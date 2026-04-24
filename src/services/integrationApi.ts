import { supabase } from '../lib/supabase';

export type IntegrationPlatform =
  | 'google_ads'
  | 'meta_ads'
  | 'linkedin_ads'
  | 'tiktok_ads'
  | 'salesforce'
  | 'hubspot'
  | 'shopify'
  | 'twitter_ads';

export type IntegrationValidationResultType =
  | 'connected'
  | 'approval_required'
  | 'invalid_account'
  | 'unsupported'
  | 'error';

export interface IntegrationValidationResult {
  result: IntegrationValidationResultType;
  message: string;
  accountName?: string;
  externalAccountId?: string;
  details?: Record<string, unknown>;
}

export interface IntegrationStep {
  id: number;
  title: string;
  description: string;
  type: 'info' | 'input' | 'oauth';
  inputLabel?: string;
  inputPlaceholder?: string;
  inputKey?: string;
  helpUrl?: string;
  howToSteps?: string[];
}

export interface MetaOAuthAccountOption {
  id: string;
  accountId: string;
  name: string;
  currency?: string;
  accountStatus?: number;
}

export interface MetaOAuthStartResult {
  authorizationUrl: string;
}

export interface MetaOAuthCompleteResult {
  result: 'pending_account_selection';
  sessionId: string;
  metaUserName: string | null;
  expiresAt: string | null;
  accounts: MetaOAuthAccountOption[];
  message: string;
}

export interface MetaOAuthFinalizeResult {
  result: 'syncing';
  message: string;
  accountName: string;
  externalAccountId: string;
  details?: Record<string, unknown>;
}

const PLATFORM_LABELS: Record<string, string> = {
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
  linkedin_ads: 'LinkedIn Ads',
  tiktok_ads: 'TikTok Ads',
  salesforce: 'Salesforce',
  hubspot: 'HubSpot',
  shopify: 'Shopify',
  twitter_ads: 'Twitter / X Ads',
};

const SUPPORTED_MANAGED_CONNECTORS = new Set<IntegrationPlatform>([
  'google_ads',
  'meta_ads',
  'linkedin_ads',
  'tiktok_ads',
  'twitter_ads',
]);

const ACCOUNT_VALIDATORS: Partial<Record<IntegrationPlatform, { pattern: RegExp; message: string }>> = {
  google_ads: {
    pattern: /^\d{3}-\d{3}-\d{4}$/,
    message: 'Use the Google Ads Customer ID format XXX-XXX-XXXX, for example 123-456-7890.',
  },
  meta_ads: {
    pattern: /^(act_)?\d+$/,
    message: 'Use a Meta Ad Account ID such as 742016485571736 or act_742016485571736.',
  },
  linkedin_ads: {
    pattern: /^\d{6,}$/,
    message: 'Use the numeric LinkedIn account ID from Campaign Manager.',
  },
  tiktok_ads: {
    pattern: /^\d{8,}$/,
    message: 'Use the numeric TikTok Advertiser ID from TikTok Ads Manager.',
  },
  twitter_ads: {
    pattern: /^[A-Za-z0-9]{6,}$/,
    message: 'Use the account ID shown in X Ads Manager.',
  },
};

