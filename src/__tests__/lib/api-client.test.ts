import { ApiClient, apiClient } from '@/lib/api-client'
import { getSession } from 'next-auth/react'
import { ApiError } from '@/lib/api-types'

// Mock next-auth
jest.mock('next-auth/react')
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('ApiClient', () => {
  let client: ApiClient

  beforeEach(() => {
    client = new ApiClient()
    jest.clearAllMocks()
    // Reset fetch mock
    mockFetch.mockClear()
  })

  describe('constructor', () => {
    it('should initialise with default base URL', () => {
      expect(client).toBeInstanceOf(ApiClient)
    })

    it('should initialise with custom base URL', () => {
      const customClient = new ApiClient('https://custom.api.com')
      expect(customClient).toBeInstanceOf(ApiClient)
    })
  })

  describe('authentication headers', () => {
    it('should add auth headers when session exists', async () => {
      const mockSession = {
        user: { id: 'user123', role: 'USER' },
        expires: '2024-12-31T23:59:59.999Z'
      }
      mockGetSession.mockResolvedValue(mockSession as any)

      const mockResponse = { success: true, data: { test: 'data' } }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      await client.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer user123',
            'X-User-Role': 'USER',
          }),
        })
      )
    })

    it('should work without auth headers when no session', async () => {
      mockGetSession.mockResolvedValue(null)

      const mockResponse = { success: true, data: { test: 'data' } }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      await client.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
            'X-User-Role': expect.any(String),
          }),
        })
      )
    })
  })

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { success: true, data: { test: 'data' } }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      const result = await client.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'GET',
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle query parameters', async () => {
      const mockResponse = { success: true, data: [] }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      await client.get('/test', { page: 1, limit: 10, category: 'main' })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test?page=1&limit=10&category=main',
        expect.any(Object)
      )
    })

    it('should handle array parameters', async () => {
      const mockResponse = { success: true, data: [] }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      await client.get('/test', { ids: ['1', '2', '3'] })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test?ids%5B%5D=1&ids%5B%5D=2&ids%5B%5D=3',
        expect.any(Object)
      )
    })

    it('should filter out undefined and null parameters', async () => {
      const mockResponse = { success: true, data: [] }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      await client.get('/test', { 
        page: 1, 
        category: null, 
        search: undefined, 
        limit: 10,
        empty: ''
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test?page=1&limit=10',
        expect.any(Object)
      )
    })
  })

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const mockResponse = { success: true, data: { id: '1' } }
      const postData = { name: 'Test', price: 10.99 }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      const result = await client.post('/test', postData)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle FormData', async () => {
      const mockResponse = { success: true, data: { id: '1' } }
      const formData = new FormData()
      formData.append('file', new File(['test'], 'test.txt'))

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      const result = await client.post('/upload', formData)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/upload',
        expect.objectContaining({
          method: 'POST',
          body: formData,
          headers: expect.not.objectContaining({
            'Content-Type': expect.any(String),
          }),
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const mockResponse = { success: true, data: { id: '1' } }
      const putData = { name: 'Updated Test', price: 12.99 }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      const result = await client.put('/test/1', putData)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(putData),
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('PATCH requests', () => {
    it('should make successful PATCH request', async () => {
      const mockResponse = { success: true, data: { id: '1' } }
      const patchData = { price: 12.99 }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      const result = await client.patch('/test/1', patchData)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(patchData),
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      const mockResponse = { success: true, data: null }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      const result = await client.delete('/test/1')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('file upload', () => {
    it('should upload file successfully', async () => {
      const mockResponse = { success: true, data: { url: '/uploads/test.jpg' } }
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      const result = await client.upload('/upload', file, { category: 'menu' })

      const call = mockFetch.mock.calls[0]
      const formData = call[1]?.body as FormData

      expect(formData.get('file')).toBe(file)
      expect(formData.get('category')).toBe('menu')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('error handling', () => {
    it('should handle HTTP errors', async () => {
      const errorResponse = { message: 'Not found', code: 'NOT_FOUND' }
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve(errorResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      await expect(client.get('/test')).rejects.toEqual({
        message: 'Not found',
        status: 404,
        code: 'NOT_FOUND',
        details: errorResponse,
      })
    })

    it('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
        headers: new Headers({ 'content-type': 'text/plain' }),
      } as Response)

      await expect(client.get('/test')).rejects.toEqual(
        expect.objectContaining({
          message: 'Internal Server Error',
          status: 500,
        })
      )
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to fetch'))

      await expect(client.get('/test')).rejects.toEqual(
        expect.objectContaining({
          message: 'Network error - please check your connection',
          status: 0,
          code: 'NETWORK_ERROR',
        })
      )
    })

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((resolve, reject) => {
          const error = new Error('The operation was aborted.')
          error.name = 'AbortError'
          setTimeout(() => reject(error), 100)
        })
      )

      await expect(client.get('/test', {}, { timeout: 50 })).rejects.toEqual(
        expect.objectContaining({
          message: 'Request timeout',
          status: 408,
          code: 'TIMEOUT',
        })
      )
    })
  })

  describe('retry logic', () => {
    it('should retry on 5xx errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Server error' }),
          headers: new Headers({ 'content-type': 'application/json' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { test: 'data' } }),
          headers: new Headers({ 'content-type': 'application/json' }),
        } as Response)

      const result = await client.get('/test')

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ success: true, data: { test: 'data' } })
    })

    it('should not retry on 4xx errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Bad request' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      await expect(client.get('/test')).rejects.toEqual(
        expect.objectContaining({
          message: 'Bad request',
          status: 400,
        })
      )

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should retry on 429 rate limit errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ message: 'Rate limit exceeded' }),
          headers: new Headers({ 'content-type': 'application/json' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { test: 'data' } }),
          headers: new Headers({ 'content-type': 'application/json' }),
        } as Response)

      const result = await client.get('/test')

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ success: true, data: { test: 'data' } })
    })

    it('should respect custom retry count', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      await expect(client.get('/test', {}, { retry: 1 })).rejects.toEqual(
        expect.objectContaining({
          message: 'Server error',
          status: 500,
        })
      )

      expect(mockFetch).toHaveBeenCalledTimes(2) // Initial + 1 retry
    })

    it('should not retry when retry is disabled', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      await expect(client.get('/test', {}, { retry: false })).rejects.toEqual(
        expect.objectContaining({
          message: 'Server error',
          status: 500,
        })
      )

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('response parsing', () => {
    it('should handle responses with data property', async () => {
      const mockResponse = { success: true, data: { test: 'value' } }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      const result = await client.get('/test')

      expect(result.data).toEqual({ test: 'value' })
    })

    it('should handle responses without data property', async () => {
      const mockResponse = { test: 'value' }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      const result = await client.get('/test')

      expect(result.data).toEqual({ test: 'value' })
    })

    it('should handle text responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('plain text response'),
        headers: new Headers({ 'content-type': 'text/plain' }),
      } as Response)

      const result = await client.get('/test')

      expect(result.data).toBe('plain text response')
    })
  })

  describe('default instance', () => {
    it('should export a default instance', () => {
      expect(apiClient).toBeInstanceOf(ApiClient)
    })

    it('should export convenience methods', () => {
      expect(typeof apiClient.get).toBe('function')
      expect(typeof apiClient.post).toBe('function')
      expect(typeof apiClient.put).toBe('function')
      expect(typeof apiClient.patch).toBe('function')
      expect(typeof apiClient.delete).toBe('function')
      expect(typeof apiClient.upload).toBe('function')
    })
  })
})