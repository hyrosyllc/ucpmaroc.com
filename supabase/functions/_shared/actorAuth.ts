import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

/** Resolve the authenticated actor instead of trusting an actor id from JSON. */
export async function requireActorForRequest(
  req: Request,
  adminClient: any,
  actorId: string,
) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) throw new Error("Authentication is required.");

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authorization } } },
  );
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) throw new Error("Authentication is required.");

  const { data: actor, error: actorError } = await adminClient
    .from("actors")
    .select("id, user_id, stripe_customer_id, ActorName, ActorEmail")
    .eq("id", actorId)
    .single();

  if (actorError || !actor || actor.user_id !== user.id) {
    throw new Error("Actor does not belong to the authenticated user.");
  }

  return actor;
}
