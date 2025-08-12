import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: process.env.CLOUDINARY_SECURE === 'true',
});

// Types for upload options and responses
export interface CloudinaryUploadOptions extends Partial<UploadApiOptions> {
  folder?: string;
  transformation?: Array<{
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  }>;
  tags?: string[];
  context?: Record<string, any>;
}

export interface CloudinaryDeleteOptions {
  invalidate?: boolean;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
}

// Maximum file size (default: 10MB)
const MAX_FILE_SIZE = parseInt(process.env.CLOUDINARY_MAX_FILE_SIZE || '10485760', 10);

// Allowed file formats
const ALLOWED_FORMATS = (process.env.CLOUDINARY_ALLOWED_FORMATS || 'jpg,jpeg,png,gif,webp').split(',');

/**
 * Upload an image to Cloudinary
 */
export async function uploadImage(
  file: string | Buffer,
  options: CloudinaryUploadOptions = {}
): Promise<UploadApiResponse> {
  try {
    const defaultTransformation = [
      {
        quality: 'auto:good',
        fetch_format: 'auto',
      },
    ];

    const defaultOptions: UploadApiOptions = {
      folder: 'osassy-kitchen',
      resource_type: 'auto',
      allowed_formats: ALLOWED_FORMATS,
      ...options,
    };

    // Set up transformations - merge default with custom if provided
    if (options.transformation && options.transformation.length > 0) {
      defaultOptions.transformation = [
        ...defaultTransformation,
        ...options.transformation,
      ];
    } else {
      defaultOptions.transformation = defaultTransformation;
    }

    const result = await cloudinary.uploader.upload(
      typeof file === 'string' ? file : `data:image/jpeg;base64,${file.toString('base64')}`,
      defaultOptions
    );

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Upload multiple images to Cloudinary
 */
export async function uploadMultipleImages(
  files: (string | Buffer)[],
  options: CloudinaryUploadOptions = {}
): Promise<UploadApiResponse[]> {
  try {
    const uploadPromises = files.map(file => uploadImage(file, options));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Cloudinary multiple upload error:', error);
    throw new Error('Failed to upload multiple images to Cloudinary');
  }
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(
  publicId: string,
  options: CloudinaryDeleteOptions = {}
): Promise<{ result: string }> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      ...options,
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}

/**
 * Delete multiple images from Cloudinary
 */
export async function deleteMultipleImages(
  publicIds: string[],
  options: CloudinaryDeleteOptions = {}
): Promise<{ deleted: Record<string, string> }> {
  try {
    const result = await cloudinary.api.delete_resources(publicIds, {
      invalidate: true,
      ...options,
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete multiple error:', error);
    throw new Error('Failed to delete multiple images from Cloudinary');
  }
}

/**
 * Generate optimized image URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  } = {}
): string {
  const defaultOptions = {
    quality: 'auto:good',
    fetch_format: 'auto',
    ...options,
  };

  return cloudinary.url(publicId, {
    transformation: [defaultOptions],
    secure: true,
  });
}

/**
 * Generate responsive image URLs for different screen sizes
 */
export function getResponsiveImageUrls(
  publicId: string,
  breakpoints: number[] = [320, 640, 768, 1024, 1280, 1920]
): Record<number, string> {
  const urls: Record<number, string> = {};
  
  breakpoints.forEach(width => {
    urls[width] = getOptimizedImageUrl(publicId, {
      width,
      crop: 'fill',
      quality: 'auto:good',
    });
  });

  return urls;
}

/**
 * Validate file before upload
 */
export function validateFile(file: {
  size: number;
  mimetype: string;
}): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check file format
  const fileExtension = file.mimetype.split('/')[1]?.toLowerCase();
  if (!fileExtension || !ALLOWED_FORMATS.includes(fileExtension)) {
    return {
      valid: false,
      error: `Invalid file format. Allowed formats: ${ALLOWED_FORMATS.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Generate upload signature for client-side uploads
 */
export function generateUploadSignature(
  timestamp: number,
  params: Record<string, any> = {}
): string {
  const crypto = require('crypto');
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  if (!apiSecret) {
    throw new Error('Cloudinary API secret not configured');
  }

  const paramsString = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const signatureString = `${paramsString}&timestamp=${timestamp}${apiSecret}`;
  return crypto.createHash('sha256').update(signatureString).digest('hex');
}

export default cloudinary;