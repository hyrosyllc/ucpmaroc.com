// In supabase/functions/create-order/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1. UPDATE THIS INTERFACE to accept all new fields
interface OrderData {
  actor_id: string;
  client_name: string;
  script: string;
  service_type: string;
  
  // Voice-over fields (optional)
  word_count?: number;
  usage?: string | null;
  total_price?: number | null;
  payment_method?: 'stripe' | 'bank' | null;
  stripe_payment_intent_id?: string | null;

  // Scriptwriting fields (optional)
  quote_est_duration?: string | null;
  
  // Video editing fields (optional)
  quote_video_type?: string | null;
  quote_footage_choice?: string | null;
}
// --- END INTERFACE UPDATE ---

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) throw new Error('Authentication is required.');

    const orderData = await req.json() as OrderData;

    // Validation
    if (!orderData.actor_id || !orderData.client_name || !orderData.service_type) {
      throw new Error('Missing required fields (actor_id, client_name, service_type).');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authorization } },
    });
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) throw new Error('Authentication is required.');

    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, email')
      .eq('user_id', user.id)
      .maybeSingle();
    if (clientError) throw clientError;
    if (!client) throw new Error('A client profile is required to place an order.');

    const { data: actor, error: actorError } = await supabaseAdmin
      .from('actors')
      .select('id, ActorName, ActorEmail, BaseRate_per_Word, WebMultiplier, BroadcastMultiplier')
      .eq('id', orderData.actor_id)
      .eq('IsActive', true)
      .single();
    if (actorError || !actor) throw new Error('This actor is not available.');

    const { data: service, error: serviceError } = await supabaseAdmin
      .from('actor_services')
      .select('service_id, enabled, status')
      .eq('actor_id', actor.id)
      .eq('service_id', orderData.service_type)
      .eq('enabled', true)
      .eq('status', 'approved')
      .maybeSingle();
    if (serviceError) throw serviceError;
    if (!service) throw new Error('This service is not currently available.');

    const isVoiceOver = orderData.service_type === 'voice_over';
    const wordCount = Math.max(0, Math.floor(Number(orderData.word_count) || 0));
    const usage = orderData.usage === 'broadcast' ? 'broadcast' : 'web';
    const baseRate = Number(actor.BaseRate_per_Word) || 0;
    const multiplier = usage === 'broadcast'
      ? Number(actor.BroadcastMultiplier) || 1
      : Number(actor.WebMultiplier) || 1;
    const calculatedPrice = isVoiceOver
      ? Math.max(10, wordCount * baseRate * multiplier)
      : null;

    const paymentMethod = orderData.payment_method === 'stripe' || orderData.payment_method === 'bank'
      ? orderData.payment_method
      : null;
    let status = isVoiceOver ? 'Awaiting Payment' : 'awaiting_offer';

    if (isVoiceOver && paymentMethod === 'stripe') {
      if (!orderData.stripe_payment_intent_id || !calculatedPrice) {
        throw new Error('A valid Stripe payment is required.');
      }

      const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (!stripeSecretKey) throw new Error('Stripe payment configuration is missing.');

      const stripeResponse = await fetch(
        `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(orderData.stripe_payment_intent_id)}`,
        { headers: { Authorization: `Bearer ${stripeSecretKey}` } },
      );
      const paymentIntent = await stripeResponse.json();
      if (!stripeResponse.ok || paymentIntent.status !== 'succeeded') {
        throw new Error('Stripe payment has not succeeded.');
      }
      if (paymentIntent.currency !== 'mad' || paymentIntent.amount_received !== Math.round(calculatedPrice * 100)) {
        throw new Error('Stripe payment amount does not match the order.');
      }

      status = 'In Progress';
    }

    const { data: newOrder, error: insertError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_id_string: `UCP-${Date.now()}`,
        actor_id: orderData.actor_id,
        client_name: orderData.client_name,
        client_email: client.email.toLowerCase(),
        script: orderData.script,
        status,
        service_type: orderData.service_type,
        word_count: isVoiceOver ? wordCount : 0,
        usage: isVoiceOver ? usage : null,
        total_price: calculatedPrice,
        payment_method: isVoiceOver ? paymentMethod : null,
        stripe_payment_intent_id: isVoiceOver && paymentMethod === 'stripe' ? orderData.stripe_payment_intent_id : null,
        quote_est_duration: orderData.quote_est_duration || null,
        quote_video_type: orderData.quote_video_type || null,
        quote_footage_choice: orderData.quote_footage_choice || null,
        client_id: client.id,
      })
      .select()
      .single();
    // --- END INSERTION UPDATE ---

    if (insertError) {
      console.error("Error inserting order:", insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify(newOrder),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.';
    console.error("Error in create-order function:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})