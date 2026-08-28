import React, { useState, useEffect, useMemo, useId } from 'react';
import { Employee, TimeRecord, DispensaSptfRecord, ConstructionSite, SystemConfig, Branch } from '../types';
import { getEmployeeTotalBalance } from '../services/timebankEngine';
import { getSignaturesForCanteiro } from '../services/canteiroService';
import { calculateSPTFBalance, calculateLunchOverlap } from '../utils/calculations';
import { useInstitution } from '../contexts/InstitutionContext';
import { IconButton } from './IconButton';
import { 
  X, 
  Printer, 
  FileText, 
  Clock, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Search, 
  History, 
  PlusCircle, 
  Trash2, 
  ArrowRight,
  Coffee,
  UserCheck,
  Download,
  ExternalLink,
  FileDown
} from 'lucide-react';

export interface SptfDispensaModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  records?: TimeRecord[];
  timeRecords?: TimeRecord[];
  dispensas?: DispensaSptfRecord[];
  constructionSites?: ConstructionSite[];
  onSaveDispensa: (dispensa: DispensaSptfRecord, record: TimeRecord) => Promise<void> | void;
  onDeleteDispensa?: (dispensaId: string, lancamentoId?: string) => Promise<void> | void;
  preselectedMatricula?: string;
  preselectedDate?: string;
  systemConfig?: SystemConfig;
  theme?: 'dark' | 'light';
  currentUserEmail?: string;
  currentUserName?: string;
}

/**
 * Formata data ISO (AAAA-MM-DD) para padrão brasileiro DD/MM/AAAA
 */
