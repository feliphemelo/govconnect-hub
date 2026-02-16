export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action?: string
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_provider_config: {
        Row: {
          api_key: string | null
          block_on_limit: boolean | null
          company_id: string
          created_at: string
          id: string
          model: string
          monthly_limit: number
          provider: string
          updated_at: string
          used_this_month: number
        }
        Insert: {
          api_key?: string | null
          block_on_limit?: boolean | null
          company_id: string
          created_at?: string
          id?: string
          model?: string
          monthly_limit?: number
          provider?: string
          updated_at?: string
          used_this_month?: number
        }
        Update: {
          api_key?: string | null
          block_on_limit?: boolean | null
          company_id?: string
          created_at?: string
          id?: string
          model?: string
          monthly_limit?: number
          provider?: string
          updated_at?: string
          used_this_month?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_provider_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcasts: {
        Row: {
          company_id: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          media_url: string | null
          name: string
          recipient_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          media_url?: string | null
          name: string
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          media_url?: string | null
          name?: string
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcasts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          close_time: string
          company_id: string
          day_of_week: number
          id: string
          is_active: boolean | null
          open_time: string
          sector_id: string | null
        }
        Insert: {
          close_time?: string
          company_id: string
          day_of_week: number
          id?: string
          is_active?: boolean | null
          open_time?: string
          sector_id?: string | null
        }
        Update: {
          close_time?: string
          company_id?: string
          day_of_week?: number
          id?: string
          is_active?: boolean | null
          open_time?: string
          sector_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_hours_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_config: {
        Row: {
          ai_enabled: boolean | null
          ai_mode: string | null
          ai_name: string | null
          ai_personality: string | null
          ai_trigger_command: string | null
          company_id: string
          created_at: string
          error_message: string | null
          farewell_message: string | null
          id: string
          public_notice: string | null
          public_notice_expires_at: string | null
          return_message: string | null
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          ai_enabled?: boolean | null
          ai_mode?: string | null
          ai_name?: string | null
          ai_personality?: string | null
          ai_trigger_command?: string | null
          company_id: string
          created_at?: string
          error_message?: string | null
          farewell_message?: string | null
          id?: string
          public_notice?: string | null
          public_notice_expires_at?: string | null
          return_message?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          ai_enabled?: boolean | null
          ai_mode?: string | null
          ai_name?: string | null
          ai_personality?: string | null
          ai_trigger_command?: string | null
          company_id?: string
          created_at?: string
          error_message?: string | null
          farewell_message?: string | null
          id?: string
          public_notice?: string | null
          public_notice_expires_at?: string | null
          return_message?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_menus: {
        Row: {
          action_target: string | null
          action_type: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean | null
          media_type: string | null
          media_url: string | null
          menu_type: string
          message: string | null
          parent_id: string | null
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          action_target?: string | null
          action_type?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          media_type?: string | null
          media_url?: string | null
          menu_type?: string
          message?: string | null
          parent_id?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          action_target?: string | null
          action_type?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          media_type?: string | null
          media_url?: string | null
          menu_type?: string
          message?: string | null
          parent_id?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_menus_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_menus_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chatbot_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          credits_balance: number | null
          id: string
          is_active: boolean | null
          lgpd_terms_url: string | null
          logo_url: string | null
          max_ai_interactions: number | null
          max_sectors: number | null
          max_users: number | null
          name: string
          plan: string | null
          plan_id: string | null
          primary_color: string | null
          slug: string
          storage_used_gb: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_balance?: number | null
          id?: string
          is_active?: boolean | null
          lgpd_terms_url?: string | null
          logo_url?: string | null
          max_ai_interactions?: number | null
          max_sectors?: number | null
          max_users?: number | null
          name: string
          plan?: string | null
          plan_id?: string | null
          primary_color?: string | null
          slug: string
          storage_used_gb?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_balance?: number | null
          id?: string
          is_active?: boolean | null
          lgpd_terms_url?: string | null
          logo_url?: string | null
          max_ai_interactions?: number | null
          max_sectors?: number | null
          max_users?: number | null
          name?: string
          plan?: string | null
          plan_id?: string | null
          primary_color?: string | null
          slug?: string
          storage_used_gb?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          accepted_lgpd: boolean | null
          avatar_url: string | null
          company_id: string
          created_at: string
          email: string | null
          id: string
          is_blocked: boolean | null
          metadata: Json | null
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          accepted_lgpd?: boolean | null
          avatar_url?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_blocked?: boolean | null
          metadata?: Json | null
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          accepted_lgpd?: boolean | null
          avatar_url?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_blocked?: boolean | null
          metadata?: Json | null
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_to: string | null
          channel: string
          close_message: string | null
          closed_at: string | null
          company_id: string
          contact_id: string
          created_at: string
          id: string
          nps_score: number | null
          protocol: string
          sector_id: string | null
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          channel?: string
          close_message?: string | null
          closed_at?: string | null
          company_id: string
          contact_id: string
          created_at?: string
          id?: string
          nps_score?: number | null
          protocol: string
          sector_id?: string | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          channel?: string
          close_message?: string | null
          closed_at?: string | null
          company_id?: string
          contact_id?: string
          created_at?: string
          id?: string
          nps_score?: number | null
          protocol?: string
          sector_id?: string | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      form_questions: {
        Row: {
          form_id: string
          id: string
          options: Json | null
          question: string
          question_type: string
          sort_order: number | null
        }
        Insert: {
          form_id: string
          id?: string
          options?: Json | null
          question: string
          question_type?: string
          sort_order?: number | null
        }
        Update: {
          form_id?: string
          id?: string
          options?: Json | null
          question?: string
          question_type?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "form_questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          company_id: string
          created_at: string
          forward_email: string | null
          forward_phone: string | null
          id: string
          is_active: boolean | null
          is_anonymous: boolean | null
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          forward_email?: string | null
          forward_phone?: string | null
          id?: string
          is_active?: boolean | null
          is_anonymous?: boolean | null
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          forward_email?: string | null
          forward_phone?: string | null
          id?: string
          is_active?: boolean | null
          is_anonymous?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "forms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          contact_id: string
          group_id: string
          id: string
          joined_at: string
        }
        Insert: {
          contact_id: string
          group_id: string
          id?: string
          joined_at?: string
        }
        Update: {
          contact_id?: string
          group_id?: string
          id?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          invite_url: string | null
          is_open: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          invite_url?: string | null
          is_open?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          invite_url?: string | null
          is_open?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          company_id: string
          created_at: string
          date: string
          id: string
          is_national: boolean | null
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          date: string
          id?: string
          is_national?: boolean | null
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          date?: string
          id?: string
          is_national?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "holidays_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          category: string | null
          company_id: string
          content: string
          created_at: string
          id: string
          source_type: string | null
          source_url: string | null
          title: string
        }
        Insert: {
          category?: string | null
          company_id: string
          content: string
          created_at?: string
          id?: string
          source_type?: string | null
          source_url?: string | null
          title: string
        }
        Update: {
          category?: string | null
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          source_type?: string | null
          source_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          media_type: string | null
          media_url: string | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      module_permissions: {
        Row: {
          company_id: string
          created_at: string
          id: string
          module_name: string
          permission_level: string
          role_name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          module_name: string
          permission_level?: string
          role_name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          module_name?: string
          permission_level?: string
          role_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          max_ai_interactions: number
          max_sectors: number
          max_users: number
          max_whatsapp_credits: number
          name: string
          price: number | null
          storage_limit_gb: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_ai_interactions?: number
          max_sectors?: number
          max_users?: number
          max_whatsapp_credits?: number
          name: string
          price?: number | null
          storage_limit_gb?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_ai_interactions?: number
          max_sectors?: number
          max_users?: number
          max_whatsapp_credits?: number
          name?: string
          price?: number | null
          storage_limit_gb?: number
          updated_at?: string
        }
        Relationships: []
      }
      poll_questions: {
        Row: {
          id: string
          options: Json | null
          poll_id: string
          question: string
          question_type: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          options?: Json | null
          poll_id: string
          question: string
          question_type?: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          options?: Json | null
          poll_id?: string
          question?: string
          question_type?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_questions_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          answer: string
          contact_id: string | null
          created_at: string
          id: string
          question_id: string
        }
        Insert: {
          answer: string
          contact_id?: string | null
          created_at?: string
          id?: string
          question_id: string
        }
        Update: {
          answer?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "poll_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          company_id: string
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean | null
          starts_at: string
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          starts_at?: string
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepted_lgpd: boolean | null
          avatar_url: string | null
          company_id: string
          created_at: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_lgpd?: boolean | null
          avatar_url?: string | null
          company_id: string
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_lgpd?: boolean | null
          avatar_url?: string | null
          company_id?: string
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_replies: {
        Row: {
          company_id: string
          content: string
          created_at: string
          id: string
          sector_id: string | null
          shortcut: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          id?: string
          sector_id?: string | null
          shortcut: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          sector_id?: string | null
          shortcut?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_replies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_replies_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sectors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_documents: {
        Row: {
          company_id: string
          contact_id: string | null
          created_at: string
          document_url: string
          id: string
          qr_code: string | null
          sent_at: string | null
          signed_at: string | null
          signed_document_url: string | null
          status: string
          title: string
        }
        Insert: {
          company_id: string
          contact_id?: string | null
          created_at?: string
          document_url: string
          id?: string
          qr_code?: string | null
          sent_at?: string | null
          signed_at?: string | null
          signed_document_url?: string | null
          status?: string
          title: string
        }
        Update: {
          company_id?: string
          contact_id?: string | null
          created_at?: string
          document_url?: string
          id?: string
          qr_code?: string | null
          sent_at?: string | null
          signed_at?: string | null
          signed_document_url?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "signature_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_documents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      spy_logs: {
        Row: {
          company_id: string
          conversation_id: string
          ended_at: string | null
          id: string
          spy_user_id: string
          started_at: string
        }
        Insert: {
          company_id: string
          conversation_id: string
          ended_at?: string | null
          id?: string
          spy_user_id: string
          started_at?: string
        }
        Update: {
          company_id?: string
          conversation_id?: string
          ended_at?: string | null
          id?: string
          spy_user_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spy_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spy_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          executed_at: string
          id: string
          request_body: Json | null
          response_body: string | null
          status_code: number | null
          webhook_id: string
        }
        Insert: {
          executed_at?: string
          id?: string
          request_body?: Json | null
          response_body?: string | null
          status_code?: number | null
          webhook_id: string
        }
        Update: {
          executed_at?: string
          id?: string
          request_body?: Json | null
          response_body?: string | null
          status_code?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          company_id: string
          created_at: string
          direction: string
          headers: Json | null
          id: string
          is_active: boolean | null
          method: string
          name: string
          secret_token: string | null
          updated_at: string
          url: string
        }
        Insert: {
          company_id: string
          created_at?: string
          direction?: string
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          method?: string
          name: string
          secret_token?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          company_id?: string
          created_at?: string
          direction?: string
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          method?: string
          name?: string
          secret_token?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_connections: {
        Row: {
          api_base_url: string | null
          api_key: string | null
          company_id: string
          connection_status: string
          created_at: string
          id: string
          instance_id: string | null
          last_sync_at: string | null
          provider: string
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          api_base_url?: string | null
          api_key?: string | null
          company_id: string
          connection_status?: string
          created_at?: string
          id?: string
          instance_id?: string | null
          last_sync_at?: string | null
          provider?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          api_base_url?: string | null
          api_key?: string | null
          company_id?: string
          connection_status?: string
          created_at?: string
          id?: string
          instance_id?: string | null
          last_sync_at?: string | null
          provider?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_protocol: { Args: { p_company_id: string }; Returns: string }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "agent" | "broadcaster" | "referenced"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "agent", "broadcaster", "referenced"],
    },
  },
} as const
