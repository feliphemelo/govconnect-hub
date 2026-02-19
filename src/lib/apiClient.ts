// API Client - Substitui Supabase completamente
const API_URL = 'https://atendimento.nextplan.tec.br/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

class APIClient {
  private getToken(): string | null {
    return localStorage.getItem('govchat_token');
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${API_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = this.buildUrl(endpoint, params);
    
    const response = await fetch(url, {
      ...fetchOptions,
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
    me: () => this.request('/auth/me'),
    login: (email: string, password: string) => 
      this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (data: { email: string; password: string; full_name: string }) =>
      this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    logout: () => {
      localStorage.removeItem('govchat_token');
    },
  };

  // Contacts
  contacts = {
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      this.request('/contacts', { params }),
    get: (id: string) => this.request(`/contacts/${id}`),
    create: (data: any) =>
      this.request('/contacts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request(`/contacts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request(`/contacts/${id}`, { method: 'DELETE' }),
  };

  // Conversations
  conversations = {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      this.request('/conversations', { params }),
    get: (id: string) => this.request(`/conversations/${id}`),
    create: (data: any) =>
      this.request('/conversations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request(`/conversations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  };

  // Messages
  messages = {
    list: (conversationId: string, params?: { page?: number; limit?: number }) =>
      this.request(`/conversations/${conversationId}/messages`, { params }),
    send: (conversationId: string, data: { content: string; type?: string }) =>
      this.request(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // Profiles
  profiles = {
    list: () => this.request('/profiles'),
    get: (id: string) => this.request(`/profiles/${id}`),
    update: (id: string, data: any) =>
      this.request(`/profiles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  };

  // Sectors
  sectors = {
    list: () => this.request('/sectors'),
    create: (data: { name: string; description?: string }) =>
      this.request('/sectors', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request(`/sectors/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request(`/sectors/${id}`, { method: 'DELETE' }),
  };

  // Users
  users = {
    list: () => this.request('/users'),
    create: (data: { email: string; password: string; full_name: string; role?: string }) =>
      this.request('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request(`/users/${id}`, { method: 'DELETE' }),
  };

  // Companies
  companies = {
    list: () => this.request('/companies'),
    get: (id: string) => this.request(`/companies/${id}`),
    update: (id: string, data: any) =>
      this.request(`/companies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  };

  // Notification Preferences
  notificationPreferences = {
    get: () => this.request('/notification_preferences'),
    update: (data: any) =>
      this.request('/notification_preferences', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // WhatsApp Configuration
  whatsapp = {
    getConfig: () => this.request('/whatsapp/config'),
    createConfig: (data: any) =>
      this.request('/whatsapp/config', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateConfig: (id: string, data: any) =>
      this.request(`/whatsapp/config/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteConfig: (id: string) =>
      this.request(`/whatsapp/config/${id}`, { method: 'DELETE' }),
    getQRCode: (id: string) =>
      this.request(`/whatsapp/config/${id}/qrcode`),
    connect: (id: string) =>
      this.request(`/whatsapp/config/${id}/connect`, { method: 'POST' }),
    disconnect: (id: string) =>
      this.request(`/whatsapp/config/${id}/disconnect`, { method: 'POST' }),
  };

  // Health check
  health = () => this.request('/health');
}

export const apiClient = new APIClient();
export default apiClient;
