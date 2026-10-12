/**
 * NOVA HOUSE · Clean API Service Abstraction
 * 
 * Designed for future plug-and-play connection to:
 * React Admin Panel -> FastAPI -> MySQL / PostgreSQL
 * 
 * When VITE_API_URL is configured, calls route to the live FastAPI backend.
 * Otherwise, services operate seamlessly using in-memory state and localStorage caching.
 */

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const API_BASE_URL = RAW_BASE.replace(/\/+$/, '');

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('nova_admin_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('nova_admin_token', token);
    } else {
      localStorage.removeItem('nova_admin_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  buildUrl(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    if (cleanEndpoint.startsWith('/api')) {
      const hostOnly = this.baseUrl.replace(/\/api(\/v1)?$/, '');
      return `${hostOnly}${cleanEndpoint}`;
    }

    if (this.baseUrl.endsWith('/api') || this.baseUrl.endsWith('/api/v1')) {
      return `${this.baseUrl}${cleanEndpoint}`;
    }

    return `${this.baseUrl}/api${cleanEndpoint}`;
  }

  async request(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (err) {
      // Backend offline or unreachable; return null to trigger mock/local fallback
      return null;
    }
  }

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
