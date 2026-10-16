import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { SECTION_LIST, createSectionData, getSectionDefinition } from "@/features/portfolio-builder/sections/registry";
import { getSectionAnchor, getSectionFrame } from "@/features/portfolio-builder/sections/frame";
import type { PortfolioSection } from "@/features/portfolio-builder/types/portfolio";
import { resolveThemeComponent } from "@/themes/registry";
import { loadThemeBundle, schemaDefaults, sectionTypeForFile, stripExtension, type CompiledTheme } from "@/lib/theme-runtime";
import { isCommerceViewKey } from "@/lib/theme-runtime/commerceViews";
import { CommerceViewMock } from "./CommerceViewMock";

/** Messages the Studio parent may send. Anything else, or from another origin, is ignored. */
interface LoadMessage {
  type: "STUDIO_LOAD";
  bundle: Record<string, string>;
  mode: "single" | "full";
  activeFile: string;
}

// In a sandbox="allow-scripts" iframe the origin is opaque ("null"): trust only the parent window and post with "*".
const SANDBOXED = window.origin === "null";
const PARENT_ORIGIN = SANDBOXED ? "*" : window.location.origin;
const fromParent = (event: MessageEvent) => event.source === window.parent && (SANDBOXED || event.origin === window.location.origin);

class SectionBoundary extends React.Component<{ name: string; children: React.ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="m-3 rounded-lg border border-red-500/40 bg-red-950/20 p-3 font-mono text-xs text-red-400">
        <strong>{this.props.name}</strong> crashed while rendering: {this.state.error}
      </div>
    );
  }
}

