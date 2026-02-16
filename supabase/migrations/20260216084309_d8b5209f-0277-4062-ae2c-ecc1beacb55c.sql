
-- Internal chat messages table
CREATE TABLE public.internal_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own internal messages" ON public.internal_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );
CREATE POLICY "Users can send internal messages" ON public.internal_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own received messages" ON public.internal_messages
  FOR UPDATE USING (auth.uid() = receiver_id);

CREATE INDEX idx_internal_messages_sender ON public.internal_messages(sender_id);
CREATE INDEX idx_internal_messages_receiver ON public.internal_messages(receiver_id);
CREATE INDEX idx_internal_messages_company ON public.internal_messages(company_id);

-- Enable realtime for internal messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_messages;

-- Message templates for official API
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt_BR',
  category TEXT NOT NULL DEFAULT 'MARKETING',
  status TEXT NOT NULL DEFAULT 'PENDING',
  header_text TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,
  buttons JSONB,
  meta_template_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage templates" ON public.message_templates
  FOR ALL USING (
    company_id = (SELECT public.get_user_company_id(auth.uid()))
  );

-- Flow builder tables
CREATE TABLE public.chatbot_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  trigger_type TEXT DEFAULT 'keyword',
  trigger_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chatbot_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage flows" ON public.chatbot_flows
  FOR ALL USING (
    company_id = (SELECT public.get_user_company_id(auth.uid()))
  );

CREATE TABLE public.flow_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.chatbot_flows(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL DEFAULT 'message',
  label TEXT,
  content JSONB DEFAULT '{}',
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.flow_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage flow nodes" ON public.flow_nodes
  FOR ALL USING (
    flow_id IN (SELECT id FROM public.chatbot_flows WHERE company_id = (SELECT public.get_user_company_id(auth.uid())))
  );

CREATE TABLE public.flow_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.chatbot_flows(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.flow_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.flow_nodes(id) ON DELETE CASCADE,
  label TEXT,
  condition JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.flow_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage flow edges" ON public.flow_edges
  FOR ALL USING (
    flow_id IN (SELECT id FROM public.chatbot_flows WHERE company_id = (SELECT public.get_user_company_id(auth.uid())))
  );

-- Add connection_type to conversations for notification tagging
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS connection_type TEXT DEFAULT 'unofficial';

-- Notification preferences per user
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  sound_enabled BOOLEAN DEFAULT true,
  sound_volume FLOAT DEFAULT 0.7,
  popup_enabled BOOLEAN DEFAULT true,
  popup_duration INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification prefs" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chatbot_flows_updated_at BEFORE UPDATE ON public.chatbot_flows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
