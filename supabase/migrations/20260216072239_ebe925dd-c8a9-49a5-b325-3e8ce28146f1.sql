
-- Table for non-official WhatsApp sessions (Baileys / LibZapitu)
CREATE TABLE public.whatsapp_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  engine_type TEXT NOT NULL DEFAULT 'baileys' CHECK (engine_type IN ('baileys', 'libzapitu')),
  phone_number TEXT,
  instance_name TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connecting', 'connected', 'disconnected', 'failed')),
  qr_code TEXT,
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp sessions"
ON public.whatsapp_sessions FOR ALL
USING (
  (company_id = get_user_company_id(auth.uid()))
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can view whatsapp sessions"
ON public.whatsapp_sessions FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE TRIGGER update_whatsapp_sessions_updated_at
BEFORE UPDATE ON public.whatsapp_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add global engine config + branding columns to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS allowed_unofficial_engines TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS default_unofficial_engine TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS allow_unofficial_api BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS official_api_mandatory BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS login_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS sidebar_logo_url TEXT;

-- Create storage bucket for tenant logos
INSERT INTO storage.buckets (id, name, public) VALUES ('tenant-logos', 'tenant-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tenant logos
CREATE POLICY "Anyone can view tenant logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'tenant-logos');

CREATE POLICY "Authenticated users can upload tenant logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tenant-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tenant logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'tenant-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tenant logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'tenant-logos' AND auth.role() = 'authenticated');

-- Connection logs for non-official sessions
CREATE TABLE public.whatsapp_session_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.whatsapp_sessions(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage session logs"
ON public.whatsapp_session_logs FOR ALL
USING (
  (company_id = get_user_company_id(auth.uid()))
  AND has_role(auth.uid(), 'admin'::app_role)
);
