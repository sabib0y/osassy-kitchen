import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useImageUpload, UseImageUploadOptions } from '@/hooks/useImageUpload';
import React from 'react';

// Mock XMLHttpRequest
const mockXHR = {
  open: jest.fn(),
  send: jest.fn(),
  abort: jest.fn(),
  setRequestHeader: jest.fn(),
  upload: {
    addEventListener: jest.fn(),
  },
  addEventListener: jest.fn(),
  status: 200,
  responseText: '',
};

(global as any).XMLHttpRequest = jest.fn(() => mockXHR) as any;

// Mock fetch for delete operations
global.fetch = jest.fn();

describe('useImageUpload', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset all mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockXHR.open.mockClear();
    mockXHR.send.mockClear();
    mockXHR.abort.mockClear();
    mockXHR.upload.addEventListener.mockClear();
    mockXHR.addEventListener.mockClear();
    mockXHR.status = 200;
    mockXHR.responseText = '';
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('File Validation', () => {
    it('should validate file size', () => {
      const { result } = renderHook(
        () => useImageUpload({ maxSize: 1024 * 1024 }), // 1MB
        { wrapper }
      );

      const validation = result.current.validateFiles([
        new File(['x'.repeat(2 * 1024 * 1024)], 'large.png', { type: 'image/png' }),
      ]);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('File 1: Size exceeds 1MB limit');
    });

    it('should validate file format', () => {
      const { result } = renderHook(
        () => useImageUpload({ acceptedFormats: ['image/png'] }),
        { wrapper }
      );

      const validation = result.current.validateFiles([
        new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
      ]);

      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('Invalid format');
    });

    it('should validate number of files', () => {
      const { result } = renderHook(
        () => useImageUpload({ maxFiles: 2 }),
        { wrapper }
      );

      const validation = result.current.validateFiles([
        new File(['test1'], 'test1.png', { type: 'image/png' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
        new File(['test3'], 'test3.png', { type: 'image/png' }),
      ]);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Maximum 2 files allowed');
    });

    it('should pass validation for valid files', () => {
      const { result } = renderHook(
        () => useImageUpload(),
        { wrapper }
      );

      const validation = result.current.validateFiles([
        new File(['test'], 'test.png', { type: 'image/png' }),
      ]);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Upload Functionality', () => {
    it('should upload a single file', async () => {
      const onSuccess = jest.fn();
      const { result } = renderHook(
        () => useImageUpload({ onSuccess }),
        { wrapper }
      );

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      
      // Setup mock response
      const mockResponse = {
        success: true,
        data: {
          url: 'https://example.com/image.jpg',
          publicId: 'test/image',
          width: 800,
          height: 600,
          format: 'jpg',
          size: 1024000,
        },
      };

      // Simulate successful upload
      mockXHR.addEventListener.mockImplementation((event, handler) => {
        if (event === 'load') {
          mockXHR.responseText = JSON.stringify(mockResponse);
          setTimeout(() => handler(), 0);
        }
      });

      await act(async () => {
        result.current.uploadWithProgress(file);
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockResponse.data);
      });

      expect(result.current.uploadedImages).toContainEqual(mockResponse.data);
    });

    it('should upload multiple files', async () => {
      const onSuccess = jest.fn();
      const { result } = renderHook(
        () => useImageUpload({ onSuccess }),
        { wrapper }
      );

      const files = [
        new File(['test1'], 'test1.png', { type: 'image/png' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
      ];
      
      // Setup mock response
      const mockResponse = {
        success: true,
        data: [
          {
            url: 'https://example.com/image1.jpg',
            publicId: 'test/image1',
            width: 800,
            height: 600,
            format: 'jpg',
            size: 1024000,
          },
          {
            url: 'https://example.com/image2.jpg',
            publicId: 'test/image2',
            width: 800,
            height: 600,
            format: 'jpg',
            size: 1024000,
          },
        ],
      };

      // Simulate successful upload
      mockXHR.addEventListener.mockImplementation((event, handler) => {
        if (event === 'load') {
          mockXHR.responseText = JSON.stringify(mockResponse);
          setTimeout(() => handler(), 0);
        }
      });

      await act(async () => {
        result.current.uploadWithProgress(files);
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockResponse.data);
      });

      expect(result.current.uploadedImages).toHaveLength(2);
    });

    it('should track upload progress', async () => {
      const onProgress = jest.fn();
      const { result } = renderHook(
        () => useImageUpload({ onProgress }),
        { wrapper }
      );

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      
      // Simulate progress event
      mockXHR.upload.addEventListener.mockImplementation((event, handler) => {
        if (event === 'progress') {
          setTimeout(() => {
            handler({
              lengthComputable: true,
              loaded: 5242880,
              total: 10485760,
            });
          }, 0);
        }
      });

      // Setup successful response
      mockXHR.addEventListener.mockImplementation((event, handler) => {
        if (event === 'load') {
          mockXHR.responseText = JSON.stringify({
            success: true,
            data: {
              url: 'https://example.com/image.jpg',
              publicId: 'test/image',
              width: 800,
              height: 600,
              format: 'jpg',
              size: 10485760,
            },
          });
          setTimeout(() => handler(), 100);
        }
      });

      await act(async () => {
        result.current.uploadWithProgress(file);
      });

      await waitFor(() => {
        expect(onProgress).toHaveBeenCalledWith({
          loaded: 5242880,
          total: 10485760,
          percentage: 50,
        });
      });

      expect(result.current.uploadProgress).toEqual({
        loaded: 5242880,
        total: 10485760,
        percentage: 50,
      });
    });

    it('should handle upload errors', async () => {
      const onError = jest.fn();
      const { result } = renderHook(
        () => useImageUpload({ onError }),
        { wrapper }
      );

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      
      // Simulate error response
      mockXHR.addEventListener.mockImplementation((event, handler) => {
        if (event === 'load') {
          mockXHR.responseText = JSON.stringify({
            success: false,
            error: 'Upload failed',
          });
          setTimeout(() => handler(), 0);
        }
      });

      await act(async () => {
        result.current.uploadWithProgress(file);
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });

      expect(result.current.error?.message).toBe('Upload failed');
    });

    it('should handle network errors', async () => {
      const onError = jest.fn();
      const { result } = renderHook(
        () => useImageUpload({ onError }),
        { wrapper }
      );

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      
      // Simulate network error
      mockXHR.addEventListener.mockImplementation((event, handler) => {
        if (event === 'error') {
          setTimeout(() => handler(), 0);
        }
      });

      await act(async () => {
        result.current.uploadWithProgress(file);
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });

      expect(result.current.error?.message).toBe('Network error during upload');
    });
  });

  describe('Delete Functionality', () => {
    it('should delete an image', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(
        () => useImageUpload(),
        { wrapper }
      );

      // First, add an image to the state
      act(() => {
        result.current.uploadedImages.push({
          url: 'https://example.com/image.jpg',
          publicId: 'test/image',
          width: 800,
          height: 600,
          format: 'jpg',
          size: 1024000,
        });
      });

      await act(async () => {
        await result.current.deleteImage('test/image');
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/upload?publicId=test%2Fimage',
        { method: 'DELETE' }
      );
    });

    it('should handle delete errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Delete failed' }),
      });

      const { result } = renderHook(
        () => useImageUpload(),
        { wrapper }
      );

      await expect(
        act(async () => {
          await result.current.deleteImage('test/image');
        })
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('State Management', () => {
    it('should reset state', () => {
      const { result } = renderHook(
        () => useImageUpload(),
        { wrapper }
      );

      // Set some state
      act(() => {
        result.current.uploadedImages.push({
          url: 'https://example.com/image.jpg',
          publicId: 'test/image',
          width: 800,
          height: 600,
          format: 'jpg',
          size: 1024000,
        });
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.uploadedImages).toHaveLength(0);
      expect(result.current.uploadProgress).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should return upload promise with upload method', async () => {
      const { result } = renderHook(
        () => useImageUpload(),
        { wrapper }
      );

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      
      // Setup mock response
      const mockResponse = {
        success: true,
        data: {
          url: 'https://example.com/image.jpg',
          publicId: 'test/image',
          width: 800,
          height: 600,
          format: 'jpg',
          size: 1024000,
        },
      };

      // Simulate successful upload
      mockXHR.addEventListener.mockImplementation((event, handler) => {
        if (event === 'load') {
          mockXHR.responseText = JSON.stringify(mockResponse);
          setTimeout(() => handler(), 0);
        }
      });

      const uploadPromise = result.current.upload(file);
      expect(uploadPromise).toBeInstanceOf(Promise);

      const uploadedData = await uploadPromise;
      expect(uploadedData).toEqual(mockResponse.data);
    });
  });
});