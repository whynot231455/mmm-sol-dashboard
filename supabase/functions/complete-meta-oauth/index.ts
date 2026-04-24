import { createSupabaseAdmin, exchangeMetaOAuthCode, verifyMetaOAuthState } from "../_shared/metaOAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST requests are supported." }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    const code = String(body?.code || "").trim();
    const state = String(body?.state || "").trim();
    if (!code || !state) {
      return new Response(JSON.stringify({ error: "Missing code or state." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createSupabaseAdmin();
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statePayload = await verifyMetaOAuthState(state);
    if (!statePayload || statePayload.userId !== user.id) {
      return new Response(JSON.stringify({ error: "OAuth state validation failed." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const exchange = await exchangeMetaOAuthCode(code);
    if (!exchange.accounts.length) {
      return new Response(JSON.stringify({ error: "No Meta ad accounts were returned for this login." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresAt = typeof exchange.expiresIn === "number"
      ? new Date(Date.now() + (exchange.expiresIn * 1000)).toISOString()
      : null;

    const { data: sessionRow, error: upsertError } = await supabase
      .from("meta_oauth_sessions")
      .upsert({
        user_id: user.id,
        state,
        access_token: exchange.token,
        access_token_expires_at: expiresAt,
        meta_user_id: exchange.metaUser.id || null,
        meta_user_name: exchange.metaUser.name || null,
        accounts: exchange.accounts,
        finalized_at: null,
      }, { onConflict: "state" })
      .select("id,accounts,meta_user_name,access_token_expires_at")
      .single();

    if (upsertError || !sessionRow) {
      throw upsertError || new Error("Failed to store Meta OAuth session.");
    }

    return new Response(JSON.stringify({
      result: "pending_account_selection",
      sessionId: sessionRow.id,
      metaUserName: sessionRow.meta_user_name,
      expiresAt: sessionRow.access_token_expires_at,
      accounts: sessionRow.accounts,
      message: "Meta login succeeded. Choose the ad account you want to connect.",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to complete Meta OAuth." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

