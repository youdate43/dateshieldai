-- Bank logo overrides table
CREATE TABLE public.bank_logos (
  domain text PRIMARY KEY,
  logo_url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_logos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bank logos" ON public.bank_logos FOR SELECT USING (true);
CREATE POLICY "Anyone can upsert bank logos" ON public.bank_logos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update bank logos" ON public.bank_logos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete bank logos" ON public.bank_logos FOR DELETE USING (true);

-- Allow deleting trial submissions from admin
CREATE POLICY "Anyone can delete trial submissions" ON public.trial_submissions FOR DELETE USING (true);

-- Storage bucket for bank logos (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('bank-logos', 'bank-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read bank-logos" ON storage.objects FOR SELECT USING (bucket_id = 'bank-logos');
CREATE POLICY "Public upload bank-logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bank-logos');
CREATE POLICY "Public update bank-logos" ON storage.objects FOR UPDATE USING (bucket_id = 'bank-logos');
CREATE POLICY "Public delete bank-logos" ON storage.objects FOR DELETE USING (bucket_id = 'bank-logos');