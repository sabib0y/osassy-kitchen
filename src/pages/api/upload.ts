import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import formidable, { Fields, Files, File } from 'formidable';
import { authOptions } from './auth/[...nextauth]';
import {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  validateFile,
  CloudinaryUploadOptions,
} from '@/lib/cloudinary';
import fs from 'fs';
import path from 'path';

// Disable Next.js body parser for formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

// Response types
interface UploadSuccessResponse {
  success: true;
  data: {
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    size: number;
    thumbnailUrl?: string;
  } | Array<{
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    size: number;
    thumbnailUrl?: string;
  }>;
}

interface UploadErrorResponse {
  success: false;
  error: string;
}

type UploadResponse = UploadSuccessResponse | UploadErrorResponse;

/**
 * Parse form data using formidable
 */
const parseForm = async (
  req: NextApiRequest
): Promise<{ fields: Fields; files: Files }> => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: parseInt(process.env.CLOUDINARY_MAX_FILE_SIZE || '10485760', 10),
      allowEmptyFiles: false,
      multiples: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
};

/**
 * Read file as buffer
 */
const readFileAsBuffer = async (filePath: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * Process single file upload
 */
const processSingleFile = async (
  file: File,
  options: CloudinaryUploadOptions
): Promise<UploadSuccessResponse['data']> => {
  // Validate file
  const validation = validateFile({
    size: file.size,
    mimetype: file.mimetype || '',
  });

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Read file buffer
  const buffer = await readFileAsBuffer(file.filepath);

  // Upload to Cloudinary
  const result = await uploadImage(buffer, options);

  // Generate thumbnail URL
  const thumbnailUrl = result.secure_url.replace(
    '/upload/',
    '/upload/c_fill,h_200,w_200/'
  );

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    size: result.bytes,
    thumbnailUrl,
  };
};

/**
 * Main upload handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Please login to upload images',
      });
    }

    // Handle different HTTP methods
    if (req.method === 'POST') {
      // Parse form data
      const { fields, files } = await parseForm(req);

      // Extract upload options from fields
      const rawFolder = Array.isArray(fields.folder) ? fields.folder[0] : fields.folder;
      const folder = rawFolder || 'osassy-kitchen/user-uploads';
      const rawTags = fields.tags;
      const tags = rawTags
        ? (Array.isArray(rawTags) ? rawTags : [rawTags]) as string[]
        : [`user-${session.user.id}`];

      const uploadOptions: CloudinaryUploadOptions = {
        folder,
        tags,
        context: {
          userId: session.user.id,
          uploadedAt: new Date().toISOString(),
        },
      };

      // Handle file upload
      if (files.file) {
        const fileArray = Array.isArray(files.file) ? files.file : [files.file];
        
        if (fileArray.length === 1) {
          // Single file upload
          const data = await processSingleFile(fileArray[0], uploadOptions);
          
          return res.status(200).json({
            success: true,
            data,
          });
        } else {
          // Multiple files upload
          const uploadPromises = fileArray.map(file => 
            processSingleFile(file, uploadOptions)
          );
          
          const results = await Promise.all(uploadPromises) as Array<{
            url: string; publicId: string; width: number; height: number;
            format: string; size: number; thumbnailUrl?: string;
          }>;
          
          return res.status(200).json({
            success: true,
            data: results,
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: 'No file provided',
        });
      }
    } else if (req.method === 'DELETE') {
      // Handle image deletion
      const { publicId } = req.query;
      
      if (!publicId || typeof publicId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Public ID is required for deletion',
        });
      }

      await deleteImage(publicId);
      
      return res.status(200).json({
        success: true,
        data: {
          url: '',
          publicId,
          width: 0,
          height: 0,
          format: '',
          size: 0,
        },
      });
    } else {
      res.setHeader('Allow', ['POST', 'DELETE']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`,
      });
    }
  } catch (error) {
    console.error('Upload API error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred during upload';
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}