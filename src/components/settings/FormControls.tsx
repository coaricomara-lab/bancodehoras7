import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  isDark: boolean;
  className?: string;
  badge?: string;
}

export const CardSection: React.FC<CardSectionProps> = ({
  title,
  description,
  icon: Icon,
  action,
  children,
  isDark,
  className = '',
  badge,
}) => {
  return (
    <div
      className={`rounded-2xl border transition-all ${
        isDark
          ? 'bg-[#15171C] border-[#1F2229] text-[#E0E2E5]'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      } ${className}`}
    >
      <div className={`px-5 py-4 border-b flex items-center justify-between gap-4 ${
        isDark ? 'border-[#1F2229]' : 'border-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">{title}</h3>
              {badge && (
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${
                  isDark
                    ? 'bg-blue-900/30 text-blue-300 border-blue-800/50'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
};

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  isDark: boolean;
  required?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  helperText,
  icon: Icon,
  isDark,
  required,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="w-full space-y-1.5">
      <label
        htmlFor={inputId}
        className={`block text-xs font-semibold ${
          isDark ? 'text-[#C5C8CD]' : 'text-slate-700'
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative rounded-xl">
        {Icon && (
          <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${
            isDark ? 'text-[#8E9299]' : 'text-slate-400'
          }`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          required={required}
          className={`w-full rounded-xl text-xs font-medium transition-all outline-hidden border ${
            Icon ? 'pl-10' : 'pl-3.5'
          } pr-3.5 py-2.5 ${
            isDark
              ? 'bg-[#0D0F14] border-[#2A2E38] text-white placeholder-[#5A5E66] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
          } ${error ? (isDark ? '!border-red-500/80 !ring-red-500/20' : '!border-red-500 !ring-red-100') : ''} ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-[11px] text-red-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className={`text-[11px] ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
  isDark: boolean;
  required?: boolean;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  error,
  helperText,
  isDark,
  required,
  id,
  className = '',
  rows = 3,
  ...props
}) => {
  const textareaId = id || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="w-full space-y-1.5">
      <label
        htmlFor={textareaId}
        className={`block text-xs font-semibold ${
          isDark ? 'text-[#C5C8CD]' : 'text-slate-700'
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        id={textareaId}
        rows={rows}
        required={required}
        className={`w-full rounded-xl text-xs font-medium transition-all outline-hidden border px-3.5 py-2.5 ${
          isDark
            ? 'bg-[#0D0F14] border-[#2A2E38] text-white placeholder-[#5A5E66] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
        } ${error ? (isDark ? '!border-red-500/80' : '!border-red-500') : ''} ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-[11px] text-red-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className={`text-[11px] ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string | number; label: string }>;
  error?: string;
  helperText?: string;
  isDark: boolean;
  required?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  options,
  error,
  helperText,
  isDark,
  required,
  id,
  className = '',
  ...props
}) => {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="w-full space-y-1.5">
      <label
        htmlFor={selectId}
        className={`block text-xs font-semibold ${
          isDark ? 'text-[#C5C8CD]' : 'text-slate-700'
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={selectId}
        required={required}
        className={`w-full rounded-xl text-xs font-medium transition-all outline-hidden border px-3.5 py-2.5 cursor-pointer ${
          isDark
            ? 'bg-[#0D0F14] border-[#2A2E38] text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            : 'bg-white border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
        } ${error ? (isDark ? '!border-red-500/80' : '!border-red-500') : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className={isDark ? 'bg-[#15171C] text-white' : 'bg-white text-slate-900'}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-[11px] text-red-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className={`text-[11px] ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

interface ToggleSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  isDark: boolean;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  description,
  checked,
  onChange,
  isDark,
  disabled = false,
}) => {
  return (
    <label className={`flex items-start justify-between gap-4 p-3 rounded-xl border transition-all cursor-pointer select-none ${
      isDark
        ? 'bg-[#0D0F14]/60 border-[#1F2229] hover:border-[#2A2E38]'
        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="flex-1">
        <span className={`text-xs font-semibold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {label}
        </span>
        {description && (
          <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) onChange(!checked);
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
          checked ? 'bg-blue-600' : isDark ? 'bg-[#2A2E38]' : 'bg-slate-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
};
