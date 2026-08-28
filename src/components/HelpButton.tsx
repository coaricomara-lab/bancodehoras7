import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface HelpButtonProps {
  title: string;
  children: React.ReactNode;
  theme?: 'dark' | 'light';
  className?: string;
}

/**
 * Discrete help button ("?") that opens a lightweight modal with longer
 * explanatory text. Touch-friendly: works on both mobile (tap) and desktop (click).
 * Use for multi-paragraph help that's too long for an InfoTooltip.
 */
export const HelpButton: React.FC<HelpButtonProps> = ({
  title,
  children,
  theme = 'dark',
  className = '',
}) => {
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Ajuda: ${title}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`p-1 rounded-full transition-all inline-flex items-center justify-center border-0 bg-transparent active:scale-95 ${
          isDark
            ? 'text-[#64748B] hover:text-blue-400 hover:bg-[#243756]'
            : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
        } ${className}`}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className={`w-full max-w-md max-h-[80vh] overflow-y-auto p-5 rounded-2xl border shadow-2xl animate-in zoom-in-95 duration-150 ${
              isDark
                ? 'bg-[#16243D] border-[#335075] text-[#E2E8F0]'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <h3 className="text-sm font-bold">{title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-lg transition-colors cursor-pointer active:scale-95 ${
                  isDark ? 'text-[#94A3B8] hover:text-white hover:bg-[#243756]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className={`text-xs leading-relaxed space-y-2 ${isDark ? 'text-[#CBD5E1]' : 'text-slate-600'}`}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
