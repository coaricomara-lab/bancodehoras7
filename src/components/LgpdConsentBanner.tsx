import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, Lock, ExternalLink } from 'lucide-react';

interface LgpdConsentBannerProps {
  isDark?: boolean;
}

const STORAGE_KEY = 'comara_lgpd_consent_v1';

export const LgpdConsentBanner: React.FC<LgpdConsentBannerProps> = ({ isDark = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleAcknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        acceptedAt: new Date().toISOString(),
        version: '1.0',
      }));
    } catch (err) {
      console.warn('Erro ao salvar aceite de LGPD:', err);
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      role="region"
      aria-label="Aviso de Privacidade e LGPD"
      className={`fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 border-t shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-6 ${
        isDark
          ? 'bg-[#0B1426]/95 border-[#233654] text-[#E2E8F0]'
          : 'bg-white/95 border-slate-200 text-slate-800'
      }`}
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
            isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold tracking-tight">Privacidade & Proteção de Dados (LGPD)</h2>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                Lei 13.709/2018
              </span>
            </div>
            <p className={`text-[11px] sm:text-xs leading-relaxed ${isDark ? 'text-[#94A3B8]' : 'text-slate-600'}`}>
              Os dados de identificação funcional (CPF, Matrícula e Extrato de Horas) são tratados exclusivamente para fins de controle e transparência do Banco de Horas SPTF da COMARA, com proteção de acesso individual, criptografia de senhas e auditoria imutável.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={handleAcknowledge}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Ciente</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
