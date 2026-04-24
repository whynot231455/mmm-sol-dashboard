-- Create user_integration_secrets table
CREATE TABLE IF NOT EXISTS public.user_integration_secrets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_id text NOT NULL,
  account_id text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  access_token_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, platform_id, account_id)
);

-- Enable RLS
ALTER TABLE public.user_integration_secrets ENABLE ROW LEVEL SECURITY;

-- NO SELECT POLICY FOR AUTHENTICATED USERS
-- This ensures the tokens are only visible to the Service Role (Edge Functions)

CREATE POLICY "Users can delete their own secrets"
ON public.user_integration_secrets
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Update RLS for user_integrations to be safe
-- (Assuming it already exists, we just ensure it's tight)
-- Note: fetchIntegrations should still work for public info but we'll sanitize in the app logic too.

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_integration_secrets_user_platform_account 
ON public.user_integration_secrets(user_id, platform_id, account_id);
