import { supabase } from '@/supabaseClient';

export const trackEvent = async (
  actorId: string, 
  eventType: 'page_view' | 'shop_click' | 'whatsapp_click' | 'social_click', 
  metadata: Record<string, any> = {}
) => {
  try {
    // 1. Basic bot detection (optional but good)
    const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);
    if (isBot) return;

    // 2. Fire and Forget (Don't await, just send)
    supabase.from('analytics_events').insert({
      actor_id: actorId,
      portfolio_id: metadata.portfolio_id || null, // <--- THE FIX: Send to dedicated column
      event_type: eventType,
      page_path: window.location.pathname,
      metadata: {
        ...metadata,
        referrer: document.referrer,
        screen_width: window.screen.width,
        language: navigator.language
      }
    }).then(({ error }) => {
        if (error) console.error("Analytics error:", error);
    });

  } catch (err) {
    // Fail silently so we never break the app
    console.error("Analytics exception:", err);
  }
};