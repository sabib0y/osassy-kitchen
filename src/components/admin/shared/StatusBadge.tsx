import React from 'react';

interface StatusBadgeProps {
  status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED' | 'available' | 'unavailable';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    style: {
      background: 'var(--primary)',
      color: 'var(--primary-foreground)',
    },
  },
  IN_PROGRESS: {
    label: 'In Progress',
    style: {
      background: 'var(--accent)',
      color: 'var(--accent-foreground)',
    },
  },
  DELIVERED: {
    label: 'Delivered',
    style: {
      background: 'var(--secondary)',
      color: 'var(--secondary-foreground)',
    },
  },
  CANCELLED: {
    label: 'Cancelled',
    style: {
      background: 'var(--destructive)',
      color: 'var(--destructive-foreground)',
    },
  },
  available: {
    label: 'Available',
    style: {
      background: 'var(--accent)',
      color: 'var(--accent-foreground)',
    },
  },
  unavailable: {
    label: 'Unavailable',
    style: {
      background: 'var(--destructive)',
      color: 'var(--destructive-foreground)',
    },
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-2.5 py-1.5',
  lg: 'text-base px-3 py-2',
};

export default function StatusBadge({ 
  status, 
  size = 'sm', 
  className = '' 
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = sizeClasses[size];

  return (
    <span 
      className={`status-badge ${className}`}
      style={{
        ...config.style,
        borderRadius: '0.5rem',
        padding: size === 'sm' ? '0.25rem 0.75rem' : '0.5rem 1rem',
        fontSize: size === 'sm' ? '0.9rem' : '1rem',
        fontWeight: '600',
        display: 'inline-block'
      }}
    >
      {config.label}
    </span>
  );
}
