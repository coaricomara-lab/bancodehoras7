import React from 'react';

type BadgeVariant = 'neutral' | 'brand' | 'success' | 'danger' | 'warning' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  uppercase?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--surface-border)]',
  brand: 'bg-[var(--brand-primary-bg)] text-[var(--brand-primary)] border-[var(--brand-primary-border)]',
  success: 'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success)]/30',
  danger: 'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger)]/30',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning)]/30',
  purple: 'bg-[var(--purple-bg)] text-[var(--purple)] border-[var(--purple)]/30',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
  uppercase = false,
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${variantClasses[variant]} ${uppercase ? 'uppercase tracking-wide' : ''} ${className}`}
    >
      {children}
    </span>
  );
};
