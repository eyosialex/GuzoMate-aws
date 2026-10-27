import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { springTactile, tactilePress } from '../../lib/motion';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'floating' | 'glass';
  shape?: 'rounded' | 'circle';
  isActive?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  'aria-label': ariaLabel,
  icon,
  variant = 'ghost',
  shape = 'rounded',
  isActive = false,
  className = '',
  disabled,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const baseStyles =
    'h-11 w-11 min-h-[44px] min-w-[44px] inline-flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed select-none';

  const shapeStyles = {
    rounded: 'rounded-xl',
    circle: 'rounded-full',
  };

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark shadow-sm',
    secondary: 'bg-surface-container text-on-surface hover:bg-surface-high active:bg-surface-highest',
    outline: 'bg-white text-on-surface-variant border border-outline-variant/60 hover:bg-surface-low active:bg-surface-container shadow-sm',
    ghost: isActive
      ? 'bg-primary/10 text-primary font-bold'
      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-low active:bg-surface-container',
    floating:
      'bg-white text-on-surface shadow-floating border border-outline-variant/30 hover:bg-surface-low',
    glass:
      'backdrop-blur-md bg-white/90 text-on-surface border border-white/60 shadow-floating hover:bg-white',
  };

  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      whileTap={shouldReduceMotion || disabled ? undefined : tactilePress.icon}
      transition={springTactile}
      className={`${baseStyles} ${shapeStyles[shape]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
    >
      <span className="inline-flex items-center justify-center pointer-events-none">
        {icon}
      </span>
    </motion.button>
  );
};
