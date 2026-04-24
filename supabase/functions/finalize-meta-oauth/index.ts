import { createSupabaseAdmin, normalizeMetaAccountId } from "../_shared/metaOAuth.ts";
import { syncMetaAdsData } from "../_shared/metaAdsSync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request, context?: { waitUntil?: (promise: Promise<unknown>) => void }) => {
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
    const sessionId = String(body?.sessionId || "").trim();
    const accountId = normalizeMetaAccountId(String(body?.accountId || "").trim());
    if (!sessionId || !accountId) {
      return new Response(JSON.stringify({ error: "sessionId and accountId are required." }), {
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

    const { data: sessionRow, error: sessionError } = await supabase
      .from("meta_oauth_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !sessionRow || sessionRow.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "OAuth session not found or access denied." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const selectedAccount = (sessionRow.accounts || []).find((account: { accountId?: string; id?: string }) => {
      return normalizeMetaAccountId(String(account.accountId || account.id || "")) === accountId;
    });
    const accountName = selectedAccount?.name || `Meta Ad Account ${accountId}`;

    const integrationConfig = {
      meta_user_id: sessionRow.meta_user_id,
      meta_user_name: sessionRow.meta_user_name,
      oauth_session_id: sessionRow.id,
      oauth_state: sessionRow.state,
      oauth_completed_at: new Date().toISOString(),
      selected_account: selectedAccount || null,
      sync_progress: 0,
      last_message: "Meta login completed. Starting initial sync...",
    };

    // 1. Upsert the integration record (without the token in config)
    const { data: integration, error: integrationError } = await supabase
      .from("user_integrations")
      .upsert({
        user_id: user.id,
        platform_id: "meta_ads",
        account_name: accountName,
        account_id: accountId,
        status: "syncing",
        config: integrationConfig,
        last_synced_at: null,
      }, { onConflict: "user_id,platform_id" })
      .select("*")
      .single();

    if (integrationError || !integration) {
      throw integrationError || new Error("Failed to save Meta integration.");
    }

    // 2. Store the token securely in user_integration_secrets
    const { error: secretError } = await supabase
      .from("user_integration_secrets")
      .upsert({
        user_id: user.id,
        platform_id: "meta_ads",
        account_id: accountId,
        access_token: sessionRow.access_token,
        access_token_expires_at: sessionRow.access_token_expires_at,
      }, { onConflict: "user_id,platform_id,account_id" });

    if (secretError) {
      console.error("[finalize-meta-oauth] Failed to store secure secret:", secretError);
      // We don't throw here to avoid breaking the UI flow, but it's a critical error for syncing
    }

    // 3. Delete the OAuth session row entirely (Retention Boundary)
    const { error: deleteError } = await supabase
      .from("meta_oauth_sessions")
      .delete()
      .eq("id", sessionRow.id);
    
    if (deleteError) {
      console.warn("[finalize-meta-oauth] Failed to cleanup OAuth session:", deleteError);
    }

    const syncPromise = syncMetaAdsData({
      supabase,
      accountId,
      accessToken: sessionRow.access_token,
      userId: user.id,
      updateProgress: async (progress, message) => {
        await supabase
          .from("user_integrations")
          .update({
            status: progress === 100 ? "connected" : "syncing",
            last_synced_at: progress === 100 ? new Date().toISOString() : null,
            config: {
              ...integration.config,
              ...integrationConfig,
              sync_progress: progress,
              last_message: message || "Syncing Meta data...",
            },
          })
          .eq("user_id", user.id)
          .eq("platform_id", "meta_ads");
      },
    });

    if (context && typeof context.waitUntil === "function") {
      context.waitUntil(syncPromise.catch((err) => {
        console.error("[finalize-meta-oauth] background sync failed", err);
      }));
    } else {
      void syncPromise.catch((err) => console.error("[finalize-meta-oauth] sync failed", err));
    }

    // The session row is already deleted at this point (Retention Boundary)

    return new Response(JSON.stringify({
      result: "syncing",
      message: "Meta Ads connected. Your first sync has started.",
      accountName,
      externalAccountId: accountId,
      details: {
        syncStatus: "syncing",
        oauthSessionId: sessionRow.id,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to finalize Meta OAuth." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

