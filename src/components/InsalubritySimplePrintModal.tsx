import React, { useMemo } from 'react';
import { Employee, InsalubrityRecord, ConstructionSite } from '../types';
import { ComaraLogo } from './ComaraLogo';
import { getSignaturesForCanteiro } from '../services/canteiroService';
import { Printer, X, Calendar, AlertCircle, FileText } from 'lucide-react';

export interface InsalubritySimplePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  insalubrityRecords: InsalubrityRecord[];
  recordsMap: Map<string, InsalubrityRecord>;
  currentQuinzenaDays: Array<{
    dayNumber: number;
    dayOfWeek: number;
    weekdayInitial: string;
    isWeekend: boolean;
    formattedDate: string;
  }>;
  currentPeriodLabel: string;
  selectedMonth: number;
  selectedYear: number;
  selectedBranch: string;
  monthNames: string[];
  constructionSites?: ConstructionSite[];
  theme?: 'dark' | 'light';
}

export const InsalubritySimplePrintModal: React.FC<InsalubritySimplePrintModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <InsalubritySimplePrintModalContent {...props} />;
};

const InsalubritySimplePrintModalContent: React.FC<InsalubritySimplePrintModalProps> = ({
  isOpen: _isOpen,
  onClose,
  employees,
  recordsMap,
  currentQuinzenaDays,
  currentPeriodLabel,
  selectedMonth,
  selectedYear,
  selectedBranch,
  monthNames,
  constructionSites = [],
}) => {
  // 1. Filtrar APENAS colaboradores que possuem insalubridade/apontamento cadastrado no período
  const printEmployees = useMemo(() => {
    return employees.filter(emp => {
      return currentQuinzenaDays.some(d => {
        const key = `${emp.matricula.trim().toUpperCase()}_${d.formattedDate}`;
        return recordsMap.has(key);
      });
    });
  }, [employees, currentQuinzenaDays, recordsMap]);

  // 2. Filtrar APENAS os dias que possuem alguma insalubridade/apontamento cadastrado
  const printDays = useMemo(() => {
    return currentQuinzenaDays.filter(d => {
      return printEmployees.some(emp => {
        const key = `${emp.matricula.trim().toUpperCase()}_${d.formattedDate}`;
        return recordsMap.has(key);
      });
    });
  }, [currentQuinzenaDays, printEmployees, recordsMap]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs">
      {/* Estilos específicos de impressão em PAISAGEM (Landscape) */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 6mm 5mm 6mm 5mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="w-full max-w-[96vw] xl:max-w-7xl max-h-[92vh] flex flex-col rounded-2xl bg-white text-black p-4 sm:p-6 shadow-2xl overflow-hidden print-full-width">
        {/* Barra Superior com Controles de Impressão (Oculta na Impressão) */}
        <div className="flex items-center justify-between pb-3 border-b mb-3 no-print flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                Folha de Impressão de Insalubridade (Modo Paisagem)
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {printEmployees.length} {printEmployees.length === 1 ? 'Colaborador com Lançamento' : 'Colaboradores com Lançamento'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">
                  {printDays.length} {printDays.length === 1 ? 'Dia com Atividade' : 'Dias com Atividade'}
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                Visualização formatada em Paisagem • Sem coluna de função • Apenas colaboradores e dias com lançamentos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20 active:scale-[0.98] transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir em Paisagem (Ctrl+P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 cursor-pointer transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Documento Formatado para Impressão */}
        <div className="overflow-y-auto flex-1 font-sans text-xs p-1 sm:p-2 space-y-4">
          {/* Cabeçalho Oficial da COMARA com Logo e Dados Institucionais */}
          <div className="border-b-2 border-gray-800 pb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ComaraLogo size="print" theme="light" />
              <div className="text-left space-y-0.5">
                <div className="text-[9px] font-bold uppercase tracking-widest text-gray-700">
                  COMANDO DA AERONÁUTICA • DEPARTAMENTO DE CONTROLE DO ESPAÇO AÉREO
                </div>
                <div className="text-xs sm:text-sm font-black tracking-tight text-gray-900 uppercase">
                  COMISSÃO DE AEROPORTOS DA REGIÃO AMAZÔNICA — COMARA
                </div>
                <div className="text-xs font-bold text-blue-900 uppercase">
                  PLANILHA DE EFETIVO EM CAMPO & ATIVIDADES INSALUBRES — {currentPeriodLabel.toUpperCase()}
                </div>
              </div>
            </div>
            <div className="text-right text-[10px] font-mono text-gray-700 space-y-0.5 shrink-0">
              <div>MÊS/ANO: <strong>{monthNames[selectedMonth].toUpperCase()} / {selectedYear}</strong></div>
              <div>CANTEIRO/SEDE: <strong>{selectedBranch}</strong></div>
              <div>EMISSÃO: <strong>{new Date().toLocaleDateString('pt-BR')}</strong></div>
              <div>ORIENTAÇÃO: <strong>PAISAGEM</strong></div>
            </div>
          </div>

          {/* Se não houver colaboradores ou dias com insalubridade */}
          {printEmployees.length === 0 || printDays.length === 0 ? (
            <div className="py-16 text-center border rounded-xl border-dashed border-gray-300 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-gray-800">
                Nenhum lançamento de insalubridade encontrado
              </h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Não há colaboradores com atividades insalubres apontadas no período selecionado ({currentPeriodLabel} de {monthNames[selectedMonth]}/{selectedYear}).
              </p>
            </div>
          ) : (
            <>
              {/* Tabela de Efetivo e Atividades (Sem coluna de função, apenas dias com lançamento) */}
              <table className="w-full text-[10px] border-collapse border-2 border-gray-800">
                <thead>
                  <tr className="bg-gray-100 text-gray-900 font-bold">
                    <th className="border border-gray-600 p-1 w-8 text-center">Nº</th>
                    <th className="border border-gray-600 p-1.5 text-left min-w-[180px]">NOME DO COLABORADOR</th>
                    <th className="border border-gray-600 p-1 text-center w-20">MATRÍCULA</th>
                    
                    {/* Colunas APENAS dos dias que têm lançamentos */}
                    {printDays.map(d => (
                      <th 
                        key={d.dayNumber} 
                        className={`border border-gray-600 p-1 text-center min-w-[38px] ${
                          d.isWeekend ? 'bg-gray-200 text-red-700' : 'bg-gray-100'
                        }`}
                      >
                        <div className="font-black text-[11px] leading-tight">{d.dayNumber}</div>
                        <div className="text-[8px] font-semibold">{d.weekdayInitial}</div>
                      </th>
                    ))}

                    <th className="border border-gray-600 p-1 text-center w-24 bg-gray-200 font-black">
                      TOTAL DIAS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {printEmployees.map((emp, idx) => {
                    let totalDays = 0;

                    return (
                      <tr key={emp.matricula} className="hover:bg-gray-50 border-b border-gray-400">
                        <td className="border border-gray-400 p-1 text-center font-mono font-bold text-[9px] bg-gray-50">
                          {idx + 1}
                        </td>
                        <td className="border border-gray-400 p-1.5 font-bold truncate max-w-[220px]">
                          {emp.nome}
                        </td>
                        <td className="border border-gray-400 p-1 text-center font-mono text-[9px]">
                          {emp.matricula}
                        </td>

                        {/* Células dos dias com lançamento */}
                        {printDays.map(d => {
                          const key = `${emp.matricula.trim().toUpperCase()}_${d.formattedDate}`;
                          const rec = recordsMap.get(key);
                          if (rec) {
                            totalDays++;
                          }
                          const act = rec?.atividadeDesempenhada || '';
                          const code = act.length > 5 ? act.substring(0, 5) : act;

                          return (
                            <td 
                              key={d.dayNumber} 
                              className={`border border-gray-400 p-1 text-center font-bold text-[9px] ${
                                rec ? 'bg-amber-100 text-amber-950 font-black' : d.isWeekend ? 'bg-gray-100 text-gray-300' : ''
                              }`}
                            >
                              {code ? (
                                <span className="inline-block px-1 py-0.5 rounded bg-amber-300/80 text-black text-[8.5px] font-black leading-none">
                                  {code}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                          );
                        })}

                        <td className="border border-gray-400 p-1 text-center font-black font-mono text-xs bg-gray-50">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-black">
                            {totalDays} {totalDays === 1 ? 'dia' : 'dias'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Blocos de Assinatura Oficiais COMARA */}
              {(() => {
                const branchCode = selectedBranch === 'TODAS' ? 'KO' : selectedBranch;
                const sigs = getSignaturesForCanteiro(branchCode, constructionSites);
                return (
                  <div className="pt-6 grid grid-cols-3 gap-6 text-center text-[10px] print-avoid-break">
                    <div className="space-y-1">
                      <div className="border-t-2 border-gray-800 pt-1.5 font-bold text-gray-900">
                        {sigs.assinatura1.titulo}
                      </div>
                      <div className="font-bold text-gray-900 text-[10px]">{sigs.assinatura1.nome}</div>
                      <div className="text-gray-600 text-[9px]">{sigs.assinatura1.subtitulo}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="border-t-2 border-gray-800 pt-1.5 font-bold text-gray-900">
                        {sigs.assinatura2.titulo}
                      </div>
                      <div className="font-bold text-gray-900 text-[10px]">{sigs.assinatura2.nome}</div>
                      <div className="text-gray-600 text-[9px]">{sigs.assinatura2.subtitulo}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="border-t-2 border-gray-800 pt-1.5 font-bold text-gray-900">
                        {sigs.assinatura3.titulo}
                      </div>
                      <div className="font-bold text-gray-900 text-[10px]">{sigs.assinatura3.nome}</div>
                      <div className="text-gray-600 text-[9px]">{sigs.assinatura3.subtitulo}</div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
