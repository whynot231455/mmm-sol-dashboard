import { createClient } from "supabase-js";

type ConnectorResult =
  | 'connected'
  | 'approval_required'
  | 'invalid_account'
  | 'unsupported'
  | 'error'
  | 'syncing';

interface ConnectorResponse {
  result: ConnectorResult;
  message: string;
  accountName?: string;
  externalAccountId?: string;
  details?: Record<string, unknown>;
}

interface ConnectorOptions {
  platformLabel: string;
  envPrefix: string;
  requiredEnv: string[];
  accountValidator: RegExp;
  validationMessage: string;
  approvalMessage: string;
  onSync?: (params: {
    supabase: ReturnType<typeof createClient>;
    accountId: string;
    userId: string;
    config: Record<string, unknown>;
    updateProgress: (progress: number, message?: string) => Promise<void>;
  }) => Promise<void>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const logResponse = (status: number, body: ConnectorResponse) => {
  console.log('[managed-connector]', JSON.stringify({
    status,
    result: body.result,
    message: body.message,
    externalAccountId: body.externalAccountId ?? null,
    details: body.details ?? null,
  }));
};

const response = (status: number, body: ConnectorResponse) => {
  logResponse(status, body);
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
};

// Safely derives the platform_id from a human-readable label.
// Using a lookup map avoids bugs like 'Twitter / X Ads' -> 'twitteritter / twitter Ads'
// from character-level regex replacements.
const PLATFORM_LABEL_TO_ID: Record<string, string> = {
  'google ads':        'google_ads',
  'meta ads':          'meta_ads',
  'linkedin ads':      'linkedin_ads',
  'tiktok ads':        'tiktok_ads',
  'twitter / x ads':  'twitter_ads',
  'twitter ads':       'twitter_ads',
  'x ads':             'twitter_ads',
};

const derivePlatformId = (platformLabel: string): string => {
  const key = platformLabel.toLowerCase();
  return PLATFORM_LABEL_TO_ID[key] ?? key.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
};

export const createManagedConnector = (options: ConnectorOptions) => {
  return async (request: Request, context?: { waitUntil: (p: Promise<unknown>) => void }) => {
    console.log('[managed-connector] request', JSON.stringify({
      platformLabel: options.platformLabel,
      method: request.method,
    }));

    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return response(405, {
        result: 'error',
        message: 'Only POST requests are supported.',
      });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return response(401, {
        result: 'error',
        message: 'Missing authorization header.',
      });
    }

    const body = await request.json().catch(() => null);
    const accountId = String(body?.config?.accountId || body?.accountId || '').trim();

    console.log('[managed-connector] parsed-body', JSON.stringify({
      platformLabel: options.platformLabel,
      hasBody: Boolean(body),
      accountId: accountId || null,
    }));

    if (!accountId) {
      return response(400, {
        result: 'invalid_account',
        message: 'Account ID is required.',
      });
    }

    if (!options.accountValidator.test(accountId)) {
      return response(400, {
        result: 'invalid_account',
        message: options.validationMessage,
        externalAccountId: accountId,
      });
    }

    const missingEnv = options.requiredEnv.filter((key) => !Deno.env.get(key));
    if (missingEnv.length > 0) {
      return response(500, {
        result: 'error',
        message: `${options.platformLabel} credentials are not configured in the edge function environment.`,
        externalAccountId: accountId,
        details: { missingEnv },
      });
    }

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get User ID from JWT
    const token = authHeader.replace('Bearer ', '');
    
    // Debug: Peek at JWT header
    try {
      const [headerB64] = token.split('.');
      const header = JSON.parse(atob(headerB64));
      console.log(`[managed-connector] JWT Header:`, JSON.stringify(header));
    } catch {
      console.log(`[managed-connector] Could not parse JWT header`);
    }

    console.log(`[managed-connector] Verifying token (prefix: ${token.substring(0, 10)}..., length: ${token.length})`);
    
    let user;
    let authError;
    try {
      const result = await supabase.auth.getUser(token);
      user = result.data.user;
      authError = result.error;
    } catch (err) {
      console.error('[managed-connector] Fatal error in auth.getUser:', err);
      authError = err;
    }
    
    if (authError || !user) {
      console.error('[managed-connector] Auth error details:', JSON.stringify(authError));
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: Invalid token',
        details: authError?.message || 'User not found',
        hint: 'This error (ES256) often means the Supabase SDK version is too old to handle new project JWTs. We are currently using 2.49.4.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Start background sync if provided
    if (options.onSync) {
      const updateProgress = async (progress: number, message?: string) => {
        console.log(`[managed-connector] progress update: ${progress}% - ${message}`);
        const platform_id = derivePlatformId(options.platformLabel);
        
        const { error: updateError } = await supabase
          .from('user_integrations')
          .update({ 
            config: { 
              ...body?.config, 
              sync_progress: progress,
              last_message: message || `Syncing ${options.platformLabel} data...`
            },
            status: progress === 100 ? 'connected' : 'syncing',
            last_synced_at: progress === 100 ? new Date().toISOString() : undefined
          })
          .eq('user_id', user.id)
          .eq('account_id', accountId)
          .eq('platform_id', platform_id === 'twitter_ads' ? 'twitter_ads' : platform_id);

        if (updateError) {
          console.error(`[managed-connector] failed to update progress in DB for user ${user.id}, account ${accountId}:`, updateError);
        } else {
          console.log(`[managed-connector] successfully updated progress in DB for user ${user.id}, account ${accountId}`);
        }
      };

      const syncPromise = (async () => {
        try {
          console.log(`[${options.platformLabel}] Background sync task started for user ${user.id}`);
          
          // Small delay to ensure DB record exists (though it should already exist from Wizard)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          console.log(`[${options.platformLabel}] Calling onSync for account ${accountId}`);
          await options.onSync!({
            supabase,
            accountId,
            userId: user.id,
            config: body?.config || body,
            updateProgress,
          });
          
          console.log(`[${options.platformLabel}] Background sync task completed successfully`);
        } catch (err) {
          console.error(`[${options.platformLabel} Sync Error]`, err);
          
          let errorMessage = 'An unexpected error occurred during sync.';
          if (err instanceof Error) {
            errorMessage = err.message;
          }

          const platform_id = derivePlatformId(options.platformLabel);
          await supabase
            .from('user_integrations')
            .update({ 
              status: 'error',
              config: { ...(body?.config || body), last_message: `Sync failed: ${errorMessage}` }
            })
            .eq('user_id', user.id)
            .eq('account_id', accountId)
            .eq('platform_id', platform_id === 'twitter_ads' ? 'twitter_ads' : platform_id);
        }
      })();

      // Use context.waitUntil if available to keep the function alive
      if (context && typeof context.waitUntil === 'function') {
        console.log(`[${options.platformLabel}] Using context.waitUntil to keep background sync alive`);
        context.waitUntil(syncPromise);
      } else {
        console.warn(`[${options.platformLabel}] context.waitUntil not available, sync might be killed early`);
      }
      
      return response(200, {
        result: 'syncing',
        message: `${options.platformLabel} verified. Syncing started in the background.`,
        externalAccountId: accountId,
        details: { syncStatus: 'syncing' },
      });
    }

    return response(200, {
      result: 'connected',
      message: `${options.platformLabel} access was verified.`,
      externalAccountId: accountId,
      details: { syncStatus: 'connected' },
    });
  };
};
