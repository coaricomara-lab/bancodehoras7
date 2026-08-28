import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', elevated = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border transition-all ${
        elevated
          ? 'bg-[var(--surface-card-elevated)] border-[var(--surface-border-subtle)]'
          : 'bg-[var(--surface-card)] border-[var(--surface-border)]'
      } ${onClick ? 'cursor-pointer hover:border-[var(--brand-primary)] hover:shadow-md' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`p-4 sm:p-5 border-b border-[var(--surface-border)] ${className}`}>
    {children}
  </div>
);

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => (
  <div className={`p-4 sm:p-5 ${className}`}>{children}</div>
);
