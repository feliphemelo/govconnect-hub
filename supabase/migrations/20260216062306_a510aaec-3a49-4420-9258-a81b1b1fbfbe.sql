
-- ===== PHASE 4: CHATBOT =====
CREATE TABLE public.chatbot_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  parent_id UUID REFERENCES public.chatbot_menus(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  media_url TEXT,
  media_type TEXT,
  menu_type TEXT NOT NULL DEFAULT 'list' CHECK (menu_type IN ('list','buttons')),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  action_type TEXT CHECK (action_type IN ('submenu','sector','form','message','survey')),
  action_target TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chatbot_menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view chatbot menus" ON public.chatbot_menus FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins can manage chatbot menus" ON public.chatbot_menus FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_chatbot_menus_updated_at BEFORE UPDATE ON public.chatbot_menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.chatbot_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) UNIQUE,
  welcome_message TEXT DEFAULT 'Olá! Bem-vindo ao nosso atendimento.',
  farewell_message TEXT DEFAULT 'Obrigado pelo contato!',
  error_message TEXT DEFAULT 'Desculpe, não entendi. Tente novamente.',
  return_message TEXT DEFAULT 'Voltando ao menu principal...',
  public_notice TEXT,
  public_notice_expires_at TIMESTAMPTZ,
  ai_enabled BOOLEAN DEFAULT false,
  ai_mode TEXT DEFAULT 'passive' CHECK (ai_mode IN ('passive','active')),
  ai_personality TEXT DEFAULT 'formal' CHECK (ai_personality IN ('normal','formal','casual')),
  ai_name TEXT DEFAULT 'Assistente',
  ai_trigger_command TEXT DEFAULT '/ia',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chatbot_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view chatbot config" ON public.chatbot_config FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins can manage chatbot config" ON public.chatbot_config FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- Forms
CREATE TABLE public.forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  forward_email TEXT,
  forward_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view forms" ON public.forms FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins can manage forms" ON public.forms FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE TABLE public.form_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'open' CHECK (question_type IN ('open','closed','affirmative','location')),
  options JSONB,
  sort_order INTEGER DEFAULT 0
);
ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view form questions" ON public.form_questions FOR SELECT USING (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Admins can manage form questions" ON public.form_questions FOR ALL USING (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

-- ===== PHASE 5: AI KNOWLEDGE BASE =====
CREATE TABLE public.knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT DEFAULT 'text' CHECK (source_type IN ('text','url','pdf')),
  source_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view knowledge base" ON public.knowledge_base FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins can manage knowledge base" ON public.knowledge_base FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- ===== PHASE 6: GROUPS, BROADCASTS, POLLS =====
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  description TEXT,
  is_open BOOLEAN DEFAULT true,
  invite_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view groups" ON public.groups FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins can manage groups" ON public.groups FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, contact_id)
);
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view group members" ON public.group_members FOR SELECT USING (EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Admins can manage group members" ON public.group_members FOR ALL USING (EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin')));

CREATE TABLE public.broadcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sent','failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  target_type TEXT DEFAULT 'all' CHECK (target_type IN ('all','group','segment')),
  target_id UUID,
  recipient_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view broadcasts" ON public.broadcasts FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Authorized users can manage broadcasts" ON public.broadcasts FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'broadcaster')));

CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view polls" ON public.polls FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins can manage polls" ON public.polls FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE TABLE public.poll_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'closed' CHECK (question_type IN ('affirmative','closed')),
  options JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0
);
ALTER TABLE public.poll_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view poll questions" ON public.poll_questions FOR SELECT USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.company_id = get_user_company_id(auth.uid())));

CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.poll_questions(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id),
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view poll votes" ON public.poll_votes FOR SELECT USING (EXISTS (SELECT 1 FROM public.poll_questions pq JOIN public.polls p ON p.id = pq.poll_id WHERE pq.id = question_id AND p.company_id = get_user_company_id(auth.uid())));

-- ===== PHASE 7: SIGNATURES =====
CREATE TABLE public.signature_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  contact_id UUID REFERENCES public.contacts(id),
  title TEXT NOT NULL,
  document_url TEXT NOT NULL,
  signed_document_url TEXT,
  qr_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','agreed','disagreed','expired')),
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.signature_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view signatures" ON public.signature_documents FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can manage signatures" ON public.signature_documents FOR ALL USING (company_id = get_user_company_id(auth.uid()));

-- ===== PHASE 9: CREDITS & WEBHOOKS =====
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit','debit')),
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view credit transactions" ON public.credit_transactions FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins can manage credits" ON public.credit_transactions FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST' CHECK (method IN ('POST','GET')),
  direction TEXT NOT NULL DEFAULT 'outgoing' CHECK (direction IN ('incoming','outgoing')),
  headers JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  secret_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view webhooks" ON public.webhooks FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins can manage webhooks" ON public.webhooks FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON public.webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  status_code INTEGER,
  request_body JSONB,
  response_body TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view webhook logs" ON public.webhook_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.webhooks w WHERE w.id = webhook_id AND w.company_id = get_user_company_id(auth.uid())));
