import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  className = '' 
}: StatsCardProps) {
  // Determine icon color based on title
  const getIconColor = () => {
    if (title.toLowerCase().includes('pending')) return 'var(--primary)';
    if (title.toLowerCase().includes('progress')) return 'var(--accent)';
    if (title.toLowerCase().includes('delivered')) return 'var(--secondary)';
    if (title.toLowerCase().includes('revenue')) return 'var(--accent)';
    return 'var(--primary)';
  };

  return (
    <div className={`card ${className}`} style={{
      background: 'var(--card)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-md)',
      padding: '1.5rem',
      marginBottom: '0'
    }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--secondary)' }}>
            {title}
          </p>
          <p className="text-2xl font-bold">
            {typeof value === 'number' && value > 999 
              ? value.toLocaleString() 
              : value
            }
          </p>
          {trend && (
            <p className={`text-sm mt-1 flex items-center gap-1 ${
              trend.isPositive !== false ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>
                {trend.isPositive !== false ? '+' : ''}
                {trend.value}
              </span>
              <span style={{ color: 'var(--muted-foreground)' }}>{trend.label}</span>
            </p>
          )}
        </div>
        <Icon className="w-8 h-8" style={{ color: getIconColor() }} />
      </div>
    </div>
  );
}
