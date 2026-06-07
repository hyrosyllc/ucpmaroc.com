import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { ActorDashboardContextType } from "@/layouts/ActorDashboardLayout"; "@/features/talent-marketplace";
import { supabase } from "@/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Code2,
  Rocket,
  Clock,
  CheckCircle2,
  XCircle,
  Coins,
  Settings,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DeveloperHubPage() {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTheme, setNewTheme] = useState({
    name: "",
    description: "",
    site_price: 200,
    global_price: 500,
  });

  // 1. Fetch the Developer's Themes
  const {
    data: themes = [],
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["developer_themes", actorData?.id],
    queryFn: async () => {
      if (!actorData?.id) return [];
      const { data, error } = await supabase
        .from("marketplace_themes")
        .select("*")
        .eq("developer_id", actorData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!actorData?.id,
  });

  // 2. Create a New Theme
  const handleCreateTheme = async () => {
    if (!newTheme.name.trim()) return alert("Theme name is required.");
    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("marketplace_themes")
      .insert({
        developer_id: actorData.id,
        name: newTheme.name,
        description: newTheme.description,
        site_price: newTheme.site_price,
        global_price: newTheme.global_price,
        status: "draft",
      })
      .select()
      .single();

    setIsSubmitting(false);

    if (error) {
      alert("Failed to create theme: " + error.message);
    } else {
      setIsCreateOpen(false);
      refetch();
      // Instantly drop them into the IDE to start coding!
      navigate(`/dashboard/studio?themeId=${data.id}`);
    }
  };

  // 3. Submit for Review
  const handleSubmitForReview = async (themeId: string) => {
    if (
      !confirm("Submit this theme to the AI Auditor for Marketplace approval?")
    )
      return;

    const { error } = await supabase
      .from("marketplace_themes")
      .update({ status: "pending_review" })
      .eq("id", themeId);

    if (error) alert("Error submitting theme.");
    else {
      alert(
        "Theme submitted successfully! Our AI and Admin team will review it shortly."
      );
      refetch();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 gap-1">
            <CheckCircle2 size={12} /> Approved (Live)
          </Badge>
        );
      case "pending_review":
        return (
          <Badge
            variant="outline"
            className="border-amber-500 text-amber-600 bg-amber-50 gap-1"
          >
            <Clock size={12} /> In Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle size={12} /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Code2 size={12} /> Draft
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-zinc-950 text-white p-8 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Creator Hub
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl">
            Build, test, and monetize your custom themes. Earn coins every time
            an actor uses your design.
          </p>
        </div>
        <Button
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold relative z-10 rounded-xl h-12 px-6 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="mr-2" size={20} /> Create New Theme
        </Button>
      </div>

      {/* Theme Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Code2 className="text-indigo-500" /> My Projects
        </h2>

        {themes.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 border-2 border-dashed rounded-3xl">
            <Code2
              size={48}
              className="mx-auto text-muted-foreground mb-4 opacity-20"
            />
            <h3 className="font-bold text-xl mb-2">No themes yet</h3>
            <p className="text-muted-foreground mb-6">
              Start building your first custom theme to earn coins.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus size={16} className="mr-2" /> Create Theme
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map((theme) => (
              <Card
                key={theme.id}
                className="flex flex-col overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="h-32 bg-zinc-100 dark:bg-zinc-900 border-b flex items-center justify-center relative overflow-hidden">
                  {/* We will render actual thumbnails here later */}
                  <Code2
                    size={40}
                    className="text-zinc-300 dark:text-zinc-800"
                  />
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(theme.status)}
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold truncate">
                    {theme.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[40px]">
                    {theme.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-0 flex-grow">
                  <div className="flex gap-4 text-sm bg-muted/50 p-3 rounded-lg border border-border/50">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">
                        Site License
                      </div>
                      <div className="flex items-center gap-1 font-bold text-amber-600">
                        <Coins size={12} /> {theme.site_price}
                      </div>
                    </div>
                    <div className="w-px bg-border"></div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">
                        Global License
                      </div>
                      <div className="flex items-center gap-1 font-bold text-primary">
                        <Coins size={12} /> {theme.global_price}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-5 pt-4 flex gap-2">
                  <Button
                    className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    onClick={() =>
                      navigate(`/dashboard/studio?themeId=${theme.id}`)
                    }
                  >
                    <Code2 size={16} className="mr-2" /> Open Studio
                  </Button>

                  {theme.status === "draft" || theme.status === "rejected" ? (
                    <Button
                      variant="outline"
                      className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-950"
                      onClick={() => handleSubmitForReview(theme.id)}
                    >
                      <Rocket size={16} />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      disabled
                      title="Pending Review or Approved"
                    >
                      <Settings size={16} className="text-muted-foreground" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create New Theme</DialogTitle>
            <DialogDescription>
              Setup the details for your new marketplace theme.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Theme Name</Label>
              <Input
                placeholder="e.g. Minimalist Agency"
                value={newTheme.name}
                onChange={(e) =>
                  setNewTheme({ ...newTheme, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the vibe and use-case for this theme..."
                value={newTheme.description}
                onChange={(e) =>
                  setNewTheme({ ...newTheme, description: e.target.value })
                }
                className="resize-none h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Single Site Price (Coins)</Label>
                <Input
                  type="number"
                  min="0"
                  step="50"
                  value={newTheme.site_price}
                  onChange={(e) =>
                    setNewTheme({
                      ...newTheme,
                      site_price: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Global Price (Coins)</Label>
                <Input
                  type="number"
                  min="0"
                  step="50"
                  value={newTheme.global_price}
                  onChange={(e) =>
                    setNewTheme({
                      ...newTheme,
                      global_price: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded border">
              <strong>Note:</strong> You keep 70% of all coin revenue generated
              from sales of this theme. You can use this theme for free on your
              own portfolios while it is a Draft.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTheme} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Create & Enter Studio"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
