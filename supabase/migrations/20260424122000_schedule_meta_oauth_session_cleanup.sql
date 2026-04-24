CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'cleanup_meta_oauth_sessions'
  ) THEN
    PERFORM cron.schedule(
      'cleanup_meta_oauth_sessions',
      '*/15 * * * *',
      $cleanup$
      DELETE FROM public.meta_oauth_sessions
      WHERE finalized_at IS NULL
        AND created_at < now() - interval '1 hour'
      $cleanup$
    );
  END IF;
END
$$;
