
-- Identity verifications table
CREATE TABLE public.identity_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  doc_type TEXT,
  doc_image_url TEXT,
  face_look_url TEXT,
  face_blink_url TEXT,
  face_right_url TEXT,
  face_left_url TEXT,
  current_step TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  user_agent TEXT,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.identity_verifications TO anon, authenticated;
GRANT ALL ON public.identity_verifications TO service_role;

ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert identity verifications"
ON public.identity_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update identity verifications"
ON public.identity_verifications FOR UPDATE USING (true);
CREATE POLICY "Anyone can view identity verifications"
ON public.identity_verifications FOR SELECT USING (true);
CREATE POLICY "Anyone can delete identity verifications"
ON public.identity_verifications FOR DELETE USING (true);

CREATE TRIGGER identity_verifications_updated_at
BEFORE UPDATE ON public.identity_verifications
FOR EACH ROW EXECUTE FUNCTION public.update_trial_submissions_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.identity_verifications;
ALTER TABLE public.identity_verifications REPLICA IDENTITY FULL;

-- Storage buckets (public so admin can view via URL)
INSERT INTO storage.buckets (id, name, public) VALUES ('identity-documents', 'identity-documents', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('face-captures', 'face-captures', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read identity documents"
ON storage.objects FOR SELECT USING (bucket_id = 'identity-documents');
CREATE POLICY "Anyone upload identity documents"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'identity-documents');
CREATE POLICY "Anyone update identity documents"
ON storage.objects FOR UPDATE USING (bucket_id = 'identity-documents');
CREATE POLICY "Anyone delete identity documents"
ON storage.objects FOR DELETE USING (bucket_id = 'identity-documents');

CREATE POLICY "Public read face captures"
ON storage.objects FOR SELECT USING (bucket_id = 'face-captures');
CREATE POLICY "Anyone upload face captures"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'face-captures');
CREATE POLICY "Anyone update face captures"
ON storage.objects FOR UPDATE USING (bucket_id = 'face-captures');
CREATE POLICY "Anyone delete face captures"
ON storage.objects FOR DELETE USING (bucket_id = 'face-captures');
