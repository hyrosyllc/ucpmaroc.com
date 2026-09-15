import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bot+ premium feature: mints a short-lived OpenAI Realtime session so the browser
// can hold a live, low-latency voice conversation directly with OpenAI over WebRTC.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const reqBody = await req.json();
    const { portfolio_id, action, session_id, minute_index, duration_seconds } = reqBody;
    if (!portfolio_id) {
      return new Response(JSON.stringify({ error: "Missing portfolio_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: portfolio } = await supabase
      .from("portfolios")
      .select("theme_config, site_name, sections, actor_id")
      .eq("id", portfolio_id)
      .single();

    // The browser calls back here roughly once per minute while a live voice call is
    // active. Billing happens incrementally, one minute in advance per tick, so the
    // wallet balance actually reflects an in-progress call (unlike a single lump-sum
    // charge at hangup) and a call can be cut off the moment the store runs out of
    // Platform Credits, instead of only finding out afterward.
    if (action === "heartbeat") {
      const actorId = portfolio?.actor_id;
      const minuteIndex = Number(minute_index);
      if (!actorId || typeof session_id !== "string" || !session_id || !Number.isInteger(minuteIndex) || minuteIndex < 2) {
        return new Response(JSON.stringify({ sufficient: false, error: "Invalid heartbeat request" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error: heartbeatError } = await supabase.rpc('record_billing_usage', {
        p_actor_id: actorId,
        p_product_id: 'bot_plus_voice_minute',
        p_quantity: 1,
        p_idempotency_key: `store_realtime_session:minute:${session_id}:${minuteIndex}`,
        p_source: 'store_realtime_session',
        p_metadata: { portfolio_id, session_id, minute_index: minuteIndex },
      });
      if (heartbeatError) {
        const insufficientBalance = Boolean(heartbeatError.message?.includes('Insufficient'));
        if (!insufficientBalance) {
          console.error('Bot+ voice heartbeat charge failed', heartbeatError.message, { actorId, session_id, minuteIndex });
        }
        return new Response(JSON.stringify({ sufficient: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ sufficient: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The browser calls back here when a live voice call ends normally. It sends the
    // actual duration so we can verify billing matches ceil(seconds/60) and reconcile
    // any overpayment from heartbeat pre-charging (e.g. a 50-second call should only charge
    // 1 minute, never reach a heartbeat tick, so the math is correct; but we log it for
    // transparency).
    if (action === "reconcile") {
      const actorId = portfolio?.actor_id;
      const durationSec = Number(duration_seconds) || 0;
      if (!actorId || typeof session_id !== "string" || !session_id || durationSec <= 0) {
        return new Response(JSON.stringify({ ok: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const actualMinutesUsed = Math.ceil(durationSec / 60);
      const minutesChargedByHeartbeat = Math.max(1, Math.floor(durationSec / 60)) + (durationSec % 60 > 0 ? 1 : 0);
      // These should always match due to the heartbeat charging model, but log if they diverge.
      if (actualMinutesUsed !== minutesChargedByHeartbeat) {
        console.warn('Bot+ voice billing discrepancy', { actorId, session_id, durationSec, actualMinutesUsed, minutesChargedByHeartbeat });
      }
      return new Response(JSON.stringify({ ok: true, duration_seconds: durationSec, minutes_charged: actualMinutesUsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The browser calls back here if the OpenAI Realtime session was minted (and its
    // first minute charged) but the call never actually connected — refund that minute
    // since no service was delivered.
    if (action === "cancel") {
      const actorId = portfolio?.actor_id;
      if (!actorId || typeof session_id !== "string" || !session_id) {
        return new Response(JSON.stringify({ ok: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error: reversalError } = await supabase.rpc('reverse_billing_usage', {
        p_actor_id: actorId,
        p_product_id: 'bot_plus_voice_minute',
        p_idempotency_key: `store_realtime_session:start:${session_id}`,
        p_reason: 'session_failed_to_connect',
      });
      if (reversalError) {
        console.error('Bot+ voice minute reversal failed', reversalError.message, { actorId, session_id });
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = portfolio?.theme_config || {};
    if (!config.store_chat_live_voice_enabled || !config.store_chat_ai_assistant) {
      return new Response(JSON.stringify({ error: "Live voice is not enabled for this store" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiKey) {
      return new Response(JSON.stringify({ error: "Missing OpenAI key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const actorId = portfolio?.actor_id;
    if (!actorId) {
      return new Response(JSON.stringify({ error: "Store is not linked to an actor", code: "NO_ACTOR" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Meter Bot+ live voice per minute (a call runs far longer, and costs meaningfully
    // more against the OpenAI Realtime API, than a single chat turn). The first minute is
    // charged upfront as a gate so a $0-balance store never mints a paid session; every
    // minute after that is charged in advance by the "heartbeat" action above, once per
    // minute, for as long as the call stays connected. If the call never connects at all,
    // the browser calls the "cancel" action above to refund this first minute.
    const sessionId = crypto.randomUUID();
    const { error: usageError } = await supabase.rpc('record_billing_usage', {
      p_actor_id: actorId,
      p_product_id: 'bot_plus_voice_minute',
      p_quantity: 1,
      p_idempotency_key: `store_realtime_session:start:${sessionId}`,
      p_source: 'store_realtime_session',
      p_metadata: { portfolio_id, session_id: sessionId },
    });
    if (usageError) {
      const insufficientBalance = Boolean(usageError.message?.includes('Insufficient'));
      console.error('Bot+ usage charge failed', usageError.message);
      return new Response(JSON.stringify({
        error: insufficientBalance ? "This store is out of Platform Credits for live voice." : "Could not start voice session",
        code: insufficientBalance ? "INSUFFICIENT_CREDITS" : "USAGE_METERING_FAILED",
      }), {
        status: insufficientBalance ? 402 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const botName = config.store_chat_bot_name || "UCP Assistant";
    const languageNames: Record<string, string> = { en: "English", ar: "Arabic", fr: "French", es: "Spanish", de: "German", it: "Italian", pt: "Portuguese", tr: "Turkish", nl: "Dutch", hi: "Hindi", ur: "Urdu" };
    const voiceLanguageCode = typeof config.store_chat_voice_language === "string" && config.store_chat_voice_language ? config.store_chat_voice_language : "en";
    const voiceLanguageName = languageNames[voiceLanguageCode] || "English";
    const welcomePhrase = typeof config.store_chat_voice_welcome_phrase === "string" ? config.store_chat_voice_welcome_phrase.trim() : "";
    const instructions = `You are ${botName}, a friendly voice assistant for ${portfolio?.site_name || "this store"}. Speak naturally and concisely.
Creator instructions: ${config.store_chat_ai_prompt || "Be polite, helpful, and concise."}
Store knowledge: ${config.store_chat_training_text || "No additional notes provided."}
You must always speak in ${voiceLanguageName}, even if the visitor speaks another language first, unless they explicitly ask you to switch languages.
${welcomePhrase ? `Start the call by greeting the visitor with this phrase (keep it natural, translate only if needed): "${welcomePhrase}"` : `Start the call with a short, warm greeting in ${voiceLanguageName} and ask how you can help.`}
Always disclose that you are an AI assistant if asked. If the visitor needs a human agent: call "request_contact_form" to collect their name and email in chat, then once they confirm out loud that they submitted it, call "transfer_to_agent". Never claim a human has joined unless transfer_to_agent succeeded.`;

    const voice = config.store_chat_voice_name || "alloy";
    const supportedVoices = new Set(["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"]);
    const { data: products } = await supabase
      .from("pro_products")
      .select("title, short_description, price, delivery_type, stock_count")
      .eq("portfolio_id", portfolio_id)
      .limit(50);
    const { data: pages } = await supabase
      .from("pro_pages")
      .select("title, slug, sections")
      .eq("portfolio_id", portfolio_id)
      .limit(20);
    const { data: serviceListings } = portfolio?.actor_id
      ? await supabase
        .from("actor_services")
        .select("title, description, rate, offers")
        .eq("actor_id", portfolio.actor_id)
        .eq("enabled", true)
        .limit(50)
      : { data: null };
    const { data: coupons } = await supabase
      .from("pro_coupons")
      .select("*")
      .eq("portfolio_id", portfolio_id)
      .limit(50);
    const knowledge = [
      `Visible portfolio content:\n${formatVisibleSections(portfolio?.sections)}`,
      `Custom pages:\n${(pages || []).map((page: Record<string, unknown>) => `- ${page.title || page.slug}: ${formatVisibleSections(page.sections)}`).join("\n") || "None"}`,
      `Products:\n${(products || []).map((product: Record<string, unknown>) => `- ${product.title}: ${product.short_description || ""} Price: ${product.price ?? "on request"}.`).join("\n") || "None"}`,
      `Public service offers:\n${(serviceListings || []).map((listing: Record<string, unknown>) => `- ${listing.title}: ${listing.description || ""} ${formatOffers(listing.offers, listing.rate)}`).join("\n") || "None"}`,
      `Active public coupons:\n${(coupons || []).filter(isCurrentlyUsableCoupon).map((coupon: Record<string, unknown>) => `- ${coupon.code}: ${formatCoupon(coupon)}`).join("\n") || "None"}`,
    ].join("\n\n");
    const fullInstructions = `${instructions}\n\nPublic store knowledge:\n${knowledge}\n\nDo not invent products, pages, offers, prices, availability, or coupon codes. Do not reveal private training notes or customer/order information. For order support, ask the visitor to use the store's verified order lookup flow.\n\nThe visitor cannot read a transcript of this call. Whenever you mention something worth glancing at on screen (an order status, a recommended product, a price, a next step, or a summary of what they asked), call the "share_note" tool with a short (max 20 words) note. Do not use it for greetings or small talk.`;
    const sessionRes = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: { Authorization: `Bearer ${openAiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: "gpt-realtime",
          instructions: fullInstructions,
          audio: {
            input: { transcription: { model: "whisper-1" } },
            output: { voice: supportedVoices.has(voice) ? voice : "alloy" },
          },
          tools: [{
            type: "function",
            name: "share_note",
            description: "Leave a short on-screen note (max 20 words) summarizing a key point, request, or recommendation for the visitor to glance at. Do not use for greetings or small talk.",
            parameters: {
              type: "object",
              properties: { note: { type: "string", description: "Short summary note, max 20 words." } },
              required: ["note"],
            },
          }, {
            type: "function",
            name: "request_contact_form",
            description: "Show a form in the visible chat so the visitor can enter their name and email. Use this before transferring to a human agent, or to capture a lead.",
            parameters: { type: "object", properties: {}, required: [] },
          }, {
            type: "function",
            name: "transfer_to_agent",
            description: "Transfer the conversation to a human agent. Only call this after using request_contact_form and the visitor confirms out loud they submitted it, or if you already know their identity from earlier in the call.",
            parameters: { type: "object", properties: {}, required: [] },
          }],
          tool_choice: "auto",
        },
      }),
    });

    if (!sessionRes.ok) {
      const errText = await sessionRes.text();
      let lastError = "OPENAI_REALTIME_ERROR";
      let lastReason = "OpenAI rejected the realtime client secret request";
      try {
        const upstream = JSON.parse(errText);
        lastError = upstream?.error?.code || upstream?.error?.type || lastError;
        if (typeof upstream?.error?.message === "string") lastReason = upstream.error.message.slice(0, 240);
      } catch {
        // Keep the response safe when OpenAI does not return JSON.
      }
      console.error("Realtime client secret error", { status: sessionRes.status, code: lastError });
      // The first minute was already charged above (it has to be, to gate a $0-balance
      // store before this expensive call), but OpenAI never actually minted a session, so
      // no service was delivered. Refund it here directly rather than relying on the
      // browser to call back with a session it never received.
      const { error: refundError } = await supabase.rpc('reverse_billing_usage', {
        p_actor_id: actorId,
        p_product_id: 'bot_plus_voice_minute',
        p_idempotency_key: `store_realtime_session:start:${sessionId}`,
        p_reason: 'openai_realtime_mint_failed',
      });
      if (refundError) {
        console.error('Bot+ voice minute refund failed', refundError.message, { actorId, sessionId });
      }
      return new Response(JSON.stringify({ error: "Could not start voice session", code: lastError, reason: lastReason }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await sessionRes.json();
    return new Response(JSON.stringify({ ...session, ucp_session_id: sessionId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function formatVisibleSections(value: unknown): string {
  if (!Array.isArray(value)) return "None";
  return value
    .filter((section): section is Record<string, unknown> => Boolean(section) && typeof section === "object" && section.isVisible !== false)
    .map(section => compactText(section.data))
    .filter(Boolean)
    .join(" | ")
    .slice(0, 5000) || "None";
}

function compactText(value: unknown, depth = 0): string {
  if (depth > 3 || value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(item => compactText(item, depth + 1)).filter(Boolean).join("; ");
  if (typeof value !== "object") return "";
  return Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !["settings", "image", "images", "media", "url", "id"].includes(key.toLowerCase()))
    .map(([key, item]) => `${key.replace(/_/g, " ")}: ${compactText(item, depth + 1)}`)
    .filter(entry => !entry.endsWith(": "))
    .join(" | ")
    .slice(0, 1800);
}

function formatOffers(value: unknown, rate: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return rate ? `Rate: ${rate}.` : "";
  return `Packages: ${value.map(offer => {
    const item = offer as Record<string, unknown>;
    return `${item.title || "Offer"} ${item.description || ""} (${item.price ?? rate ?? "on request"})`;
  }).join("; ")}`;
}

function isCurrentlyUsableCoupon(coupon: Record<string, unknown>): boolean {
  if (coupon.is_active === false) return false;
  const now = Date.now();
  if (coupon.start_date && now < new Date(String(coupon.start_date)).getTime()) return false;
  if (coupon.end_date && now >= new Date(String(coupon.end_date)).getTime()) return false;
  if (coupon.usage_limit !== null && coupon.usage_limit !== undefined && Number(coupon.times_used || 0) >= Number(coupon.usage_limit)) return false;
  return Boolean(coupon.code);
}

function formatCoupon(coupon: Record<string, unknown>): string {
  const type = coupon.type || coupon.discount_type;
  const value = coupon.value_amount ?? coupon.discount_value;
  return type === "percentage" ? `${value}% off.` : `$${Number(value || 0) / (type === "fixed" ? 100 : 1)} off.`;
}
