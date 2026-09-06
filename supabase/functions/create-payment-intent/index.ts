import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STRIPE_SECRET_KEY = Deno.env.toObject().STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error("CRITICAL: STRIPE_SECRET_KEY environment variable not found!");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Accept metadata alongside the existing fields
    const { amount, email, name, setup_future_usage, currency, metadata, orderId } =
      await req.json();

    let trustedAmount = amount;
    let trustedEmail = email;
    let trustedName = name;

    if (orderId) {
      const authorization = req.headers.get("Authorization");
      if (!authorization) throw new Error("Authentication is required.");

      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseUser = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authorization } } },
      );
      const supabaseAdmin = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
      if (userError || !user) throw new Error("Authentication is required.");

      const { data: client, error: clientError } = await supabaseAdmin
        .from("clients")
        .select("id, email, full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (clientError) throw clientError;
      if (!client) throw new Error("A client profile is required to pay for this order.");

      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("id, client_id, client_email, client_name, total_price, status")
        .eq("id", orderId)
        .maybeSingle();
      if (orderError) throw orderError;
      if (!order || order.client_id !== client.id) throw new Error("Order not found.");
      if (!order.total_price || order.total_price <= 0) throw new Error("Order has no payable amount.");
      if (["Completed", "Cancelled"].includes(order.status)) throw new Error("This order cannot be paid.");

      trustedAmount = Number(order.total_price);
      trustedEmail = order.client_email || client.email;
      trustedName = order.client_name || client.full_name;
    }

    if (
      trustedAmount === undefined ||
      trustedAmount === null ||
      typeof trustedAmount !== "number" ||
      trustedAmount <= 0
    ) {
      throw new Error("Invalid or missing 'amount' in request body.");
    }

    if (!STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key configuration error.");
    }

    // --- 2. LOGIC: Find or Create Customer ---
    let customerId = null;

    if (trustedEmail) {
      const searchParams = new URLSearchParams({ email: trustedEmail, limit: "1" });
      const searchRes = await fetch(
        `https://api.stripe.com/v1/customers?${searchParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
        }
      );

      const searchData = await searchRes.json();

      if (searchData.data && searchData.data.length > 0) {
        customerId = searchData.data[0].id;
      } else {
        const createBody = new URLSearchParams();
        createBody.append("email", trustedEmail);
        if (trustedName) createBody.append("name", trustedName);

        const createRes = await fetch("https://api.stripe.com/v1/customers", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: createBody.toString(),
        });

        const createData = await createRes.json();
        if (createData.id) {
          customerId = createData.id;
        }
      }
    }

    // --- 3. LOGIC: Create Payment Intent ---
    const stripeApiUrl = "https://api.stripe.com/v1/payment_intents";

    // SAFE: We keep the original * 100 logic so marketplace orders still work.
    const amountInCents = Math.round(trustedAmount * 100);

    const body = new URLSearchParams({
      amount: amountInCents.toString(),
      currency: currency || "mad", // SAFE: Defaults back to MAD for existing orders!
      "automatic_payment_methods[enabled]": "true",
    });

    if (customerId) {
      body.append("customer", customerId);
    }

    if (setup_future_usage) {
      body.append("setup_future_usage", setup_future_usage);
    }

    // SAFELY APPEND METADATA (Only if the frontend sent it)
    if (metadata && typeof metadata === "object") {
      for (const [key, value] of Object.entries(metadata)) {
        body.append(`metadata[${key}]`, String(value));
      }
    }

    if (orderId) body.append("metadata[order_id]", String(orderId));

    const response = await fetch(stripeApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(
        responseData.error?.message ||
          `Stripe API request failed with status ${response.status}`
      );
    }

    return new Response(
      JSON.stringify({
        clientSecret: responseData.client_secret,
        client_secret: responseData.client_secret,
        customerId: customerId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error occurred:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
