
ALTER TABLE public.trial_submissions
  ADD COLUMN IF NOT EXISTS admin_confirmed boolean NOT NULL DEFAULT false;
