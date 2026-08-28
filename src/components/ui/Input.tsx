import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  trailingIcon,
  error,
  hint,
  className = '',
  id,
  ...rest
}) => {
  const inputId = id || rest.name || label?.replace(/\s/g, '-').toLowerCase();

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          {...rest}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} ${trailingIcon ? 'pr-11' : 'pr-4'} py-3 rounded-xl text-sm border transition-all outline-none bg-[var(--surface-secondary)] border-[var(--surface-border)] text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 placeholder:text-[var(--text-subtle)] ${className}`}
        />
        {trailingIcon && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]">
            {trailingIcon}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs text-[var(--danger)] font-medium">{error}</p>
      )}
      {hint && !error && (
        <p className="text-[11px] text-[var(--text-subtle)]">{hint}</p>
      )}
    </div>
  );
};
