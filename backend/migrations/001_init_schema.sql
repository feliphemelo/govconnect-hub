-- GovChat Database Schema (PostgreSQL Local)
-- Migration 001: Initial Schema Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- App roles enum
CREATE TYPE app_role AS ENUM ('admin', 'manager', 'agent', 'broadcaster', 'referenced');

-- ====================================
-- COMPANIES TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#1e40af',
  plan VARCHAR(20) DEFAULT 'basic',
  max_users INTEGER DEFAULT 10,
  max_ai_interactions INTEGER DEFAULT 2500,
  credits_balance NUMERIC(10,2) DEFAULT 0,
  lgpd_terms_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================
-- AUTH & PROFILES
-- ====================================
CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy')),
  accepted_lgpd BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'agent',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role, company_id)
);

-- ====================================
-- ORGANIZATION
-- ====================================
CREATE TABLE IF NOT EXISTS sectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME DEFAULT '08:00',
  close_time TIME DEFAULT '18:00',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  is_national BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================
-- CONTACTS & MESSAGING
-- ====================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,
  is_blocked BOOLEAN DEFAULT false,
  accepted_lgpd BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, phone)
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  assigned_user_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
  sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'waiting', 'closed', 'archived')),
  channel VARCHAR(20) DEFAULT 'whatsapp',
  last_message_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('contact', 'agent', 'system', 'bot')),
  sender_id UUID,
  content TEXT,
  media_url TEXT,
  media_type VARCHAR(20),
  status VARCHAR(20) DEFAULT 'sent',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- ====================================
-- CHATBOT
-- ====================================
CREATE TABLE IF NOT EXISTS chatbot_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID UNIQUE NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  welcome_message TEXT DEFAULT 'Olá! Como posso ajudar?',
  farewell_message TEXT DEFAULT 'Obrigado pelo contato!',
  error_message TEXT DEFAULT 'Desculpe, não entendi. Por favor, tente novamente.',
  return_to_main_text TEXT DEFAULT '🔙 Voltar ao menu principal',
  business_hours_message TEXT,
  out_of_hours_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chatbot_menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES chatbot_menus(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  media_url TEXT,
  media_type VARCHAR(20),
  menu_type VARCHAR(20) DEFAULT 'buttons' CHECK (menu_type IN ('buttons', 'list')),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  action_type VARCHAR(50),
  action_target TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================
-- PLANS & WHATSAPP
-- ====================================
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  max_users INTEGER DEFAULT 5,
  max_sectors INTEGER DEFAULT 3,
  max_ai_interactions INTEGER DEFAULT 1000,
  max_whatsapp_credits INTEGER DEFAULT 500,
  storage_limit_gb INTEGER DEFAULT 5,
  price NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  api_base_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  instance_id VARCHAR(255),
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================
-- LOGS & ANALYTICS
-- ====================================
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  action VARCHAR(100) DEFAULT 'login',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  tokens_used INTEGER DEFAULT 0,
  cost NUMERIC(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================
-- TRIGGERS & FUNCTIONS
-- ====================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auth_users_updated_at BEFORE UPDATE ON auth_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sectors_updated_at BEFORE UPDATE ON sectors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chatbot_config_updated_at BEFORE UPDATE ON chatbot_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chatbot_menus_updated_at BEFORE UPDATE ON chatbot_menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- INDEXES FOR PERFORMANCE
-- ====================================
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_conversations_contact ON conversations(contact_id);
CREATE INDEX idx_conversations_assigned ON conversations(assigned_user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_access_logs_user ON access_logs(user_id);
CREATE INDEX idx_access_logs_company ON access_logs(company_id);

-- ====================================
-- INITIAL DATA
-- ====================================

-- Insert default plan
INSERT INTO plans (name, max_users, max_sectors, max_ai_interactions, max_whatsapp_credits, storage_limit_gb, price, is_active)
VALUES ('Básico', 10, 5, 2500, 1000, 10, 0, true)
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'GovChat schema initialized successfully!';
END $$;
