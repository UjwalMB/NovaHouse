/**
 * NOVA HOUSE · Executive Dashboard Base API Client
 * Uses VITE_API_BASE_URL for live FastAPI communication.
 */

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
export const API_BASE_URL = RAW_BASE.replace(/\/+$/, '');

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('nova_dashboard_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('nova_dashboard_token', token);
    } else {
      localStorage.removeItem('nova_dashboard_token');
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

    return `${this.baseUrl}/api/v1${cleanEndpoint}`;
  }

  async request(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const err = new Error(errorBody.detail || errorBody.message || `API Error ${response.status}`);
        err.status = response.status;
        err.data = errorBody;
        throw err;
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('API Request timed out.');
      }
      throw err;
    }
  }

  get(endpoint, params = {}) {
    let url = endpoint;
    const query = new URLSearchParams(params).toString();
    if (query) {
      url += (url.includes('?') ? '&' : '?') + query;
    }
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
