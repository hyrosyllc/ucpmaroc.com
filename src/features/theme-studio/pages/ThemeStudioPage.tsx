import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Cloud,
  Code2,
  FileCode2,
  FolderTree,
  Globe,
  History,
  Layers,
  LayoutTemplate,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Play,
  Plus,
  Search,
  Settings2,
  Trash2,
  UploadCloud,
  X,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/supabaseClient";
import { ActorDashboardContextType } from "@/layouts/ActorDashboardLayout";
import { Button as UIButton } from "@/components/ui/button";
import { Input as UIInput } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import SdkDocsModal from "@/components/dashboard/SdkDocsModal";
import { SchemaFields } from "@/features/portfolio-builder/sections/SchemaFields";
import type { ContentField } from "@/features/portfolio-builder/sections/schema";
import { SECTION_LIST } from "@/features/portfolio-builder/sections/registry";
import { compileThemeFiles } from "@/lib/theme-runtime/compile";

import ucpSdkTypesRaw from "@/lib/ucp-sdk/types.d.ts?raw";
import uiTypesRaw from "@/lib/ucp-sdk/ui.d.ts?raw";

// Every Cupertino file is a starter: sections, their shared helper, and the commerce views (shop, product, cart, checkout, thank you, login).
const starterModules = import.meta.glob("../../../themes/cupertino/*.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const STARTER_FILES: Record<string, string> = Object.fromEntries(
  Object.entries(starterModules).map(([path, source]) => [path.split("/").pop()!, source] as const)
);

const FILE_NAME = /^[A-Za-z][A-Za-z0-9_-]*(\/[A-Za-z][A-Za-z0-9_-]*)*\.(tsx|ts|jsx|js)$/;
const BLANK_SECTION = (name: string) => `import React from "react";

export const schema = [
  // { id: "variant", type: "select", label: "Layout", options: ["a", "b"], defaultValue: "a" },
];

export default function ${name}({ data = {}, settings = {}, id, isPreview }: any) {
  return (
    <section className="py-16 px-6">
      <h2 className="text-3xl font-bold">{data.title}</h2>
    </section>
  );
}
`;

type PreviewMode = "single" | "full";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
};

