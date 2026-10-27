import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'pending' | 'active' | 'resolved' | 'neutral' | 'indigo' | 'teal';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}) => {
  const variantStyles = {
    // Highland Green Primary
    primary: 'bg-primary/10 text-primary border-primary/20',
    // Harvest Amber Secondary
    secondary: 'bg-secondary/10 text-secondary-dark border-secondary/20',
    // Amber for Pending
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    // Red for Active
    active: 'bg-red-50 text-red-800 border-red-200',
    // Green for Resolved
    resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    // Neutral
    neutral: 'bg-surface-container text-on-surface-variant border-outline-variant/30',
    // Indigo accent
    indigo: 'bg-primary/10 text-primary border-primary/20',
    // Teal accent
    teal: 'bg-teal-50 text-teal-800 border-teal-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 rounded-md gap-1',
    md: 'text-xs px-2.5 py-1 rounded-full gap-1.5 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center border font-medium select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
