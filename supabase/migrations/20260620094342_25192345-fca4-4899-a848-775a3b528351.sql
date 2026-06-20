ALTER TABLE public.trial_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.google_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.identity_verifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trial_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.google_submissions;