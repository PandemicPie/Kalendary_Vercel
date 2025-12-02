// API Client for making authenticated requests

class APIClient {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
    this.token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth endpoints
  async register(email: string, password: string, name: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getUser() {
    return this.request('/api/user');
  }

  // Activities endpoints
  async getActivities() {
    return this.request('/api/activities');
  }

  async createActivity(activity: any) {
    return this.request('/api/activities', {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  }

  async updateActivity(id: string, updates: any) {
    return this.request('/api/activities', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates }),
    });
  }

  async deleteActivity(id: string) {
    return this.request(`/api/activities?id=${id}`, {
      method: 'DELETE',
    });
  }

  // User endpoints (to be implemented)
  async updateUser(updates: any) {
    return this.request('/api/user', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getStreak() {
    return this.request('/api/streak');
  }

  async updateStreak(updates: any) {
    return this.request('/api/streak', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // AI endpoints
  async analyzeCalendar(userProfile: any) {
    return this.request('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ userProfile }),
    });
  }

  async getDailySuggestions(userProfile: any, date?: Date) {
    return this.request('/api/ai/suggestions', {
      method: 'POST',
      body: JSON.stringify({
        userProfile,
        date: date?.toISOString(),
      }),
    });
  }
}

export const apiClient = new APIClient();
