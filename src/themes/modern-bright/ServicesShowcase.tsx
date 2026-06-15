import React, { useState, useEffect } from "react";
import { BlockProps } from "../types";
import { supabase } from "@/supabaseClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Mic,
  Video,
  PencilLine,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Sparkles,
  Settings,
} from "lucide-react";
import {
  AudioDemoCard,
  VideoDemoCard,
  ScriptDemoCard,
  Demo,
} from "@/components/DemoCards";
import { cn } from "@/lib/utils";
// 🚀 1. IMPORT INLINE EDIT
import { InlineEdit } from "../../components/dashboard/InlineEdit";

interface ServiceData {
  id: string;
  title: string;
  icon: any;
  description: string;
  rate: string;
  demos: Demo[];
}

// 🚀 2. GRAB id AND isPreview FROM PROPS
const ServicesShowcase: React.FC<any> = ({ data, id, isPreview, actorId }) => {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);

  // --- DATA FETCHING ---
  useEffect(() => {
    const loadData = async () => {
      if (!actorId) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const { data: actor, error: actorError } = await supabase
        .from("actors")
        .select("*")
        .eq("id", actorId)
        .single();

      if (actorError || !actor) {
        console.error("ServicesShowcase: Failed to fetch actor", actorError);
        setLoading(false);
        return;
      }

      const [demosRes, scriptRes, videoRes] = await Promise.all([
        supabase.from("demos").select("*").eq("actor_id", actorId),
        supabase.from("script_demos").select("*").eq("actor_id", actorId),
        supabase.from("video_demos").select("*").eq("actor_id", actorId),
      ]);

      const availableServices: ServiceData[] = [];

      if (actor.service_voiceover) {
        const voDemos = (demosRes.data || []).map((d: any) => ({
          demo_type: "audio" as const,
          demo_id: d.demo_id || d.id,
          demo_title: d.demo_title || d.title,
          demo_url: d.demo_url || d.url,
          demo_content: null,
          created_at: d.created_at,
          actor_id: actor.id,
          actor_name: actor.ActorName,
          actor_headshot: actor.HeadshotURL,
          actor_slug: actor.slug,
          likes: 0,
        }));

        availableServices.push({
          id: "voice_over",
          title: "Voice Over",
          icon: Mic,
          description:
            "Professional voice recording for commercials, narration, and character work.",
          rate: `${actor.BaseRate_per_Word} MAD / word`,
          demos: voDemos,
        });
      }

      if (actor.service_scriptwriting) {
        const scDemos = (scriptRes.data || []).map((d: any) => ({
          demo_type: "script" as const,
          demo_id: d.id,
          demo_title: d.title,
          demo_content: d.content,
          demo_url: null,
          created_at: d.created_at,
          actor_id: actor.id,
          actor_name: actor.ActorName,
          actor_headshot: actor.HeadshotURL,
          actor_slug: actor.slug,
          likes: 0,
        }));

        availableServices.push({
          id: "scriptwriting",
          title: "Script Writing",
          icon: PencilLine,
          description:
            actor.service_script_description || "Creative scriptwriting.",
          rate: actor.service_script_rate
            ? `${actor.service_script_rate} MAD / word`
            : "Custom Quote",
          demos: scDemos,
        });
      }

      if (actor.service_videoediting) {
        const vidDemos = (videoRes.data || []).map((d: any) => ({
          demo_type: "video" as const,
          demo_id: d.id,
          demo_title: d.title,
          demo_url: d.video_url,
          demo_content: null,
          created_at: d.created_at,
          actor_id: actor.id,
          actor_name: actor.ActorName,
          actor_headshot: actor.HeadshotURL,
          actor_slug: actor.slug,
          likes: 0,
        }));

        availableServices.push({
          id: "video_editing",
          title: "Video Editing",
          icon: Video,
          description:
            actor.service_video_description || "Professional editing.",
          rate: actor.service_video_rate
            ? `${actor.service_video_rate} MAD / min`
            : "Custom Quote",
          demos: vidDemos,
        });
      }

      setServices(availableServices);
      setLoading(false);
    };

    loadData();
  }, [actorId]);

  if (loading)
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-900" />
      </div>
    );

  const hasServices = services.length > 0;

  // Hide entirely on live site if no services, but show in preview mode!
  if (!hasServices && !isPreview) return null;

  return (
    <section className="relative py-24 px-4 bg-white overflow-hidden min-h-screen">
      <div className="hidden md:block absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

      <div className="container max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4">
          {/* 🚀 3. INLINE EDITABLE TITLE & SUBTITLE */}
          <InlineEdit
            tagName="h2"
            className="text-4xl md:text-5xl font-bold text-neutral-900 tracking-tight block"
            text={data.title || "Services & Rates"}
            sectionId={id}
            fieldKey="title"
            isPreview={isPreview}
          />
          <InlineEdit
            tagName="p"
            className="text-neutral-600 text-lg max-w-2xl mx-auto block"
            text={
              data.subheadline ||
              "Explore my professional services and view selected works."
            }
            sectionId={id}
            fieldKey="subheadline"
            isPreview={isPreview}
          />
        </div>

        {/* 🚀 4. EMPTY STATE UX */}
        {!hasServices && isPreview ? (
          <div className="w-full py-24 border-2 border-dashed border-black/10 rounded-3xl flex flex-col items-center justify-center text-neutral-500 bg-black/5">
            <Settings className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-neutral-900 mb-2">
              No Services Configured
            </h3>
            <p className="max-w-md text-center mb-6">
              This section automatically syncs with your Actor Profile. Go to
              your Dashboard Profile settings to enable services and set your
              rates.
            </p>
          </div>
        ) : (
          <Tabs defaultValue={services[0]?.id} className="w-full">
            <div className="flex justify-center mb-16">
              <TabsList className="bg-black/5 border border-black/10 p-1 rounded-full h-auto flex flex-wrap justify-center gap-2 backdrop-blur-md">
                {services.map((s) => (
                  <TabsTrigger
                    key={s.id}
                    value={s.id}
                    className="rounded-full px-6 py-3 text-base data-[state=active]:bg-white data-[state=active]:text-black text-neutral-600 hover:text-neutral-900 transition-all flex items-center gap-2"
                  >
                    <s.icon className="w-4 h-4" /> {s.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {services.map((service) => (
              <TabsContent
                key={service.id}
                value={service.id}
                className="animate-in fade-in slide-in-from-bottom-8 duration-700 will-change-transform"
              >
                {/* Service Info Card */}
                {data.showRates && (
                  <div className="relative rounded-[2rem] overflow-hidden border border-black/10 bg-neutral-50 shadow-2xl mb-20 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />
                    <service.icon className="hidden md:block absolute -right-12 -bottom-12 w-96 h-96 text-white/5 rotate-[-15deg] pointer-events-none transition-transform duration-700 group-hover:rotate-0" />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-8 p-0">
                      <div className="lg:col-span-2 p-8 md:p-12 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/10 text-xs font-mono text-indigo-300">
                          <Sparkles className="w-3 h-3" /> PROFESSIONAL SERVICE
                        </div>
                        <h3 className="text-3xl md:text-5xl font-bold text-neutral-900">
                          {service.title}
                        </h3>
                        <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl">
                          {service.description}
                        </p>
                      </div>
                      <div className="lg:col-span-1 bg-black/5 border-t lg:border-t-0 lg:border-l border-black/10 p-8 md:p-12 flex flex-col justify-center gap-6 backdrop-blur-sm">
                        <div>
                          <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-2">
                            Starting Rate
                          </p>
                          <p className="text-3xl md:text-4xl font-bold text-neutral-900">
                            {service.rate}
                          </p>
                        </div>
                        {data.ctaText && (
                          <Button
                            size="lg"
                            className="w-full h-14 rounded-xl bg-white text-black hover:bg-neutral-200 text-lg font-semibold shadow-lg group/btn"
                            asChild
                          >
                            <a
                              href={data.ctaLink || "#contact"}
                              onClick={(e) => isPreview && e.preventDefault()}
                            >
                              {/* 🚀 5. INLINE EDITABLE CTA BUTTON */}
                              <InlineEdit
                                tagName="span"
                                text={data.ctaText}
                                sectionId={id}
                                fieldKey="ctaText"
                                isPreview={isPreview}
                              />
                              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover/btn:translate-x-1 inline-block" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Demos Section */}
                {data.showDemos && (
                  <div className="space-y-10">
                    <div className="flex items-center gap-4">
                      <div className="h-px bg-black/5 flex-1" />
                      <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                        Selected {service.title} Work
                      </h3>
                      <div className="h-px bg-black/5 flex-1" />
                    </div>

                    {service.demos.length > 0 ? (
                      <div
                        className={cn(
                          "grid gap-6",
                          service.id === "video_editing"
                            ? "grid-cols-1 md:grid-cols-2"
                            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                        )}
                      >
                        {service.demos.map((demo) => (
                          <div key={demo.demo_id}>
                            {/* Block clicks in preview so modals don't trap the user */}
                            <div
                              className={cn(
                                "rounded-xl overflow-hidden border border-black/5 bg-black/20 hover:border-black/20 transition-colors",
                                isPreview && "pointer-events-none"
                              )}
                            >
                              {service.id === "voice_over" && (
                                <AudioDemoCard demo={demo} />
                              )}
                              {service.id === "video_editing" && (
                                <VideoDemoCard demo={demo} />
                              )}
                              {service.id === "scriptwriting" && (
                                <ScriptDemoCard demo={demo} />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-24 border border-dashed border-black/10 rounded-3xl bg-black/5 text-neutral-500">
                        <service.icon className="w-12 h-12 mb-4 opacity-20" />
                        <p>No demos uploaded for this service yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </section>
  );
};

export default ServicesShowcase;
