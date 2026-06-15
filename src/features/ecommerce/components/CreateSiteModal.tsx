import React, { useState } from "react";
import { supabase } from "@/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  LayoutTemplate,
  Sparkles,
  ArrowRight,
  MonitorPlay,
  Palette,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PORTFOLIO_TEMPLATES } from "@/features/portfolio-builder/config/templates";
import { useSubscription } from "@/context/SubscriptionContext";

const EXTENDED_TEMPLATES = [
  {
    id: "blank",
    name: "Blank Canvas",
    description: "Start from scratch and build your own custom layout.",
    sections: [],
  },
  ...PORTFOLIO_TEMPLATES,
];

interface CreateSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  actorId: string;
  onSuccess: (portfolioId: string, isFirstSite: boolean) => void;
  siteCount: number;
}

export function CreateSiteModal({
  isOpen,
  onClose,
  actorId,
  onSuccess,
  siteCount,
}: CreateSiteModalProps) {
  const { siteSlots, isLoading: isSubLoading, limits } = useSubscription();

  const [newSiteName, setNewSiteName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    EXTENDED_TEMPLATES[0].id
  );
  const [installMockData, setInstallMockData] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSite = async () => {
    if (!newSiteName.trim()) {
      alert("Please enter a site name");
      return;
    }
    if (!limits || isSubLoading) {
      alert("Subscription data is still loading. Please wait a moment.");
      return;
    }

    const maxSites = siteSlots?.total || 1;
    if (siteCount >= maxSites) {
      alert(
        `Plan limit reached. You can only have ${maxSites} site(s) on your current plan.`
      );
      onClose();
      return;
    }

    setIsCreating(true);
    try {
      const template =
        EXTENDED_TEMPLATES.find((t) => t.id === selectedTemplate) ||
        EXTENDED_TEMPLATES[0];
      const baseSlug =
        newSiteName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "site";
      const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

      const { data, error } = await supabase
        .from("portfolios")
        .insert({
          actor_id: actorId,
          site_name: newSiteName,
          public_slug: uniqueSlug,
          is_published: false,
          sections: template.sections,
          theme_config: {
            templateId: "modern",
            primaryColor: "violet",
            font: "sans",
            radius: 0.5,
            buttonStyle: "solid",
          },
        })
        .select()
        .single();

      if (error) throw error;

      // 🚀 INJECT MOCK E-COMMERCE DATA IF REQUESTED
      if (installMockData && template.mockData?.products) {
        const mockProducts = template.mockData.products.map((p: any) => ({
          ...p,
          actor_id: actorId,
          portfolio_id: data.id,
          action_type: "cart", // Default them to cart
          slug: `${p.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}-${Date.now()
            .toString()
            .slice(-4)}`,
        }));

        // Fire and forget
        supabase
          .from("pro_products")
          .insert(mockProducts)
          .then(({ error: prodError }) => {
            if (prodError)
              console.error("Failed to inject mock products:", prodError);
          });
      }

      const isFirstSite = siteCount === 0;

      setNewSiteName("");
      setInstallMockData(true);
      onSuccess(data.id, isFirstSite);
    } catch (error: any) {
      alert("Failed to create site: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const activeTemplate = EXTENDED_TEMPLATES.find((t) => t.id === selectedTemplate) || EXTENDED_TEMPLATES[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[100vw] w-screen h-[100dvh] p-0 m-0 border-0 rounded-none overflow-hidden bg-background flex flex-col md:flex-row [&>button]:right-6 [&>button]:top-6 [&>button]:bg-muted/50 [&>button]:rounded-full hover:[&>button]:bg-muted [&>button]:opacity-100 [&>button]:z-50 shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Welcome to the Builder</DialogTitle>
          <DialogDescription>Set up your new portfolio site.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col md:flex-row w-full h-full">
          <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-gradient-to-br from-primary/80 to-blue-600 flex-col justify-between text-white relative overflow-hidden h-full">
            {activeTemplate.thumbnail ? (
              <>
                <img src={activeTemplate.thumbnail} alt={activeTemplate.name} className="absolute inset-0 w-full h-full object-cover animate-in fade-in zoom-in duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none"></div>
                <div className="relative z-10 mt-auto p-10 lg:p-16 animate-in slide-in-from-bottom-8 duration-700 fade-in">
                  <Badge variant="secondary" className="bg-primary/90 text-white border-none mb-4 hover:bg-primary px-3 py-1 text-xs shadow-sm">{activeTemplate.name}</Badge>
                  <h2 className="text-4xl lg:text-5xl font-black mb-4 text-white tracking-tight">{activeTemplate.name}</h2>
                  <p className="text-white/80 font-medium text-lg lg:text-xl leading-relaxed max-w-xl">{activeTemplate.description}</p>
                </div>
              </>
            ) : (
              <>
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="relative z-10 p-10 lg:p-16">
                  <Sparkles className="w-12 h-12 mb-6 text-white/90" />
                  <h2 className="text-4xl lg:text-5xl font-black mb-3 tracking-tight leading-tight">
                    Create New Website
                  </h2>
                  <p className="text-white/80 font-medium leading-relaxed text-lg lg:text-xl max-w-lg">
                    Launch a stunning portfolio, set up your shop, and take bookings
                    in minutes. No coding required.
                  </p>
                </div>
                <div className="mt-auto space-y-4 relative z-10 p-10 lg:p-16">
                  <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                    <MonitorPlay className="w-6 h-6 text-white" />
                    <span className="text-base font-bold">1. Choose a template</span>
                  </div>
                  <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                    <Palette className="w-6 h-6 text-white" />
                    <span className="text-base font-bold">2. Customize your brand</span>
                  </div>
                  <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                    <Globe className="w-6 h-6 text-white" />
                    <span className="text-base font-bold">3. Publish to the world</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-full md:w-1/2 lg:w-2/5 p-6 sm:p-8 md:p-10 lg:p-12 bg-background flex flex-col justify-start h-full overflow-y-auto custom-scrollbar">
            <div className="max-w-md mx-auto w-full pt-4 pb-8">
              <h3 className="text-2xl font-extrabold mb-8 flex items-center gap-2 text-foreground mt-4 md:mt-0">
                Let's get started <ArrowRight className="w-6 h-6 text-primary" />
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground font-bold uppercase tracking-wider text-xs">
                    Website Name
                  </Label>
                  <Input
                    placeholder="e.g. My Creative Portfolio"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    className="h-12 text-lg font-medium bg-muted/50 border-transparent focus-visible:border-primary focus-visible:bg-background transition-colors"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-muted-foreground font-bold uppercase tracking-wider text-xs">
                    Select Template
                  </Label>
                  <div className="grid grid-cols-2 gap-4 mt-2 pb-4">
                  {EXTENDED_TEMPLATES.map((template) => {
                    const isSelected = selectedTemplate === template.id;
                    return (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={cn(
                          "flex flex-col border-2 rounded-xl cursor-pointer overflow-hidden transition-all hover:border-primary/50 relative group",
                          isSelected ? "border-primary shadow-sm" : "border-border bg-card"
                        )}
                      >
                        <div className="h-28 w-full bg-muted relative overflow-hidden">
                          {template.thumbnail ? (
                            <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center">
                              <LayoutTemplate className="w-8 h-8 text-primary/40" />
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute top-2 right-2 text-white bg-primary rounded-full shadow-md z-10">
                              <CheckCircle2 size={18} />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="font-bold text-sm text-foreground leading-tight">{template.name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{template.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {EXTENDED_TEMPLATES.find((t) => t.id === selectedTemplate)?.mockData && (
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center justify-between mb-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="space-y-0.5 pr-4">
                      <Label className="text-sm font-bold text-primary cursor-pointer" htmlFor="quickMockDataToggle">
                        Install Sample Products
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        This template includes mock E-Commerce products to jumpstart your store.
                      </p>
                    </div>
                    <Switch id="quickMockDataToggle" checked={installMockData} onCheckedChange={setInstallMockData} />
                  </div>
                )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={onClose} className="h-14 px-6 font-bold">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateSite}
                    disabled={isCreating || isSubLoading || !limits}
                    className="flex-1 h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    {isCreating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                    {isSubLoading ? "Loading Plan..." : "Create My Website"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}