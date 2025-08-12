import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  size: number;
  thumbnailUrl?: string;
}

export interface UseImageUploadOptions {
  folder?: string;
  tags?: string[];
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFormats?: string[];
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (data: UploadedImage | UploadedImage[]) => void;
  onError?: (error: Error) => void;
}

export interface UseImageUploadReturn {
  upload: (files: File | File[]) => Promise<UploadedImage | UploadedImage[]>;
  uploadWithProgress: (files: File | File[]) => void;
  deleteImage: (publicId: string) => Promise<void>;
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
  uploadedImages: UploadedImage[];
  error: Error | null;
  reset: () => void;
  validateFiles: (files: File[]) => { valid: boolean; errors: string[] };
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ACCEPTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const {
    folder = 'osassy-kitchen/user-uploads',
    tags = [],
    maxFiles = 10,
    maxSize = DEFAULT_MAX_SIZE,
    acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
    onProgress,
    onSuccess,
    onError,
  } = options;

  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File | File[]) => {
      const formData = new FormData();
      const fileArray = Array.isArray(files) ? files : [files];

      // Validate files
      const validation = validateFiles(fileArray);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Append files to form data
      fileArray.forEach(file => {
        formData.append('file', file);
      });

      // Append additional options
      formData.append('folder', folder);
      tags.forEach(tag => formData.append('tags', tag));

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Make the upload request with progress tracking
      return new Promise<UploadedImage | UploadedImage[]>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            };
            setUploadProgress(progress);
            onProgress?.(progress);
          }
        });

        // Handle successful upload
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                resolve(response.data);
              } else {
                reject(new Error(response.error || 'Upload failed'));
              }
            } catch (err) {
              reject(new Error('Invalid server response'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        // Handle abort
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        // Set up the request
        xhr.open('POST', '/api/upload');
        
        // Send the request
        xhr.send(formData);

        // Handle abort controller
        if (abortControllerRef.current) {
          abortControllerRef.current.signal.addEventListener('abort', () => {
            xhr.abort();
          });
        }
      });
    },
    onSuccess: (data) => {
      const images = Array.isArray(data) ? data : [data];
      setUploadedImages(prev => [...prev, ...images]);
      setUploadProgress(null);
      setError(null);
      onSuccess?.(data);
    },
    onError: (err) => {
      const error = err instanceof Error ? err : new Error('Upload failed');
      setError(error);
      setUploadProgress(null);
      onError?.(error);
    },
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (publicId: string) => {
      const response = await fetch(`/api/upload?publicId=${encodeURIComponent(publicId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete image');
      }

      return publicId;
    },
    onSuccess: (publicId) => {
      setUploadedImages(prev => prev.filter(img => img.publicId !== publicId));
    },
  });

  // Validate files before upload
  const validateFiles = useCallback((files: File[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check number of files
    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
    }

    // Validate each file
    files.forEach((file, index) => {
      // Check file size
      if (file.size > maxSize) {
        errors.push(`File ${index + 1}: Size exceeds ${maxSize / 1024 / 1024}MB limit`);
      }

      // Check file format
      if (!acceptedFormats.includes(file.type)) {
        errors.push(`File ${index + 1}: Invalid format. Accepted: ${acceptedFormats.join(', ')}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [maxFiles, maxSize, acceptedFormats]);

  // Upload with automatic progress tracking
  const uploadWithProgress = useCallback((files: File | File[]) => {
    uploadMutation.mutate(files);
  }, [uploadMutation]);

  // Direct upload (returns promise)
  const upload = useCallback(async (files: File | File[]) => {
    return uploadMutation.mutateAsync(files);
  }, [uploadMutation]);

  // Delete image
  const deleteImage = useCallback(async (publicId: string) => {
    await deleteMutation.mutateAsync(publicId);
  }, [deleteMutation]);

  // Reset state
  const reset = useCallback(() => {
    setUploadProgress(null);
    setUploadedImages([]);
    setError(null);
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  // Cancel ongoing upload
  const cancelUpload = useCallback(() => {
    abortControllerRef.current?.abort();
    setUploadProgress(null);
  }, []);

  return {
    upload,
    uploadWithProgress,
    deleteImage,
    isUploading: uploadMutation.isPending || deleteMutation.isPending,
    uploadProgress,
    uploadedImages,
    error,
    reset,
    validateFiles,
  };
}