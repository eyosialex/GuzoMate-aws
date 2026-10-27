import { Language } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface RequestOptions extends RequestInit {
  language?: Language;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code = 'API_ERROR', status = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { language = 'en', params, ...customConfig } = options;

  let url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = localStorage.getItem('guzomate_token') || localStorage.getItem('guzo_access_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': language,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(customConfig.headers as Record<string, string>),
  };

  try {
    const response = await fetch(url, {
      ...customConfig,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('guzomate_token');
        localStorage.removeItem('guzomate_user');
        localStorage.removeItem('guzo_access_token');
        localStorage.removeItem('guzo_user_session');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:logout'));
        }
      }

      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      const errorCode = errorData?.error?.code || `HTTP_${response.status}`;
      const errorMessage = errorData?.error?.message || errorData?.message || 'Server error occurred.';

      throw new ApiError(errorMessage, errorCode, response.status, errorData?.error?.details);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const result = await response.json();
    if (result && typeof result === 'object' && 'data' in result && result.data !== undefined) {
      return result.data as T;
    }
    return result as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Network connection error';
    throw new ApiError(message, 'PROVIDER_UNAVAILABLE', 503);
  }
}
