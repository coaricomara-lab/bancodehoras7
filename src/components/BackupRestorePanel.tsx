import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Download, FileJson, Loader2, ShieldCheck, UploadCloud } from 'lucide-react';
import {
  BackupProgress,
  downloadBackup,
  exportAllData,
  importAllData,
  ImportProgress,
} from '../services/backupService';

interface BackupRestorePanelProps {
  theme: 'dark' | 'light';
  userRole?: string;
}

type PanelProgress = BackupProgress | ImportProgress;

export const BackupRestorePanel: React.FC<BackupRestorePanelProps> = ({ theme, userRole }) => {
  const isDark = theme === 'dark';
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'replace' | 'merge'>('merge');
  const [progress, setProgress] = useState<PanelProgress | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (userRole !== 'SUPER_ADMIN') return null;

  const surface = isDark ? 'bg-[#16243D] border-[#243756] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm';
  const muted = isDark ? 'text-[#94A3B8]' : 'text-slate-500';

  const handleExport = async () => {
    setIsBusy(true);
    setMessage(null);
    setProgress(null);
    try {
      const backup = await exportAllData(setProgress);
      downloadBackup(backup);
      setMessage({ text: 'Backup completo baixado com sucesso.', type: 'success' });
    } catch (error: any) {
      setMessage({ text: error?.message || 'Falha ao exportar o backup.', type: 'error' });
    } finally {
      setIsBusy(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setMessage({ text: 'Selecione um arquivo JSON de backup.', type: 'error' });
      return;
    }
    if (mode === 'replace' && !window.confirm('O modo substituir apagará os dados atuais das coleções configuradas. Deseja continuar?')) {
      return;
    }
    setIsBusy(true);
    setMessage(null);
    setProgress(null);
    try {
      await importAllData(selectedFile, mode, setProgress);
      setMessage({ text: `Backup restaurado com sucesso no modo ${mode === 'replace' ? 'substituir' : 'mesclar'}.`, type: 'success' });
      setSelectedFile(null);
    } catch (error: any) {
      setMessage({ text: error?.message || 'Falha ao restaurar o backup.', type: 'error' });
    } finally {
      setIsBusy(false);
    }
  };

  const progressPercent = progress?.percent ?? 0;

  return (
    <section className={`max-w-4xl mx-auto rounded-2xl border overflow-hidden ${surface}`}>
      <div className={`p-6 border-b ${isDark ? 'border-[#243756]' : 'border-slate-200'}`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Backup e Restauração</h1>
            <p className={`text-xs mt-1 ${muted}`}>Exportação completa das coleções configuradas e restauração controlada da base Firestore.</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid gap-5 md:grid-cols-2">
        <div className={`p-5 rounded-xl border ${isDark ? 'border-[#335075] bg-[#0F1B33]' : 'border-slate-200 bg-slate-50'}`}>
          <Download className="w-5 h-5 text-cyan-500 mb-3" />
          <h2 className="font-bold text-sm">Exportar base completa</h2>
          <p className={`text-xs mt-1 mb-5 ${muted}`}>Gera um arquivo JSON com IDs, campos, tipos nativos e subcoleções registradas.</p>
          <button type="button" onClick={handleExport} disabled={isBusy} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer">
            {isBusy && !selectedFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Baixar Backup Completo
          </button>
        </div>

        <div className={`p-5 rounded-xl border ${isDark ? 'border-[#335075] bg-[#0F1B33]' : 'border-slate-200 bg-slate-50'}`}>
          <UploadCloud className="w-5 h-5 text-amber-500 mb-3" />
          <h2 className="font-bold text-sm">Restaurar backup</h2>
          <label className={`mt-3 flex items-center gap-2 p-3 rounded-lg border border-dashed cursor-pointer text-xs ${isDark ? 'border-[#3A3F4A] hover:bg-[#16243D]' : 'border-slate-300 hover:bg-white'}`}>
            <FileJson className="w-4 h-4 text-amber-500" />
            <span className="truncate">{selectedFile?.name || 'Selecionar arquivo .json'}</span>
            <input type="file" accept="application/json,.json" className="sr-only" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
          </label>
          <div className="flex gap-2 mt-3">
            <label className={`flex-1 text-xs p-2 rounded-lg border cursor-pointer ${mode === 'merge' ? 'border-cyan-500 text-cyan-500' : isDark ? 'border-[#335075]' : 'border-slate-200'}`}>
              <input type="radio" checked={mode === 'merge'} onChange={() => setMode('merge')} className="mr-2" /> Mesclar
            </label>
            <label className={`flex-1 text-xs p-2 rounded-lg border cursor-pointer ${mode === 'replace' ? 'border-rose-500 text-rose-500' : isDark ? 'border-[#335075]' : 'border-slate-200'}`}>
              <input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} className="mr-2" /> Substituir
            </label>
          </div>
          <button type="button" onClick={handleImport} disabled={isBusy || !selectedFile} className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer">
            {isBusy && selectedFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            Restaurar Backup
          </button>
        </div>
      </div>

      {(progress || message) && <div className={`px-6 pb-6 space-y-3 text-xs ${muted}`}>
        {progress && <div><div className="flex justify-between mb-1"><span>{progress.phase === 'reading' ? `Lendo ${progress.collection}` : progress.phase === 'deleting' ? `Apagando ${progress.collection}` : `Gravando ${progress.collection}`}</span><strong>{progressPercent}%</strong></div><div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#335075]' : 'bg-slate-200'}`}><div className="h-full bg-cyan-500 transition-all" style={{ width: `${progressPercent}%` }} /></div></div>}
        {message && <div className={`flex items-center gap-2 p-3 rounded-lg border ${message.type === 'success' ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-rose-500 border-rose-500/30 bg-rose-500/10'}`}>{message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}<span>{message.text}</span></div>}
      </div>}
    </section>
  );
};