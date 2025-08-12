import React from 'react';
import styles from './LoadingSkeleton.module.scss';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'avatar' | 'button';
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number; // For text variant
  animate?: boolean;
}

const LoadingSkeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width = '100%',
  height,
  className = '',
  lines = 1,
  animate = true,
}) => {
  const getSkeletonClass = () => {
    const baseClass = animate ? styles.skeleton : styles.skeletonStatic;
    
    switch (variant) {
      case 'text':
        return `${baseClass} ${styles.skeletonText}`;
      case 'circular':
        return `${baseClass} ${styles.skeletonCircular}`;
      case 'rectangular':
        return `${baseClass} ${styles.skeletonRectangular}`;
      case 'card':
        return `${baseClass} ${styles.skeletonCard}`;
      case 'avatar':
        return `${baseClass} ${styles.skeletonAvatar}`;
      case 'button':
        return `${baseClass} ${styles.skeletonButton}`;
      default:
        return baseClass;
    }
  };

  const getDefaultHeight = () => {
    if (height) return height;
    
    switch (variant) {
      case 'text':
        return '1.2em';
      case 'circular':
      case 'avatar':
        return '40px';
      case 'button':
        return '40px';
      case 'card':
        return '200px';
      default:
        return '20px';
    }
  };

  const getDefaultWidth = () => {
    if (variant === 'circular' || variant === 'avatar') {
      return getDefaultHeight();
    }
    return width;
  };

  const skeletonStyle = {
    width: getDefaultWidth(),
    height: getDefaultHeight(),
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`${styles.skeletonGroup} ${className}`}>
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={getSkeletonClass()}
            style={{
              ...skeletonStyle,
              width: index === lines - 1 ? '80%' : '100%',
              marginBottom: index === lines - 1 ? 0 : '0.5em',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${getSkeletonClass()} ${className}`}
      style={skeletonStyle}
      role="progressbar"
      aria-label="Loading content"
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`${styles.skeletonCardContainer} ${className || ''}`}>
    <LoadingSkeleton variant="rectangular" height="200px" className={styles.skeletonCardImage} />
    <div className={styles.skeletonCardContent}>
      <LoadingSkeleton variant="text" height="1.5em" className={styles.skeletonCardTitle} />
      <LoadingSkeleton variant="text" lines={2} className={styles.skeletonCardText} />
      <div className={styles.skeletonCardActions}>
        <LoadingSkeleton variant="button" width="100px" />
        <LoadingSkeleton variant="button" width="80px" />
      </div>
    </div>
  </div>
);

export const SkeletonUserProfile: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`${styles.skeletonProfileContainer} ${className || ''}`}>
    <LoadingSkeleton variant="avatar" width="80px" height="80px" />
    <div className={styles.skeletonProfileContent}>
      <LoadingSkeleton variant="text" height="1.5em" width="150px" />
      <LoadingSkeleton variant="text" height="1em" width="200px" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ 
  rows?: number; 
  columns?: number; 
  className?: string 
}> = ({ rows = 5, columns = 4, className }) => (
  <div className={`${styles.skeletonTableContainer} ${className || ''}`}>
    <div className={styles.skeletonTableHeader}>
      {Array.from({ length: columns }, (_, index) => (
        <LoadingSkeleton key={index} variant="text" height="1.2em" />
      ))}
    </div>
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={rowIndex} className={styles.skeletonTableRow}>
        {Array.from({ length: columns }, (_, colIndex) => (
          <LoadingSkeleton key={colIndex} variant="text" height="1em" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonList: React.FC<{ 
  items?: number; 
  showAvatar?: boolean;
  className?: string 
}> = ({ items = 5, showAvatar = false, className }) => (
  <div className={`${styles.skeletonListContainer} ${className || ''}`}>
    {Array.from({ length: items }, (_, index) => (
      <div key={index} className={styles.skeletonListItem}>
        {showAvatar && <LoadingSkeleton variant="avatar" width="40px" height="40px" />}
        <div className={styles.skeletonListContent}>
          <LoadingSkeleton variant="text" height="1.2em" width="70%" />
          <LoadingSkeleton variant="text" height="1em" width="50%" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonStats: React.FC<{ 
  count?: number; 
  className?: string 
}> = ({ count = 4, className }) => (
  <div className={`${styles.skeletonStatsContainer} ${className || ''}`}>
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className={styles.skeletonStatCard}>
        <LoadingSkeleton variant="circular" width="64px" height="64px" />
        <div className={styles.skeletonStatContent}>
          <LoadingSkeleton variant="text" height="2em" width="60px" />
          <LoadingSkeleton variant="text" height="1em" width="120px" />
        </div>
      </div>
    ))}
  </div>
);

export default LoadingSkeleton;