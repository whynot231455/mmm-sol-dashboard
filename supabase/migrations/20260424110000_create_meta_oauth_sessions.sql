CREATE TABLE public.meta_oauth_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state text NOT NULL UNIQUE,
  access_token text NOT NULL,
  access_token_expires_at timestamptz,
  meta_user_id text,
  meta_user_name text,
  accounts jsonb NOT NULL DEFAULT '[]'::jsonb,
  finalized_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.meta_oauth_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Meta OAuth sessions"
ON public.meta_oauth_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Meta OAuth sessions"
ON public.meta_oauth_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Meta OAuth sessions"
ON public.meta_oauth_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Meta OAuth sessions"
ON public.meta_oauth_sessions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

