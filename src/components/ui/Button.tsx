import React from 'react';
import { designTokens } from '../../constants/designTokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isFullWidth?: boolean;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white shadow-sm',
  secondary: 'bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--surface-border)]',
  ghost: 'bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)]',
  danger: 'bg-[var(--danger)] hover:opacity-90 text-white shadow-sm',
  success: 'bg-[var(--success)] hover:opacity-90 text-white shadow-sm',
  outline: 'bg-transparent border border-[var(--surface-border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]',
};

const sizeClasses: Record<Size, string> = {
  xs: 'px-2.5 py-1.5 text-[11px] gap-1 rounded-lg',
  sm: 'px-3 py-2 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-5 py-3 text-sm gap-2 rounded-xl',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isFullWidth,
  isLoading,
  disabled,
  className = '',
  children,
  ...rest
}) => {
  return (
    <button
      {...rest}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${isFullWidth ? 'w-full' : ''} ${className}`}
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {!isLoading && icon && iconPosition === 'left' && icon}
      {children}
      {!isLoading && icon && iconPosition === 'right' && icon}
    </button>
  );
};
