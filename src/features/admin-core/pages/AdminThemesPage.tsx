import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { diffFileSets, diffLines } from "@/lib/theme-runtime/diff";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  TerminalSquare, 
  ShieldAlert,
  Play
} from "lucide-react";

interface CompileReport {
  success?: boolean;
  version?: number | null;
  problems?: string[];
  findings?: string[];
  needsAcknowledgement?: boolean;
  error?: string;
  message?: string;
}

// The function answers 4xx with a JSON body the review UI needs (findings, problems).
async function callCompile(body: Record<string, unknown>): Promise<CompileReport> {
  const { data, error } = await supabase.functions.invoke("compile-theme", { body });
  if (!error) return data as CompileReport;
  try {
    return await (error as any).context.json();
  } catch {
    return { error: error.message };
  }
}

export default function AdminThemesPage() {
  const [selectedTheme, setSelectedTheme] = useState<any | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [report, setReport] = useState<CompileReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [submittedFiles, setSubmittedFiles] = useState<Record<string, string> | null>(null);
  // The immutable snapshot that was submitted; the working copy may have changed since.
  const reviewFiles: Record<string, string> | null = submittedFiles ?? selectedTheme?.files ?? null;
  // Files of the currently live version, so a reviewer can read only what changed.
  const [liveFiles, setLiveFiles] = useState<Record<string, string> | null>(null);
  const [showChanges, setShowChanges] = useState(false);
  const fileChanges = reviewFiles && liveFiles ? diffFileSets(liveFiles, reviewFiles) : null;
  const tabFiles = reviewFiles && fileChanges && showChanges ? Object.keys({ ...liveFiles, ...reviewFiles }).filter((n) => fileChanges[n] !== "unchanged") : Object.keys(reviewFiles ?? {});

  useEffect(() => {
    setLiveFiles(null);
    setShowChanges(false);
    if (!selectedTheme?.published_version) return;
    supabase
      .from("marketplace_theme_versions")
      .select("files")
      .eq("theme_id", selectedTheme.id)
      .eq("version", selectedTheme.published_version)
      .maybeSingle()
      .then(({ data }) => setLiveFiles(data?.files ?? null));
  }, [selectedTheme]);

  useEffect(() => {
    setSubmittedFiles(null);
    if (!selectedTheme) return;
    supabase
      .from("marketplace_theme_versions")
      .select("files")
      .eq("theme_id", selectedTheme.id)
      .eq("status", "pending")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setSubmittedFiles(data?.files ?? null));
  }, [selectedTheme]);

  useEffect(() => {
    setReport(null);
    if (!selectedTheme) return;
    setIsAnalyzing(true);
    callCompile({ theme_id: selectedTheme.id, action: "analyze" }).then((r) => {
      setReport(r);
      setIsAnalyzing(false);
    });
  }, [selectedTheme]);

  // 1. Fetch themes needing review
  const { data: pendingThemes = [], refetch, isLoading } = useQuery({
    queryKey: ["admin_pending_themes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_themes")
        .select(`
          *,
          developer:actors(ActorName, ActorEmail)
        `)
        .eq("status", "pending_review")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // 2. Trigger the Edge Function to Compile & Approve
  const handleApproveAndCompile = async (themeId: string) => {
    if (!confirm("Approve this theme? It is compiled on the server and becomes available to everyone who buys it.")) return;

    setIsCompiling(true);
    let result = await callCompile({ theme_id: themeId, action: "approve" });
    if (result.needsAcknowledgement) {
      const list = (result.findings ?? []).map((f) => `- ${f}`).join("\n");
      if (confirm(`The automated scan flagged:\n${list}\n\nI have reviewed these and they are acceptable.`)) {
        result = await callCompile({ theme_id: themeId, action: "approve", acknowledgeFindings: true });
      } else {
        setIsCompiling(false);
        return;
      }
    }
    setIsCompiling(false);

    if (!result.success) {
      alert(`Compilation failed:\n${[result.error, ...(result.problems ?? [])].filter(Boolean).join("\n")}`);
    } else {
      alert("Theme successfully compiled and approved!");
      setSelectedTheme(null);
      refetch();
    }
  };

  // 3. Reject Theme (server-side, so the reason is stored and developers cannot self-approve)
  const handleReject = async (themeId: string) => {
    const reason = prompt("Tell the developer what to fix (shown in Theme Studio):");
    if (reason === null) return; // User cancelled

    setIsRejecting(true);
    const result = await callCompile({ theme_id: themeId, action: "reject", reason });
    setIsRejecting(false);

    if (!result.success) alert("Failed to reject theme.");
    else {
      setSelectedTheme(null);
      refetch();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShieldAlert className="text-amber-500" /> Theme Auditor
        </h1>
        <p className="text-muted-foreground mt-2">
          Review developer code submissions for security issues before compiling and publishing them to the marketplace.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
      ) : pendingThemes.length === 0 ? (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <CheckCircle2 size={48} className="mb-4 opacity-20" />
            <p className="font-bold">No themes pending review!</p>
            <p className="text-sm">Developers haven't submitted anything new.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingThemes.map((theme: any) => (
            <Card key={theme.id} className="border-amber-200 bg-amber-50/10">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge className="bg-amber-500 hover:bg-amber-600">Pending Review</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(theme.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="mt-2 text-xl">{theme.name}</CardTitle>
                <CardDescription>
                  By: {theme.developer?.ActorName || "Unknown"} ({theme.developer?.ActorEmail})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-xs font-mono bg-muted p-2 rounded border">
                  <div>Site: <span className="font-bold">{theme.site_price}</span></div>
                  <div>Global: <span className="font-bold">{theme.global_price}</span></div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full gap-2" 
                  onClick={() => setSelectedTheme(theme)}
                >
                  <Search size={16} /> Audit Code
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* MANUAL CODE AUDITOR MODAL */}
      <Dialog open={!!selectedTheme} onOpenChange={() => setSelectedTheme(null)}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b bg-muted/30 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <TerminalSquare className="text-primary" /> Auditing: {selectedTheme?.name}{report?.version ? ` (version ${report.version})` : ""}
            </DialogTitle>
            <DialogDescription>
              Check the files below for malicious code (e.g., unauthorized <code>fetch</code> calls, raw <code>&lt;script&gt;</code> tags, or `window.parent` hacks).
            </DialogDescription>
          </DialogHeader>

          <div className="flex-grow overflow-hidden flex flex-col p-6">
            <div className="mb-4 shrink-0 text-sm" role="status">
              {isAnalyzing ? (
                <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Running automated checks…</span>
              ) : report ? (
                <div className="space-y-2">
                  {report.error && <p className="text-destructive">{report.error}</p>}
                  {(report.problems?.length ?? 0) > 0 && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                      <p className="font-semibold text-destructive">Blocking problems</p>
                      <ul className="list-disc pl-5 text-xs">{report.problems!.map((p) => <li key={p}>{p}</li>)}</ul>
                    </div>
                  )}
                  {(report.findings?.length ?? 0) > 0 && (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                      <p className="font-semibold text-amber-600">Review these patterns</p>
                      <ul className="list-disc pl-5 text-xs">{report.findings!.map((f) => <li key={f}>{f}</li>)}</ul>
                    </div>
                  )}
                  {!report.error && !report.problems?.length && !report.findings?.length && (
                    <p className="text-emerald-600">Automated checks found nothing. Still read the code.</p>
                  )}
                </div>
              ) : null}
            </div>
            {reviewFiles ? (
              <Tabs key={`${showChanges}`} defaultValue={tabFiles[0]} className="flex flex-col h-full">
                {liveFiles && (
                  <div className="mb-3 flex shrink-0 items-center gap-2 text-xs">
                    <Button size="sm" variant={showChanges ? "outline" : "secondary"} onClick={() => setShowChanges(false)}>All files</Button>
                    <Button size="sm" variant={showChanges ? "secondary" : "outline"} onClick={() => setShowChanges(true)}>
                      Changes vs live (v{selectedTheme?.published_version})
                    </Button>
                    {showChanges && tabFiles.length === 0 && <span className="text-muted-foreground">No file changes.</span>}
                  </div>
                )}
                <div className="mb-4 max-w-full overflow-x-auto">
                <TabsList className="w-max">
                  {tabFiles.map(filename => (
                    <TabsTrigger key={filename} value={filename}>
                      {filename}{fileChanges && fileChanges[filename] !== "unchanged" ? ` (${fileChanges[filename]})` : ""}
                    </TabsTrigger>
                  ))}
                </TabsList>
                </div>
                
                {tabFiles.map((filename) => (
                  <TabsContent key={filename} value={filename} className="flex-grow mt-0 h-full">
                    {/* Read-only code viewer */}
                    <div className="w-full h-full bg-zinc-950 text-zinc-300 p-4 rounded-xl overflow-auto font-mono text-xs leading-relaxed custom-scrollbar border border-zinc-800">
                      {showChanges ? (
                        <pre>
                          {diffLines(liveFiles?.[filename] ?? "", reviewFiles[filename] ?? "").map((line, i) => (
                            <div key={i} className={line.type === "add" ? "bg-emerald-500/15 text-emerald-300" : line.type === "remove" ? "bg-red-500/15 text-red-300" : "opacity-60"}>
                              {line.type === "add" ? "+ " : line.type === "remove" ? "- " : "  "}{line.text}
                            </div>
                          ))}
                        </pre>
                      ) : (
                        <pre>
                          <code>{String(reviewFiles[filename])}</code>
                        </pre>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No files found in this theme.
              </div>
            )}
          </div>

          <DialogFooter className="flex shrink-0 flex-col items-stretch gap-3 border-t bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <Button 
              variant="destructive" 
              onClick={() => handleReject(selectedTheme.id)}
              disabled={isRejecting || isCompiling}
            >
              {isRejecting ? <Loader2 className="animate-spin mr-2" /> : <XCircle className="mr-2" size={16} />}
              Reject & Send Back
            </Button>
            
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleApproveAndCompile(selectedTheme.id)}
              disabled={isCompiling || isRejecting || isAnalyzing || (report?.problems?.length ?? 0) > 0}
            >
              {isCompiling ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2" size={16} />}
              {isCompiling ? "Compiling Server-Side..." : "Approve & Compile Theme"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}