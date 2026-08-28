import React, { useState } from 'react';
import { SedeInstituicao } from '../../types/institutionConfig';
import { CardSection, FormInput } from './FormControls';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  UserCheck,
  Building
} from 'lucide-react';

interface SedesTabProps {
  sedes: SedeInstituicao[];
  onChange: (updatedSedes: SedeInstituicao[]) => void;
  isDark: boolean;
}

export const SedesTab: React.FC<SedesTabProps> = ({
  sedes,
  onChange,
  isDark,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Estados do formulário de nova sede
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [responsavel, setResponsavel] = useState('');

  const handleAddSede = () => {
    if (!codigo.trim() || !nome.trim()) return;

    const newSede: SedeInstituicao = {
      id: `sede-${codigo.trim().toLowerCase()}-${Date.now()}`,
      codigo: codigo.trim().toUpperCase(),
      nome: nome.trim(),
      endereco: endereco.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      responsavel: responsavel.trim(),
      ativa: true,
    };

    onChange([...sedes, newSede]);
    setCodigo('');
    setNome('');
    setEndereco('');
    setTelefone('');
    setEmail('');
    setResponsavel('');
    setIsAddingNew(false);
  };

  const handleDeleteSede = (id: string) => {
    const filtered = sedes.filter((s) => s.id !== id);
    onChange(filtered);
  };

  const handleToggleAtiva = (id: string) => {
    const updated = sedes.map((s) => (s.id === id ? { ...s, ativa: !s.ativa } : s));
    onChange(updated);
  };

  const handleUpdateSede = (id: string, partial: Partial<SedeInstituicao>) => {
    const updated = sedes.map((s) => (s.id === id ? { ...s, ...partial } : s));
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <CardSection
        title="Sedes, Destacamentos e Canteiros de Obras"
        description="Gerencie as unidades físicas da Organização Militar onde há atuação de efetivo, lançamento de horas e fiscalização."
        icon={Building2}
        isDark={isDark}
        action={
          !isAddingNew && (
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Unidade / Sede</span>
            </button>
          )
        }
      >
        {/* Formulário de Nova Sede */}
        {isAddingNew && (
          <div className={`p-4 mb-5 rounded-2xl border ${
            isDark ? 'bg-[#0F1B33] border-blue-500/30' : 'bg-blue-50/50 border-blue-200'
          } animate-in fade-in duration-150`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Cadastrar Nova Unidade Institucional
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
                label="Código / Sigla da Sede (2-4 letras)"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ex: KO, BE, MN, BV..."
                maxLength={6}
                isDark={isDark}
                required
              />

              <div className="md:col-span-2">
                <FormInput
                  label="Nome Completo da Unidade"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Canteiro de Obras Coari / Destacamento de Apoio"
                  isDark={isDark}
                  required
                />
              </div>

              <div className="md:col-span-3">
                <FormInput
                  label="Endereço Completo com CEP"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Ex: Estrada Coari-Mamiá, s/n - Coari / AM, CEP: 69460-000"
                  icon={MapPin}
                  isDark={isDark}
                />
              </div>

              <FormInput
                label="Telefone da Unidade"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(97) 3561-0000"
                icon={Phone}
                isDark={isDark}
              />

              <FormInput
                label="E-mail de Contato"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="canteiro.comara@gmail.com"
                icon={Mail}
                isDark={isDark}
              />

              <FormInput
                label="Responsável / Chefe da Unidade"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Ex: Chefe do Canteiro KO"
                icon={UserCheck}
                isDark={isDark}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  isDark ? 'border-[#335075] text-gray-400 hover:text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddSede}
                disabled={!codigo.trim() || !nome.trim()}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs"
              >
                Cadastrar Sede
              </button>
            </div>
          </div>
        )}

        {/* Lista de Sedes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {sedes.length === 0 ? (
            <div className={`col-span-2 p-8 text-center rounded-xl border border-dashed ${
              isDark ? 'border-[#335075] text-[#94A3B8]' : 'border-slate-200 text-slate-400'
            }`}>
              <Building className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Nenhuma sede ou canteiro configurado.</p>
            </div>
          ) : (
            sedes.map((sede) => {
              const isEditing = editingId === sede.id;

              return (
                <div
                  key={sede.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    isDark
                      ? 'bg-[#0F1B33]/70 border-[#243756] hover:border-[#335075]'
                      : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header do Card */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                          isDark
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {sede.codigo}
                        </span>
                        <h4 className={`text-xs font-bold ${
                          sede.ativa !== false 
                            ? isDark ? 'text-white' : 'text-slate-900'
                            : 'text-gray-400 line-through'
                        }`}>
                          {sede.nome}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleAtiva(sede.id)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors ${
                          sede.ativa !== false
                            ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isDark ? 'bg-slate-800 text-gray-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {sede.ativa !== false ? 'Ativa' : 'Inativa'}
                      </button>
                    </div>

                    {/* Detalhes / Edição */}
                    {isEditing ? (
                      <div className="space-y-2 pt-2">
                        <input
                          type="text"
                          value={sede.nome}
                          onChange={(e) => handleUpdateSede(sede.id, { nome: e.target.value })}
                          className={`w-full text-xs px-2.5 py-1.5 rounded-lg border ${
                            isDark ? 'bg-[#16243D] border-[#335075] text-white' : 'bg-white border-slate-300'
                          }`}
                          placeholder="Nome da unidade"
                        />
                        <input
                          type="text"
                          value={sede.endereco}
                          onChange={(e) => handleUpdateSede(sede.id, { endereco: e.target.value })}
                          className={`w-full text-xs px-2.5 py-1.5 rounded-lg border ${
                            isDark ? 'bg-[#16243D] border-[#335075] text-white' : 'bg-white border-slate-300'
                          }`}
                          placeholder="Endereço"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={sede.telefone || ''}
                            onChange={(e) => handleUpdateSede(sede.id, { telefone: e.target.value })}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border ${
                              isDark ? 'bg-[#16243D] border-[#335075] text-white' : 'bg-white border-slate-300'
                            }`}
                            placeholder="Telefone"
                          />
                          <input
                            type="text"
                            value={sede.responsavel || ''}
                            onChange={(e) => handleUpdateSede(sede.id, { responsavel: e.target.value })}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border ${
                              isDark ? 'bg-[#16243D] border-[#335075] text-white' : 'bg-white border-slate-300'
                            }`}
                            placeholder="Responsável"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className={`text-[11px] space-y-1 ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                        {sede.endereco && (
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3 h-3 shrink-0 mt-0.5 opacity-70" />
                            <span className="line-clamp-2">{sede.endereco}</span>
                          </div>
                        )}
                        {sede.telefone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 shrink-0 opacity-70" />
                            <span>{sede.telefone}</span>
                          </div>
                        )}
                        {sede.responsavel && (
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3 h-3 shrink-0 opacity-70" />
                            <span>Chefia: {sede.responsavel}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className={`pt-2 border-t flex items-center justify-end gap-1.5 ${
                    isDark ? 'border-[#243756]' : 'border-slate-200'
                  }`}>
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold"
                      >
                        <Check className="w-3.5 h-3.5" /> Concluir
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingId(sede.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Editar Unidade"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteSede(sede.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Excluir Unidade"
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
