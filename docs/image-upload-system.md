# Image Upload System Documentation

## Overview

The Image Upload System provides a complete solution for handling image uploads in the Osassy's Kitchen application. It integrates with Cloudinary for cloud storage and includes features like drag-and-drop uploads, progress tracking, image optimization, and responsive image generation.

## Features

- **Drag-and-drop upload interface**
- **File validation** (size, format, number of files)
- **Upload progress tracking**
- **Image optimization** (automatic quality and format optimization)
- **Responsive image URLs** generation
- **Secure uploads** with authentication
- **Error handling and retry logic**
- **Image deletion** capability
- **Thumbnail generation**

## Setup and Configuration

### 1. Cloudinary Account Setup

1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Navigate to your Dashboard to find your credentials
3. Create an upload preset (optional) for unsigned uploads

### 2. Environment Variables

Add the following variables to your `.env.local` file:

```env
# Required Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=osassy_kitchen_preset  # Optional

# Optional Configuration
CLOUDINARY_SECURE=true
CLOUDINARY_MAX_FILE_SIZE=10485760  # 10MB in bytes
CLOUDINARY_ALLOWED_FORMATS=jpg,jpeg,png,gif,webp
```

### 3. Installation

The required dependencies are already installed:
- `cloudinary`: Server-side Cloudinary SDK
- `next-cloudinary`: Next.js Cloudinary integration
- `formidable`: Form parsing for file uploads

## Usage Examples

### Basic Image Upload Component

```tsx
import { ImageUploader } from '@/components/ImageUploader';

function MenuImageUpload() {
  const handleUploadComplete = (images) => {
    console.log('Uploaded images:', images);
    // Save image URLs to your database
  };

  return (
    <ImageUploader
      onUploadComplete={handleUploadComplete}
      maxFiles={5}
      maxSize={5 * 1024 * 1024} // 5MB
      folder="menu-items"
      tags={['menu', 'food']}
      showPreview={true}
    />
  );
}
```

### Using the Upload Hook Directly

```tsx
import { useImageUpload } from '@/hooks/useImageUpload';

function CustomUploader() {
  const {
    upload,
    uploadProgress,
    isUploading,
    uploadedImages,
    error,
    deleteImage,
  } = useImageUpload({
    folder: 'custom-folder',
    maxFiles: 3,
    onSuccess: (data) => {
      console.log('Upload successful:', data);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    await upload(files);
  };

  return (
    <div>
      <input type="file" onChange={handleFileSelect} multiple />
      
      {isUploading && uploadProgress && (
        <div>Uploading: {uploadProgress.percentage}%</div>
      )}
      
      {error && <div>Error: {error.message}</div>}
      
      {uploadedImages.map(img => (
        <div key={img.publicId}>
          <img src={img.thumbnailUrl} alt="" />
          <button onClick={() => deleteImage(img.publicId)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### Server-Side Image Upload

```tsx
// pages/api/menu-items.ts
import { uploadImage } from '@/lib/cloudinary';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { imageBase64, name } = req.body;
    
    try {
      // Upload image to Cloudinary
      const result = await uploadImage(Buffer.from(imageBase64, 'base64'), {
        folder: 'menu-items',
        tags: ['menu'],
        context: { itemName: name },
      });
      
      // Save to database
      const menuItem = await prisma.menuItem.create({
        data: {
          name,
          imageUrl: result.secure_url,
          imagePublicId: result.public_id,
        },
      });
      
      res.json({ success: true, data: menuItem });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

### Generating Responsive Images

```tsx
import { getResponsiveImageUrls } from '@/lib/cloudinary';

function ResponsiveImage({ publicId, alt }) {
  const urls = getResponsiveImageUrls(publicId);
  
  return (
    <picture>
      <source media="(max-width: 640px)" srcSet={urls[640]} />
      <source media="(max-width: 768px)" srcSet={urls[768]} />
      <source media="(max-width: 1024px)" srcSet={urls[1024]} />
      <img src={urls[1920]} alt={alt} loading="lazy" />
    </picture>
  );
}
```

## API Reference

### Components

#### ImageUploader

Main upload component with drag-and-drop interface.

**Props:**
- `onUploadComplete?: (images: UploadedImage[]) => void` - Callback when upload completes
- `onImageDelete?: (publicId: string) => void` - Callback when image is deleted
- `maxFiles?: number` - Maximum number of files (default: 10)
- `maxSize?: number` - Maximum file size in bytes (default: 10MB)
- `acceptedFormats?: string[]` - Accepted MIME types
- `folder?: string` - Cloudinary folder path
- `tags?: string[]` - Tags to add to uploaded images
- `multiple?: boolean` - Allow multiple file selection (default: true)
- `showPreview?: boolean` - Show uploaded images preview (default: true)
- `initialImages?: UploadedImage[]` - Initial images to display
- `disabled?: boolean` - Disable the uploader

### Hooks

#### useImageUpload

React hook for managing image uploads.

**Options:**
- `folder?: string` - Cloudinary folder path
- `tags?: string[]` - Tags for uploaded images
- `maxFiles?: number` - Maximum files allowed
- `maxSize?: number` - Maximum file size
- `acceptedFormats?: string[]` - Accepted formats
- `onProgress?: (progress: UploadProgress) => void` - Progress callback
- `onSuccess?: (data: UploadedImage | UploadedImage[]) => void` - Success callback
- `onError?: (error: Error) => void` - Error callback

**Returns:**
- `upload: (files: File | File[]) => Promise<UploadedImage | UploadedImage[]>` - Upload function
- `uploadWithProgress: (files: File | File[]) => void` - Upload with progress tracking
- `deleteImage: (publicId: string) => Promise<void>` - Delete image function
- `isUploading: boolean` - Upload in progress
- `uploadProgress: UploadProgress | null` - Current upload progress
- `uploadedImages: UploadedImage[]` - Array of uploaded images
- `error: Error | null` - Current error
- `reset: () => void` - Reset state
- `validateFiles: (files: File[]) => { valid: boolean; errors: string[] }` - Validate files

### API Endpoints

#### POST /api/upload

Upload one or more images.

**Authentication:** Required

**Request Body:** `multipart/form-data`
- `file`: File or array of files
- `folder`: Optional folder path
- `tags`: Optional tags array

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "osassy-kitchen/...",
    "width": 800,
    "height": 600,
    "format": "jpg",
    "size": 1024000,
    "thumbnailUrl": "https://res.cloudinary.com/..."
  }
}
```

#### DELETE /api/upload

Delete an image from Cloudinary.

**Authentication:** Required

**Query Parameters:**
- `publicId`: The public ID of the image to delete

**Response:**
```json
{
  "success": true,
  "data": {
    "publicId": "osassy-kitchen/..."
  }
}
```

## Integration with Menu Items (Chunk-011)

The Image Upload System is designed to integrate seamlessly with the menu management system. Here's how to use it:

```tsx
// Example integration in menu item creation
import { ImageUploader } from '@/components/ImageUploader';
import { useState } from 'react';

