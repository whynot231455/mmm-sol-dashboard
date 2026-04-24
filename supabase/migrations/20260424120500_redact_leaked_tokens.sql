-- 1. Ensure any existing tokens are moved to user_integration_secrets if missing
INSERT INTO public.user_integration_secrets (user_id, platform_id, account_id, access_token, access_token_expires_at)
SELECT 
    user_id, 
    platform_id, 
    account_id, 
    (config->>'access_token') as access_token,
    (config->>'access_token_expires_at')::timestamptz as access_token_expires_at
FROM public.user_integrations
WHERE config ? 'access_token'
ON CONFLICT (user_id, platform_id, account_id) DO UPDATE SET
    access_token = EXCLUDED.access_token,
    access_token_expires_at = EXCLUDED.access_token_expires_at;

-- 2. Redact access_token from config in user_integrations
UPDATE public.user_integrations
SET config = config - 'access_token' - 'access_token_expires_at'
WHERE config ? 'access_token';

-- 3. Cleanup existing meta_oauth_sessions that were finalized but not deleted
DELETE FROM public.meta_oauth_sessions
WHERE finalized_at IS NOT NULL;
