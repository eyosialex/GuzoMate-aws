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
    'h-11 w-11 min-h-[44px] min-w-[44px] inline-flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed select-none';

  const shapeStyles = {
    rounded: 'rounded-xl',
    circle: 'rounded-full',
  };

  const variantStyles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300',
    outline: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 shadow-sm',
    ghost: isActive
      ? 'bg-indigo-50 text-indigo-600'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 active:bg-gray-200/80',
    floating:
      'bg-white text-gray-800 shadow-floating border border-gray-100 hover:bg-gray-50',
    glass:
      'backdrop-blur-md bg-white/85 text-gray-800 border border-white/60 shadow-floating hover:bg-white/95',
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
