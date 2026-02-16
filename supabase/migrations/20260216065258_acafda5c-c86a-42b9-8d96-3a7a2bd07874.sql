
-- Plans table for SaaS plan management
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  max_users INTEGER NOT NULL DEFAULT 10,
  max_sectors INTEGER NOT NULL DEFAULT 5,
  max_ai_interactions INTEGER NOT NULL DEFAULT 2500,
  max_whatsapp_credits INTEGER NOT NULL DEFAULT 1000,
  storage_limit_gb INTEGER NOT NULL DEFAULT 10,
  price NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans viewable by authenticated" ON public.plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Plans managed by admins" ON public.plans FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- WhatsApp Connections per tenant
CREATE TABLE public.whatsapp_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'meta' CHECK (provider IN ('meta', 'serpro')),
  api_base_url TEXT,
  api_key TEXT,
  instance_id TEXT,
  webhook_secret TEXT,
  connection_status TEXT NOT NULL DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error')),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "WhatsApp connections by tenant" ON public.whatsapp_connections FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

-- Module permissions (role-based per module)
CREATE TABLE public.module_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  module_name TEXT NOT NULL,
  permission_level TEXT NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view', 'edit', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, role_name, module_name)
);

ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Module permissions by tenant" ON public.module_permissions FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

-- AI Provider Config per tenant
CREATE TABLE public.ai_provider_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  provider TEXT NOT NULL DEFAULT 'lovable' CHECK (provider IN ('lovable', 'openai', 'anthropic')),
  model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  api_key TEXT,
  monthly_limit INTEGER NOT NULL DEFAULT 2500,
  used_this_month INTEGER NOT NULL DEFAULT 0,
  block_on_limit BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_provider_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI config by tenant" ON public.ai_provider_config FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

-- Conversation spy logs (audit)
CREATE TABLE public.spy_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  spy_user_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

ALTER TABLE public.spy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Spy logs by tenant admins" ON public.spy_logs FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Add plan_id to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS storage_used_gb NUMERIC DEFAULT 0;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS max_sectors INTEGER DEFAULT 5;

-- Triggers for updated_at
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_whatsapp_connections_updated_at BEFORE UPDATE ON public.whatsapp_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ai_provider_config_updated_at BEFORE UPDATE ON public.ai_provider_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default plan
INSERT INTO public.plans (name, max_users, max_sectors, max_ai_interactions, max_whatsapp_credits, storage_limit_gb)
VALUES ('Básico', 10, 5, 2500, 1000, 10);
