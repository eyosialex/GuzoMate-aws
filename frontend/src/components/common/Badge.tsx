import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'pending' | 'active' | 'resolved' | 'neutral' | 'indigo' | 'teal';
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
    // Amber for Pending
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    // Red for Active
    active: 'bg-red-50 text-red-800 border-red-200',
    // Green for Resolved
    resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    // Neutral
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
    // Indigo accent
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
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
