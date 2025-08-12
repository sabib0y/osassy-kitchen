import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import LoadingSkeleton from './LoadingSkeleton';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallback?: string;
  showSkeleton?: boolean;
}

const ImageOptimized: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  quality = 75,
  sizes,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  loading = 'lazy',
  onLoad,
  onError,
  fallback = '/images/placeholder.jpg',
  showSkeleton = true,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager' || priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [loading, priority]);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  const generateBlurDataURL = (w: number, h: number) => {
    // Generate a simple blur data URL if none provided
    if (blurDataURL) return blurDataURL;
    
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create a simple gradient for blur effect
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(1, '#e5e7eb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
    
    return canvas.toDataURL();
  };

  const imageProps = {
    src: imageError ? fallback : src,
    alt,
    quality,
    className: `${className} ${imageLoaded ? 'loaded' : 'loading'}`,
    onLoad: handleLoad,
    onError: handleError,
    ...(width && height && { width, height }),
    ...(fill && { fill: true }),
    ...(sizes && { sizes }),
    ...(priority && { priority: true }),
    ...(placeholder === 'blur' && {
      placeholder: 'blur' as const,
      blurDataURL: generateBlurDataURL(width || 400, height || 300),
    }),
    style: {
      objectFit,
      objectPosition,
      transition: 'opacity 0.3s ease-in-out',
      opacity: imageLoaded ? 1 : 0,
    },
  };

  return (
    <div
      ref={imgRef}
      className={`image-optimized-container ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...(width && height && { width, height }),
      }}
    >
      {/* Show skeleton while loading */}
      {showSkeleton && !imageLoaded && (
        <LoadingSkeleton
          variant="rectangular"
          width={width || '100%'}
          height={height || '100%'}
          className="image-skeleton"
        />
      )}

      {/* Render image only when in view (for lazy loading) */}
      {isInView && (
        <Image
          {...imageProps}
          style={{
            ...imageProps.style,
            position: fill ? 'absolute' : 'relative',
          }}
        />
      )}

      {/* Error state */}
      {imageError && (
        <div
          className="image-error-state"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f3f4f6',
            color: '#6b7280',
            fontSize: '14px',
          }}
        >
          <div>
            <svg
              width="48"
              height="48"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p>Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Gallery component for multiple images with optimized loading
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
    caption?: string;
  }>;
  columns?: number;
  gap?: number;
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  columns = 3,
  gap = 16,
  className = '',
}) => {
  return (
    <div
      className={`image-gallery ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {images.map((image, index) => (
        <div key={index} className="gallery-item">
          <ImageOptimized
            src={image.src}
            alt={image.alt}
            width={image.width || 400}
            height={image.height || 300}
            priority={index < 2} // Prioritize first 2 images
            className="gallery-image"
          />
          {image.caption && (
            <p className="gallery-caption" style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
              {image.caption}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ImageOptimized;