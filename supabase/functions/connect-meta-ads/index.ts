import { createClient } from "supabase-js";
import { getMetaAccessToken } from "../_shared/metaAdsSync.ts";
import { normalizeMetaAccountId } from "../_shared/metaOAuth.ts";
import { syncMetaAdsData } from "../_shared/metaAdsSync.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * connect-meta-ads
 *
 * This function is called when the user triggers "Retry Sync" from the
 * Connect page. Unlike other platform connectors (Google, LinkedIn, TikTok)
 * which accept a user-supplied credential, Meta Ads is OAuth-only.
 *
 * Flow:
 *  1. Validate auth + account ID.
 *  2. Look up the stored OAuth token from user_integration_secrets.
 *  3a. If token found → kick off background sync.
 *  3b. If token NOT found → return `approval_required` so the UI
 *      knows to redirect the user back through the Meta OAuth flow.
 */
Deno.serve(async (req: Request, context?: { waitUntil?: (p: Promise<unknown>) => void }) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ result: 'error', message: 'Only POST requests are supported.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ result: 'error', message: 'Missing authorization header.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ result: 'error', message: 'Unauthorized: Invalid or expired session.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json().catch(() => null);
  // Accept accountId from both body.config.accountId (wizard) and body.accountId (retry)
  const rawAccountId = String(body?.config?.accountId || body?.accountId || '').trim();
  const accountId = normalizeMetaAccountId(rawAccountId);

  if (!accountId || !/^\d+$/.test(accountId)) {
    return new Response(JSON.stringify({
      result: 'invalid_account',
      message: 'A valid Meta Ad Account ID (numbers only) is required.',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log(`[connect-meta-ads] User ${user.id} requesting sync for account ${accountId}`);

  // Look up the stored OAuth access token for this user + account
  const accessToken = await getMetaAccessToken(supabase, user.id, accountId);

  if (!accessToken) {
    console.warn(`[connect-meta-ads] No OAuth token found for user ${user.id}, account ${accountId}. Requesting re-auth.`);

    // Mark integration as needing re-auth in the DB so the UI reflects it
    await supabase
      .from('user_integrations')
      .update({
        status: 'error',
        config: {
          ...(body?.config || {}),
          last_message: 'Meta access token is missing. Please reconnect your account via Facebook Login.',
          requires_reauth: true,
        },
      })
      .eq('user_id', user.id)
      .eq('platform_id', 'meta_ads')
      .eq('account_id', accountId);

    return new Response(JSON.stringify({
      result: 'approval_required',
      message: 'Your Meta Ads account needs to be reconnected. Please click "Connect via Facebook" to re-authorize access.',
      externalAccountId: accountId,
      details: { reason: 'missing_oauth_token', requiresReauth: true },
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Token found — update status to syncing and kick off background sync
  await supabase
    .from('user_integrations')
    .update({
      status: 'syncing',
      config: {
        ...(body?.config || {}),
        sync_progress: 0,
        last_message: 'Sync started...',
        requires_reauth: false,
      },
    })
    .eq('user_id', user.id)
    .eq('platform_id', 'meta_ads')
    .eq('account_id', accountId);

  const updateProgress = async (progress: number, message?: string) => {
    console.log(`[connect-meta-ads] progress ${progress}% — ${message}`);
    await supabase
      .from('user_integrations')
      .update({
        status: progress === 100 ? 'connected' : 'syncing',
        last_synced_at: progress === 100 ? new Date().toISOString() : undefined,
        config: {
          ...(body?.config || {}),
          sync_progress: progress,
          last_message: message || 'Syncing Meta Ads data...',
        },
      })
      .eq('user_id', user.id)
      .eq('platform_id', 'meta_ads')
      .eq('account_id', accountId);
  };

  const syncPromise = (async () => {
    try {
      await syncMetaAdsData({
        supabase,
        accountId,
        accessToken,
        userId: user.id,
        updateProgress,
      });
      console.log(`[connect-meta-ads] Sync completed for user ${user.id}, account ${accountId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during sync.';
      console.error(`[connect-meta-ads] Sync failed:`, err);
      await supabase
        .from('user_integrations')
        .update({
          status: 'error',
          config: {
            ...(body?.config || {}),
            last_message: `Sync failed: ${errorMessage}`,
          },
        })
        .eq('user_id', user.id)
        .eq('platform_id', 'meta_ads')
        .eq('account_id', accountId);
    }
  })();

  if (context && typeof context.waitUntil === 'function') {
    context.waitUntil(syncPromise);
  } else {
    void syncPromise;
  }

  return new Response(JSON.stringify({
    result: 'syncing',
    message: 'Meta Ads verified. Syncing started in the background.',
    externalAccountId: accountId,
    details: { syncStatus: 'syncing' },
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