export default function ThemeStudioPage() {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const themeId = searchParams.get("themeId");

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && resolvedTheme === "dark";
  useEffect(() => setMounted(true), []);

  const [isLoading, setIsLoading] = useState(true);
  const [themeData, setThemeData] = useState<any>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState("");
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("single");

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [compileErrors, setCompileErrors] = useState<Record<string, string>>({});
  const [runtimeErrors, setRuntimeErrors] = useState<Record<string, string>>({});
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [fileSearch, setFileSearch] = useState("");
  const [showFileSearch, setShowFileSearch] = useState(false);
  const [selectedTestSiteId, setSelectedTestSiteId] = useState<string | null>(null);

  // Preview panels: what the active file declares and the values being tested.
  const [designSchema, setDesignSchema] = useState<ContentField[]>([]);
  const [contentSchema, setContentSchema] = useState<ContentField[]>([]);
  const [mockData, setMockData] = useState<Record<string, any>>({});
  const [mockSettings, setMockSettings] = useState<Record<string, any>>({});
  const [panel, setPanel] = useState<"design" | "content">("design");
  const overridesRef = useRef<{ data: Record<string, any>; settings: Record<string, any> } | null>(null);

  // File dialogs
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFileKind, setNewFileKind] = useState<"starter" | "blank" | "module">("starter");
  const [newFileName, setNewFileName] = useState("");
  const [newStarter, setNewStarter] = useState("");
  const [fileDialogError, setFileDialogError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [versionMessage, setVersionMessage] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Isolated: the preview runs in a sandboxed iframe with an opaque origin (no cookies, storage or session) on sample data.
  const [isolated, setIsolated] = useState(false);
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) monaco.editor.setTheme(isDark ? "ucp-dark" : "ucp-light");
  }, [monaco, isDark]);

  const { data: testSites = [] } = useQuery({
    queryKey: ["developerTestSites", actorData?.id],
    queryFn: async () => {
      const { data } = await supabase.from("portfolios").select("id, site_name").eq("actor_id", actorData!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!actorData?.id,
  });

  useEffect(() => {
    if (testSites.length > 0 && !selectedTestSiteId) setSelectedTestSiteId(testSites[0].id);
  }, [testSites, selectedTestSiteId]);

  // --- LOAD THEME ---
  useEffect(() => {
    if (!actorData?.id) return;
    if (!themeId) {
      setIsLoading(false);
      return;
    }
    let active = true;
    (async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from("marketplace_themes").select("*").eq("id", themeId).eq("developer_id", actorData.id).single();
      if (!active) return;
      if (error || !data) {
        navigate("/dashboard/creator-hub");
        return;
      }
      setThemeData(data);
      const loaded: Record<string, string> = data.files && Object.keys(data.files).length > 0 ? data.files : { ...STARTER_FILES };
      setFiles(loaded);
      if (!data.files || Object.keys(data.files).length === 0) setHasUnsavedChanges(true);
      const first = loaded["Hero.tsx"] ? "Hero.tsx" : Object.keys(loaded).find((f) => /\.(tsx|jsx)$/.test(f)) ?? "";
      setActiveFile(first);
      setOpenFiles(first ? [first] : []);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [themeId, actorData?.id, navigate]);

  const { data: recentThemes = [], isLoading: isLoadingRecent } = useQuery({
    queryKey: ["recent_themes", actorData?.id],
    queryFn: async () => {
      const { data } = await supabase.from("marketplace_themes").select("id, name, status, updated_at").eq("developer_id", actorData!.id).order("updated_at", { ascending: false });
      return data || [];
    },
    enabled: !themeId && !!actorData?.id,
  });

  // --- SAVE ---
  const saveNow = useCallback(async () => {
    if (!themeId) return true;
    setIsSaving(true);
    // Editing a theme that is waiting for review withdraws it, so reviewers never approve code that has since changed.
    const withdraw = themeData?.status === "pending_review";
    const { error } = await supabase
      .from("marketplace_themes")
      .update({ files, updated_at: new Date().toISOString(), ...(withdraw ? { status: "draft" } : {}) })
      .eq("id", themeId);
    setIsSaving(false);
    if (error) {
      setSaveError(error.message);
      return false;
    }
    setSaveError(null);
    setHasUnsavedChanges(false);
    if (withdraw) setThemeData((t: any) => ({ ...t, status: "draft" }));
    return true;
  }, [files, themeId, themeData?.status]);

  useEffect(() => {
    if (!hasUnsavedChanges || !themeId || isLoading) return;
    const timer = setTimeout(saveNow, 1500);
    return () => clearTimeout(timer);
  }, [files, hasUnsavedChanges, themeId, isLoading, saveNow]);

  // --- PREVIEW ---
  const post = useCallback((message: unknown) => {
    // An opaque-origin frame has no nameable origin; the message holds only the theme source.
    iframeRef.current?.contentWindow?.postMessage(message, isolated ? "*" : window.location.origin);
  }, [isolated]);

  const runPreview = useCallback(() => {
    const { bundle, errors } = compileThemeFiles(files);
    setCompileErrors(errors);
    if (Object.keys(errors).length > 0 && activeFile && errors[activeFile] && previewMode === "single") return;
    post({ type: "STUDIO_LOAD", bundle, mode: previewMode, activeFile });
    if (overridesRef.current) post({ type: "STUDIO_PROPS", ...overridesRef.current });
  }, [files, activeFile, previewMode, post]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if ((!isolated && e.origin !== window.location.origin) || e.source !== iframeRef.current?.contentWindow) return;
      const msg = e.data;
      if (msg?.type === "PREVIEW_READY") runPreview();
      else if (msg?.type === "STUDIO_ERRORS") setRuntimeErrors(msg.errors || {});
      else if (msg?.type === "SCHEMA_PARSED") {
        setDesignSchema(msg.schema || []);
        setContentSchema(msg.contentSchema || []);
        setMockData({ ...(msg.data || {}), ...(overridesRef.current?.data || {}) });
        setMockSettings({ ...(msg.settings || {}), ...(overridesRef.current?.settings || {}) });
      } else if (msg?.type === "STUDIO_INLINE_EDIT") {
        setMockData((prev) => {
          const data = { ...prev, [msg.field]: msg.value };
          overridesRef.current = { data, settings: overridesRef.current?.settings ?? mockSettingsRef.current };
          return data;
        });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [runPreview, isolated]);

  const mockSettingsRef = useRef(mockSettings);
  mockSettingsRef.current = mockSettings;

  // Re-run when the file, mode, or site changes, and shortly after edits.
  useEffect(() => {
    if (isLoading || !themeId) return;
    const timer = setTimeout(runPreview, 400);
    return () => clearTimeout(timer);
  }, [activeFile, previewMode, selectedTestSiteId, isLoading, themeId, runPreview]);

  const updateTestValues = (data: Record<string, any>, settings: Record<string, any>) => {
    setMockData(data);
    setMockSettings(settings);
    overridesRef.current = { data, settings };
    post({ type: "STUDIO_PROPS", data, settings });
  };

  // --- FILES ---
  const openFile = (name: string) => {
    setOpenFiles((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setActiveFile(name);
    setPreviewMode("single");
    overridesRef.current = null;
  };

  const closeFile = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    const next = openFiles.filter((f) => f !== name);
    setOpenFiles(next);
    if (activeFile === name) setActiveFile(next[next.length - 1] ?? "");
  };

  const changeFiles = (next: Record<string, string>) => {
    setFiles(next);
    setHasUnsavedChanges(true);
  };

  const createFile = () => {
    setFileDialogError(null);
    let name = newFileName.trim();
    let source = "";
    if (newFileKind === "starter") {
      if (!newStarter) return setFileDialogError("Choose a starter.");
      name = newStarter;
      source = STARTER_FILES[newStarter];
    } else {
      if (!FILE_NAME.test(name)) return setFileDialogError("Use letters, numbers, - or _, with a .tsx, .ts, .jsx, or .js extension.");
      source = newFileKind === "blank" ? BLANK_SECTION(name.replace(/\.\w+$/, "").split("/").pop()!) : `export {};\n`;
    }
    if (files[name]) return setFileDialogError("A file with that name already exists.");
    changeFiles({ ...files, [name]: source });
    setNewFileOpen(false);
    setNewFileName("");
    setNewStarter("");
    openFile(name);
  };

  const renameFile = (name: string) => {
    const next = window.prompt("New file name", name)?.trim();
    if (!next || next === name) return;
    if (!FILE_NAME.test(next)) return window.alert("Use letters, numbers, - or _, with a .tsx, .ts, .jsx, or .js extension.");
    if (files[next]) return window.alert("A file with that name already exists.");
    const { [name]: source, ...rest } = files;
    changeFiles({ ...rest, [next]: source });
    setOpenFiles((prev) => prev.map((f) => (f === name ? next : f)));
    if (activeFile === name) setActiveFile(next);
  };

  const deleteFile = (name: string) => {
    if (!window.confirm(`Delete ${name}? Other files that import it will stop working.`)) return;
    const { [name]: _removed, ...rest } = files;
    changeFiles(rest);
    setOpenFiles((prev) => prev.filter((f) => f !== name));
    if (activeFile === name) setActiveFile(openFiles.find((f) => f !== name) ?? "");
  };

  const availableStarters = Object.keys(STARTER_FILES).filter((n) => !files[n]).sort();
  const starterLabel = (name: string) => {
    const key = name.replace(/\.tsx$/, "");
    const def = SECTION_LIST.find((d) => d.componentKey === key);
    return def ? `${name} (${def.label})` : `${name} (helper)`;
  };

  // --- VERSIONS ---
  const loadVersions = useCallback(async () => {
    if (!themeId) return;
    setIsLoadingVersions(true);
    const { data } = await supabase
      .from("marketplace_theme_versions")
      .select("version, status, created_at, rejection_reason, deprecated_at, deprecation_note")
      .eq("theme_id", themeId)
      .order("version", { ascending: false });
    setVersions(data || []);
    setIsLoadingVersions(false);
  }, [themeId]);

  const openVersions = () => {
    setVersionsOpen(true);
    setVersionMessage(null);
    loadVersions();
  };

  const restoreVersionFiles = async (version: number) => {
    if (!window.confirm(`Replace your current files with version ${version}? Your current files are overwritten (submit first if you want to keep them).`)) return;
    const { data, error } = await supabase.from("marketplace_theme_versions").select("files").eq("theme_id", themeId!).eq("version", version).maybeSingle();
    if (error || !data) return setVersionMessage("Could not load that version.");
    changeFiles(data.files);
    const first = data.files["Hero.tsx"] ? "Hero.tsx" : Object.keys(data.files)[0] ?? "";
    setActiveFile(first);
    setOpenFiles(first ? [first] : []);
    setVersionsOpen(false);
  };

  const makeLive = async (version: number) => {
    if (!window.confirm(`Make version ${version} the live version? Sites using this theme switch to it immediately.`)) return;
    const { error } = await supabase.rpc("rollback_theme_version", { p_theme_id: themeId!, p_version: version });
    if (error) return setVersionMessage(error.message);
    setThemeData((t: any) => ({ ...t, published_version: version }));
    setVersionMessage(`Version ${version} is now live.`);
  };

  const toggleDeprecated = async (version: number, deprecated: boolean) => {
    const note = deprecated ? window.prompt("Why is this version deprecated? Sites pinned to it keep working but are told to update.") : null;
    if (deprecated && note === null) return;
    const { error } = await supabase.rpc("set_theme_version_deprecated", { p_theme_id: themeId!, p_version: version, p_deprecated: deprecated, p_note: note });
    if (error) return setVersionMessage(error.message);
    setVersionMessage(deprecated ? `Version ${version} is deprecated.` : `Version ${version} is active again.`);
    loadVersions();
  };

  // --- PUBLISH ---
  const submitForReview = async () => {
    setPublishMessage(null);
    const { errors, warnings } = compileThemeFiles(files);
    if (Object.keys(errors).length > 0) {
      setCompileErrors(errors);
      setPublishMessage(`Fix ${Object.keys(errors).length} file(s) with errors before submitting.`);
      return;
    }
    const sectionFiles = Object.keys(files).filter((f) => SECTION_LIST.some((d) => d.componentKey === f.replace(/\.\w+$/, "")));
    if (sectionFiles.length === 0) {
      setPublishMessage("Add at least one section file (for example Hero.tsx) before submitting.");
      return;
    }
    const note = warnings.length ? `\n\nWarnings:\n- ${warnings.join("\n- ")}` : "";
    const verb = themeData?.status === "approved" ? "Submit this update for review? The live version stays available until it is approved." : "Submit this theme for marketplace review?";
    if (!window.confirm(`${verb}${note}`)) return;

    setIsSubmitting(true);
    if (!(await saveNow())) {
      setIsSubmitting(false);
      setPublishMessage("Could not save your files. Try again.");
      return;
    }
    let { data: submitted, error } = await supabase.rpc("submit_theme_version", { p_theme_id: themeId! });
    // Before the versions migration is applied, fall back to the plain status change.
    if (error && ["PGRST202", "42883"].includes(error.code)) {
      submitted = null;
      ({ error } = await supabase.from("marketplace_themes").update({ status: "pending_review" }).eq("id", themeId!));
    }
    setIsSubmitting(false);
    if (error) return setPublishMessage(error.message);
    setThemeData((t: any) => ({ ...t, status: "pending_review" }));
    setPublishMessage(`Submitted${submitted ? ` as version ${submitted}` : ""}. You will see the result here and in Creator Hub.`);
  };

  // --- MONACO ---
  const handleEditorWillMount = (m: any) => {
    m.editor.defineTheme("ucp-dark", { base: "vs-dark", inherit: true, rules: [], colors: { "editor.background": "#09090b", "editor.lineHighlightBackground": "#18181b", "editorLineNumber.foreground": "#52525b", "editorIndentGuide.background1": "#27272a", "editor.selectionBackground": "#3f3f4650" } });
    m.editor.defineTheme("ucp-light", { base: "vs", inherit: true, rules: [], colors: { "editor.background": "#ffffff", "editor.lineHighlightBackground": "#f4f4f5", "editorLineNumber.foreground": "#a1a1aa", "editorIndentGuide.background1": "#e4e4e7" } });

    const ts = m.languages.typescript as any;
    ts.typescriptDefaults.setCompilerOptions({ jsx: ts.JsxEmit.React, jsxFactory: "React.createElement", reactNamespace: "React", allowNonTsExtensions: true, allowJs: true, target: ts.ScriptTarget.Latest });
    ts.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });
    ts.typescriptDefaults.addExtraLib(ucpSdkTypesRaw, "file:///node_modules/@types/ucp-sdk/index.d.ts");
    ts.typescriptDefaults.addExtraLib(uiTypesRaw, "file:///node_modules/@types/ucp-ui/index.d.ts");
    // Shorthand ambient modules: every allowed import resolves (typed as any) without false "cannot find module" errors.
    const loose = ["react-dom", "framer-motion", "lucide-react", "recharts", "date-fns", "canvas-confetti", "react-router-dom", "@/lib/utils", ...["accordion", "avatar", "badge", "carousel", "checkbox", "dialog", "input", "label", "select", "separator", "skeleton", "slider", "switch", "tabs", "textarea"].map((n) => `@/components/ui/${n}`)];
    ts.typescriptDefaults.addExtraLib(loose.map((n) => `declare module '${n}';`).join("\n"), "file:///node_modules/@types/ucp-loose/index.d.ts");
  };

  const handleEditorDidMount = (editor: any, m: any) => {
    editor.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.KeyS, () => {
      saveNow();
      runPreview();
    });
  };

  const fileErrorCount = Object.keys(compileErrors).length + Object.keys(runtimeErrors).length;
  const activeError = compileErrors[activeFile] || runtimeErrors[activeFile.replace(/\.\w+$/, "")];
  const status = themeData?.status || "draft";
  const filteredSearch = useMemo(() => Object.keys(files).filter((f) => f.toLowerCase().includes(fileSearch.toLowerCase())), [files, fileSearch]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!themeId) {
    return (
      <div className="flex h-[calc(100vh-64px)] w-full flex-col overflow-y-auto bg-zinc-50 p-4 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 md:p-8">
        <div className="mx-auto mt-4 w-full max-w-5xl space-y-8 md:mt-12">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">Theme Studio</h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">Select an existing theme to continue editing.</p>
            </div>
            <UIButton onClick={() => navigate("/dashboard/creator-hub")} className="h-11 bg-indigo-600 px-6 font-bold hover:bg-indigo-500">
              <Plus className="mr-2 h-5 w-5" /> Create New Theme
            </UIButton>
          </div>
          {isLoadingRecent ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
          ) : recentThemes.length === 0 ? (
            <div className="rounded-3xl border border-zinc-200 bg-zinc-100/50 py-20 text-center dark:border-zinc-800/50 dark:bg-zinc-900/30">
              <Code2 size={48} className="mx-auto mb-4 text-zinc-400 opacity-50 dark:text-zinc-600" />
              <h3 className="mb-2 text-xl font-bold">No themes found</h3>
              <p className="mx-auto mb-6 max-w-sm text-zinc-500">Head over to the Creator Hub to start building.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recentThemes.map((t: any) => (
                <button key={t.id} type="button" onClick={() => navigate(`/dashboard/studio?themeId=${t.id}`)} className="group flex h-40 flex-col rounded-2xl border border-zinc-200 bg-zinc-100 p-6 text-left transition-all hover:border-indigo-500/50 hover:bg-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/80">
                  <div className="mb-auto flex w-full items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400"><LayoutTemplate size={24} /></div>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{STATUS_LABEL[t.status] ?? t.status}</Badge>
                  </div>
                  <div>
                    <h3 className="mb-1 truncate text-lg font-bold">{t.name}</h3>
                    <p className="flex items-center gap-1.5 font-mono text-xs text-zinc-500"><Clock size={12} /> {new Date(t.updated_at).toLocaleDateString()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full flex-col overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* TOPBAR */}
      <div className="relative z-10 flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-white/80 px-2 py-2 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 sm:px-4">
        <div className="flex items-center gap-3">
          <UIButton variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/dashboard/creator-hub")} aria-label="Back to Creator Hub"><ArrowLeft size={16} /></UIButton>
          <UIButton variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExplorerOpen(!isExplorerOpen)} aria-label="Toggle explorer">{isExplorerOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}</UIButton>
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-indigo-500/30 bg-indigo-500/20 text-indigo-400"><Code2 size={18} /></div>
          <div>
            <h1 className="flex items-center gap-2 text-sm font-bold leading-tight">
              {themeData?.name || "Theme Studio"}
              <Badge variant="outline" className="h-5 text-[10px]">{STATUS_LABEL[status] ?? status}</Badge>
            </h1>
            <p className="flex items-center gap-1 font-mono text-[10px] text-zinc-500"><FolderTree size={10} /> {Object.keys(files).length} files</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="flex items-center gap-2 border-r border-zinc-200 pr-4 dark:border-zinc-800">
            <Globe size={14} className="text-zinc-500" />
            <Select value={selectedTestSiteId || ""} onValueChange={setSelectedTestSiteId}>
              <SelectTrigger className="h-8 w-[180px] text-xs font-medium"><SelectValue placeholder="Select test site" /></SelectTrigger>
              <SelectContent>
                {testSites.map((site: any) => <SelectItem key={site.id} value={site.id} className="text-xs">{site.site_name || "Untitled Site"}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500" role="status">
            {isSaving ? <><Loader2 size={12} className="animate-spin" /> Saving...</> : saveError ? <span className="text-red-500">Save failed</span> : hasUnsavedChanges ? <><Cloud size={12} /> Unsaved</> : <><CheckCircle2 size={12} className="text-emerald-500" /> Saved</>}
          </div>
          <UIButton variant="ghost" size="sm" className="h-8 px-2" onClick={openVersions} aria-label="Version history"><History size={14} className="sm:mr-2" /><span className="hidden sm:inline">Versions</span></UIButton>
          <UIButton variant="ghost" size="sm" className="h-8 px-2" onClick={() => setIsDocsOpen(true)} aria-label="Open SDK documentation"><BookOpen size={14} className="sm:mr-2" /><span className="hidden sm:inline">SDK Docs</span></UIButton>
          <UIButton size="sm" className="h-8 bg-emerald-600 px-2 font-bold text-white hover:bg-emerald-700" onClick={submitForReview} disabled={isSubmitting || status === "pending_review"} aria-label="Submit theme for review">
            {isSubmitting ? <Loader2 size={14} className="animate-spin sm:mr-2" /> : <UploadCloud size={14} className="sm:mr-2" />}
            <span className="hidden sm:inline">{status === "pending_review" ? "In review" : status === "approved" ? "Submit update" : "Submit for review"}</span>
          </UIButton>
        </div>
      </div>

      {(status === "rejected" || publishMessage) && (
        <div role="status" className={cn("shrink-0 border-b px-4 py-2 text-xs", status === "rejected" ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300" : "border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900")}>
          {status === "rejected" && <strong>Rejected{themeData?.rejection_reason ? `: ${themeData.rejection_reason}` : "."} </strong>}
          {publishMessage}
        </div>
      )}

      <div className="flex flex-grow overflow-hidden">
        {/* EXPLORER */}
        <div className={cn("flex shrink-0 flex-col overflow-hidden border-r border-zinc-200 bg-zinc-50 transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900", isExplorerOpen ? "w-64" : "w-0 border-r-0")}>
          <div className="flex h-8 shrink-0 items-center justify-between whitespace-nowrap border-b border-zinc-200 bg-zinc-100/50 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span>Explorer</span>
            <button type="button" aria-label="New file" title="New file" onClick={() => { setFileDialogError(null); setNewFileOpen(true); }} className="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800"><Plus size={14} /></button>
          </div>
          <div className="flex-grow overflow-y-auto py-2">
            {Object.keys(files).sort().map((name) => {
              const errored = !!compileErrors[name];
              return (
                <div key={name} className={cn("group flex items-center border-l-2 pr-2 font-mono text-sm transition-colors", activeFile === name && previewMode === "single" ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" : "border-transparent text-zinc-600 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800/50")}>
                  <button type="button" onClick={() => openFile(name)} className="flex flex-1 items-center gap-2 whitespace-nowrap px-5 py-1.5 text-left">
                    <FileCode2 size={14} className={errored ? "text-red-500" : "text-zinc-400"} /> {name}
                  </button>
                  <button type="button" aria-label={`Rename ${name}`} onClick={() => renameFile(name)} className="rounded p-1 opacity-0 hover:bg-zinc-300/50 group-hover:opacity-100 focus:opacity-100 dark:hover:bg-zinc-700/50"><Pencil size={12} /></button>
                  <button type="button" aria-label={`Delete ${name}`} onClick={() => deleteFile(name)} className="rounded p-1 text-red-500 opacity-0 hover:bg-red-500/10 group-hover:opacity-100 focus:opacity-100"><Trash2 size={12} /></button>
                </div>
              );
            })}
          </div>
        </div>

        {/* EDITOR */}
        <div className="relative flex h-full min-w-0 flex-grow flex-col border-r border-zinc-200 dark:border-zinc-800">
          <div className="no-scrollbar flex shrink-0 overflow-x-auto border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
            {openFiles.map((name) => (
              <button type="button" key={name} onClick={() => openFile(name)} className={cn("group flex h-10 min-w-fit select-none items-center gap-2 border-r border-t-2 border-zinc-200 px-4 font-mono text-sm dark:border-zinc-800", activeFile === name ? "border-t-indigo-500 bg-white text-indigo-600 dark:bg-zinc-800 dark:text-indigo-300" : "border-t-transparent bg-zinc-50 text-zinc-500 hover:bg-zinc-200/50 dark:bg-zinc-900 dark:hover:bg-zinc-800/50")}>
                <FileCode2 size={14} /> {name}
                <span role="button" aria-label={`Close ${name}`} onClick={(e) => closeFile(e, name)} className="ml-1 rounded-md p-0.5 opacity-0 hover:bg-zinc-200 group-hover:opacity-100 dark:hover:bg-zinc-700/50"><X size={14} /></span>
              </button>
            ))}
            {openFiles.length === 0 && <div className="flex h-10 items-center px-4 font-mono text-xs text-zinc-600">No open files</div>}
          </div>

          <div className="relative flex h-8 shrink-0 items-center border-b border-zinc-200 bg-zinc-100/50 px-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <Search size={12} className="mr-2 shrink-0 text-zinc-400" />
            <input type="text" aria-label="Search files" placeholder="Search files..." className="w-full bg-transparent font-mono text-xs outline-none placeholder:text-zinc-500" value={fileSearch} onChange={(e) => { setFileSearch(e.target.value); setShowFileSearch(true); }} onFocus={() => setShowFileSearch(true)} onBlur={() => setTimeout(() => setShowFileSearch(false), 200)} onKeyDown={(e) => e.key === "Escape" && e.currentTarget.blur()} />
            {showFileSearch && fileSearch && (
              <div className="absolute left-0 top-8 z-50 max-h-64 w-full overflow-y-auto rounded-b-lg border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-800">
                {filteredSearch.map((f) => (
                  <button key={f} type="button" className="flex w-full items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-left font-mono text-sm hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20" onClick={() => { openFile(f); setFileSearch(""); setShowFileSearch(false); }}><FileCode2 size={14} /> {f}</button>
                ))}
                {filteredSearch.length === 0 && <div className="px-4 py-3 font-mono text-sm text-zinc-500">No files match "{fileSearch}".</div>}
              </div>
            )}
          </div>

          <div className="relative flex-grow">
            {activeFile && files[activeFile] !== undefined ? (
              <Editor
                height="100%"
                path={activeFile}
                language={/\.tsx?$/.test(activeFile) ? "typescript" : "javascript"}
                theme={isDark ? "ucp-dark" : "ucp-light"}
                value={files[activeFile]}
                onChange={(value) => changeFiles({ ...files, [activeFile]: value ?? "" })}
                beforeMount={handleEditorWillMount}
                onMount={handleEditorDidMount}
                options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: "on", formatOnPaste: true, padding: { top: 16 }, fontFamily: "JetBrains Mono, monospace" }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50 text-zinc-400 dark:bg-zinc-950 dark:text-zinc-600">
                <Code2 size={64} className="mb-4 opacity-10" />
                <p className="font-mono text-sm">Select or create a file to start editing</p>
              </div>
            )}
            {activeError && (
              <div className="absolute bottom-4 left-4 right-4 z-10 rounded-lg border border-red-500/50 bg-red-50/90 p-3 shadow-xl backdrop-blur-md dark:bg-red-950/90">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" size={16} />
                  <div className="max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-red-800 dark:text-red-200">{activeError}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PREVIEW */}
        <div className="flex h-full w-[45%] shrink-0 flex-col border-l border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 xl:w-[40%]">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex rounded-lg border border-zinc-300 bg-zinc-200 p-1 dark:border-zinc-800 dark:bg-zinc-950">
              <UIButton size="sm" variant="ghost" className={cn("h-7 px-3 text-xs", previewMode === "single" && "bg-white shadow-sm dark:bg-zinc-800")} onClick={() => setPreviewMode("single")}><LayoutTemplate size={14} className="mr-1.5" /> Component</UIButton>
              <UIButton size="sm" variant="ghost" className={cn("h-7 px-3 text-xs", previewMode === "full" && "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500")} onClick={() => setPreviewMode("full")}><Layers size={14} className="mr-1.5" /> Full page</UIButton>
            </div>
            <div className="flex items-center gap-2">
              {fileErrorCount > 0 && <Badge variant="outline" className="border-red-500/40 text-[10px] text-red-500">{fileErrorCount} error{fileErrorCount === 1 ? "" : "s"}</Badge>}
              <UIButton size="sm" variant="ghost" className={cn("h-8", isolated && "bg-emerald-500/10 text-emerald-600")} aria-pressed={isolated} title="Run the preview in a sandboxed iframe with sample data (no session or storage access)" onClick={() => setIsolated((v) => !v)}><ShieldCheck size={14} className="mr-1.5" /> Isolated</UIButton>
              <UIButton size="sm" variant="ghost" className="h-8" onClick={runPreview}><Play size={14} className="mr-1.5" /> Refresh</UIButton>
            </div>
          </div>

          <div className={cn("relative flex min-h-0 flex-col", previewMode === "single" ? "flex-1 border-b border-zinc-200 dark:border-zinc-800" : "h-full")}>
            <div className="relative flex flex-grow items-center justify-center overflow-hidden bg-zinc-100/50 p-4 dark:bg-zinc-950/50">
              <iframe
                key={isolated ? "isolated" : "app"}
                ref={iframeRef}
                src={isolated ? "/sandbox.html" : `/studio-preview?portfolioId=${selectedTestSiteId || ""}`}
                sandbox={isolated ? "allow-scripts" : undefined}
                className={cn("border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950", previewMode === "full" ? "h-full w-full rounded-md" : "h-[500px] w-full max-w-2xl rounded-xl")}
                title="Theme preview"
              />
            </div>
          </div>

          {previewMode === "single" && (
            <div className="flex min-h-0 flex-[0.8] shrink-0 flex-col bg-white dark:bg-zinc-900">
              <div className="flex h-9 shrink-0 items-center gap-1 border-b border-zinc-200 bg-indigo-50 px-2 dark:border-zinc-800 dark:bg-indigo-500/5">
                <Settings2 size={12} className="mx-2 text-indigo-500" />
                {(["design", "content"] as const).map((tab) => (
                  <button key={tab} type="button" onClick={() => setPanel(tab)} aria-pressed={panel === tab} className={cn("rounded px-3 py-1 font-mono text-[11px] uppercase tracking-widest", panel === tab ? "bg-white text-indigo-600 shadow-sm dark:bg-zinc-800 dark:text-indigo-300" : "text-zinc-500")}>
                    {tab === "design" ? "Design settings" : "Content"}
                  </button>
                ))}
              </div>
              <div className="custom-scrollbar flex-grow space-y-4 overflow-y-auto p-4">
                {panel === "design" ? (
                  designSchema.length === 0 ? (
                    <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
                      This file exports no <code>schema</code>. Add <code>export const schema = [&#123; id, type, label, defaultValue &#125;]</code> to expose design settings.
                    </div>
                  ) : (
                    <SchemaFields schema={designSchema} values={mockSettings} onChange={(id, value) => updateTestValues(mockData, { ...mockSettings, [id]: value })} />
                  )
                ) : contentSchema.length === 0 ? (
                  <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
                    This section type has no declared content fields; the preview uses the test site's data.
                  </div>
                ) : (
                  <SchemaFields schema={contentSchema} values={mockData} onChange={(id, value) => updateTestValues({ ...mockData, [id]: value }, mockSettings)} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NEW FILE */}
      <Dialog open={newFileOpen} onOpenChange={setNewFileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New file</DialogTitle>
            <DialogDescription>Section files must be named after the section (for example FAQ is Faq.tsx). Helpers can be imported with ./Name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="File type">
              {([["starter", "Starter"], ["blank", "Blank section"], ["module", "Helper"]] as const).map(([kind, label]) => (
                <UIButton key={kind} type="button" size="sm" variant={newFileKind === kind ? "default" : "outline"} onClick={() => setNewFileKind(kind)}>{label}</UIButton>
              ))}
            </div>
            {newFileKind === "starter" ? (
              availableStarters.length === 0 ? (
                <p className="text-sm text-zinc-500">Every starter is already in your theme.</p>
              ) : (
                <Select value={newStarter} onValueChange={setNewStarter}>
                  <SelectTrigger><SelectValue placeholder="Choose a starter" /></SelectTrigger>
                  <SelectContent>{availableStarters.map((n) => <SelectItem key={n} value={n}>{starterLabel(n)}</SelectItem>)}</SelectContent>
                </Select>
              )
            ) : (
              <UIInput autoFocus placeholder={newFileKind === "blank" ? "Faq.tsx" : "helpers.ts"} value={newFileName} onChange={(e) => setNewFileName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createFile()} />
            )}
            {fileDialogError && <p role="alert" className="text-sm text-red-500">{fileDialogError}</p>}
          </div>
          <DialogFooter>
            <UIButton variant="ghost" onClick={() => setNewFileOpen(false)}>Cancel</UIButton>
            <UIButton onClick={createFile}>Create</UIButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SdkDocsModal isOpen={isDocsOpen} onOpenChange={setIsDocsOpen} />

      {/* VERSIONS */}
      <Dialog open={versionsOpen} onOpenChange={setVersionsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Version history</DialogTitle>
            <DialogDescription>Every submission is saved as an immutable version. Approved versions can be made live again at any time.</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {isLoadingVersions ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : versions.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">No versions yet. Submit your theme for review to create version 1.</p>
            ) : (
              versions.map((v) => {
                const isLive = themeData?.published_version === v.version;
                return (
                  <div key={v.version} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-semibold">
                        Version {v.version}
                        <Badge variant="outline" className="text-[10px] capitalize">{v.status}</Badge>
                        {isLive && <Badge className="bg-emerald-600 text-[10px]">Live</Badge>}
                        {v.deprecated_at && <Badge variant="outline" className="border-amber-500 text-[10px] text-amber-600">Deprecated</Badge>}
                      </div>
                      <div className="text-xs text-zinc-500">{new Date(v.created_at).toLocaleString()}</div>
                      {v.rejection_reason && <div className="text-xs text-red-500">{v.rejection_reason}</div>}
                      {v.deprecation_note && <div className="text-xs text-amber-600">{v.deprecation_note}</div>}
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                      <UIButton size="sm" variant="outline" onClick={() => restoreVersionFiles(v.version)}>Load files</UIButton>
                      {v.status === "approved" && !isLive && !v.deprecated_at && <UIButton size="sm" onClick={() => makeLive(v.version)}>Make live</UIButton>}
                      {v.status === "approved" && !isLive && (
                        <UIButton size="sm" variant="ghost" onClick={() => toggleDeprecated(v.version, !v.deprecated_at)}>{v.deprecated_at ? "Reactivate" : "Deprecate"}</UIButton>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {versionMessage && <p role="status" className="text-sm text-zinc-600 dark:text-zinc-300">{versionMessage}</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
