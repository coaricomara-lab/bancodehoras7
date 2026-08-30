import React, { useState } from 'react';
import { 
  AlertCircle, 
  X, 
  Lock,
  ShieldCheck 
} from 'lucide-react';
import { authService } from '../services/authService';
import { ComaraLogo } from './ComaraLogo';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => Promise<any>;
  onEmailSignIn?: (email: string, pass: string) => Promise<void>;
  isDark: boolean;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onGoogleSignIn,
  isDark,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSubmit = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await onGoogleSignIn() as any;
      if (res?.success) {
        await authService.logAccess(
          'ADMIN_AUTH',
          'Google Workspace User',
          'LOGIN_GESTAO_RH',
          true,
          'Login administrativo RH via Google Workspace autenticado com sucesso'
        );
        onClose();
      } else if (res?.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      console.error('Erro no login Google:', err);
      setErrorMessage(err?.message || 'Falha ao autenticar com Google Workspace.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 relative animate-in zoom-in-95 ${
        isDark ? 'bg-[#16243D] border-[#335075] text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-5 right-5 p-1.5 rounded-xl border transition-colors active:scale-[0.98] cursor-pointer ${
            isDark ? 'bg-[#243756] border-[#335075] text-gray-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header with Official COMARA Shield */}
        <div className="text-center space-y-2 pt-2">
          <div className="flex justify-center mb-1">
            <ComaraLogo size="lg" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Acesso à Gestão & RH • COMARA
          </h2>
          <p className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
            Autenticação segura via Google Workspace para Gestores e Administradores
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Google Workspace Sign-In */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSubmit}
            disabled={isLoading}
            className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer shadow-md ${
              isDark 
                ? 'bg-[#243756] hover:bg-[#335075] border-[#335075] text-white' 
                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
            } disabled:opacity-50`}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isLoading ? 'Autenticando...' : 'Entrar com Google Workspace'}</span>
          </button>
        </div>

        {/* RBAC Notice */}
        <div className={`p-3 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${
          isDark ? 'bg-[#0F1B33]/60 border-[#243756] text-[#94A3B8]' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <Lock className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <span>Acesso corporativo restrito às contas cadastradas na matriz de permissões RBAC.</span>
        </div>

        {/* Footer info */}
        <div className={`pt-2 text-center text-[11px] ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
          <span>Acesso corporativo seguro • COMARA / FAB</span>
        </div>

      </div>
    </div>
  );
};