export const PLATFORM_STEPS: Record<string, IntegrationStep[]> = {
  google_ads: [
    {
      id: 1,
      title: 'Connect Google Ads',
      description: 'Enter your 10-digit Google Ads Customer ID. We will verify access after you approve our manager request in Google Ads.',
      type: 'input',
      inputLabel: 'Customer ID',
      inputPlaceholder: '123-456-7890',
      inputKey: 'accountId',
      helpUrl: 'https://ads.google.com/aw/overview',
      howToSteps: [
        'Open your Google Ads account.',
        'Click Tools & Settings, then open Access and security.',
        'Select the Managers tab.',
        'Approve our manager account request.',
      ],
    },
  ],
  meta_ads: [
    {
      id: 1,
      title: 'Connect Meta Ads via Facebook',
      description: 'Log in with Facebook to automatically connect your Meta Ads accounts. After login, you will choose which ad account to sync.',
      type: 'oauth',
      helpUrl: 'https://www.facebook.com/business/tools/ads-manager',
    },
  ],
  linkedin_ads: [
    {
      id: 1,
      title: 'Connect LinkedIn Ads',
      description: 'Enter your LinkedIn Ad Account ID. We will verify access after your team approves the connection in Campaign Manager.',
      type: 'input',
      inputLabel: 'Account ID',
      inputPlaceholder: '5000000',
      inputKey: 'accountId',
      helpUrl: 'https://www.linkedin.com/campaignmanager/accounts',
    },
  ],
  tiktok_ads: [
    {
      id: 1,
      title: 'Connect TikTok Ads',
      description: 'Enter your TikTok Advertiser ID. We will verify access once your advertiser permissions are in place.',
      type: 'input',
      inputLabel: 'Advertiser ID',
      inputPlaceholder: '7000000000000000',
      inputKey: 'accountId',
      helpUrl: 'https://ads.tiktok.com/i18n/dashboard',
    },
  ],
  twitter_ads: [
    {
      id: 1,
      title: 'Connect Twitter / X Ads',
      description: 'Enter your X Ads account ID. We will verify access after the account permissions are approved.',
      type: 'input',
      inputLabel: 'Account ID',
      inputPlaceholder: '18ce54d4x5t',
      inputKey: 'accountId',
      helpUrl: 'https://ads.x.com/',
    },
  ],
  shopify: [
    {
      id: 1,
      title: 'Connect Shopify',
      description: 'Enter your Shopify store URL. Shopify is still on a separate integration path and may require additional setup.',
      type: 'input',
      inputLabel: 'Store URL',
      inputPlaceholder: 'your-store.myshopify.com',
      inputKey: 'storeUrl',
      helpUrl: 'https://www.shopify.com/admin',
    },
  ],
  hubspot: [
    {
      id: 1,
      title: 'Connect HubSpot',
      description: 'Enter your HubSpot Portal ID. HubSpot is not part of the managed ad-platform flow yet.',
      type: 'input',
      inputLabel: 'Portal ID',
      inputPlaceholder: '1234567',
      inputKey: 'accountId',
      helpUrl: 'https://app.hubspot.com/',
    },
  ],
  salesforce: [
    {
      id: 1,
      title: 'Connect Salesforce',
      description: 'Enter your Salesforce Organization ID. Salesforce is not part of the managed ad-platform flow yet.',
      type: 'input',
      inputLabel: 'Organization ID',
      inputPlaceholder: '00DXXXXXXXXXXXX',
      inputKey: 'accountId',
      helpUrl: 'https://login.salesforce.com/',
    },
  ],
};

const getPlatformLabel = (platformId: string) => {
  return PLATFORM_LABELS[platformId] || platformId.split('_').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
};

const getEdgeFunctionName = (platformId: string) => `connect-${platformId.replace(/_/g, '-')}`;

interface ParsedConnectorResponse {
  data: Record<string, unknown> | null;
  rawText: string | null;
}

const parseJsonResponse = async (response: Response): Promise<ParsedConnectorResponse> => {
  const rawText = await response.text().catch(() => null);

  if (!rawText) {
    return {
      data: null,
      rawText,
    };
  }

  try {
    return { data: JSON.parse(rawText), rawText };
  } catch {
    return {
      data: null,
      rawText,
    };
  }
};

const normalizeResult = (
  result: Partial<IntegrationValidationResult> | null | undefined,
  fallback: IntegrationValidationResult,
): IntegrationValidationResult => {
  if (!result?.result || !result.message) {
    return fallback;
  }

  return {
    result: result.result,
    message: result.message,
    accountName: result.accountName,
    externalAccountId: result.externalAccountId,
    details: result.details,
  };
};

