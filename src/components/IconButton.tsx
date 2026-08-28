import React, { useState, useRef, useEffect } from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';

export type IconButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'ghost' 
  | 'danger' 
  | 'success' 
  | 'warning' 
  | 'subtle';

export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Ícone da biblioteca lucide-react */
  icon: LucideIcon;
  /** Texto ou elemento descritivo exibido no tooltip */
  tooltip?: React.ReactNode;
  /** Rótulo para acessibilidade (leitores de tela). Se omitido, utiliza o texto de tooltip quando for string */
  'aria-label'?: string;
  /** Variante visual de cor e superfície */
  variant?: IconButtonVariant;
  /** Dimensão do botão e do ícone */
  size?: IconButtonSize;
  /** Posição relativa do tooltip */
  position?: TooltipPosition;
  /** Tema ativo (dark ou light). Se omitido, herda automaticamente */
  theme?: 'dark' | 'light';
  /** Indicador de carregamento (spinner) */
  isLoading?: boolean;
  /** Badge numérico ou booleano para indicador de status */
  badge?: string | number | boolean;
  /** Cor do badge */
  badgeColor?: 'blue' | 'emerald' | 'rose' | 'amber';
  /** Atalho de teclado para exibição no tooltip (ex: "Ctrl+P") */
  shortcut?: string;
  /** Classes CSS adicionais */
  className?: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon: Icon,
  tooltip,
  'aria-label': ariaLabel,
  variant = 'ghost',
  size = 'md',
  position = 'top',
  theme,
  isLoading = false,
  badge,
  badgeColor = 'blue',
  shortcut,
  className = '',
  disabled,
  onClick,
  type = 'button',
  id,
  ...rest
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Determina rótulo acessível
  const accessibleLabel = ariaLabel || (typeof tooltip === 'string' ? tooltip : 'Ação');

  // Dimensões do botão
  const sizeClasses: Record<IconButtonSize, { btn: string; icon: string; badge: string }> = {
    xs: {
      btn: 'w-7 h-7 p-1 rounded-md text-xs',
      icon: 'w-3.5 h-3.5',
      badge: '-top-1 -right-1 min-w-3.5 h-3.5 text-[9px] px-1',
    },
    sm: {
      btn: 'w-8 h-8 p-1.5 rounded-lg text-xs',
      icon: 'w-4 h-4',
      badge: '-top-1 -right-1 min-w-4 h-4 text-[10px] px-1',
    },
    md: {
      btn: 'w-9 h-9 p-2 rounded-xl text-sm',
      icon: 'w-4 h-4',
      badge: '-top-1.5 -right-1.5 min-w-4.5 h-4.5 text-[10px] px-1.5',
    },
    lg: {
      btn: 'w-10 h-10 p-2.5 rounded-xl text-base',
      icon: 'w-5 h-5',
      badge: '-top-1.5 -right-1.5 min-w-5 h-5 text-[11px] px-1.5',
    },
  };

  // Variantes visuais com suporte a Dark e Light Mode
  const variantClasses: Record<IconButtonVariant, string> = {
    primary: 
      'bg-blue-600 hover:bg-blue-500 text-white shadow-sm hover:shadow-blue-500/25 active:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900',
    secondary: 
      'bg-slate-100 dark:bg-[#243756] hover:bg-slate-200 dark:hover:bg-[#335075] text-slate-700 dark:text-[#E2E8F0] border border-slate-200 dark:border-[#335075] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900',
    ghost: 
      'bg-transparent hover:bg-slate-100 dark:hover:bg-[#243756] text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#FFFFFF] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900',
    danger: 
      'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 active:scale-95 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900',
    success: 
      'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900',
    warning: 
      'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900',
    subtle: 
      'bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900',
  };

  // Posicionamento do tooltip flutuante
  const positionClasses: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const badgeColorClasses = {
    blue: 'bg-blue-500 text-white ring-2 ring-white dark:ring-[#16243D]',
    emerald: 'bg-emerald-500 text-white ring-2 ring-white dark:ring-[#16243D]',
    rose: 'bg-rose-500 text-white ring-2 ring-white dark:ring-[#16243D]',
    amber: 'bg-amber-500 text-black ring-2 ring-white dark:ring-[#16243D]',
  };

  const currentSize = sizeClasses[size];

  return (
    <div 
      className="relative inline-flex items-center justify-center group"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        ref={(node) => {
          triggerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }}
        id={id}
        type={type}
        aria-label={accessibleLabel}
        disabled={disabled || isLoading}
        onClick={onClick}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false);
        }}
        className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none select-none focus:outline-none ${currentSize.btn} ${variantClasses[variant]} ${className}`}
        {...rest}
      >
        {isLoading ? (
          <Loader2 className={`${currentSize.icon} animate-spin`} />
        ) : (
          <Icon className={currentSize.icon} />
        )}

        {/* Badge Indicador (Status ou Contagem) */}
        {badge !== undefined && badge !== false && (
          <span className={`absolute inline-flex items-center justify-center font-mono font-bold rounded-full ${currentSize.badge} ${badgeColorClasses[badgeColor]}`}>
            {typeof badge === 'boolean' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
            ) : (
              badge
            )}
          </span>
        )}
      </button>

      {/* Tooltip Acessível Flutuante */}
      {tooltip && isOpen && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none whitespace-nowrap px-2.5 py-1.5 text-xs font-medium rounded-lg shadow-xl border font-sans animate-in fade-in zoom-in-95 duration-100 ${positionClasses[position]} bg-[#111317] dark:bg-[#1E3252] text-white border-[#335075] dark:border-[#383D4A] shadow-black/60`}
        >
          <div className="flex items-center gap-1.5">
            <span>{tooltip}</span>
            {shortcut && (
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-black/50 text-slate-300 rounded border border-white/10">
                {shortcut}
              </kbd>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

IconButton.displayName = 'IconButton';
