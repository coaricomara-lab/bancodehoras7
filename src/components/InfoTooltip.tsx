import React, { useState, useRef, useEffect } from 'react';
import { Info, HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  content: React.ReactNode;
  className?: string;
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md';
  position?: 'top' | 'bottom' | 'left' | 'right';
  badge?: string;
  /** Accessibility label for screen readers */
  label?: string;
}

/**
 * Touch-friendly tooltip: hover on desktop, tap to toggle on mobile.
 * Closes on outside-click and Escape. No behavior change to existing API.
 */
export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  className = '',
  theme = 'dark',
  size = 'sm',
  position = 'top',
  badge,
  label,
}) => {
  const isDark = theme === 'dark';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click (mobile tap-away)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center group cursor-help ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-label={label || 'Mais informações'}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`p-0.5 rounded-full transition-all inline-flex items-center justify-center border-0 bg-transparent ${
          isDark
            ? 'text-gray-400 hover:text-blue-400 hover:bg-[#243756]'
            : 'text-gray-400 hover:text-blue-600 hover:bg-gray-100'
        }`}
      >
        {badge ? (
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors ${
            isDark
              ? 'bg-[#1B2D4A] text-blue-300 border-[#335075] hover:border-blue-500/50'
              : 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400'
          }`}>
            <span>{badge}</span>
            <Info className="w-2.5 h-2.5 opacity-70" />
          </span>
        ) : (
          <HelpCircle className={iconSize} />
        )}
      </button>

      {/* Popover Tooltip — visible on hover (desktop) or tap (mobile) */}
      {isOpen && (
        <div
          role="tooltip"
          className={`absolute z-50 w-72 max-w-xs p-2.5 text-[11px] leading-relaxed rounded-xl shadow-xl border font-sans animate-in fade-in zoom-in-95 duration-150 ${positionClasses[position]} ${
            isDark
              ? 'bg-[#1B2D4A] text-[#D1D5DB] border-[#335075] shadow-black/80'
              : 'bg-white text-slate-700 border-slate-200 shadow-slate-300/80'
          }`}
        >
          <div className="flex items-start gap-2">
            <Info className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <div className="text-left font-normal break-words">{content}</div>
          </div>
        </div>
      )}
    </div>
  );
};
