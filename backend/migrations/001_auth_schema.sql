-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table (Supabase compatible)
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  encrypted_password TEXT NOT NULL,
  email_confirmed_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ,
  confirmation_token TEXT,
  confirmation_sent_at TIMESTAMPTZ,
  recovery_token TEXT,
  recovery_sent_at TIMESTAMPTZ,
  email_change_token_new TEXT,
  email_change TEXT,
  email_change_sent_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  raw_app_meta_data JSONB DEFAULT '{}',
  raw_user_meta_data JSONB DEFAULT '{}',
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  phone TEXT,
  phone_confirmed_at TIMESTAMPTZ,
  phone_change TEXT,
  phone_change_token TEXT,
  phone_change_sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  email_change_token_current TEXT,
  email_change_confirm_status SMALLINT DEFAULT 0,
  banned_until TIMESTAMPTZ,
  reauthentication_token TEXT,
  reauthentication_sent_at TIMESTAMPTZ,
  is_sso_user BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  role TEXT DEFAULT 'authenticated'
);

-- Create index on email
CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users(email);

-- Function to get auth.uid() for compatibility
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID
$$;

-- Create auth.role() function
CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.role', true), '')::TEXT
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA auth TO PUBLIC;
GRANT SELECT ON auth.users TO PUBLIC;
