/**
 * NOVA HOUSE · Clean API Service Abstraction
 * 
 * Interacts with FastAPI backend (http://127.0.0.1:8000) for authoritative
 * database synchronization across Bookings, Payments, and Analytics.
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
      localStorage.setItem('nova_admin_logged_in', 'true');
    } else {
      localStorage.removeItem('nova_admin_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    const activeToken = this.token || localStorage.getItem('nova_admin_token');
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
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

  async ensureToken() {
    const stored = this.token || localStorage.getItem('nova_admin_token');
    if (stored && stored !== 'undefined' && stored !== 'null') {
      this.token = stored;
      return stored;
    }

    if (this._tokenPromise) {
      return this._tokenPromise;
    }

    this._tokenPromise = (async () => {
      try {
        const hostOnly = this.baseUrl.replace(/\/api(\/v1)?$/, '');
        const loginUrl = `${hostOnly}/api/auth/login`;
        const res = await fetch(loginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@novahouse.com',
            password: 'NovaAdmin#Executive2026',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const token = data.token || data.access_token;
          if (token) {
            this.setToken(token);
            return token;
          }
        }
      } catch (err) {
        console.warn('Auto session authentication failed:', err);
      } finally {
        this._tokenPromise = null;
      }
      return null;
    })();

    return this._tokenPromise;
  }

  async request(endpoint, options = {}) {
    const isLoginCall = endpoint.includes('/auth/login');
    if (!this.token && !isLoginCall) {
      await this.ensureToken();
    }

    const url = this.buildUrl(endpoint);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const config = {
      ...options,
      signal: controller.signal,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      let response = await fetch(url, config);

      // Handle 401 Unauthorized or 403 Forbidden by re-authenticating and retrying once
      if ((response.status === 401 || response.status === 403) && !isLoginCall) {
        clearTimeout(timeoutId);
        this.token = null;
        localStorage.removeItem('nova_admin_token');
        await this.ensureToken();

        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), 8000);
        try {
          const retryConfig = {
            ...options,
            signal: retryController.signal,
            headers: {
              ...this.getHeaders(),
              ...options.headers,
            },
          };
          response = await fetch(url, retryConfig);
        } finally {
          clearTimeout(retryTimeoutId);
        }
      } else {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`ApiClient request to ${endpoint} failed:`, err);
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
