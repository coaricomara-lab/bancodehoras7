import React, { useEffect, useState } from 'react';
import { Edit2, X } from 'lucide-react';
import { Branch, ConstructionSite, Employee, EmployeeStatus } from '../types';

interface EditEmployeeModalProps {
  employee: Employee;
  constructionSites?: ConstructionSite[];
  theme?: 'dark' | 'light';
  isSaving?: boolean;
  error?: string;
  onClose: () => void;
  onSave: (employee: Employee) => Promise<void>;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  employee,
  constructionSites = [],
  theme = 'dark',
  isSaving = false,
  error = '',
  onClose,
  onSave,
}) => {
  const isDark = theme === 'dark';
  const [nome, setNome] = useState(employee.nome);
  const [funcao, setFuncao] = useState(employee.funcao || employee.cargo || '');
  const [sedeOrigem, setSedeOrigem] = useState<Branch>(employee.sede_origem || employee.sede);
  const [sedeAtual, setSedeAtual] = useState<Branch>(employee.sede_atual || employee.sede);
  const [canteiroId, setCanteiroId] = useState(employee.canteiroId || '');
  const [dataAdmissao, setDataAdmissao] = useState(employee.dataAdmissao || '');
  const [status, setStatus] = useState<EmployeeStatus>(employee.status);

  useEffect(() => {
    setNome(employee.nome);
    setFuncao(employee.funcao || employee.cargo || '');
    setSedeOrigem(employee.sede_origem || employee.sede);
    setSedeAtual(employee.sede_atual || employee.sede);
    setCanteiroId(employee.canteiroId || '');
    setDataAdmissao(employee.dataAdmissao || '');
    setStatus(employee.status);
  }, [employee]);

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
    isDark ? 'bg-[#0F1B33] border-[#335075] text-[#E2E8F0]' : 'bg-white border-slate-300 text-slate-900'
  }`;
  const labelClass = `mb-1 block text-[11px] font-bold uppercase tracking-wide ${isDark ? 'text-[#94A3B8]' : 'text-slate-600'}`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSave({
      ...employee,
      nome: nome.trim(),
      funcao: funcao.trim() || 'Técnico de Manutenção',
      cargo: funcao.trim() || 'Técnico de Manutenção',
      sede: sedeOrigem,
      sede_origem: sedeOrigem,
      sede_atual: sedeAtual,
      canteiroId: canteiroId || undefined,
      dataAdmissao,
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="edit-employee-title">
      <form onSubmit={handleSubmit} className={`w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'border-[#243756] bg-[#16243D]' : 'border-slate-200 bg-white'}`}>
        <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark ? 'border-[#243756] bg-[#0F1B33]' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2">
            <Edit2 className="h-4 w-4 text-blue-500" />
            <h2 id="edit-employee-title" className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Editar Cadastro</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="cursor-pointer text-slate-400 hover:text-red-400"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {error && <p className="sm:col-span-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">{error}</p>}
          <label className="sm:col-span-2"><span className={labelClass}>Nome Completo</span><input required value={nome} onChange={(event) => setNome(event.target.value)} className={inputClass} /></label>
          <label><span className={labelClass}>Função / Cargo</span><input required value={funcao} onChange={(event) => setFuncao(event.target.value)} className={inputClass} /></label>
          <label><span className={labelClass}>Data de Admissão</span><input required type="date" value={dataAdmissao} onChange={(event) => setDataAdmissao(event.target.value)} className={inputClass} /></label>
          <label><span className={labelClass}>Sede / Origem</span><select value={sedeOrigem} onChange={(event) => setSedeOrigem(event.target.value as Branch)} className={inputClass}>{['KO', 'BE', 'MN', 'SP', 'RJ'].map((branch) => <option key={branch} value={branch}>{branch}</option>)}</select></label>
          <label><span className={labelClass}>Canteiro Atual</span><select value={canteiroId} onChange={(event) => { setCanteiroId(event.target.value); const site = constructionSites.find((item) => item.id === event.target.value); if (site?.code || site?.codigo) setSedeAtual((site.code || site.codigo) as Branch); }} className={inputClass}><option value="">Sem canteiro específico</option>{constructionSites.map((site) => <option key={site.id} value={site.id}>{site.code || site.codigo || site.name || site.nome}</option>)}</select></label>
          <label><span className={labelClass}>Sede / Canteiro Atual</span><select value={sedeAtual} onChange={(event) => setSedeAtual(event.target.value as Branch)} className={inputClass}>{['KO', 'BE', 'MN', 'SP', 'RJ'].map((branch) => <option key={branch} value={branch}>{branch}</option>)}</select></label>
          <label><span className={labelClass}>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as EmployeeStatus)} className={inputClass}><option value="Ativo">Ativo</option><option value="Inativo">Desligado</option><option value="Férias">Férias</option><option value="Afastado">Afastado</option></select></label>
        </div>

        <div className={`flex justify-end gap-2 border-t px-5 py-4 ${isDark ? 'border-[#243756]' : 'border-slate-200'}`}>
          <button type="button" onClick={onClose} className={`rounded-lg border px-4 py-2 text-xs font-bold cursor-pointer ${isDark ? 'border-[#335075] text-[#CBD5E1]' : 'border-slate-300 text-slate-700'}`}>Cancelar</button>
          <button type="submit" disabled={isSaving} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? 'Salvando...' : 'Salvar alterações'}</button>
        </div>
      </form>
    </div>
  );
};