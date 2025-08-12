import { v2 as cloudinary } from 'cloudinary';
import {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  getOptimizedImageUrl,
  getResponsiveImageUrls,
  validateFile,
  generateUploadSignature,
} from '@/lib/cloudinary';

// Mock cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
    api: {
      delete_resources: jest.fn(),
    },
    url: jest.fn(),
  },
}));

// Mock crypto for signature generation
jest.mock('crypto', () => ({
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue({
      digest: jest.fn().mockReturnValue('mock-signature'),
    }),
  }),
}));

describe('Cloudinary Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-api-key';
    process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
    process.env.CLOUDINARY_SECURE = 'true';
    process.env.CLOUDINARY_MAX_FILE_SIZE = '10485760';
    process.env.CLOUDINARY_ALLOWED_FORMATS = 'jpg,jpeg,png,gif,webp';
  });

  describe('uploadImage', () => {
    it('should upload an image from string path', async () => {
      const mockResponse = {
        secure_url: 'https://example.com/image.jpg',
        public_id: 'test/image',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 1024000,
      };

      (cloudinary.uploader.upload as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await uploadImage('/path/to/image.jpg', {
        folder: 'custom-folder',
      });

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        '/path/to/image.jpg',
        expect.objectContaining({
          folder: 'custom-folder',
          resource_type: 'auto',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should upload an image from buffer', async () => {
      const mockResponse = {
        secure_url: 'https://example.com/image.jpg',
        public_id: 'test/image',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 1024000,
      };

      (cloudinary.uploader.upload as jest.Mock).mockResolvedValueOnce(mockResponse);

      const buffer = Buffer.from('test-image-data');
      const result = await uploadImage(buffer);

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        expect.stringContaining('data:image/jpeg;base64,'),
        expect.objectContaining({
          folder: 'osassy-kitchen',
          resource_type: 'auto',
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should apply custom transformations', async () => {
      const mockResponse = {
        secure_url: 'https://example.com/image.jpg',
        public_id: 'test/image',
        width: 400,
        height: 300,
        format: 'jpg',
        bytes: 512000,
      };

      (cloudinary.uploader.upload as jest.Mock).mockResolvedValueOnce(mockResponse);

      await uploadImage('/path/to/image.jpg', {
        transformation: [
          { width: 400, height: 300, crop: 'fill' },
        ],
      });

      const callArgs = (cloudinary.uploader.upload as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toBe('/path/to/image.jpg');
      expect(callArgs[1].transformation).toEqual([
        { quality: 'auto:good', fetch_format: 'auto' },
        { width: 400, height: 300, crop: 'fill' },
      ]);
    });

    it('should handle upload errors', async () => {
      (cloudinary.uploader.upload as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(uploadImage('/path/to/image.jpg')).rejects.toThrow(
        'Failed to upload image to Cloudinary'
      );
    });
  });

  describe('uploadMultipleImages', () => {
    it('should upload multiple images', async () => {
      const mockResponses = [
        {
          secure_url: 'https://example.com/image1.jpg',
          public_id: 'test/image1',
          width: 800,
          height: 600,
          format: 'jpg',
          bytes: 1024000,
        },
        {
          secure_url: 'https://example.com/image2.jpg',
          public_id: 'test/image2',
          width: 1024,
          height: 768,
          format: 'jpg',
          bytes: 2048000,
        },
      ];

      (cloudinary.uploader.upload as jest.Mock)
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1]);

      const result = await uploadMultipleImages([
        '/path/to/image1.jpg',
        '/path/to/image2.jpg',
      ]);

      expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResponses);
    });

    it('should handle partial failures', async () => {
      (cloudinary.uploader.upload as jest.Mock)
        .mockResolvedValueOnce({
          secure_url: 'https://example.com/image1.jpg',
          public_id: 'test/image1',
        })
        .mockRejectedValueOnce(new Error('Upload failed'));

      await expect(
        uploadMultipleImages(['/path/to/image1.jpg', '/path/to/image2.jpg'])
      ).rejects.toThrow('Failed to upload multiple images to Cloudinary');
    });
  });

  describe('deleteImage', () => {
    it('should delete an image', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValueOnce({
        result: 'ok',
      });

      const result = await deleteImage('test/image');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test/image', {
        invalidate: true,
      });

      expect(result).toEqual({ result: 'ok' });
    });

    it('should pass delete options', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValueOnce({
        result: 'ok',
      });

      await deleteImage('test/image', {
        invalidate: false,
        resource_type: 'video',
      });

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test/image', {
        invalidate: false,
        resource_type: 'video',
      });
    });

    it('should handle delete errors', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValueOnce(
        new Error('Not found')
      );

      await expect(deleteImage('test/image')).rejects.toThrow(
        'Failed to delete image from Cloudinary'
      );
    });
  });

  describe('deleteMultipleImages', () => {
    it('should delete multiple images', async () => {
      (cloudinary.api.delete_resources as jest.Mock).mockResolvedValueOnce({
        deleted: {
          'test/image1': 'deleted',
          'test/image2': 'deleted',
        },
      });

      const result = await deleteMultipleImages(['test/image1', 'test/image2']);

      expect(cloudinary.api.delete_resources).toHaveBeenCalledWith(
        ['test/image1', 'test/image2'],
        { invalidate: true }
      );

      expect(result).toEqual({
        deleted: {
          'test/image1': 'deleted',
          'test/image2': 'deleted',
        },
      });
    });

    it('should handle delete errors', async () => {
      (cloudinary.api.delete_resources as jest.Mock).mockRejectedValueOnce(
        new Error('API error')
      );

      await expect(
        deleteMultipleImages(['test/image1', 'test/image2'])
      ).rejects.toThrow('Failed to delete multiple images from Cloudinary');
    });
  });

  describe('getOptimizedImageUrl', () => {
    it('should generate optimized image URL', () => {
      (cloudinary.url as jest.Mock).mockReturnValue(
        'https://res.cloudinary.com/test/image/upload/q_auto:good,f_auto/test/image.jpg'
      );

      const url = getOptimizedImageUrl('test/image');

      expect(cloudinary.url).toHaveBeenCalledWith('test/image', {
        transformation: [
          {
            quality: 'auto:good',
            fetch_format: 'auto',
          },
        ],
        secure: true,
      });

      expect(url).toBe(
        'https://res.cloudinary.com/test/image/upload/q_auto:good,f_auto/test/image.jpg'
      );
    });

    it('should apply custom transformations', () => {
      (cloudinary.url as jest.Mock).mockReturnValue(
        'https://res.cloudinary.com/test/image/upload/w_400,h_300,c_fill/test/image.jpg'
      );

      getOptimizedImageUrl('test/image', {
        width: 400,
        height: 300,
        crop: 'fill',
      });

      expect(cloudinary.url).toHaveBeenCalledWith('test/image', {
        transformation: [
          {
            quality: 'auto:good',
            fetch_format: 'auto',
            width: 400,
            height: 300,
            crop: 'fill',
          },
        ],
        secure: true,
      });
    });
  });

  describe('getResponsiveImageUrls', () => {
    it('should generate URLs for default breakpoints', () => {
      (cloudinary.url as jest.Mock).mockImplementation((publicId, options) => {
        const width = options.transformation[0].width;
        return `https://res.cloudinary.com/test/image/upload/w_${width}/test/image.jpg`;
      });

      const urls = getResponsiveImageUrls('test/image');

      expect(urls).toEqual({
        320: expect.stringContaining('w_320'),
        640: expect.stringContaining('w_640'),
        768: expect.stringContaining('w_768'),
        1024: expect.stringContaining('w_1024'),
        1280: expect.stringContaining('w_1280'),
        1920: expect.stringContaining('w_1920'),
      });
    });

    it('should generate URLs for custom breakpoints', () => {
      (cloudinary.url as jest.Mock).mockImplementation((publicId, options) => {
        const width = options.transformation[0].width;
        return `https://res.cloudinary.com/test/image/upload/w_${width}/test/image.jpg`;
      });

      const urls = getResponsiveImageUrls('test/image', [400, 800, 1200]);

      expect(urls).toEqual({
        400: expect.stringContaining('w_400'),
        800: expect.stringContaining('w_800'),
        1200: expect.stringContaining('w_1200'),
      });
    });
  });

  describe('validateFile', () => {
    it('should validate file size', () => {
      const result = validateFile({
        size: 20 * 1024 * 1024, // 20MB
        mimetype: 'image/jpeg',
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size exceeds maximum allowed size');
    });

    it('should validate file format', () => {
      const result = validateFile({
        size: 1024000,
        mimetype: 'image/bmp',
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file format');
    });

    it('should pass valid files', () => {
      const result = validateFile({
        size: 1024000,
        mimetype: 'image/jpeg',
      });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle missing mimetype', () => {
      const result = validateFile({
        size: 1024000,
        mimetype: '',
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file format');
    });
  });

  describe('generateUploadSignature', () => {
    it('should generate upload signature', () => {
      const timestamp = 1609459200;
      const params = {
        public_id: 'test/image',
        folder: 'test-folder',
      };

      const signature = generateUploadSignature(timestamp, params);

      expect(signature).toBe('mock-signature');
    });

    it('should throw error if API secret is not configured', () => {
      delete process.env.CLOUDINARY_API_SECRET;

      expect(() => generateUploadSignature(1609459200)).toThrow(
        'Cloudinary API secret not configured'
      );
    });
  });
});