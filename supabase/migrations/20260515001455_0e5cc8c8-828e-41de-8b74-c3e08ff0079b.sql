CREATE TABLE public.user_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL,
  level TEXT NOT NULL,
  flags TEXT[] NOT NULL DEFAULT '{}',
  thumb TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scans"
  ON public.user_scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans"
  ON public.user_scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans"
  ON public.user_scans FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_scans_user_created ON public.user_scans(user_id, created_at DESC);