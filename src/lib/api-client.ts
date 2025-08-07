/**
 * Generic API Client for Osassy's Kitchen
 * Handles HTTP requests with authentication, error handling, and retry logic
 */

import { getSession } from 'next-auth/react';
import type { 
  ApiResponse, 
  ApiError, 
  RequestConfig, 
  HttpMethod 
} from './api-types';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;

export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get authentication headers from NextAuth session
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const session = await getSession();
      if (session?.user) {
        return {
          'Authorization': `Bearer ${(session.user as any)?.id || 'anonymous'}`, // Using user ID as token for now
          'X-User-Role': (session.user as any)?.role || 'USER',
        };
      }
    } catch (error) {
      console.warn('Failed to get session for auth headers:', error);
    }
    return {};
  }

  /**
   * Build query string from parameters
   */
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((item) => searchParams.append(`${key}[]`, String(item)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Create a custom error from response
   */
  private async createError(response: Response): Promise<ApiError> {
    let errorData: any = {};
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() };
      }
    } catch {
      errorData = { message: 'Unknown error occurred' };
    }

    return {
      message: errorData.message || errorData.error || `HTTP ${response.status}`,
      status: response.status,
      code: errorData.code,
      details: errorData,
    };
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Core request method with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      params = {},
      timeout = DEFAULT_TIMEOUT,
      retry = true,
    } = config;

    const url = `${this.baseURL}${endpoint}${method === 'GET' ? this.buildQueryString(params) : ''}`;
    
    // Get authentication headers
    const authHeaders = await this.getAuthHeaders();
    
    // Merge headers
    const requestHeaders = {
      ...this.defaultHeaders,
      ...authHeaders,
      ...headers,
    };

    // Prepare request body
    let body: string | FormData | undefined;
    if (method !== 'GET' && params) {
      if (params instanceof FormData) {
        body = params;
        // Remove Content-Type for FormData (browser sets it with boundary)
        delete requestHeaders['Content-Type'];
      } else {
        body = JSON.stringify(params);
      }
    }

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      body,
    };

    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    requestConfig.signal = controller.signal;

    let lastError: ApiError | null = null;
    const maxAttempts = retry ? (typeof retry === 'number' ? retry + 1 : MAX_RETRIES + 1) : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(url, requestConfig);
        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await this.createError(response);
          
          // Don't retry client errors (4xx) except for 429 (rate limit)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw error;
          }
          
          lastError = error;
          
          // If this is the last attempt, throw the error
          if (attempt === maxAttempts) {
            throw error;
          }
          
          // Wait before retrying (exponential backoff)
          await this.sleep(Math.pow(2, attempt - 1) * 1000);
          continue;
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        let data: T;
        
        if (contentType?.includes('application/json')) {
          const jsonData = await response.json();
          data = jsonData.data !== undefined ? jsonData.data : jsonData;
        } else {
          data = (await response.text()) as T;
        }

        return {
          success: true,
          data,
        };

      } catch (error: any) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          lastError = {
            message: 'Request timeout',
            status: 408,
            code: 'TIMEOUT',
          };
        } else if (error.message === 'Failed to fetch') {
          lastError = {
            message: 'Network error - please check your connection',
            status: 0,
            code: 'NETWORK_ERROR',
          };
        } else if (error.status) {
          lastError = error as ApiError;
        } else {
          lastError = {
            message: error.message || 'Unknown error occurred',
            status: 500,
            code: 'UNKNOWN_ERROR',
          };
        }

        // Don't retry on certain errors
        if (lastError.code === 'TIMEOUT' || lastError.status === 0) {
          if (attempt === maxAttempts) break;
          await this.sleep(Math.pow(2, attempt - 1) * 1000);
          continue;
        }
        
        break;
      }
    }

    // If we get here, all attempts failed
    throw lastError;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>, config?: Omit<RequestConfig, 'method' | 'params'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'GET',
      params,
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'params'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'POST',
      params: data,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'params'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'PUT',
      params: data,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'params'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'PATCH',
      params: data,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'DELETE',
    });
  }

  /**
   * Upload file
   */
  async upload<T>(endpoint: string, file: File, additionalFields?: Record<string, string>, config?: Omit<RequestConfig, 'method' | 'params'>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'POST',
      params: formData,
    });
  }
}

// Create and export a default instance
export const apiClient = new ApiClient();

// Export convenience methods
export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>, config?: Omit<RequestConfig, 'method' | 'params'>) => 
    apiClient.get<T>(endpoint, params, config),
  
  post: <T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'params'>) => 
    apiClient.post<T>(endpoint, data, config),
  
  put: <T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'params'>) => 
    apiClient.put<T>(endpoint, data, config),
  
  patch: <T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'params'>) => 
    apiClient.patch<T>(endpoint, data, config),
  
  delete: <T>(endpoint: string, config?: Omit<RequestConfig, 'method'>) => 
    apiClient.delete<T>(endpoint, config),
  
  upload: <T>(endpoint: string, file: File, additionalFields?: Record<string, string>, config?: Omit<RequestConfig, 'method' | 'params'>) => 
    apiClient.upload<T>(endpoint, file, additionalFields, config),
};

export default apiClient;