export const integrationApi = {
  getSteps: (platformId: string): IntegrationStep[] => {
    return PLATFORM_STEPS[platformId] || [
      {
        id: 1,
        title: `Connect ${getPlatformLabel(platformId)}`,
        description: 'Enter the account identifier for this data source.',
        type: 'input',
        inputLabel: 'Account ID',
        inputPlaceholder: 'Enter ID...',
        inputKey: 'accountId',
      },
    ];
  },

  getInitialConfig: () => {
    return {};
  },

  validateConfig: (platformId: string, config: Record<string, string>) => {
    const accountId = config.accountId?.trim();
    const storeUrl = config.storeUrl?.trim();

    if (SUPPORTED_MANAGED_CONNECTORS.has(platformId as IntegrationPlatform)) {
      if (!accountId) {
        return 'Enter the account ID before continuing.';
      }

      const validator = ACCOUNT_VALIDATORS[platformId as IntegrationPlatform];
      if (validator && !validator.pattern.test(accountId)) {
        return validator.message;
      }
    }

    if (platformId === 'shopify' && !storeUrl) {
      return 'Enter your Shopify store URL before continuing.';
    }

    if ((platformId === 'hubspot' || platformId === 'salesforce') && !accountId) {
      return 'Enter the account ID before continuing.';
    }

    return null;
  },

  startMetaOAuth: async (): Promise<MetaOAuthStartResult> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase is not configured.');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Your session has expired. Please log in again before connecting an account.');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/start-meta-oauth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({}),
    });

    const { data, rawText } = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error((data as { error?: string } | null)?.error || rawText || 'Failed to start Meta OAuth.');
    }

    if (!data?.authorizationUrl) {
      throw new Error('Meta OAuth start did not return an authorization URL.');
    }

    return { authorizationUrl: data.authorizationUrl as string };
  },

  completeMetaOAuth: async (params: { code: string; state: string }): Promise<MetaOAuthCompleteResult> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase is not configured.');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Your session has expired. Please log in again before connecting an account.');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/complete-meta-oauth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(params),
    });

    const { data, rawText } = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error((data as { error?: string } | null)?.error || rawText || 'Failed to complete Meta OAuth.');
    }

    if (!data?.sessionId || !Array.isArray(data?.accounts)) {
      throw new Error('Meta OAuth completion returned an unexpected response.');
    }

    return {
      result: 'pending_account_selection',
      sessionId: String(data.sessionId),
      metaUserName: typeof data.metaUserName === 'string' ? data.metaUserName : null,
      expiresAt: typeof data.expiresAt === 'string' ? data.expiresAt : null,
      accounts: data.accounts as MetaOAuthAccountOption[],
      message: String(data.message || 'Choose the account you want to connect.'),
    };
  },

  finalizeMetaOAuth: async (params: { sessionId: string; accountId: string }): Promise<MetaOAuthFinalizeResult> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase is not configured.');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Your session has expired. Please log in again before connecting an account.');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/finalize-meta-oauth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(params),
    });

    const { data, rawText } = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error((data as { error?: string } | null)?.error || rawText || 'Failed to finalize Meta OAuth.');
    }

    if (!data?.externalAccountId || !data?.message) {
      throw new Error('Meta OAuth finalization returned an unexpected response.');
    }

    return {
      result: 'syncing',
      message: String(data.message),
      accountName: String(data.accountName || ''),
      externalAccountId: String(data.externalAccountId),
      details: typeof data.details === 'object' && data.details ? (data.details as Record<string, unknown>) : undefined,
    };
  },

  testConnection: async (platformId: string, config: Record<string, string>): Promise<IntegrationValidationResult> => {
    const platformLabel = getPlatformLabel(platformId);
    const validationError = integrationApi.validateConfig(platformId, config);

    if (validationError) {
      return {
        result: 'invalid_account',
        message: validationError,
        externalAccountId: config.accountId?.trim() || config.storeUrl?.trim(),
      };
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      return {
        result: 'error',
        message: 'Supabase is not configured, so this connection cannot be verified yet.',
      };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return {
        result: 'error',
        message: 'Your session has expired. Please log in again before connecting an account.',
      };
    }

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/${getEdgeFunctionName(platformId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ config }),
      });

      const { data, rawText } = await parseJsonResponse(response);

      if (response.status === 404) {
        return {
          result: 'error',
          message: `${platformLabel} is not deployed in Supabase yet. Deploy the ${getEdgeFunctionName(platformId)} edge function before connecting clients.`,
          externalAccountId: config.accountId?.trim() || config.storeUrl?.trim(),
          details: { reason: 'missing_connector' },
        };
      }

      if (!response.ok) {
        return normalizeResult(data, {
          result: 'error',
          message: (data as { message?: string })?.message || `${platformLabel} could not be verified right now.`,
          externalAccountId: config.accountId?.trim() || config.storeUrl?.trim(),
          details: {
            httpStatus: response.status,
            rawResponse: rawText,
          },
        });
      }

      return normalizeResult(data, {
        result: 'error',
        message: `${platformLabel} connector returned HTTP 200 without the required result/message fields. Check the deployed edge function response shape.`,
        externalAccountId: config.accountId?.trim() || config.storeUrl?.trim(),
        details: {
          reason: 'invalid_response_shape',
          rawResponse: rawText,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        result: 'error',
        message: `We could not reach the ${platformLabel} connector. ${message}`,
        externalAccountId: config.accountId?.trim() || config.storeUrl?.trim(),
        details: { reason: 'network_error' },
      };
    }
  },

  fetchSampleData: async (platformId: string, config: Record<string, string> = {}) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return null;
    }

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/fetch-${platformId.replace(/_/g, '-')}-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch {
      return null;
    }
  },
};
