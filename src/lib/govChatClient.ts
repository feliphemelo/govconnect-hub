// GovChat API Client - Replace Supabase client

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class GovChatClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('govchat_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  auth = {
    register: async (data: { email: string; password: string; full_name: string; company_id: string }) => {
      const result = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      this.token = result.token;
      localStorage.setItem('govchat_token', result.token);
      return result;
    },

    login: async (email: string, password: string) => {
      const result = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      this.token = result.token;
      localStorage.setItem('govchat_token', result.token);
      return result;
    },

    logout: () => {
      this.token = null;
      localStorage.removeItem('govchat_token');
    },

    getUser: async () => {
      return this.request('/auth/me');
    },
  };

  // Companies
  companies = {
    list: async () => {
      return this.request('/companies');
    },

    get: async (id: string) => {
      return this.request(`/companies/${id}`);
    },
  };

  // Profiles
  profiles = {
    list: async () => {
      return this.request('/profiles');
    },

    update: async (id: string, data: any) => {
      return this.request(`/profiles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  };

  // Contacts
  contacts = {
    list: async (params?: { page?: number; limit?: number; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return this.request(`/contacts?${query}`);
    },

    create: async (data: { name: string; phone: string; email?: string; metadata?: any }) => {
      return this.request('/contacts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    get: async (id: string) => {
      return this.request(`/contacts/${id}`);
    },

    update: async (id: string, data: any) => {
      return this.request(`/contacts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  };

  // Sectors
  sectors = {
    list: async () => {
      return this.request('/sectors');
    },

    create: async (data: { name: string; description?: string }) => {
      return this.request('/sectors', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  };

  // Health
  health = async () => {
    return this.request('/health');
  };
}

export const govChatClient = new GovChatClient();

// Export for compatibility with existing Supabase code
export const supabase = {
  auth: govChatClient.auth,
  from: (table: string) => ({
    select: async (columns?: string) => {
      const data = await govChatClient.request(`/${table}`);
      return { data, error: null };
    },
    insert: async (values: any) => {
      const data = await govChatClient.request(`/${table}`, {
        method: 'POST',
        body: JSON.stringify(values),
      });
      return { data, error: null };
    },
    update: async (values: any) => ({
      eq: async (column: string, value: any) => {
        // This would need the ID from context
        return { data: null, error: new Error('Use govChatClient directly') };
      },
    }),
    delete: async () => ({
      eq: async (column: string, value: any) => {
        return { data: null, error: new Error('Use govChatClient directly') };
      },
    }),
  }),
};
