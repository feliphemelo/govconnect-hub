export interface User {
  id: string;
  email: string;
  encrypted_password: string;
  email_confirmed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  role: 'authenticated';
  raw_user_meta_data: any;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  plan: string;
  max_users: number;
  max_ai_interactions: number;
  credits_balance: number;
  lgpd_terms_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  id: string;
  user_id: string;
  company_id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  status: 'online' | 'offline' | 'busy';
  accepted_lgpd: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserRole {
  id: string;
  user_id: string;
  company_id: string;
  role: 'admin' | 'manager' | 'agent' | 'broadcaster' | 'referenced';
}

export interface Contact {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  email: string | null;
  avatar_url: string | null;
  is_blocked: boolean;
  accepted_lgpd: boolean;
  metadata: any;
  created_at: Date;
  updated_at: Date;
}

export interface Sector {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Ticket {
  id: string;
  company_id: string;
  contact_id: string;
  sector_id: string | null;
  assigned_to: string | null;
  protocol: string;
  subject: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channel: string;
  created_at: Date;
  updated_at: Date;
  closed_at: Date | null;
}

export interface Message {
  id: string;
  ticket_id: string;
  sender_type: 'user' | 'contact' | 'system' | 'bot';
  sender_id: string | null;
  content: string;
  media_url: string | null;
  media_type: string | null;
  is_read: boolean;
  created_at: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  companyId: string;
  role: string;
}