export default function StudioPreview() {
  const [params] = useSearchParams();
  const portfolioId = params.get("portfolioId");

  const [portfolio, setPortfolio] = useState<any>(null);
  const [compiled, setCompiled] = useState<CompiledTheme | null>(null);
  const [mode, setMode] = useState<"single" | "full">("single");
  const [activeFile, setActiveFile] = useState("");
  const [override, setOverride] = useState<{ data?: Record<string, any>; settings?: Record<string, any> }>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!portfolioId) return;
    supabase.from("portfolios").select("*").eq("id", portfolioId).maybeSingle().then(({ data }) => setPortfolio(data));
  }, [portfolioId]);

  const sections: PortfolioSection[] = useMemo(() => {
    const own = (portfolio?.sections ?? []) as PortfolioSection[];
    if (own.length > 0) return own;
    // No test site: preview every section type with its starter content.
    return SECTION_LIST.map((d) => ({ id: `preview-${d.type}`, type: d.type, isVisible: true, data: createSectionData(d.type), settings: {} }));
  }, [portfolio]);

  const activeType = activeFile ? sectionTypeForFile(activeFile) : "";
  const activeKey = stripExtension(activeFile.split("/").pop() ?? "");

  // Single-component state: real site data for this section type, starter content as fallback.
  const single = useMemo(() => {
    if (!compiled || !activeKey) return null;
    const Component = compiled.components[activeKey];
    if (!Component) return null;
    const real = sections.find((s) => s.type === activeType);
    const def = getSectionDefinition(activeType);
    const schema = compiled.normalizedSchemas[activeKey] ?? [];
    const data = { ...(def ? createSectionData(def.type) : {}), ...(Component.testData || {}), ...(real?.data || {}), ...(override.data || {}) };
    const settings = { ...schemaDefaults(schema), ...(real?.settings || {}), ...(override.settings || {}) };
    return { Component, data, settings, schema, id: real?.id ?? `studio-${activeKey}`, contentSchema: def?.contentSchema ?? [] };
  }, [compiled, activeKey, activeType, sections, override]);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (!fromParent(event)) return;
    const msg = event.data;
    if (msg?.type === "STUDIO_LOAD") {
      const { bundle, mode: nextMode, activeFile: file } = msg as LoadMessage;
      setMode(nextMode);
      setActiveFile(file);
      setOverride({});
      try {
        const next = loadThemeBundle(bundle);
        setCompiled(next);
        setLoadError(null);
        window.parent.postMessage({ type: "STUDIO_ERRORS", errors: next.errors }, PARENT_ORIGIN);
      } catch (error) {
        setLoadError((error as Error).message);
      }
    } else if (msg?.type === "STUDIO_PROPS") {
      setOverride({ data: msg.data, settings: msg.settings });
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    window.parent.postMessage({ type: "PREVIEW_READY" }, PARENT_ORIGIN);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // Tell the Studio which schema/data the active file uses so its panels can edit them.
  useEffect(() => {
    if (mode !== "single" || !single) return;
    window.parent.postMessage(
      { type: "SCHEMA_PARSED", sectionType: activeType, schema: single.schema, contentSchema: single.contentSchema, data: single.data, settings: single.settings },
      PARENT_ORIGIN
    );
    // Only when the file or loaded bundle changes; prop edits must not echo back.
  }, [mode, compiled, activeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Inline edits made on the canvas flow back as field updates.
  useEffect(() => {
    const onInline = (event: MessageEvent) => {
      if ((!SANDBOXED && event.origin !== window.location.origin) || event.data?.type !== "INLINE_EDIT") return;
      const { fieldKey, value } = event.data.payload ?? {};
      if (fieldKey) window.parent.postMessage({ type: "STUDIO_INLINE_EDIT", field: fieldKey, value }, PARENT_ORIGIN);
    };
    window.addEventListener("message", onInline);
    return () => window.removeEventListener("message", onInline);
  }, []);

  if (loadError) {
    return <div className="m-4 whitespace-pre-wrap break-words rounded-xl border border-red-500/50 bg-red-950/20 p-6 font-mono text-sm text-red-500">Theme error: {loadError}</div>;
  }

  if (!compiled) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Waiting for compiler...
      </div>
    );
  }

  const fileError = activeKey ? compiled.errors[activeKey] : null;

  if (mode === "single") {
    if (fileError) {
      return <div className="m-4 whitespace-pre-wrap break-words rounded-xl border border-red-500/50 bg-red-950/20 p-6 font-mono text-sm text-red-500">{fileError}</div>;
    }
    if (!single) {
      return (
        <div className="m-6 rounded-xl border border-dashed p-8 text-center font-mono text-sm text-muted-foreground">
          {activeFile ? `${activeFile} has no default-exported component to preview.` : "Open a file to preview it."}
        </div>
      );
    }
    const { Component } = single;
    if (isCommerceViewKey(activeKey)) {
      return (
        <div className="min-h-screen w-full bg-background text-foreground">
          <SectionBoundary name={activeFile}>
            <CommerceViewMock view={activeKey} Component={compiled.components[activeKey]} />
          </SectionBoundary>
        </div>
      );
    }
    return (
      <div className="min-h-screen w-full overflow-hidden bg-background text-foreground">
        <SectionBoundary name={activeFile}>
          <Component
            data={single.data}
            settings={single.settings}
            id={single.id}
            allSections={sections}
            actorId={portfolio?.actor_id}
            portfolioId={portfolio?.id}
            isPreview
          />
        </SectionBoundary>
      </div>
    );
  }

  // Full page: the test site's own sections, in order, resolved like the live site (missing sections fall back to Modern).
  const theme = { ...compiled.components };
  const fileErrors = Object.entries(compiled.errors);
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      {fileErrors.length > 0 && (
        <div className="m-3 whitespace-pre-wrap rounded-lg border border-amber-500/40 bg-amber-950/20 p-3 font-mono text-xs text-amber-500">
          {fileErrors.map(([file, message]) => `${file}: ${message}`).join("\n")}
        </div>
      )}
      {sections.filter((s) => s.isVisible).map((section) => {
        const Component = resolveThemeComponent(theme, section.type);
        if (!Component) return null;
        const frame = section.type === "header" ? { className: "", style: {} } : getSectionFrame(section.settings);
        const anchor = getSectionAnchor(section.settings);
        return (
          <div key={section.id} id={section.id} className={`relative ${frame.className}`} style={frame.style}>
            {anchor && <span id={anchor} aria-hidden className="absolute -top-20" />}
            <SectionBoundary name={section.type}>
              <Component
                data={section.data}
                settings={section.settings || {}}
                id={section.id}
                allSections={sections}
                actorId={portfolio?.actor_id}
                portfolioId={portfolio?.id}
                isPreview
              />
            </SectionBoundary>
          </div>
        );
      })}
    </div>
  );
}
