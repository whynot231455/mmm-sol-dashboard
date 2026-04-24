import { createClient } from "supabase-js";
import { getMetaAccessToken } from "../_shared/metaAdsSync.ts";
import { normalizeMetaAccountId } from "../_shared/metaOAuth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use Service Role Key to verify the user token
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    
    console.log(`[fetch-meta-ads-data] Authenticating user with token (length: ${token.length})...`);
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[fetch-meta-ads-data] Auth error:', authError);
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: Invalid token', 
        details: authError?.message || 'User not found' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`[fetch-meta-ads-data] User authenticated: ${user.id}`);

    const body = await req.json();
    const integrationId = body.integrationId;
    const config = body.config;

    let accountId = '';
    let accessToken = '';
    let userId = '';

    if (integrationId) {
      const { data: integration, error: integrationError } = await supabaseClient
        .from('user_integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (integrationError || !integration) {
        throw new Error('Integration not found or access denied');
      }

      accountId = integration.account_id;
      userId = integration.user_id;

      if (userId !== user.id) {
        throw new Error('Integration not found or access denied');
      }

      // Fetch the token securely from user_integration_secrets
      accessToken = await getMetaAccessToken(supabaseClient, userId, accountId);
    } else if (config) {
      accountId = normalizeMetaAccountId(String(config.accountId || '').trim());
      if (!accountId) {
        throw new Error('Account ID is missing.');
      }

      // Meta tokens are stored server-side only. Require the authenticated user
      // to already have a secret row for this account.
      accessToken = await getMetaAccessToken(supabaseClient, user.id, accountId);
    } else {
      throw new Error('integrationId or config is required');
    }

    if (!accessToken) {
      throw new Error('Access token is missing. Please reconnect your account.');
    }

    if (!accountId) {
      throw new Error('Account ID is missing.');
    }

    // Fetch data from Meta Marketing API
    const metaApiUrl = `https://graph.facebook.com/v19.0/${accountId}/insights`;
    const params = new URLSearchParams({
      access_token: accessToken,
      level: 'campaign',
      fields: 'campaign_name,spend,impressions,clicks,actions',
      time_increment: '1',
      date_preset: 'last_7d'
    });

    const metaRes = await fetch(`${metaApiUrl}?${params.toString()}`);
    const metaData = await metaRes.json();

    if (metaData.error) {
      throw new Error(`Meta API Error: ${metaData.error.message}`);
    }

    const insights = metaData.data || [];
    
    const performanceData = insights.map((row: { 
      actions?: { action_type: string; value: string | number }[]; 
      date_start: string; 
      campaign_name: string; 
      spend: string; 
      impressions: string; 
      clicks: string; 
    }) => {
      const conversions = row.actions?.find((a: { action_type: string; value: string | number }) => a.action_type === 'purchase')?.value || 0;
      return {
        integration_id: integrationId || null,
        platform: 'meta_ads',
        account_id: accountId,
        date: row.date_start,
        campaign_name: row.campaign_name,
        spend: parseFloat(row.spend || '0'),
        impressions: parseInt(row.impressions || '0', 10),
        clicks: parseInt(row.clicks || '0', 10),
        conversions: parseInt(String(conversions), 10),
        user_id: user.id
      };
    });

    return new Response(
      JSON.stringify(performanceData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
