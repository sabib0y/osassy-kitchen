import React, { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import { useImageUpload, UploadedImage } from '@/hooks/useImageUpload';
import { Upload, X, Image as ImageIcon, FileImage, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './ImageUploader.module.scss';

export interface ImageUploaderProps {
  /**
   * Callback when images are successfully uploaded
   */
  onUploadComplete?: (images: UploadedImage[]) => void;
  
  /**
   * Callback when an image is deleted
   */
  onImageDelete?: (publicId: string) => void;
  
  /**
   * Maximum number of files that can be uploaded
   */
  maxFiles?: number;
  
  /**
   * Maximum file size in bytes (default: 10MB)
   */
  maxSize?: number;
  
  /**
   * Accepted file formats
   */
  acceptedFormats?: string[];
  
  /**
   * Cloudinary folder to upload to
   */
  folder?: string;
  
  /**
   * Tags to add to uploaded images
   */
  tags?: string[];
  
  /**
   * Allow multiple file selection
   */
  multiple?: boolean;
  
  /**
   * Show preview of uploaded images
   */
  showPreview?: boolean;
  
  /**
   * Custom class name
   */
  className?: string;
  
  /**
   * Initial images to display
   */
  initialImages?: UploadedImage[];
  
  /**
   * Disabled state
   */
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadComplete,
  onImageDelete,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  folder,
  tags,
  multiple = true,
  showPreview = true,
  className = '',
  initialImages = [],
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewImages, setPreviewImages] = useState<UploadedImage[]>(initialImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploadWithProgress,
    deleteImage,
    isUploading,
    uploadProgress,
    error,
    validateFiles,
  } = useImageUpload({
    folder,
    tags,
    maxFiles,
    maxSize,
    acceptedFormats,
    onSuccess: (data) => {
      const images = Array.isArray(data) ? data : [data];
      setPreviewImages(prev => [...prev, ...images]);
      onUploadComplete?.(images);
    },
  });

  // Handle drag events
  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [disabled]);

  // Handle file selection
  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  // Process selected files
  const handleFiles = useCallback((files: File[]) => {
    // Filter only image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // Validate files
    const validation = validateFiles(imageFiles);
    if (!validation.valid) {
      console.error('Validation errors:', validation.errors);
      return;
    }

    // Upload files
    uploadWithProgress(imageFiles);
  }, [validateFiles, uploadWithProgress]);

  // Handle image deletion
  const handleDeleteImage = useCallback(async (publicId: string) => {
    try {
      await deleteImage(publicId);
      setPreviewImages(prev => prev.filter(img => img.publicId !== publicId));
      onImageDelete?.(publicId);
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  }, [deleteImage, onImageDelete]);

  // Trigger file input click
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`${styles.imageUploader} ${className}`}>
      {/* Upload Area */}
      <div
        className={`${styles.uploadArea} ${isDragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className={styles.fileInput}
        />

        <div className={styles.uploadContent}>
          {isUploading && uploadProgress ? (
            <>
              <div className={styles.progressIcon}>
                <div className={styles.spinner} />
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${uploadProgress.percentage}%` }}
                />
              </div>
              <p className={styles.progressText}>
                Uploading... {uploadProgress.percentage}%
              </p>
              <p className={styles.progressDetails}>
                {formatFileSize(uploadProgress.loaded)} / {formatFileSize(uploadProgress.total)}
              </p>
            </>
          ) : (
            <>
              <Upload className={styles.uploadIcon} size={48} />
              <p className={styles.uploadText}>
                {isDragging ? 'Drop files here' : 'Drag & drop images here'}
              </p>
              <p className={styles.uploadSubtext}>
                or click to select files
              </p>
              <p className={styles.uploadInfo}>
                Max {maxFiles} files, up to {formatFileSize(maxSize)} each
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.errorMessage}>
          <AlertCircle size={20} />
          <span>{error.message}</span>
        </div>
      )}

      {/* Preview Area */}
      {showPreview && previewImages.length > 0 && (
        <div className={styles.previewArea}>
          <h3 className={styles.previewTitle}>Uploaded Images</h3>
          <div className={styles.previewGrid}>
            {previewImages.map((image) => (
              <div key={image.publicId} className={styles.previewItem}>
                <div className={styles.imageWrapper}>
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt="Uploaded"
                    className={styles.previewImage}
                  />
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDeleteImage(image.publicId)}
                    disabled={isUploading}
                    aria-label="Delete image"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className={styles.imageInfo}>
                  <p className={styles.imageName}>
                    {image.publicId.split('/').pop()}
                  </p>
                  <p className={styles.imageSize}>
                    {formatFileSize(image.size)}
                  </p>
                  <p className={styles.imageDimensions}>
                    {image.width} × {image.height}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;