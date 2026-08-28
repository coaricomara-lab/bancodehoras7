import React, { useState, useMemo } from 'react';
import { Employee, DashboardFilter } from '../types';
import { formatHoursDecimal, formatHoursToDays } from '../utils/calculations';
import { useInstitution } from '../contexts/InstitutionContext';
import { 
  Printer, 
  X, 
  Layers
} from 'lucide-react';
import { ComaraLogo } from './ComaraLogo';

export type SortField = 'matricula' | 'nome' | 'sede' | 'saldo';
export type SortDirection = 'asc' | 'desc';

export interface CollaboratorBalanceItem extends Employee {
  saldoTotalHoras: number;
  saldoTotalDias: number;
  totalAtestados: number;
  totalFaltas: number;
  totalHorasExtras50: number;
  totalHorasExtras100: number;
}

interface CollaboratorBalancesPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: CollaboratorBalanceItem[];
  sortField: SortField;
  sortDirection: SortDirection;
  filters?: DashboardFilter;
  theme?: 'dark' | 'light';
}

export const CollaboratorBalancesPrintModal: React.FC<CollaboratorBalancesPrintModalProps> = ({
  isOpen,
  onClose,
  employees,
  sortField,
  sortDirection,
  filters,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const { settings: institutionSettings, sedes: instSedes } = useInstitution();

  const [itemsPerPage, setItemsPerPage] = useState<number>(30); // 25, 30, 35, 40, 45, 50
  const [includeStatsSummary, setIncludeStatsSummary] = useState<boolean>(true);

  if (!isOpen) return null;

  // Descrição do critério de ordenação aplicado
  const sortDescription = useMemo(() => {
    switch (sortField) {
      case 'saldo':
        return sortDirection === 'asc' 
          ? 'Saldo de Horas (Mais Devedores para Menos Devedores / Mais Credores)' 
          : 'Saldo de Horas (Mais Credores para Mais Devedores)';
      case 'nome':
        return sortDirection === 'asc' ? 'Nome do Colaborador (A - Z)' : 'Nome do Colaborador (Z - A)';
      case 'matricula':
        return sortDirection === 'asc' ? 'Matrícula (Crescente)' : 'Matrícula (Decrescente)';
      case 'sede':
        return sortDirection === 'asc' ? 'Sede Operacional (A - Z)' : 'Sede Operacional (Z - A)';
      default:
        return 'Padrão do Sistema';
    }
  }, [sortField, sortDirection]);

  // Estatísticas do Lote
  const stats = useMemo(() => {
    let credores = 0;
    let devedores = 0;
    let zerados = 0;
    let saldoGeralHoras = 0;

    employees.forEach(emp => {
      saldoGeralHoras += emp.saldoTotalHoras;
      if (emp.saldoTotalHoras > 0.05) credores++;
      else if (emp.saldoTotalHoras < -0.05) devedores++;
      else zerados++;
    });

    const saldoGeralDias = Number((saldoGeralHoras / 8).toFixed(2));

    return {
      total: employees.length,
      credores,
      devedores,
      zerados,
      saldoGeralHoras: Number(saldoGeralHoras.toFixed(2)),
      saldoGeralDias,
    };
  }, [employees]);

  // Paginação dos Colaboradores para Folhas A4
  const pages = useMemo(() => {
    if (employees.length === 0) return [];
    const chunks: CollaboratorBalanceItem[][] = [];
    for (let i = 0; i < employees.length; i += itemsPerPage) {
      chunks.push(employees.slice(i, i + itemsPerPage));
    }
    return chunks;
  }, [employees, itemsPerPage]);

  const totalPages = pages.length || 1;

  // Textos Institucionais
  const comandoAeroText = institutionSettings?.subordinacao 
    ? institutionSettings.subordinacao.split('•')[0].trim().toUpperCase() 
    : 'COMANDO DA AERONÁUTICA';
  const comissaoText = institutionSettings?.nomeInstituicao 
    ? institutionSettings.nomeInstituicao.toUpperCase() 
    : 'COMISSÃO DE AEROPORTOS DA REGIÃO AMAZÔNICA';
  const destacamentoText = (instSedes && instSedes.find(s => s.codigo === (filters?.sede !== 'TODAS' ? filters?.sede : 'KO'))?.nome) 
    || 'DESTACAMENTO DE ENGENHARIA DA COMARA DE COARI-AM (DECO-KO)';

  // Data e hora de emissão formatadas
  const now = new Date();
  const dataEmissao = now.toLocaleDateString('pt-BR');
  const horaEmissao = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Dispara a impressão
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* CSS ESPECÍFICO PARA IMPRESSÃO EM FOLHA A4 */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 7mm 6mm 7mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 8.5pt !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #print-balance-content, #print-balance-content * {
            visibility: visible !important;
          }
          #print-balance-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          .balance-page-sheet {
            page-break-after: always !important;
            break-after: page !important;
            padding: 0 !important;
            margin: 0 0 10px 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
          }
          .balance-page-sheet:last-of-type {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* PAINEL PRINCIPAL DO MODAL */}
      <div 
        className={`w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] no-print border transition-colors ${
          isDark 
            ? 'bg-[#16243D] border-[#243756] text-white' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* CABEÇALHO DO MODAL (CONTROLES E AÇÕES) */}
        <div className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'border-[#243756] bg-[#0F1B33]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                Imprimir Relação de Colaboradores
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-mono font-semibold">
                  {employees.length} Servidores
                </span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                Relação ordenada: <strong className={isDark ? 'text-[#E2E8F0]' : 'text-slate-800'}>{sortDescription}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-confirm-print-balances"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              id="btn-close-print-balances"
              onClick={onClose}
              className={`p-2 rounded-xl border transition-all active:scale-[0.98] cursor-pointer ${
                isDark 
                  ? 'border-[#243756] text-[#94A3B8] hover:text-white hover:bg-[#243756]' 
                  : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BARRA DE OPÇÕES E CONFIGURAÇÃO DA FOLHA */}
        <div className={`px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-4 text-xs ${
          isDark ? 'border-[#243756] bg-[#121E36]' : 'border-slate-200 bg-slate-100/70'
        }`}>
          <div className="flex flex-wrap items-center gap-4">
            {/* Opção: Pessoas por Folha */}
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400 shrink-0" />
              <label className="font-semibold text-[11px] uppercase tracking-wider text-slate-400">
                Pessoas por Folha:
              </label>
              <select
                id="select-balances-print-items-per-page"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono border focus:outline-hidden ${
                  isDark
                    ? 'bg-[#0F1B33] border-[#243756] text-white focus:border-blue-400'
                    : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                }`}
              >
                <option value={25}>25 pessoas / folha</option>
                <option value={30}>30 pessoas / folha (padrão)</option>
                <option value={35}>35 pessoas / folha</option>
                <option value={40}>40 pessoas / folha</option>
                <option value={45}>45 pessoas / folha</option>
                <option value={50}>50 pessoas / folha</option>
              </select>
            </div>

            {/* Opção: Incluir Card de Resumo de Totais */}
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeStatsSummary}
                onChange={(e) => setIncludeStatsSummary(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                Exibir quadro resumo de totais (Saldo Geral, Credores e Devedores)
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>Total de folhas estimadas: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{totalPages}</strong></span>
          </div>
        </div>

        {/* CORPO DE PRÉ-VISUALIZAÇÃO DAS FOLHAS A4 */}
        <div className={`p-4 sm:p-6 overflow-y-auto flex-1 ${
          isDark ? 'bg-[#0B1426]' : 'bg-slate-200/70'
        }`}>
          <div className="flex flex-col items-center gap-8">
            {pages.map((pageEmployees, pageIndex) => {
              const pageNum = pageIndex + 1;

              return (
                <div
                  key={`page-${pageIndex}`}
                  className="w-full max-w-[210mm] bg-white text-black p-6 sm:p-8 shadow-xl rounded-sm border border-slate-300 font-sans"
                  style={{ minHeight: '270mm' }}
                >
                  {/* CABEÇALHO OFICIAL AERONÁUTICA */}
                  <div className="flex items-center justify-between pb-3 border-b-2 border-black gap-3">
                    <div className="w-16 h-16 flex items-center justify-center shrink-0">
                      <ComaraLogo className="w-14 h-14 object-contain" />
                    </div>
                    <div className="flex-1 text-center font-serif leading-tight">
                      <h1 className="text-[13px] font-bold tracking-wide uppercase">
                        {comandoAeroText}
                      </h1>
                      <h2 className="text-[11px] font-bold tracking-wide uppercase mt-0.5">
                        {comissaoText}
                      </h2>
                      <h3 className="text-[10px] font-semibold uppercase mt-0.5 text-gray-800">
                        {destacamentoText}
                      </h3>
                      <div className="inline-block mt-1 px-3 py-0.5 bg-black text-white font-sans font-bold text-[10px] uppercase tracking-wider rounded-xs">
                        RELAÇÃO CONSOLIDADA DE SALDOS DO BANCO DE HORAS SPTF
                      </div>
                    </div>
                    <div className="w-16 text-right font-mono text-[9px] text-gray-700 leading-tight">
                      <p className="font-bold">FOLHA</p>
                      <p className="text-sm font-bold text-black">{pageNum}/{totalPages}</p>
                      <p className="text-[8px] mt-1">{dataEmissao}</p>
                    </div>
                  </div>

                  {/* SUB-CABEÇALHO: CRITÉRIO DE ORDENAÇÃO E FILTROS */}
                  <div className="flex flex-wrap items-center justify-between text-[9px] py-2 border-b border-black gap-2 font-mono">
                    <div>
                      <span className="font-bold uppercase">Critério de Ordenação: </span>
                      <span className="font-semibold text-blue-900 bg-blue-50 px-1.5 py-0.5 border border-blue-200 rounded-xs">
                        {sortDescription}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold uppercase">Sede: </span>
                      <span>{filters?.sede || 'TODAS'}</span>
                      {filters?.dataInicio && (
                        <span className="ml-2">
                          <span className="font-bold uppercase">Período: </span>
                          <span>{filters.dataInicio} até {filters.dataFim || 'Hoje'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* QUADRO DE RESUMO DE TOTAIS (OPCIONAL NA PRIMEIRA FOLHA) */}
                  {includeStatsSummary && pageNum === 1 && (
                    <div className="grid grid-cols-4 gap-2 my-2.5 p-2 bg-gray-50 border border-black rounded-xs text-center font-mono">
                      <div className="border-r border-gray-300 pr-2">
                        <p className="text-[8px] uppercase font-bold text-gray-600">Total Colaboradores</p>
                        <p className="text-sm font-bold text-black">{stats.total}</p>
                      </div>
                      <div className="border-r border-gray-300 pr-2">
                        <p className="text-[8px] uppercase font-bold text-emerald-800">Credores (&gt; 0h)</p>
                        <p className="text-sm font-bold text-emerald-700">{stats.credores}</p>
                      </div>
                      <div className="border-r border-gray-300 pr-2">
                        <p className="text-[8px] uppercase font-bold text-red-800">Devedores (&lt; 0h)</p>
                        <p className="text-sm font-bold text-red-700">{stats.devedores}</p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase font-bold text-gray-600">Saldo Geral Líquido</p>
                        <p className={`text-sm font-bold ${stats.saldoGeralHoras >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {formatHoursDecimal(stats.saldoGeralHoras)} ({formatHoursToDays(stats.saldoGeralHoras)})
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TABELA DE COLABORADORES NA ORDEM EXATA */}
                  <table className="w-full border-collapse text-[9px] mt-2 border border-black text-black">
                    <thead>
                      <tr className="bg-gray-100 font-bold uppercase text-[8.5px] border-b border-black">
                        <th className="py-1 px-1.5 text-center border-r border-black w-8">ITEM</th>
                        <th className="py-1 px-2 text-center border-r border-black w-16">MATRÍCULA</th>
                        <th className="py-1 px-2 text-left border-r border-black">NOME COMPLETO</th>
                        <th className="py-1 px-2 text-left border-r border-black">CARGO / FUNÇÃO</th>
                        <th className="py-1 px-1.5 text-center border-r border-black w-10">SEDE</th>
                        <th className="py-1 px-2 text-right border-r border-black w-24">SALDO (HORAS)</th>
                        <th className="py-1 px-2 text-right border-r border-black w-20">EQUIV. DIAS</th>
                        <th className="py-1 px-1.5 text-center w-16">SITUAÇÃO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageEmployees.map((emp, itemIdx) => {
                        const globalIndex = pageIndex * itemsPerPage + itemIdx + 1;
                        const isCredor = emp.saldoTotalHoras > 0.05;
                        const isDevedor = emp.saldoTotalHoras < -0.05;

                        return (
                          <tr 
                            key={emp.matricula}
                            className={`border-b border-gray-300 ${
                              itemIdx % 2 === 1 ? 'bg-gray-50/70' : 'bg-white'
                            }`}
                          >
                            {/* ITEM */}
                            <td className="py-1 px-1.5 text-center font-bold font-mono border-r border-black text-[8.5px]">
                              {globalIndex}
                            </td>

                            {/* MATRÍCULA */}
                            <td className="py-1 px-2 text-center font-mono font-bold border-r border-black text-[9px]">
                              {emp.matricula}
                            </td>

                            {/* NOME */}
                            <td className="py-1 px-2 text-left font-bold uppercase border-r border-black text-[9px] truncate max-w-[200px]">
                              {emp.nome}
                            </td>

                            {/* FUNÇÃO */}
                            <td className="py-1 px-2 text-left uppercase border-r border-black text-[8.5px] text-gray-800">
                              {emp.funcao || 'SERVENTE DE OBRAS'}
                            </td>

                            {/* SEDE */}
                            <td className="py-1 px-1.5 text-center font-mono font-bold border-r border-black text-[8.5px]">
                              {emp.sede || 'KO'}
                            </td>

                            {/* SALDO HORAS */}
                            <td className={`py-1 px-2 text-right font-mono font-bold border-r border-black text-[9.5px] ${
                              isDevedor ? 'text-red-700 font-black' : isCredor ? 'text-emerald-700' : 'text-gray-700'
                            }`}>
                              {formatHoursDecimal(emp.saldoTotalHoras)}
                            </td>

                            {/* EQUIVALENTE DIAS */}
                            <td className={`py-1 px-2 text-right font-mono border-r border-black text-[8.5px] ${
                              isDevedor ? 'text-red-700 font-semibold' : isCredor ? 'text-emerald-700' : 'text-gray-600'
                            }`}>
                              {formatHoursToDays(emp.saldoTotalHoras)}
                            </td>

                            {/* SITUAÇÃO */}
                            <td className="py-1 px-1.5 text-center font-mono text-[8px] font-bold">
                              {isDevedor ? (
                                <span className="text-red-700">DEVEDOR</span>
                              ) : isCredor ? (
                                <span className="text-emerald-700">CREDOR</span>
                              ) : (
                                <span className="text-gray-600">ZERADO</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* RODAPÉ DA FOLHA */}
                  <div className="mt-4 pt-2 border-t border-black flex items-center justify-between text-[8px] font-mono text-gray-600">
                    <span>COMARA • Sistema de Gestão SPTF — Relatório Consolidado de Colaboradores</span>
                    <span>Folha {pageNum} de {totalPages}</span>
                    <span>Emitido em: {dataEmissao} às {horaEmissao}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONTAINER DEDICADO PARA IMPRESSÃO IMPERCEPTÍVEL NA TELA (PRINT-ONLY) */}
      <div id="print-balance-content" className="hidden print:block w-full bg-white text-black p-0 m-0">
        {pages.map((pageEmployees, pageIndex) => {
          const pageNum = pageIndex + 1;

          return (
            <div
              key={`print-page-${pageIndex}`}
              className="balance-page-sheet w-full bg-white text-black font-sans box-border"
              style={{ minHeight: '280mm', padding: '0 0 10mm 0' }}
            >
              {/* CABEÇALHO OFICIAL AERONÁUTICA */}
              <div className="flex items-center justify-between pb-2 border-b-2 border-black gap-3">
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <ComaraLogo className="w-12 h-12 object-contain" />
                </div>
                <div className="flex-1 text-center font-serif leading-tight">
                  <h1 className="text-[12px] font-bold tracking-wide uppercase">
                    {comandoAeroText}
                  </h1>
                  <h2 className="text-[10.5px] font-bold tracking-wide uppercase mt-0.5">
                    {comissaoText}
                  </h2>
                  <h3 className="text-[9.5px] font-semibold uppercase mt-0.5 text-gray-800">
                    {destacamentoText}
                  </h3>
                  <div className="inline-block mt-0.5 px-2 py-0.5 bg-black text-white font-sans font-bold text-[9px] uppercase tracking-wider rounded-xs">
                    RELAÇÃO CONSOLIDADA DE SALDOS DO BANCO DE HORAS SPTF
                  </div>
                </div>
                <div className="w-14 text-right font-mono text-[8px] text-gray-700 leading-tight">
                  <p className="font-bold">FOLHA</p>
                  <p className="text-xs font-bold text-black">{pageNum}/{totalPages}</p>
                  <p className="text-[7.5px] mt-0.5">{dataEmissao}</p>
                </div>
              </div>

              {/* SUB-CABEÇALHO: CRITÉRIO DE ORDENAÇÃO E FILTROS */}
              <div className="flex items-center justify-between text-[8px] py-1 border-b border-black gap-2 font-mono">
                <div>
                  <span className="font-bold uppercase">Critério de Ordenação: </span>
                  <span className="font-semibold text-black">
                    {sortDescription}
                  </span>
                </div>
                <div>
                  <span className="font-bold uppercase">Sede: </span>
                  <span>{filters?.sede || 'TODAS'}</span>
                  {filters?.dataInicio && (
                    <span className="ml-2">
                      <span className="font-bold uppercase">Período: </span>
                      <span>{filters.dataInicio} até {filters.dataFim || 'Hoje'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* QUADRO DE RESUMO DE TOTAIS (PRIMEIRA FOLHA) */}
              {includeStatsSummary && pageNum === 1 && (
                <div className="grid grid-cols-4 gap-2 my-1.5 p-1.5 bg-gray-50 border border-black rounded-xs text-center font-mono">
                  <div className="border-r border-gray-300 pr-1">
                    <p className="text-[7.5px] uppercase font-bold text-gray-600">Total Colaboradores</p>
                    <p className="text-xs font-bold text-black">{stats.total}</p>
                  </div>
                  <div className="border-r border-gray-300 pr-1">
                    <p className="text-[7.5px] uppercase font-bold text-black">Credores (&gt; 0h)</p>
                    <p className="text-xs font-bold text-black">{stats.credores}</p>
                  </div>
                  <div className="border-r border-gray-300 pr-1">
                    <p className="text-[7.5px] uppercase font-bold text-black">Devedores (&lt; 0h)</p>
                    <p className="text-xs font-bold text-black">{stats.devedores}</p>
                  </div>
                  <div>
                    <p className="text-[7.5px] uppercase font-bold text-gray-600">Saldo Geral Líquido</p>
                    <p className="text-xs font-bold text-black">
                      {formatHoursDecimal(stats.saldoGeralHoras)} ({formatHoursToDays(stats.saldoGeralHoras)})
                    </p>
                  </div>
                </div>
              )}

              {/* TABELA DE COLABORADORES */}
              <table className="w-full border-collapse text-[8.5px] mt-1 border border-black text-black">
                <thead>
                  <tr className="bg-gray-100 font-bold uppercase text-[8px] border-b border-black">
                    <th className="py-0.5 px-1 text-center border-r border-black w-6">ITEM</th>
                    <th className="py-0.5 px-1.5 text-center border-r border-black w-14">MATRÍCULA</th>
                    <th className="py-0.5 px-1.5 text-left border-r border-black">NOME COMPLETO</th>
                    <th className="py-0.5 px-1.5 text-left border-r border-black">CARGO / FUNÇÃO</th>
                    <th className="py-0.5 px-1 text-center border-r border-black w-8">SEDE</th>
                    <th className="py-0.5 px-1.5 text-right border-r border-black w-20">SALDO (HORAS)</th>
                    <th className="py-0.5 px-1.5 text-right border-r border-black w-16">EQUIV. DIAS</th>
                    <th className="py-0.5 px-1 text-center w-14">SITUAÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {pageEmployees.map((emp, itemIdx) => {
                    const globalIndex = pageIndex * itemsPerPage + itemIdx + 1;
                    const isCredor = emp.saldoTotalHoras > 0.05;
                    const isDevedor = emp.saldoTotalHoras < -0.05;

                    return (
                      <tr 
                        key={`print-${emp.matricula}`}
                        className={`border-b border-gray-300 ${
                          itemIdx % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'
                        }`}
                      >
                        {/* ITEM */}
                        <td className="py-0.5 px-1 text-center font-bold font-mono border-r border-black text-[8px]">
                          {globalIndex}
                        </td>

                        {/* MATRÍCULA */}
                        <td className="py-0.5 px-1.5 text-center font-mono font-bold border-r border-black text-[8.5px]">
                          {emp.matricula}
                        </td>

                        {/* NOME */}
                        <td className="py-0.5 px-1.5 text-left font-bold uppercase border-r border-black text-[8.5px] truncate max-w-[200px]">
                          {emp.nome}
                        </td>

                        {/* FUNÇÃO */}
                        <td className="py-0.5 px-1.5 text-left uppercase border-r border-black text-[8px] text-gray-800">
                          {emp.funcao || 'SERVENTE DE OBRAS'}
                        </td>

                        {/* SEDE */}
                        <td className="py-0.5 px-1 text-center font-mono font-bold border-r border-black text-[8px]">
                          {emp.sede || 'KO'}
                        </td>

                        {/* SALDO HORAS */}
                        <td className={`py-0.5 px-1.5 text-right font-mono font-bold border-r border-black text-[8.5px] ${
                          isDevedor ? 'text-black font-black' : 'text-black'
                        }`}>
                          {formatHoursDecimal(emp.saldoTotalHoras)}
                        </td>

                        {/* EQUIVALENTE DIAS */}
                        <td className="py-0.5 px-1.5 text-right font-mono border-r border-black text-[8px] text-black">
                          {formatHoursToDays(emp.saldoTotalHoras)}
                        </td>

                        {/* SITUAÇÃO */}
                        <td className="py-0.5 px-1 text-center font-mono text-[7.5px] font-bold text-black">
                          {isDevedor ? 'DEVEDOR' : isCredor ? 'CREDOR' : 'ZERADO'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* RODAPÉ DA FOLHA */}
              <div className="mt-3 pt-1 border-t border-black flex items-center justify-between text-[7.5px] font-mono text-gray-600">
                <span>COMARA • Sistema de Gestão SPTF — Relatório Consolidado de Colaboradores</span>
                <span>Folha {pageNum} de {totalPages}</span>
                <span>Emitido em: {dataEmissao} às {horaEmissao}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