function CreateMenuItem() {
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');

  const handleImageUpload = (images) => {
    const image = images[0]; // Take first image
    setImageUrl(image.url);
    setImagePublicId(image.publicId);
  };

  const handleSubmit = async (formData) => {
    const menuItem = {
      ...formData,
      imageUrl,
      imagePublicId,
    };
    
    // Save to database
    await createMenuItem(menuItem);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Other form fields */}
      
      <ImageUploader
        onUploadComplete={handleImageUpload}
        maxFiles={1}
        folder="menu-items"
        showPreview={true}
      />
      
      <button type="submit">Create Menu Item</button>
    </form>
  );
}
```

## Best Practices

1. **Always validate files on both client and server**
2. **Use appropriate image transformations** to optimize for different screen sizes
3. **Implement proper error handling** and user feedback
4. **Set reasonable file size limits** based on your use case
5. **Use folders to organize images** in Cloudinary
6. **Add meaningful tags** for better organization
7. **Clean up unused images** periodically to manage storage
8. **Use progressive loading** for better user experience
9. **Implement retry logic** for failed uploads
10. **Cache images appropriately** using Next.js Image component when possible

## Troubleshooting

### Common Issues

1. **Upload fails with 401 error**
   - Check if user is authenticated
   - Verify session configuration

2. **File validation errors**
   - Check file size limits in environment variables
   - Verify accepted formats configuration

3. **Cloudinary errors**
   - Verify API credentials are correct
   - Check Cloudinary account limits
   - Ensure upload preset exists (if using unsigned uploads)

4. **Progress not updating**
   - Check browser compatibility with XMLHttpRequest progress events
   - Verify network conditions

### Debug Mode

Enable debug logging by setting:
```javascript
// In your component or hook
const debug = process.env.NODE_ENV === 'development';
if (debug) {
  console.log('Upload state:', { isUploading, uploadProgress, error });
}
```

## Security Considerations

1. **Authentication**: All uploads require authenticated users
2. **File Validation**: Strict validation of file types and sizes
3. **Secure URLs**: All Cloudinary URLs use HTTPS
4. **API Keys**: Never expose Cloudinary API secrets to the client
5. **Rate Limiting**: Consider implementing rate limiting for upload endpoints
6. **Input Sanitization**: File names and metadata are sanitized before storage

## Performance Optimization

1. **Lazy Loading**: Images are loaded only when needed
2. **Responsive Images**: Different sizes for different devices
3. **Format Optimization**: Automatic WebP/AVIF conversion when supported
4. **Quality Optimization**: Automatic quality adjustment based on content
5. **CDN Distribution**: Cloudinary's global CDN ensures fast delivery
6. **Progress Tracking**: Real-time feedback during uploads
7. **Chunked Uploads**: Large files can be uploaded in chunks (future enhancement)

## Future Enhancements

- [ ] Video upload support
- [ ] Bulk upload interface
- [ ] Image editing capabilities (crop, rotate, filters)
- [ ] AI-powered image tagging
- [ ] Automatic alt text generation
- [ ] Integration with Next.js Image component
- [ ] Offline upload queue
- [ ] Upload history and analytics