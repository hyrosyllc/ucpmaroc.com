import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import type { Demo } from "@/components/DemoCards";

export interface ShowcaseService {
  id: "voice_over" | "scriptwriting" | "video_editing";
  title: string;
  description: string;
  rate: string;
  demos: Demo[];
}

/** The actor's enabled services (voice, script, video) with their demos, for the talent services section. */
export function useServicesShowcase(actorId?: string) {
  const [services, setServices] = useState<ShowcaseService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actorId) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      const { data: actor, error } = await supabase.from("actors").select("*").eq("id", actorId).single();
      if (error || !actor) {
        if (active) setLoading(false);
        return;
      }
      const [demosRes, scriptRes, videoRes] = await Promise.all([
        supabase.from("demos").select("*").eq("actor_id", actorId),
        supabase.from("script_demos").select("*").eq("actor_id", actorId),
        supabase.from("video_demos").select("*").eq("actor_id", actorId),
      ]);

      const base = {
        actor_id: actor.id,
        actor_name: actor.ActorName,
        actor_headshot: actor.HeadshotURL,
        actor_slug: actor.slug,
        likes: 0,
      };
      const list: ShowcaseService[] = [];

      if (actor.service_voiceover) {
        list.push({
          id: "voice_over",
          title: "Voice Over",
          description: "Professional voice recording for commercials, narration, and character work.",
          rate: `${actor.BaseRate_per_Word} MAD / word`,
          demos: (demosRes.data || []).map((d: any) => ({
            ...base,
            demo_type: "audio" as const,
            demo_id: d.demo_id || d.id,
            demo_title: d.demo_title || d.title,
            demo_url: d.demo_url || d.url,
            demo_content: null,
            created_at: d.created_at,
          })),
        });
      }
      if (actor.service_scriptwriting) {
        list.push({
          id: "scriptwriting",
          title: "Script Writing",
          description: actor.service_script_description || "Creative scriptwriting.",
          rate: actor.service_script_rate ? `${actor.service_script_rate} MAD / word` : "Custom Quote",
          demos: (scriptRes.data || []).map((d: any) => ({
            ...base,
            demo_type: "script" as const,
            demo_id: d.id,
            demo_title: d.title,
            demo_content: d.content,
            demo_url: null,
            created_at: d.created_at,
          })),
        });
      }
      if (actor.service_videoediting) {
        list.push({
          id: "video_editing",
          title: "Video Editing",
          description: actor.service_video_description || "Professional editing.",
          rate: actor.service_video_rate ? `${actor.service_video_rate} MAD / min` : "Custom Quote",
          demos: (videoRes.data || []).map((d: any) => ({
            ...base,
            demo_type: "video" as const,
            demo_id: d.id,
            demo_title: d.title,
            demo_url: d.video_url,
            demo_content: null,
            created_at: d.created_at,
          })),
        });
      }

      if (active) {
        setServices(list);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [actorId]);

  return { services, loading };
}
