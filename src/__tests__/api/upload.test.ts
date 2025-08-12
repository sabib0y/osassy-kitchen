import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import handler from '@/pages/api/upload';
import * as cloudinary from '@/lib/cloudinary';
import formidable from 'formidable';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/cloudinary');
jest.mock('formidable', () => {
  const mockFormidable = jest.fn();
  return {
    __esModule: true,
    default: mockFormidable,
  };
});
jest.mock('fs');

// Mock PrismaClient to avoid initialization errors
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    }))
  };
});

// Mock bcrypt to avoid bcrypt-related issues in auth options
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockCloudinary = cloudinary as jest.Mocked<typeof cloudinary>;
const mockFormidable = formidable as jest.MockedFunction<typeof formidable>;

describe('/api/upload', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;

  beforeEach(() => {
    req = {
      method: 'POST',
      body: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    } as any;

    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValueOnce(null);

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized - Please login to upload images',
      });
    });
  });

  describe('POST - Upload Images', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: 'user123', email: 'test@example.com' },
      } as any);
    });

    it('should upload a single file successfully', async () => {
      const mockFile = {
        filepath: '/tmp/test.png',
        mimetype: 'image/png',
        size: 1024000,
      };

      const mockParsedForm = {
        fields: { folder: 'test-folder' },
        files: { file: mockFile },
      };

      // Mock formidable constructor
      mockFormidable.mockImplementation(() => ({
        parse: jest.fn((req, callback) => {
          callback(null, mockParsedForm.fields, mockParsedForm.files);
        }),
      }) as any);

      // Mock file validation
      mockCloudinary.validateFile.mockReturnValue({ valid: true });

      // Mock upload
      mockCloudinary.uploadImage.mockResolvedValueOnce({
        secure_url: 'https://example.com/image.jpg',
        public_id: 'test/image',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 1024000,
      } as any);

      // Mock fs.readFile
      const fs = require('fs');
      fs.readFile = jest.fn((path, callback) => {
        callback(null, Buffer.from('test-image-data'));
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(mockCloudinary.uploadImage).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          url: 'https://example.com/image.jpg',
          publicId: 'test/image',
          width: 800,
          height: 600,
          format: 'jpg',
          size: 1024000,
        }),
      });
    });

    it('should upload multiple files successfully', async () => {
      const mockFiles = [
        {
          filepath: '/tmp/test1.png',
          mimetype: 'image/png',
          size: 1024000,
        },
        {
          filepath: '/tmp/test2.png',
          mimetype: 'image/png',
          size: 2048000,
        },
      ];

      const mockParsedForm = {
        fields: { folder: 'test-folder' },
        files: { file: mockFiles },
      };

      // Mock formidable constructor
      mockFormidable.mockImplementation(() => ({
        parse: jest.fn((req, callback) => {
          callback(null, mockParsedForm.fields, mockParsedForm.files);
        }),
      }) as any);

      // Mock file validation
      mockCloudinary.validateFile.mockReturnValue({ valid: true });

      // Mock uploads
      mockCloudinary.uploadImage
        .mockResolvedValueOnce({
          secure_url: 'https://example.com/image1.jpg',
          public_id: 'test/image1',
          width: 800,
          height: 600,
          format: 'jpg',
          bytes: 1024000,
        } as any)
        .mockResolvedValueOnce({
          secure_url: 'https://example.com/image2.jpg',
          public_id: 'test/image2',
          width: 1024,
          height: 768,
          format: 'jpg',
          bytes: 2048000,
        } as any);

      // Mock fs.readFile
      const fs = require('fs');
      fs.readFile = jest.fn((path, callback) => {
        callback(null, Buffer.from('test-image-data'));
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(mockCloudinary.uploadImage).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            url: 'https://example.com/image1.jpg',
            publicId: 'test/image1',
          }),
          expect.objectContaining({
            url: 'https://example.com/image2.jpg',
            publicId: 'test/image2',
          }),
        ]),
      });
    });

    it('should return 400 if no file is provided', async () => {
      const mockParsedForm = {
        fields: {},
        files: {},
      };

      // Mock formidable constructor
      mockFormidable.mockImplementation(() => ({
        parse: jest.fn((req, callback) => {
          callback(null, mockParsedForm.fields, mockParsedForm.files);
        }),
      }) as any);

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No file provided',
      });
    });

    it('should handle validation errors', async () => {
      const mockFile = {
        filepath: '/tmp/test.png',
        mimetype: 'image/png',
        size: 20 * 1024 * 1024, // 20MB
      };

      const mockParsedForm = {
        fields: {},
        files: { file: mockFile },
      };

      // Mock formidable constructor
      mockFormidable.mockImplementation(() => ({
        parse: jest.fn((req, callback) => {
          callback(null, mockParsedForm.fields, mockParsedForm.files);
        }),
      }) as any);

      // Mock file validation failure
      mockCloudinary.validateFile.mockReturnValue({
        valid: false,
        error: 'File size exceeds maximum allowed size of 10MB',
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'File size exceeds maximum allowed size of 10MB',
      });
    });

    it('should handle upload errors', async () => {
      const mockFile = {
        filepath: '/tmp/test.png',
        mimetype: 'image/png',
        size: 1024000,
      };

      const mockParsedForm = {
        fields: {},
        files: { file: mockFile },
      };

      // Mock formidable constructor
      mockFormidable.mockImplementation(() => ({
        parse: jest.fn((req, callback) => {
          callback(null, mockParsedForm.fields, mockParsedForm.files);
        }),
      }) as any);

      // Mock file validation
      mockCloudinary.validateFile.mockReturnValue({ valid: true });

      // Mock upload failure
      mockCloudinary.uploadImage.mockRejectedValueOnce(
        new Error('Failed to upload image to Cloudinary')
      );

      // Mock fs.readFile
      const fs = require('fs');
      fs.readFile = jest.fn((path, callback) => {
        callback(null, Buffer.from('test-image-data'));
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to upload image to Cloudinary',
      });
    });
  });

  describe('DELETE - Delete Image', () => {
    beforeEach(() => {
      req.method = 'DELETE';
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: 'user123', email: 'test@example.com' },
      } as any);
    });

    it('should delete an image successfully', async () => {
      req.query = { publicId: 'test/image' };

      mockCloudinary.deleteImage.mockResolvedValueOnce({ result: 'ok' });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(mockCloudinary.deleteImage).toHaveBeenCalledWith('test/image');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          publicId: 'test/image',
        }),
      });
    });

    it('should return 400 if publicId is missing', async () => {
      req.query = {};

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Public ID is required for deletion',
      });
    });

    it('should handle delete errors', async () => {
      req.query = { publicId: 'test/image' };

      mockCloudinary.deleteImage.mockRejectedValueOnce(
        new Error('Failed to delete image from Cloudinary')
      );

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to delete image from Cloudinary',
      });
    });
  });

  describe('Method Validation', () => {
    it('should return 405 for unsupported methods', async () => {
      req.method = 'GET';
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: 'user123', email: 'test@example.com' },
      } as any);

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.setHeader).toHaveBeenCalledWith('Allow', ['POST', 'DELETE']);
      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Method GET not allowed',
      });
    });
  });
});