export function formatDateBR(isoDate?: string): string {
  if (!isoDate) return '____/____/________';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * REGRA DE CÁLCULO DAS HORAS COM TRAVA DO ALMOÇO
 * Reutiliza o motor central de cálculo calculateLunchOverlap com suporte a horário dinâmico
 */
export function calculateDispensaHours(
  start: string, 
  end: string, 
  lunchStart = '12:00', 
  lunchEnd = '13:00'
): {
  rawHours: number;
  lunchDeductionHours: number;
  netHours: number;
} {
  return calculateLunchOverlap(start, end, lunchStart, lunchEnd);
}

export function formatHoursToHoursMinutes(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h${m > 0 ? String(m).padStart(2, '0') + 'min' : '00'}`;
}

// ============================================================================
// COMPONENTE DE LOGO COM FALLBACK VETORIAL PARA IMPRESSÃO E TELA
// ============================================================================
const DispensaLogo: React.FC<{ logoUrl?: string; institutionSigla?: string }> = ({ logoUrl, institutionSigla }) => {
  const [imgError, setImgError] = useState(false);
  let instSettings: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const inst = useInstitution();
    instSettings = inst?.settings;
  } catch {
    // Graceful fallback
  }

  const sigla = institutionSigla || instSettings?.siglaInstituicao || 'COMARA';
  const effectiveSrc = (logoUrl && logoUrl.trim().length > 0) 
    ? logoUrl 
    : (instSettings?.logoUrl && instSettings.logoUrl.trim().length > 0)
      ? instSettings.logoUrl
      : '/comara-logo.png';

  if (!imgError) {
    return (
      <img 
        src={effectiveSrc} 
        alt={`Logo ${sigla}`} 
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        className="h-[52px] sm:h-[58px] w-auto max-h-[58px] max-w-[80px] object-contain shrink-0"
        onError={() => setImgError(true)}
      />
    );
  }

  // Brasão e Gládio Alado Vetorial Oficial de Alta Resolução
  return (
    <div className="h-[52px] sm:h-[58px] w-auto flex items-center justify-center shrink-0">
      <svg viewBox="0 0 100 120" className="h-full w-auto max-h-[58px]" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 6 6 L 94 6 L 94 65 C 94 95 74 114 50 114 C 26 114 6 95 6 65 Z" fill="#0F1B33" stroke="#11203A" strokeWidth="3" />
        <path d="M 9 9 L 91 9 L 91 65 C 91 92 72 111 50 111 C 28 111 9 92 9 65 Z" fill="#11203A" />
        {/* Banner Superior */}
        <rect x="12" y="14" width="76" height="18" rx="3" fill="#1E40AF" stroke="#60A5FA" strokeWidth="1" />
        <text x="50" y="27" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">{sigla}</text>
        {/* Espada / Gládio */}
        <path d="M 49 38 L 51 38 L 51 96 L 49 96 Z" fill="#F59E0B" />
        <path d="M 43 49 L 57 49 L 57 53 L 43 53 Z" fill="#F59E0B" />
        <path d="M 50 34 L 54 38 L 46 38 Z" fill="#FDE047" />
        {/* Asas */}
        <path d="M 46 54 C 34 46 18 48 12 56 C 22 59 34 62 46 66 Z" fill="#93C5FD" />
        <path d="M 54 54 C 66 46 82 48 88 56 C 78 59 66 62 54 66 Z" fill="#93C5FD" />
      </svg>
    </div>
  );
};

// ============================================================================
// COMPONENTE DE UMA VIA INDIVIDUAL DA DISPENSA DE SPTF (LAYOUT DA PLANILHA)
// ============================================================================
export interface DispensaViaProps {
  dispensa: DispensaSptfRecord;
  viaIndex?: 1 | 2;
  constructionSites?: ConstructionSite[];
  logoUrl?: string;
}

export const DispensaVia: React.FC<DispensaViaProps> = ({ 
  dispensa, 
  constructionSites,
  logoUrl 
}) => {
  let instSettings: any = null;
  let instCargos: any[] = [];
  let instDocumentosModelo: any = null;

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const inst = useInstitution();
    instSettings = inst?.settings;
    instCargos = inst?.cargos || [];
    instDocumentosModelo = inst?.documentosModelo;
  } catch {
    // Graceful fallback
  }

  const dataFmt = formatDateBR(dispensa.data);
  const periodoStr = `${dataFmt} (${dispensa.horarioInicio}) A ${dataFmt} (${dispensa.horarioFim})`;
  const matriculaStr = dispensa.matricula || dispensa.saram || '';
  const secaoStr = dispensa.secaoCanteiro || 'DECO-KO';
  const motivoStr = dispensa.motivo || instDocumentosModelo?.textoPadraoMotivoDispensa || 'COMPENSAÇÃO BANCO DE HORAS';
  const tituloDispensa = instDocumentosModelo?.tituloDispensa || 'DISPENSA DE SPTF';

  // Obter dinamicamente os signatários oficiais do Canteiro
  const sigs = useMemo(() => {
    return getSignaturesForCanteiro(dispensa.secaoCanteiro, constructionSites);
  }, [dispensa.secaoCanteiro, constructionSites]);

  const cargo1 = instCargos.find(c => c.ordem === 1)?.nome || 'CHEFE DO CANTEIRO';
  const cargo2 = instCargos.find(c => c.ordem === 2)?.nome || 'CH/ENC DA DA';
  const cargoServidor = instCargos.find(c => c.ordem === 3)?.nome || 'SERVIDOR (SPPF/SPTF)';

  const chefeCanteiroNome = sigs.assinatura1.nome || cargo1;
  const chefeDaNome = sigs.assinatura2.nome || cargo2;

  return (
    <div className="dispensa-via w-full border-2 border-black bg-white text-black font-sans leading-tight">
      {/* ------------------------------------------------------------- */}
      {/* CABEÇALHO: Célula Esquerda (Logo) | Célula Direita (Título)    */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-12 border-b-2 border-black">
        {/* Célula Esquerda: Logo da OM */}
        <div className="col-span-3 sm:col-span-3 flex items-center justify-center p-2.5 border-r-2 border-black bg-white">
          <DispensaLogo logoUrl={logoUrl || instSettings?.logoUrl} institutionSigla={instSettings?.siglaInstituicao} />
        </div>

        {/* Célula Direita: Título centralizado em negrito e caixa alta */}
        <div className="col-span-9 sm:col-span-9 flex items-center justify-center p-3 bg-white text-center">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
            {tituloDispensa}
          </h1>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* LINHA 1: NOME: [Nome do Colaborador]                           */}
      {/* ------------------------------------------------------------- */}
      <div className="border-b-2 border-black p-2.5 px-3 flex items-center gap-2 bg-white">
        <span className="font-black text-xs sm:text-sm uppercase tracking-wide shrink-0 text-black">
          NOME:
        </span>
        <span className="font-bold text-xs sm:text-sm uppercase text-black truncate">
          {dispensa.nome}
        </span>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* LINHA 2: MATRÍCULA: [Matrícula] | SEÇÃO: [Seção/Canteiro]      */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-12 border-b-2 border-black divide-x-2 divide-black bg-white">
        <div className="col-span-6 p-2.5 px-3 flex items-center gap-2">
          <span className="font-black text-xs sm:text-sm uppercase tracking-wide shrink-0 text-black">
            MATRÍCULA:
          </span>
          <span className="font-bold text-xs sm:text-sm font-mono text-black">
            {matriculaStr}
          </span>
        </div>
        <div className="col-span-6 p-2.5 px-3 flex items-center gap-2">
          <span className="font-black text-xs sm:text-sm uppercase tracking-wide shrink-0 text-black">
            SEÇÃO:
          </span>
          <span className="font-bold text-xs sm:text-sm uppercase text-black">
            {secaoStr}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* LINHA 3: PERÍODO: [...] | MOTIVO: [...]                        */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-12 border-b-2 border-black divide-x-2 divide-black bg-white">
        <div className="col-span-7 sm:col-span-6 p-2.5 px-3 flex items-center gap-2">
          <span className="font-black text-xs sm:text-sm uppercase tracking-wide shrink-0 text-black">
            PERÍODO:
          </span>
          <span className="font-bold text-[11px] sm:text-xs text-black">
            {periodoStr}
          </span>
        </div>
        <div className="col-span-5 sm:col-span-6 p-2.5 px-3 flex items-center gap-2">
          <span className="font-black text-xs sm:text-sm uppercase tracking-wide shrink-0 text-black">
            MOTIVO:
          </span>
          <span className="font-bold text-xs sm:text-sm uppercase text-black truncate">
            {motivoStr}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RODAPÉ: RECEBIMENTO E ASSINATURAS (4 BLOCOS OFICIAIS)          */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-4 divide-x-2 divide-black min-h-[96px] bg-white">
        {/* Bloco 1: RECEBIDO POR: */}
        <div className="p-2 sm:p-2.5 flex flex-col justify-between text-[11px]">
          <span className="font-black uppercase text-[11px] sm:text-xs block text-black leading-tight">
            RECEBIDO POR:
          </span>
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-1 font-bold text-[10px] sm:text-[11px] text-black">
              <span>DATA:</span>
              <span className="font-mono tracking-wider font-normal">___/___/______</span>
            </div>
            <div className="flex items-center gap-1 font-bold text-[10px] sm:text-[11px] text-black">
              <span>HORA:</span>
              <span className="font-mono tracking-wider font-normal">___:___</span>
            </div>
          </div>
        </div>

        {/* Bloco 2: Assinatura CHEFE DO CANTEIRO */}
        <div className="p-2 sm:p-2.5 flex flex-col justify-between text-center">
          <div className="h-10 sm:h-12 flex items-end justify-center">
            <div className="w-4/5 border-b border-black"></div>
          </div>
          <div className="pt-1">
            <span className="font-black uppercase text-[11px] sm:text-xs block text-black leading-tight">
              {cargo1}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-800 block truncate mt-0.5" title={chefeCanteiroNome}>
              {chefeCanteiroNome}
            </span>
          </div>
        </div>

        {/* Bloco 3: Assinatura SERVIDOR */}
        <div className="p-2 sm:p-2.5 flex flex-col justify-between text-center">
          <div className="h-10 sm:h-12 flex items-end justify-center">
            <div className="w-4/5 border-b border-black"></div>
          </div>
          <div className="pt-1">
            <span className="font-black uppercase text-[11px] sm:text-xs block text-black leading-tight">
              {cargoServidor}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-800 block truncate mt-0.5" title={dispensa.nome}>
              {dispensa.nome}
            </span>
          </div>
        </div>

        {/* Bloco 4: Assinatura CH/ENC DA DA */}
        <div className="p-2 sm:p-2.5 flex flex-col justify-between text-center">
          <div className="h-10 sm:h-12 flex items-end justify-center">
            <div className="w-4/5 border-b border-black"></div>
          </div>
          <div className="pt-1">
            <span className="font-black uppercase text-[11px] sm:text-xs block text-black leading-tight">
              {cargo2}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-800 block truncate mt-0.5" title={chefeDaNome}>
              {chefeDaNome}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// GERADOR DE HTML COMPLETO E AUTÔNOMO PARA IMPRESSÃO PERFEITA EM 2 VIAS A4
// ============================================================================
export function generateSptfPrintHtml(
  dispensa: DispensaSptfRecord,
  constructionSites?: ConstructionSite[],
  logoUrl?: string,
  institutionSettings?: any
): string {
  const dataFmt = formatDateBR(dispensa.data);
  const periodoStr = `${dataFmt} (${dispensa.horarioInicio}) A ${dataFmt} (${dispensa.horarioFim})`;
  const matriculaStr = dispensa.matricula || dispensa.saram || '';
  const secaoStr = dispensa.secaoCanteiro || 'DECO-KO';
  const docModelo = institutionSettings?.documentosModelo;
  const motivoStr = dispensa.motivo || docModelo?.textoPadraoMotivoDispensa || 'COMPENSAÇÃO BANCO DE HORAS';
  const tituloDispensa = docModelo?.tituloDispensa || 'DISPENSA DE SPTF';
  const siglaInst = institutionSettings?.siglaInstituicao || 'COMARA';

  const sigs = getSignaturesForCanteiro(dispensa.secaoCanteiro, constructionSites);
  const cargosList = institutionSettings?.cargos || [];
  const cargo1 = cargosList.find((c: any) => c.ordem === 1)?.nome || 'CHEFE DO CANTEIRO';
  const cargo2 = cargosList.find((c: any) => c.ordem === 2)?.nome || 'CH/ENC DA DA';
  const cargoServidor = cargosList.find((c: any) => c.ordem === 3)?.nome || 'SERVIDOR (SPPF/SPTF)';

  const chefeCanteiroNome = sigs.assinatura1.nome || cargo1;
  const chefeDaNome = sigs.assinatura2.nome || cargo2;

  const effectiveLogoSrc = logoUrl || institutionSettings?.logoUrl;

  // Brasão e Gládio Alado Vetorial Oficial
  const svgLogoHtml = `
    <svg viewBox="0 0 100 120" style="height:55px; width:auto; max-height:55px; display:inline-block;" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 6 6 L 94 6 L 94 65 C 94 95 74 114 50 114 C 26 114 6 95 6 65 Z" fill="#0F1B33" stroke="#11203A" stroke-width="3" />
      <path d="M 9 9 L 91 9 L 91 65 C 91 92 72 111 50 111 C 28 111 9 92 9 65 Z" fill="#11203A" />
      <rect x="12" y="14" width="76" height="18" rx="3" fill="#1E40AF" stroke="#60A5FA" stroke-width="1" />
      <text x="50" y="27" fill="#FFFFFF" font-size="10" font-weight="900" text-anchor="middle" font-family="sans-serif">${siglaInst}</text>
      <path d="M 49 38 L 51 38 L 51 96 L 49 96 Z" fill="#F59E0B" />
      <path d="M 43 49 L 57 49 L 57 53 L 43 53 Z" fill="#F59E0B" />
      <path d="M 50 34 L 54 38 L 46 38 Z" fill="#FDE047" />
      <path d="M 46 54 C 34 46 18 48 12 56 C 22 59 34 62 46 66 Z" fill="#93C5FD" />
      <path d="M 54 54 C 66 46 82 48 88 56 C 78 59 66 62 54 66 Z" fill="#93C5FD" />
    </svg>
  `;

  const logoCellHtml = (effectiveLogoSrc && effectiveLogoSrc.trim().length > 0)
    ? `<img src="${effectiveLogoSrc}" alt="Logo ${siglaInst}" crossorigin="anonymous" referrerpolicy="no-referrer" style="height:55px; width:auto; max-height:58px; max-width:80px; object-fit:contain; display:inline-block; vertical-align:middle;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';" /><div style="display:none;">${svgLogoHtml}</div>`
    : svgLogoHtml;

  const renderViaHtml = () => `
    <div class="dispensa-via" style="width:100%; border:2px solid #000; background:#fff; color:#000; font-family:Arial, Helvetica, sans-serif; box-sizing:border-box; margin:0;">
      <!-- CABEÇALHO -->
      <table style="width:100%; border-collapse:collapse; border-bottom:2px solid #000; margin:0; padding:0;">
        <tr>
          <td style="width:25%; border-right:2px solid #000; padding:8px; text-align:center; vertical-align:middle; background:#fff;">
            ${logoCellHtml}
          </td>
          <td style="width:75%; padding:10px; text-align:center; vertical-align:middle; background:#fff;">
            <h1 style="margin:0; font-size:22px; font-weight:900; text-transform:uppercase; letter-spacing:1.5px; color:#000; font-family:Arial, Helvetica, sans-serif;">
              ${tituloDispensa}
            </h1>
          </td>
        </tr>
      </table>

      <!-- LINHA 1: NOME -->
      <table style="width:100%; border-collapse:collapse; border-bottom:2px solid #000; margin:0; padding:0;">
        <tr>
          <td style="padding:7px 12px; font-size:13px; color:#000; background:#fff;">
            <strong style="text-transform:uppercase; margin-right:8px;">NOME:</strong>
            <span style="font-weight:700; text-transform:uppercase;">${dispensa.nome}</span>
          </td>
        </tr>
      </table>

      <!-- LINHA 2: MATRÍCULA E SEÇÃO -->
      <table style="width:100%; border-collapse:collapse; border-bottom:2px solid #000; margin:0; padding:0;">
        <tr>
          <td style="width:50%; border-right:2px solid #000; padding:7px 12px; font-size:13px; color:#000; background:#fff;">
            <strong style="text-transform:uppercase; margin-right:8px;">MATRÍCULA:</strong>
            <span style="font-weight:700; font-family:monospace, Courier;">${matriculaStr}</span>
          </td>
          <td style="width:50%; padding:7px 12px; font-size:13px; color:#000; background:#fff;">
            <strong style="text-transform:uppercase; margin-right:8px;">SEÇÃO:</strong>
            <span style="font-weight:700; text-transform:uppercase;">${secaoStr}</span>
          </td>
        </tr>
      </table>

      <!-- LINHA 3: PERÍODO E MOTIVO -->
      <table style="width:100%; border-collapse:collapse; border-bottom:2px solid #000; margin:0; padding:0;">
        <tr>
          <td style="width:55%; border-right:2px solid #000; padding:7px 12px; font-size:12px; color:#000; background:#fff;">
            <strong style="text-transform:uppercase; margin-right:8px;">PERÍODO:</strong>
            <span style="font-weight:700;">${periodoStr}</span>
          </td>
          <td style="width:45%; padding:7px 12px; font-size:12px; color:#000; background:#fff;">
            <strong style="text-transform:uppercase; margin-right:8px;">MOTIVO:</strong>
            <span style="font-weight:700; text-transform:uppercase;">${motivoStr}</span>
          </td>
        </tr>
      </table>

      <!-- RODAPÉ: 4 BLOCOS OFICIAIS -->
      <table style="width:100%; border-collapse:collapse; margin:0; padding:0;">
        <tr>
          <!-- BLOCO 1: RECEBIDO POR -->
          <td style="width:25%; border-right:2px solid #000; padding:6px 8px; vertical-align:top; font-size:11px; height:84px; background:#fff;">
            <strong style="text-transform:uppercase; display:block; margin-bottom:6px; font-size:11px;">RECEBIDO POR:</strong>
            <div style="font-weight:700; margin-bottom:4px; font-size:11px;">DATA: <span style="font-family:monospace; font-weight:normal;">___/___/______</span></div>
            <div style="font-weight:700; font-size:11px;">HORA: <span style="font-family:monospace; font-weight:normal;">___:___</span></div>
          </td>

          <!-- BLOCO 2: CHEFE DO CANTEIRO -->
          <td style="width:25%; border-right:2px solid #000; padding:6px 4px; text-align:center; vertical-align:bottom; height:84px; background:#fff;">
            <div style="width:85%; margin:0 auto 4px auto; border-bottom:1px solid #000;"></div>
            <strong style="text-transform:uppercase; font-size:11px; display:block; line-height:1.1;">${cargo1}</strong>
            <span style="font-size:9px; text-transform:uppercase; font-weight:700; color:#16243D; display:block; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${chefeCanteiroNome}</span>
          </td>

          <!-- BLOCO 3: SERVIDOR -->
          <td style="width:25%; border-right:2px solid #000; padding:6px 4px; text-align:center; vertical-align:bottom; height:84px; background:#fff;">
            <div style="width:85%; margin:0 auto 4px auto; border-bottom:1px solid #000;"></div>
            <strong style="text-transform:uppercase; font-size:11px; display:block; line-height:1.1;">${cargoServidor}</strong>
            <span style="font-size:9px; text-transform:uppercase; font-weight:700; color:#16243D; display:block; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${dispensa.nome}</span>
          </td>

          <!-- BLOCO 4: CH/ENC DA DA -->
          <td style="width:25%; padding:6px 4px; text-align:center; vertical-align:bottom; height:84px; background:#fff;">
            <div style="width:85%; margin:0 auto 4px auto; border-bottom:1px solid #000;"></div>
            <strong style="text-transform:uppercase; font-size:11px; display:block; line-height:1.1;">${cargo2}</strong>
            <span style="font-size:9px; text-transform:uppercase; font-weight:700; color:#16243D; display:block; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${chefeDaNome}</span>
          </td>
        </tr>
      </table>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Guia Dispensa SPTF - ${dispensa.numeroGuia} - ${dispensa.nome}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
    }
    .no-print {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 24px;
      background: #0F172A;
      color: #fff;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .no-print button {
      cursor: pointer;
      padding: 8px 16px;
      font-weight: bold;
      font-size: 13px;
      border-radius: 8px;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease-in-out;
    }
    .btn-print { background: #059669; color: #fff; }
    .btn-print:hover { background: #10b981; }
    .btn-close { background: #475569; color: #fff; }
    .btn-close:hover { background: #64748b; }
    .page-container {
      max-width: 210mm;
      margin: 0 auto;
      background: #fff;
      padding: 4mm;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .cut-line {
      text-align: center;
      font-family: monospace;
      font-size: 13px;
      font-weight: bold;
      color: #000;
      letter-spacing: 2px;
      margin: 16px 0;
      user-select: none;
    }
    @media print {
      body {
        background: #fff !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .page-container {
        padding: 0 !important;
        margin: 0 !important;
        box-shadow: none !important;
        width: 100% !important;
        max-width: none !important;
      }
      .dispensa-via {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <div>
      <strong style="font-size:14px; letter-spacing:0.5px;">COMARA • Guia Oficial de Dispensa de SPTF (2 Vias A4)</strong>
      <div style="font-size:12px; color:#94a3b8; margin-top:2px;">${dispensa.numeroGuia} • ${dispensa.nome} (${matriculaStr})</div>
    </div>
    <div style="display:flex; gap:10px;">
      <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
      <button class="btn-close" onclick="window.close()">✕ Fechar Janela</button>
    </div>
  </div>

  <div class="page-container">
    ${renderViaHtml()}
    <div class="cut-line">Obs: ----------------------------------------------------</div>
    ${renderViaHtml()}
  </div>

  <script>
    // Auto-disparar diálogo de impressão caso venha com parâmetro ou aberto para impressão
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
        } catch(e) {}
      }, 200);
    });
  </script>
</body>
</html>`;
}

// ============================================================================
// TEMPLATE DE IMPRESSÃO A4 (2 VIAS SEPARADAS POR OBS: -----)
// ============================================================================
export interface DispensaPrintTemplateProps {
  dispensa: DispensaSptfRecord;
  constructionSites?: ConstructionSite[];
  logoUrl?: string;
}

export const DispensaPrintTemplate: React.FC<DispensaPrintTemplateProps> = ({ 
  dispensa, 
  constructionSites,
  logoUrl 
}) => {
  return (
    <div id="sptf-print-container" className="w-full bg-white text-black p-2 sm:p-4 print:p-0">
      {/* 1ª VIA */}
      <DispensaVia dispensa={dispensa} viaIndex={1} constructionSites={constructionSites} logoUrl={logoUrl} />

      {/* LINHA PONTILHADA DE CORTE CONFORME MODELO */}
      <div className="text-center font-mono text-xs sm:text-sm font-bold text-black select-none my-4 sm:my-5 tracking-widest leading-none">
        Obs: ----------------------------------------------------
      </div>

      {/* 2ª VIA (DUPLICAÇÃO IDÊNTICA NA MESMA PÁGINA A4) */}
      <DispensaVia dispensa={dispensa} viaIndex={2} constructionSites={constructionSites} logoUrl={logoUrl} />
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL DO MODAL DE DISPENSA SPTF
// ============================================================================
export const SptfDispensaModal: React.FC<SptfDispensaModalProps> = ({
  isOpen,
  onClose,
  employees,
  records,
  timeRecords,
  dispensas = [],
  constructionSites = [],
  systemConfig,
  onSaveDispensa,
  onDeleteDispensa,
  preselectedMatricula,
  preselectedDate,
  theme = 'dark',
  currentUserEmail = '',
  currentUserName = 'Gestor SPTF'
}) => {
  const isDark = theme === 'dark';
  const modalId = useId();
  const todayStr = new Date().toISOString().split('T')[0];
  const allRecords = useMemo(() => timeRecords || records || [], [timeRecords, records]);

  // Contexto Institucional Dinâmico (Fonte da Verdade)
  const { 
    settings: institutionSettings, 
    cargos: instCargos, 
    sedes: instSedes, 
    horarios: instHorarios, 
    regrasCalculo: instRegrasCalculo, 
    documentosModelo: instDocumentosModelo 
  } = useInstitution();

  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'print'>('form');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMatricula, setSelectedMatricula] = useState<string>('');
  const [secaoCanteiro, setSecaoCanteiro] = useState<string>('DECO-KO');
  const [dataDispensa, setDataDispensa] = useState<string>(todayStr);
  const [horarioInicio, setHorarioInicio] = useState<string>('07:00');
  const [horarioFim, setHorarioFim] = useState<string>('16:00');
  const [motivo, setMotivo] = useState<string>(instDocumentosModelo?.textoPadraoMotivoDispensa || 'COMPENSAÇÃO BANCO DE HORAS');
  const [observacoes, setObservacoes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Guia ativa para impressão
  const [activePrintDispensa, setActivePrintDispensa] = useState<DispensaSptfRecord | null>(null);

  // Inicialização ao abrir
  useEffect(() => {
    if (!isOpen) return;
    const safeDate = typeof preselectedDate === 'string' ? preselectedDate : todayStr;
    const safeMat = typeof preselectedMatricula === 'string' ? preselectedMatricula : '';
    setDataDispensa(safeDate);
    const targetMat = safeMat || (employees.length > 0 ? (selectedMatricula || employees[0].matricula) : '');
    setSelectedMatricula(targetMat);
    if (targetMat) {
      const emp = employees.find(e => e.matricula === targetMat);
      if (emp) {
        const sede = emp.sede_atual || emp.sede || 'KO';
        setSecaoCanteiro(`DECO-${sede}`);
      }
    }
    setFeedbackMsg(null);
  }, [isOpen, preselectedMatricula, preselectedDate]);

  // Listener para fechamento por tecla Escape (Acessibilidade U-002)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Colaborador selecionado
  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.matricula === selectedMatricula);
  }, [employees, selectedMatricula]);

  const handleEmployeeSelectChange = (mat: string) => {
    setSelectedMatricula(mat);
    const emp = employees.find(e => e.matricula === mat);
    if (emp) {
      const sede = emp.sede_atual || emp.sede || 'KO';
      setSecaoCanteiro(`DECO-${sede}`);
    }
  };

  // Cálculo das Horas com regra dinâmica da Trava do Almoço
  const hoursCalculation = useMemo(() => {
    return calculateDispensaHours(
      horarioInicio, 
      horarioFim, 
      instHorarios?.inicioAlmoco || '12:00', 
      instHorarios?.fimAlmoco || '13:00'
    );
  }, [horarioInicio, horarioFim, instHorarios?.inicioAlmoco, instHorarios?.fimAlmoco]);

  const calculatedHours = hoursCalculation.netHours;

  // Saldo do colaborador
  const employeeCurrentBalance = useMemo(() => {
    if (!selectedEmployee) return 0;
    return getEmployeeTotalBalance(selectedEmployee.matricula, employees, allRecords).saldoTotalHoras;
  }, [selectedEmployee, employees, allRecords]);

  const forecastedBalance = useMemo(() => {
    return employeeCurrentBalance - calculatedHours;
  }, [employeeCurrentBalance, calculatedHours]);

  // Filtragem de histórico de dispensas
  const filteredDispensas = useMemo(() => {
    if (!searchTerm.trim()) return dispensas;
    const term = searchTerm.toLowerCase();
    return dispensas.filter(d => 
      d.nome.toLowerCase().includes(term) ||
      d.matricula.toLowerCase().includes(term) ||
      (d.numeroGuia && d.numeroGuia.toLowerCase().includes(term)) ||
      (d.secaoCanteiro && d.secaoCanteiro.toLowerCase().includes(term))
    );
  }, [dispensas, searchTerm]);

  // Objeto temporário para visualização em tempo real caso não haja guia gravada ainda
  const previewDispensa: DispensaSptfRecord = useMemo(() => {
    if (activePrintDispensa) return activePrintDispensa;
    return {
      id: 'preview',
      numeroGuia: `${institutionSettings?.siglaInstituicao || 'SPTF'}-2026/___`,
      matricula: selectedEmployee?.matricula || '______',
      nome: selectedEmployee?.nome || 'COLABORADOR NÃO SELECIONADO',
      saram: selectedEmployee?.matricula || '______',
      secaoCanteiro: secaoCanteiro || 'DECO-KO',
      data: dataDispensa,
      horarioInicio,
      horarioFim,
      totalHoras: calculatedHours,
      motivo: motivo || instDocumentosModelo?.textoPadraoMotivoDispensa || 'COMPENSAÇÃO BANCO DE HORAS',
      observacoes: observacoes.trim(),
      emitidoPorNome: currentUserName,
      emitidoPorEmail: currentUserEmail,
      emitidoEm: new Date().toISOString(),
      status: 'EMITIDA',
    };
  }, [activePrintDispensa, selectedEmployee, secaoCanteiro, dataDispensa, horarioInicio, horarioFim, calculatedHours, motivo, observacoes, currentUserName, currentUserEmail, institutionSettings?.siglaInstituicao, instDocumentosModelo?.textoPadraoMotivoDispensa]);

  const handleGenerateAndPrint = async () => {
    if (!selectedEmployee) {
      setFeedbackMsg({ type: 'error', text: 'Selecione um colaborador válido.' });
      return;
    }
    if (calculatedHours <= 0) {
      setFeedbackMsg({ type: 'error', text: 'O horário selecionado deve resultar em horas válidas a abater (maior que zero após dedução do almoço).' });
      return;
    }
    if (!dataDispensa) {
      setFeedbackMsg({ type: 'error', text: 'Informe a data da dispensa.' });
      return;
    }

    setIsSaving(true);
    setFeedbackMsg(null);

    try {
      const now = new Date();
      const ano = now.getFullYear();
      const numeroGuia = `DISP-${ano}-${Date.now().toString().slice(-6)}`;
      const dispensaId = `dispensa_${Date.now()}_${selectedEmployee.matricula}`;
      const lancamentoId = `lanc_dispensa_${Date.now()}_${selectedEmployee.matricula}`;

      const dispensaRecord: DispensaSptfRecord = {
        id: dispensaId,
        numeroGuia,
        matricula: selectedEmployee.matricula,
        nome: selectedEmployee.nome,
        saram: selectedEmployee.matricula,
        secaoCanteiro: secaoCanteiro || `DECO-${selectedEmployee.sede || 'KO'}`,
        data: dataDispensa,
        horarioInicio,
        horarioFim,
        totalHoras: calculatedHours,
        motivo: motivo || instDocumentosModelo?.textoPadraoMotivoDispensa || 'COMPENSAÇÃO BANCO DE HORAS',
        observacoes: observacoes.trim(),
        emitidoPorNome: currentUserName,
        emitidoPorEmail: currentUserEmail,
        emitidoEm: now.toISOString(),
        lancamentoId,
        status: 'EMITIDA',
      };

      const calcResult = calculateSPTFBalance(
        'DISPENSA_SPTF',
        calculatedHours,
        dataDispensa,
        undefined,
        selectedEmployee.sede as Branch,
        true,
        horarioInicio,
        horarioFim,
        { horarios: instHorarios, regrasCalculo: instRegrasCalculo }
      );

      const lunchStartDisp = instHorarios?.inicioAlmoco || '12h';
      const lunchEndDisp = instHorarios?.fimAlmoco || '13h';

      const timeRecord: TimeRecord = {
        id: lancamentoId,
        matricula: selectedEmployee.matricula,
        employeeName: selectedEmployee.nome,
        employeeSede: selectedEmployee.sede || 'KO',
        employeeFuncao: selectedEmployee.funcao || 'Técnico de Manutenção',
        employeeAvatarUrl: selectedEmployee.avatarUrl || selectedEmployee.url_foto_perfil,
        dataRegistro: dataDispensa,
        data_ocorrencia: dataDispensa,
        tipoOcorrencia: 'DISPENSA_SPTF',
        horasBrutas: calculatedHours,
        multiplicador: calcResult.multiplicador,
        saldoCalculado: calcResult.saldoCalculado,
        saldo_remanescente: 0,
        status_compensacao: 'TOTALMENTE_COMPENSADO',
        liquidacoes: [],
        eFeriado: calcResult.eFeriado,
        diaSemana: calcResult.diaSemana,
        diaSemanaNome: calcResult.diaSemanaNome,
        observacao: `Dispensa SPTF Nº ${numeroGuia} (${horarioInicio} às ${horarioFim}) - Motivo: ${motivo}${hoursCalculation.lunchDeductionHours > 0 ? ` [Trava de Almoço ${lunchStartDisp}-${lunchEndDisp}: -` + hoursCalculation.lunchDeductionHours + 'h]' : ''}${observacoes ? ' - ' + observacoes : ''}`,
        criadoEm: now.toISOString(),
        criadoPorEmail: currentUserEmail,
        atualizadoEm: now.toISOString(),
      };

      await onSaveDispensa(dispensaRecord, timeRecord);

      setActivePrintDispensa(dispensaRecord);
      setActiveTab('print');
      setFeedbackMsg({ type: 'success', text: `Guia ${numeroGuia} emitida e debitada com sucesso (-${calculatedHours.toFixed(1)}h no Banco de Horas)!` });

      // Disparar impressão automaticamente após emitir
      setTimeout(() => {
        try {
          const effectiveLogo = institutionSettings?.logoUrl || systemConfig?.logoUrl;
          const printHtml = generateSptfPrintHtml(dispensaRecord, constructionSites, effectiveLogo, institutionSettings);
          let iframe = document.getElementById('sptf-print-iframe') as HTMLIFrameElement | null;
          if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'sptf-print-iframe';
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.style.visibility = 'hidden';
            document.body.appendChild(iframe);
          }
          const doc = iframe.contentWindow?.document || iframe.contentDocument;
          if (doc) {
            doc.open();
            doc.write(printHtml);
            doc.close();
            setTimeout(() => {
              iframe?.contentWindow?.focus();
              iframe?.contentWindow?.print();
            }, 300);
          }
        } catch (e) {
          console.warn('Auto print trigger falhou:', e);
        }
      }, 350);
    } catch (err: any) {
      console.error('Erro ao emitir dispensa:', err);
      setFeedbackMsg({ type: 'error', text: err?.message || 'Falha ao salvar a Dispensa de SPTF.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = (dispensaTarget?: DispensaSptfRecord) => {
    const dispensaToPrint = dispensaTarget || previewDispensa;
    const effectiveLogo = institutionSettings?.logoUrl || systemConfig?.logoUrl;
    try {
      // 1. Sempre abrir a aba de visualização/impressão
      if (dispensaTarget) {
        setActivePrintDispensa(dispensaTarget);
      }
      setActiveTab('print');

      // 2. Criar HTML de impressão com contexto institucional
      const printHtml = generateSptfPrintHtml(dispensaToPrint, constructionSites, effectiveLogo, institutionSettings);

      // 3. Tentar imprimir via iframe dedicado
      let iframe = document.getElementById('sptf-print-iframe') as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'sptf-print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(printHtml);
        doc.close();

        setTimeout(() => {
          try {
            iframe?.contentWindow?.focus();
            iframe?.contentWindow?.print();
          } catch (err) {
            console.warn('Iframe print bloqueado pelo navegador, tentando window.print():', err);
            window.print();
          }
        }, 350);
        return;
      }
    } catch (e) {
      console.warn('Erro ao preparar impressão:', e);
    }

    // Fallback: window.print()
    try {
      window.print();
    } catch (e) {
      handleOpenInNewTab();
    }
  };

  const handleOpenInNewTab = () => {
    try {
      const effectiveLogo = institutionSettings?.logoUrl || systemConfig?.logoUrl;
      const printHtml = generateSptfPrintHtml(previewDispensa, constructionSites, effectiveLogo, institutionSettings);
      const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.focus();
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Falha ao abrir em nova aba:', err);
      handleDownloadHtml();
    }
  };

  const handleDownloadHtml = () => {
    try {
      const effectiveLogo = institutionSettings?.logoUrl || systemConfig?.logoUrl;
      const printHtml = generateSptfPrintHtml(previewDispensa, constructionSites, effectiveLogo, institutionSettings);
      const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = (previewDispensa.nome || 'Colaborador').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Guia_Dispensa_SPTF_${previewDispensa.matricula || 'MAT'}_${safeName}.html`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Falha ao baixar arquivo HTML:', err);
      setFeedbackMsg({ type: 'error', text: 'Não foi possível fazer o download do arquivo de impressão.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id={`modal-${modalId}`}
      className="printable-modal fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible"
      role="dialog"
      aria-modal="true"
    >
      {/* ============================================================== */}
      {/* ESTILOS DE IMPRESSÃO (@MEDIA PRINT) ULTRA-PRECISOS PARA A4     */}
      {/* ============================================================== */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          #sptf-print-container, #sptf-print-container * {
            visibility: visible;
          }
          #sptf-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .dispensa-via {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}} />

      <div className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border ${
        isDark 
          ? 'bg-slate-900 border-slate-800 text-slate-100' 
          : 'bg-white border-slate-200 text-slate-900'
      } print:max-h-none print:border-none print:shadow-none print:w-full print:rounded-none`}>
        
        {/* Header do Modal (Oculto na impressão) */}
        <div className="no-print flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-900/40 via-slate-900 to-slate-900 dark:from-blue-950/60 dark:to-slate-900 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Dispensa de SPTF
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  2 Vias A4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Modelo oficial de folha de dispensa com trava de almoço (12h-13h) e débito automático
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Abas de Navegação */}
            <div className="flex bg-slate-800/80 p-1 rounded-lg border border-slate-700">
              <button
                id="btn-tab-form"
                onClick={() => setActiveTab('form')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'form'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Nova Guia
              </button>

              <button
                id="btn-tab-history"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Histórico ({dispensas.length})
              </button>

              <button
                id="btn-tab-print"
                onClick={() => setActiveTab('print')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'print'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir 2 Vias
              </button>
            </div>

            <IconButton
              id="btn-close-sptf-modal"
              icon={X}
              variant="ghost"
              size="md"
              tooltip="Fechar Modal (Esc)"
              aria-label="Fechar Guia de Dispensa SPTF"
              onClick={onClose}
            />
          </div>
        </div>

        {/* Feedback Alert (Oculto na impressão) */}
        {feedbackMsg && (
          <div className={`no-print mx-4 mt-3 p-3 rounded-lg flex items-center gap-2 text-xs font-medium ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}>
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Conteúdo Principal com Rolagem Suave */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0 print:overflow-visible">

          {/* ============================================================ */}
          {/* TAB 1: FORMULÁRIO DE NOVA GUIA DE DISPENSA                    */}
          {/* ============================================================ */}
          {activeTab === 'form' && (
            <div className="no-print space-y-6">
              {/* Seleção do Colaborador e Seção */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    1. Colaborador / Matrícula <span className="text-rose-400">*</span>
                  </label>
                  <select
                    id="select-dispensa-colaborador"
                    value={selectedMatricula}
                    onChange={(e) => handleEmployeeSelectChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all focus:ring-2 focus:ring-blue-500 outline-none ${
                      isDark 
                        ? 'bg-slate-800/90 border-slate-700 text-slate-100 hover:border-slate-600' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 hover:border-slate-400'
                    }`}
                  >
                    <option value="" disabled>-- Selecione o Colaborador --</option>
                    {employees.map(emp => (
                      <option key={emp.matricula} value={emp.matricula}>
                        {emp.nome} ({emp.matricula}) - {emp.funcao || 'Servidor'} [{emp.sede || 'KO'}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seção / Canteiro de Lotação */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    2. Seção / Canteiro <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      id="input-dispensa-secao"
                      type="text"
                      value={secaoCanteiro}
                      onChange={(e) => setSecaoCanteiro(e.target.value.toUpperCase())}
                      placeholder="Ex: DECO-KO"
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm font-medium uppercase transition-all focus:ring-2 focus:ring-blue-500 outline-none ${
                        isDark 
                          ? 'bg-slate-800/90 border-slate-700 text-slate-100' 
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Card de Informações e Saldo em Tempo Real */}
              {selectedEmployee && (
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-sm">
                      {selectedEmployee.nome.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{selectedEmployee.nome}</h4>
                      <p className="text-xs text-slate-400">
                        Matrícula: <span className="font-mono text-slate-300 font-bold">{selectedEmployee.matricula}</span> • Seção: <span className="font-semibold text-slate-300">{secaoCanteiro}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Saldo Atual</span>
                      <span className={`text-sm font-bold font-mono ${
                        employeeCurrentBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {employeeCurrentBalance > 0 ? `+${employeeCurrentBalance.toFixed(1)}h` : `${employeeCurrentBalance.toFixed(1)}h`}
                      </span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-500" />

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Após Dispensa</span>
                      <span className={`text-sm font-bold font-mono ${
                        forecastedBalance >= 0 ? 'text-blue-400' : 'text-amber-400'
                      }`}>
                        {forecastedBalance > 0 ? `+${forecastedBalance.toFixed(1)}h` : `${forecastedBalance.toFixed(1)}h`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Data e Período de Horário */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    3. Data da Dispensa <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      id="input-dispensa-data"
                      type="date"
                      value={dataDispensa}
                      onChange={(e) => setDataDispensa(e.target.value)}
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all focus:ring-2 focus:ring-blue-500 outline-none ${
                        isDark 
                          ? 'bg-slate-800/90 border-slate-700 text-slate-100' 
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    4. Horário de Início <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <input
                      id="input-dispensa-hora-inicio"
                      type="time"
                      value={horarioInicio}
                      onChange={(e) => setHorarioInicio(e.target.value)}
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all focus:ring-2 focus:ring-blue-500 outline-none ${
                        isDark 
                          ? 'bg-slate-800/90 border-slate-700 text-slate-100' 
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    5. Horário de Fim <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <input
                      id="input-dispensa-hora-fim"
                      type="time"
                      value={horarioFim}
                      onChange={(e) => setHorarioFim(e.target.value)}
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all focus:ring-2 focus:ring-blue-500 outline-none ${
                        isDark 
                          ? 'bg-slate-800/90 border-slate-700 text-slate-100' 
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Motivo e Observações */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    6. Motivo da Dispensa <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="input-dispensa-motivo"
                    type="text"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value.toUpperCase())}
                    placeholder="Ex: COMPENSAÇÃO BANCO DE HORAS"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium uppercase transition-all focus:ring-2 focus:ring-blue-500 outline-none ${
                      isDark 
                        ? 'bg-slate-800/90 border-slate-700 text-slate-100' 
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      'COMPENSAÇÃO BANCO DE HORAS',
                      'COMPENSAÇÃO DE JORNADA',
                      'LIBERAÇÃO OPERACIONAL / CHEFIA',
                      'COMPENSAÇÃO DE SOBREAVISO',
                      'ASSUNTOS PARTICULARES'
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setMotivo(preset)}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    7. Observações Adicionais (Opcional)
                  </label>
                  <textarea
                    id="textarea-dispensa-observacoes"
                    rows={2}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações complementares, número de ordem de serviço ou despacho da chefia..."
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-blue-500 outline-none ${
                      isDark 
                        ? 'bg-slate-800/90 border-slate-700 text-slate-100' 
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  id="btn-cancel-dispensa-form"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  id="btn-submit-dispensa-print"
                  type="button"
                  disabled={isSaving || calculatedHours <= 0 || !selectedEmployee}
                  onClick={handleGenerateAndPrint}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 transition-all"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Gravando e Gerando...
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      Emitir & Imprimir (2 Vias A4)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: HISTÓRICO DE DISPENSAS EMITIDAS                       */}
          {/* ============================================================ */}
          {activeTab === 'history' && (
            <div className="no-print space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, guia ou matrícula..."
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <button
                  onClick={() => setActiveTab('form')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Nova Dispensa
                </button>
              </div>

              {filteredDispensas.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
                  <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-400">Nenhuma dispensa encontrada</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Emita novas guias de dispensa na aba "Nova Guia" para registrar abatimentos no Banco de Horas.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                  {filteredDispensas.map((d) => (
                    <div 
                      key={d.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 font-mono text-xs font-bold shrink-0">
                          {d.numeroGuia || 'SPTF'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-200">{d.nome}</span>
                            <span className="text-xs font-mono text-slate-400">({d.matricula})</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                              {d.secaoCanteiro}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Data: <span className="font-medium text-slate-300">{formatDateBR(d.data)}</span> • Período: <span className="font-medium text-slate-300">{d.horarioInicio} às {d.horarioFim}</span> • Débito: <span className="font-bold text-rose-400">-{d.totalHoras.toFixed(1)}h</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <IconButton
                          icon={Printer}
                          variant="success"
                          size="sm"
                          tooltip="Imprimir Guia Oficial em 2 Vias Diretamente"
                          aria-label={`Imprimir Guia de ${d.nome}`}
                          onClick={() => {
                            setActivePrintDispensa(d);
                            setActiveTab('print');
                            setTimeout(() => {
                              try {
                                const printHtml = generateSptfPrintHtml(d, constructionSites, systemConfig?.logoUrl);
                                let iframe = document.getElementById('sptf-print-iframe') as HTMLIFrameElement | null;
                                if (!iframe) {
                                  iframe = document.createElement('iframe');
                                  iframe.id = 'sptf-print-iframe';
                                  iframe.style.position = 'fixed';
                                  iframe.style.right = '0';
                                  iframe.style.bottom = '0';
                                  iframe.style.width = '0';
                                  iframe.style.height = '0';
                                  iframe.style.border = '0';
                                  iframe.style.visibility = 'hidden';
                                  document.body.appendChild(iframe);
                                }
                                const doc = iframe.contentWindow?.document || iframe.contentDocument;
                                if (doc) {
                                  doc.open();
                                  doc.write(printHtml);
                                  doc.close();
                                  setTimeout(() => {
                                    iframe?.contentWindow?.focus();
                                    iframe?.contentWindow?.print();
                                  }, 250);
                                }
                              } catch (e) {
                                console.warn(e);
                              }
                            }, 200);
                          }}
                        />

                        <IconButton
                          icon={ExternalLink}
                          variant="secondary"
                          size="sm"
                          tooltip="Abrir Documento A4 em Nova Aba"
                          aria-label="Abrir em Nova Aba"
                          onClick={() => {
                            const printHtml = generateSptfPrintHtml(d, constructionSites, systemConfig?.logoUrl);
                            const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            window.open(url, '_blank');
                          }}
                        />

                        {onDeleteDispensa && (
                          <IconButton
                            icon={Trash2}
                            variant="danger"
                            size="sm"
                            tooltip="Cancelar Dispensa e Lançamento Vinculado"
                            aria-label="Cancelar Dispensa"
                            onClick={() => {
                              if (window.confirm(`Deseja cancelar a Dispensa ${d.numeroGuia || ''} de ${d.nome}? O lançamento correspondente no Banco de Horas também será cancelado.`)) {
                                onDeleteDispensa(d.id, d.lancamentoId);
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: VISUALIZAÇÃO E IMPRESSÃO OFICIAL (2 VIAS A4)           */}
          {/* ============================================================ */}
          {activeTab === 'print' && (
            <div className="space-y-4">
              {/* Barra de Ações de Impressão (Oculta na folha impressa) */}
              <div className="no-print p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col lg:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Printer className="w-4 h-4 text-emerald-400" />
                    Layout de Impressão Oficial Fiel à Planilha (2 Vias na Folha A4)
                  </h4>
                  <p className="text-xs text-slate-400">
                    O documento é emitido com brasão vetorial de alta definição, 2 vias e 3 blocos de assinaturas oficiais (Chefe do Canteiro, Servidor e CH/ENC DA DA).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-back-to-edit"
                    onClick={() => setActiveTab('form')}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                  >
                    Voltar
                  </button>

                  <IconButton
                    id="btn-open-new-tab"
                    icon={ExternalLink}
                    variant="secondary"
                    size="md"
                    tooltip="Abrir a folha A4 isolada em uma nova aba do navegador"
                    aria-label="Abrir em Nova Aba"
                    onClick={handleOpenInNewTab}
                  />

                  <IconButton
                    id="btn-download-html"
                    icon={Download}
                    variant="secondary"
                    size="md"
                    tooltip="Baixar arquivo HTML oficial pronto para visualização off-line"
                    aria-label="Baixar Arquivo HTML"
                    onClick={handleDownloadHtml}
                  />

                  <button
                    id="btn-print-official-guide"
                    onClick={() => handlePrint()}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
                    title="Disparar diálogo de impressão do navegador"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Agora (2 Vias A4)</span>
                  </button>
                </div>
              </div>

              {/* CONTAINER DA FOLHA DE IMPRESSÃO A4 (2 VIAS IDÊNTICAS) */}
              <div className="p-2 sm:p-6 bg-slate-100 rounded-xl border border-slate-300 shadow-inner overflow-x-auto print:p-0 print:bg-white print:border-none print:shadow-none">
                <DispensaPrintTemplate 
                  dispensa={previewDispensa} 
                  constructionSites={constructionSites}
                  logoUrl={systemConfig?.logoUrl}
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
