import React, { useState } from 'react';
import { CargoInstituicao } from '../../types/institutionConfig';
import { CardSection, FormInput, FormSelect, ToggleSwitch } from './FormControls';
import { 
  Award, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  Edit3, 
  Shield, 
  UserCheck 
} from 'lucide-react';

interface CargosTabProps {
  cargos: CargoInstituicao[];
  onChange: (updatedCargos: CargoInstituicao[]) => void;
  isDark: boolean;
}

const TRATAMENTOS = [
  { value: 'Chefe', label: 'Chefe (Ex: Chefe do Canteiro, Chefe da DA)' },
  { value: 'Encarregado', label: 'Encarregado (Ex: Encarregado de Obras)' },
  { value: 'Comandante', label: 'Comandante (Ex: Comandante da OM)' },
  { value: 'Diretor', label: 'Diretor (Ex: Diretor de Departamento)' },
  { value: 'Fiscal', label: 'Fiscal / Engenheiro Fiscal' },
  { value: 'Gerente', label: 'Gerente / Gestor de RH' },
  { value: 'Outro', label: 'Outro (Personalizado)' },
];

export const CargosTab: React.FC<CargosTabProps> = ({
  cargos,
  onChange,
  isDark,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCargoNome, setNewCargoNome] = useState('');
  const [newCargoTratamento, setNewCargoTratamento] = useState<any>('Chefe');
  const [newCargoDepto, setNewCargoDepto] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Reordenação
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cargos.length) return;

    const copy = [...cargos];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    // Recalcula ordens sequenciais
    const reordered = copy.map((c, i) => ({ ...c, ordem: i + 1 }));
    onChange(reordered);
  };

  const handleAddCargo = () => {
    if (!newCargoNome.trim()) return;

    const newCargo: CargoInstituicao = {
      id: `cargo-${Date.now()}`,
      nome: newCargoNome.trim(),
      ordem: cargos.length + 1,
      tratamento: newCargoTratamento,
      departamento: newCargoDepto.trim() || 'Geral',
      ativo: true,
    };

    onChange([...cargos, newCargo]);
    setNewCargoNome('');
    setNewCargoDepto('');
    setIsAddingNew(false);
  };

  const handleDeleteCargo = (id: string) => {
    const filtered = cargos.filter((c) => c.id !== id).map((c, i) => ({ ...c, ordem: i + 1 }));
    onChange(filtered);
  };

  const handleToggleAtivo = (id: string) => {
    const updated = cargos.map((c) => (c.id === id ? { ...c, ativo: !c.ativo } : c));
    onChange(updated);
  };

  const handleUpdateCargo = (id: string, partial: Partial<CargoInstituicao>) => {
    const updated = cargos.map((c) => (c.id === id ? { ...c, ...partial } : c));
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <CardSection
        title="Quadro de Cargos Oficiais e Assinaturas Autorizadas"
        description="Defina os cargos da estrutura organizacional da OM. Esses cargos serão utilizados para emissão de carimbos, dispensas de SPTF e homologações de folha."
        icon={Award}
        isDark={isDark}
        action={
          !isAddingNew && (
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Cargo</span>
            </button>
          )
        }
      >
        {/* Formulário de Novo Cargo */}
        {isAddingNew && (
          <div className={`p-4 mb-5 rounded-2xl border ${
            isDark ? 'bg-[#0D0F14] border-blue-500/30' : 'bg-blue-50/50 border-blue-200'
          } animate-in fade-in duration-150`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Adicionar Cargo à Estrutura
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-gray-400 hover:text-gray-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <FormInput
                label="Nome Oficial do Cargo"
                value={newCargoNome}
                onChange={(e) => setNewCargoNome(e.target.value)}
                placeholder="Ex: Chefe do Canteiro de Obras"
                isDark={isDark}
                required
              />

              <FormSelect
                label="Forma de Tratamento"
                value={newCargoTratamento}
                onChange={(e) => setNewCargoTratamento(e.target.value as any)}
                options={TRATAMENTOS}
                isDark={isDark}
              />

              <FormInput
                label="Divisão / Departamento"
                value={newCargoDepto}
                onChange={(e) => setNewCargoDepto(e.target.value)}
                placeholder="Ex: Divisão Administrativa (DA)"
                isDark={isDark}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  isDark ? 'border-[#2A2E38] text-gray-400 hover:text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddCargo}
                disabled={!newCargoNome.trim()}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs"
              >
                Salvar Cargo
              </button>
            </div>
          </div>
        )}

        {/* Lista de Cargos */}
        <div className="space-y-2.5">
          {cargos.length === 0 ? (
            <div className={`p-8 text-center rounded-xl border border-dashed ${
              isDark ? 'border-[#2A2E38] text-[#8E9299]' : 'border-slate-200 text-slate-400'
            }`}>
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Nenhum cargo configurado no momento.</p>
            </div>
          ) : (
            cargos.map((cargo, index) => {
              const isEditing = editingId === cargo.id;

              return (
                <div
                  key={cargo.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-[#0D0F14]/70 border-[#1F2229] hover:border-[#2A2E38]'
                      : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Badge de Ordem */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMove(index, 'up')}
                        className={`p-1 rounded hover:bg-blue-500/20 text-blue-400 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer`}
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <span className={`text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                        isDark ? 'bg-[#1F2229] text-blue-400' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {index + 1}
                      </span>
                      <button
                        type="button"
                        disabled={index === cargos.length - 1}
                        onClick={() => handleMove(index, 'down')}
                        className={`p-1 rounded hover:bg-blue-500/20 text-blue-400 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer`}
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                        <input
                          type="text"
                          value={cargo.nome}
                          onChange={(e) => handleUpdateCargo(cargo.id, { nome: e.target.value })}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border outline-hidden ${
                            isDark ? 'bg-[#15171C] border-[#2A2E38] text-white' : 'bg-white border-slate-300'
                          }`}
                          placeholder="Nome do cargo"
                        />
                        <select
                          value={cargo.tratamento || 'Chefe'}
                          onChange={(e) => handleUpdateCargo(cargo.id, { tratamento: e.target.value as any })}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border outline-hidden ${
                            isDark ? 'bg-[#15171C] border-[#2A2E38] text-white' : 'bg-white border-slate-300'
                          }`}
                        >
                          {TRATAMENTOS.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.value}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={cargo.departamento || ''}
                          onChange={(e) => handleUpdateCargo(cargo.id, { departamento: e.target.value })}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border outline-hidden ${
                            isDark ? 'bg-[#15171C] border-[#2A2E38] text-white' : 'bg-white border-slate-300'
                          }`}
                          placeholder="Departamento"
                        />
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold ${
                            cargo.ativo !== false 
                              ? isDark ? 'text-white' : 'text-slate-900'
                              : 'text-gray-400 line-through'
                          }`}>
                            {cargo.nome}
                          </span>
                          {cargo.tratamento && (
                            <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-md border ${
                              isDark
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              Tratamento: {cargo.tratamento}
                            </span>
                          )}
                          {cargo.departamento && (
                            <span className={`text-[10px] px-2 py-0.2 rounded-md ${
                              isDark ? 'bg-[#1F2229] text-[#8E9299]' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {cargo.departamento}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ações do Item */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                        title="Concluir Edição"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingId(cargo.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Editar Cargo"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleAtivo(cargo.id)}
                      className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                        cargo.ativo !== false
                          ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isDark ? 'bg-slate-800 text-gray-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {cargo.ativo !== false ? 'Ativo' : 'Inativo'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCargo(cargo.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Excluir Cargo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardSection>
    </div>
  );
};
