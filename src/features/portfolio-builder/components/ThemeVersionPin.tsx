import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  themeId?: string | null;
  pinnedVersion?: number | null;
  onChange: (version: number | null) => void;
}

const LATEST = "latest";

/** Lets a site owner freeze a custom theme at an approved version instead of following the published one. */
export const ThemeVersionPin: React.FC<Props> = ({ themeId, pinnedVersion, onChange }) => {
  const { data: versions = [] } = useQuery({
    queryKey: ["themeVersionsPublic", themeId],
    enabled: !!themeId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_theme_versions_public")
        .select("version, deprecated_at, deprecation_note")
        .eq("theme_id", themeId!)
        .order("version", { ascending: false });
      return error ? [] : data ?? [];
    },
  });

  // Built-in themes have no versions; hide the control.
  if (!themeId || versions.length === 0) return null;

  const pinned = pinnedVersion ? versions.find((v: any) => v.version === pinnedVersion) : null;

  return (
    <div className="space-y-2 border-t border-border/50 pt-4">
      <div className="space-y-0.5">
        <Label className="text-sm font-bold">Theme version</Label>
        <p className="text-[10px] text-muted-foreground">Follow the latest release, or stay on a version you have tested.</p>
      </div>
      <Select value={pinnedVersion ? String(pinnedVersion) : LATEST} onValueChange={(val) => onChange(val === LATEST ? null : Number(val))}>
        <SelectTrigger className="h-9 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={LATEST}>Always latest</SelectItem>
          {versions.map((v: any) => (
            <SelectItem key={v.version} value={String(v.version)}>
              Version {v.version}
              {v.deprecated_at ? " (deprecated)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pinned?.deprecated_at && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>This version is deprecated{pinned.deprecation_note ? `: ${pinned.deprecation_note}` : "."} Switch to the latest when you can.</span>
        </div>
      )}
    </div>
  );
};
