// Button Component
// Consistent button styles with variants and sizes

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
      secondary:
        'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 active:bg-gray-400',
      outline:
        'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500 active:bg-gray-100',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
      danger:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
    };

    const sizes = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const iconSizes = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className={`animate-spin ${iconSizes[size]} ${children ? 'mr-2' : ''}`} />
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className={`${iconSizes[size]} ${children ? 'mr-2' : ''}`}>
            {icon}
          </span>
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span className={`${iconSizes[size]} ${children ? 'ml-2' : ''}`}>
            {icon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
