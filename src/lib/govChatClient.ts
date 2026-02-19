// GovChat API Client - Replace Supabase client

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class GovChatClient {
  private token: string | null = null;
  private authListeners: Array<(event: string, session: any) => void> = [];

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('govchat_token');
    console.log('🔵 GovChatClient initialized with token:', this.token ? 'YES' : 'NO');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    console.log('🔵 Request:', `${API_URL}${endpoint}`, options);
    
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

    console.log('🔵 Response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      console.log('🔴 Response error:', error);
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('🟢 Response data:', data);
    return data;
  }

  private notifyAuthListeners(event: string, session: any) {
    this.authListeners.forEach(callback => callback(event, session));
  }

  // Auth object compatible with Supabase
  auth = {
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      console.log('🔵 onAuthStateChange registered');
      this.authListeners.push(callback);
      
      // Immediately call with current session
      if (this.token) {
        this.auth.getSession().then(({ data }) => {
          if (data.session) {
            callback('SIGNED_IN', data.session);
          }
        });
      } else {
        callback('SIGNED_OUT', null);
      }
      
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              const index = this.authListeners.indexOf(callback);
              if (index > -1) {
                this.authListeners.splice(index, 1);
              }
            }
          }
        }
      };
    },

    getSession: async () => {
      console.log('🔵 getSession called');
      try {
        if (!this.token) {
          console.log('🔴 No token found');
          return { 
            data: { session: null }, 
            error: null 
          };
        }

        const userData = await this.request('/auth/me');
        console.log('🟢 getSession user data:', userData);
        
        return {
          data: {
            session: {
              access_token: this.token,
              user: userData.user
            }
          },
          error: null
        };
      } catch (error: any) {
        console.log('🔴 getSession error:', error);
        // Token inválido, limpar
        this.token = null;
        localStorage.removeItem('govchat_token');
        return {
          data: { session: null },
          error: { message: error.message }
        };
      }
    },

    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      console.log('🔵 signInWithPassword called with:', email);
      try {
        const result = await this.request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        this.token = result.token;
        localStorage.setItem('govchat_token', result.token);
        console.log('🟢 Login successful, token saved');
        
        this.notifyAuthListeners('SIGNED_IN', { access_token: result.token, user: result.user });

        return { 
          data: { 
            user: result.user, 
            session: { access_token: result.token } 
          }, 
          error: null 
        };
      } catch (error: any) {
        console.log('🔴 Login error:', error);
        return { 
          data: { user: null, session: null }, 
          error: { message: error.message } 
        };
      }
    },

    signUp: async ({ email, password, options }: any) => {
      try {
        const result = await this.request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ 
            email, 
            password,
            full_name: options?.data?.full_name || '',
            company_id: options?.data?.company_id || ''
          }),
        });

        this.token = result.token;
        localStorage.setItem('govchat_token', result.token);
        
        this.notifyAuthListeners('SIGNED_IN', { access_token: result.token, user: result.user });

        return { 
          data: { 
            user: result.user, 
            session: { access_token: result.token } 
          }, 
          error: null 
        };
      } catch (error: any) {
        return { 
          data: { user: null, session: null }, 
          error: { message: error.message } 
        };
      }
    },

    signOut: async () => {
      console.log('🔵 signOut called');
      this.token = null;
      localStorage.removeItem('govchat_token');
      this.notifyAuthListeners('SIGNED_OUT', null);
      return { error: null };
    },

    getUser: async () => {
      try {
        const userData = await this.request('/auth/me');
        return { 
          data: { user: userData.user }, 
          error: null 
        };
      } catch (error: any) {
        return { 
          data: { user: null }, 
          error: { message: error.message } 
        };
      }
    },
  };

  // Simple table helper
  from(table: string) {
    return {
      select: async (columns?: string) => {
        try {
          const data = await this.request(`/${table}`);
          return { data, error: null };
        } catch (error: any) {
          return { data: null, error: { message: error.message } };
        }
      },
      insert: async (values: any) => {
        try {
          const data = await this.request(`/${table}`, {
            method: 'POST',
            body: JSON.stringify(values),
          });
          return { data, error: null };
        } catch (error: any) {
          return { data: null, error: { message: error.message } };
        }
      },
    };
  }
}

const govChatClient = new GovChatClient();

// Export for compatibility
export { govChatClient };
export const supabase = govChatClient;
