// In supabase/functions/create-order/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1. UPDATE THIS INTERFACE to accept all new fields
interface OrderData {
  order_id_string: string;
  actor_id: string;
  client_name: string;
  client_email: string;
  script: string;
  status: string;
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
    console.log("create-order function invoked.");
    const orderData = await req.json() as OrderData;
    console.log("Received order data:", orderData);

    // Validation
    if (!orderData.actor_id || !orderData.client_email || !orderData.client_name || !orderData.service_type) {
        throw new Error('Missing required fields (actor_id, client_email, client_name, service_type).');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- 2. UPDATE THE INSERTION OBJECT ---
    const { data: newOrder, error: insertError } = await supabaseAdmin
      .from('orders')
      .insert({
        // Core Info
        order_id_string: orderData.order_id_string,
        actor_id: orderData.actor_id,
        client_name: orderData.client_name,
        client_email: orderData.client_email.toLowerCase(),
        script: orderData.script,
        status: orderData.status,
        service_type: orderData.service_type,

        // Voice Over Info
        word_count: orderData.word_count || 0,
        usage: orderData.usage || null,
        total_price: orderData.total_price || null,
        payment_method: orderData.payment_method || null,
        stripe_payment_intent_id: orderData.stripe_payment_intent_id || null,

        // Scripting Info
        quote_est_duration: orderData.quote_est_duration || null,
        
        // Video Info
        quote_video_type: orderData.quote_video_type || null,
        quote_footage_choice: orderData.quote_footage_choice || null,
        
        client_id: null
      })
      .select()
      .single();
    // --- END INSERTION UPDATE ---

    if (insertError) {
      console.error("Error inserting order:", insertError);
      throw insertError;
    }

    console.log("Order inserted successfully:", newOrder);

    return new Response(
      JSON.stringify(newOrder),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error in create-order function:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})