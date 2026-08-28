import React, { useState, useMemo } from 'react';
import { Employee, TimeRecord, ConstructionSite, DispensaSptfRecord } from '../types';
import { useInstitution } from '../contexts/InstitutionContext';
import { storageService } from '../services/storageService';
import { 
  X, 
  Printer, 
  Calendar, 
  Building2, 
  Search,
  Users,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { IconButton } from './IconButton';

export interface PortariaAttendanceSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  records?: TimeRecord[];
  dispensas?: DispensaSptfRecord[];
  constructionSites?: ConstructionSite[];
  defaultSede?: string;
  theme?: 'dark' | 'light';
}

export type DayStatusType = 'REGULAR' | 'FERIAS' | 'DISPENSA' | 'ATESTADO' | 'LICENCA';

export interface EmployeeDayStatus {
  isSpecial: boolean;
  type: DayStatusType;
  badge: string;
  entrada: string;
  saida: string;
  details?: string;
}

export interface ProcessedPortariaEmployee {
  itemNumber: number;
  emp: Employee;
  statusInfo: EmployeeDayStatus;
  isOutstation: boolean;
  sedeFixa: string;
  sedeAtual: string;
}

/**
 * Normaliza qualquer formato de data para ISO YYYY-MM-DD
 */
function toISODate(dateStr?: string): string {
  if (!dateStr) return '';
  const clean = dateStr.trim().split('T')[0];
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }
  }
  return clean;
}

/**
 * Retorna o dia da semana em extenso em maiúsculas (ex: SEXTA-FEIRA)
 */
function getDayOfWeekName(dateStr: string): string {
  if (!dateStr) return '';
  const iso = toISODate(dateStr);
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return '';
  const date = new Date(year, month - 1, day);
  const days = [
    'DOMINGO',
    'SEGUNDA-FEIRA',
    'TERÇA-FEIRA',
    'QUARTA-FEIRA',
    'QUINTA-FEIRA',
    'SEXTA-FEIRA',
    'SÁBADO'
  ];
  return days[date.getDay()] || '';
}

/**
 * Formata data YYYY-MM-DD para DD/MM/AAAA
 */
function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '';
  const clean = toISODate(dateStr);
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export const PortariaAttendanceSheetModal: React.FC<PortariaAttendanceSheetModalProps> = ({
  isOpen,
  onClose,
  employees,
  records = [],
  dispensas = [],
  constructionSites = [],
  defaultSede = 'KO',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  
  let instSettings: any = null;
  try {
    const inst = useInstitution();
    instSettings = inst?.settings;
  } catch {
    // Fallback gracioso
  }

  // Data atual no formato ISO YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Estados de Controle da Folha de Portaria
  const [selectedSede, setSelectedSede] = useState<string>(() => {
    return (defaultSede && defaultSede !== 'TODAS') ? defaultSede : 'KO';
  });
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [fillDateInPrint, setFillDateInPrint] = useState<boolean>(false);
  const [separateOutstation, setSeparateOutstation] = useState<boolean>(true); // Ativado por padrão: separa efetivo fixo do canteiro dos colaboradores fora de sede
  const [itemsPerPage, setItemsPerPage] = useState<number>(30); // Padrão: 30 pessoas por folha A4 (opções: 30, 35, 40, 45, 50)
  const [onlyActiveAndVacation, setOnlyActiveAndVacation] = useState<boolean>(true);
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'PRESENTES' | 'FERIAS_DISPENSAS'>('TODOS');

  // Métricas visuais e tipográficas ajustadas dinamicamente para densidade de 30, 35, 40, 45 ou 50 linhas por folha
  const rowMetrics = useMemo(() => {
    if (itemsPerPage >= 50) {
      return {
        tableText: 'text-[7.5px]',
        headerPy: 'py-[1px]',
        headerText: 'text-[7.5px]',
        headerSubText: 'text-[7px]',
        itemPy: 'py-[0.5px]',
        itemText: 'text-[7.5px]',
        nameText: 'text-[7.5px]',
        funcText: 'text-[7px]',
        matText: 'text-[7.5px]',
        statusText: 'text-[7px]',
        badgeText: 'text-[6.5px] px-0.5',
        bannerPy: 'py-[0.5px]',
        bannerText: 'text-[7.5px]',
      };
    }
    if (itemsPerPage >= 45) {
      return {
        tableText: 'text-[8px]',
        headerPy: 'py-[1.5px]',
        headerText: 'text-[8px]',
        headerSubText: 'text-[7.5px]',
        itemPy: 'py-[0.8px]',
        itemText: 'text-[8px]',
        nameText: 'text-[8px]',
        funcText: 'text-[7.5px]',
        matText: 'text-[8px]',
        statusText: 'text-[7.5px]',
        badgeText: 'text-[7px] px-0.5',
        bannerPy: 'py-[1px]',
        bannerText: 'text-[8px]',
      };
    }
    if (itemsPerPage >= 40) {
      return {
        tableText: 'text-[8.5px]',
        headerPy: 'py-[2px]',
        headerText: 'text-[8.5px]',
        headerSubText: 'text-[8px]',
        itemPy: 'py-[1px]',
        itemText: 'text-[8.5px]',
        nameText: 'text-[8.5px]',
        funcText: 'text-[8px]',
        matText: 'text-[8.5px]',
        statusText: 'text-[8px]',
        badgeText: 'text-[7.5px] px-1',
        bannerPy: 'py-[1px]',
        bannerText: 'text-[8.5px]',
      };
    }
    if (itemsPerPage >= 35) {
      return {
        tableText: 'text-[9px]',
        headerPy: 'py-[2px]',
        headerText: 'text-[9px]',
        headerSubText: 'text-[8.5px]',
        itemPy: 'py-[1.5px]',
        itemText: 'text-[9px]',
        nameText: 'text-[9px]',
        funcText: 'text-[8.5px]',
        matText: 'text-[9px]',
        statusText: 'text-[8.5px]',
        badgeText: 'text-[8px] px-1',
        bannerPy: 'py-[1.5px]',
        bannerText: 'text-[9px]',
      };
    }
    // Padrão 30 linhas por página
    return {
      tableText: 'text-[9.5px]',
      headerPy: 'py-[2.5px]',
      headerText: 'text-[9.5px]',
      headerSubText: 'text-[9px]',
      itemPy: 'py-[2px]',
      itemText: 'text-[9.5px]',
      nameText: 'text-[9.5px]',
      funcText: 'text-[9px]',
      matText: 'text-[9.5px]',
      statusText: 'text-[9px]',
      badgeText: 'text-[8px] px-1',
      bannerPy: 'py-[2px]',
      bannerText: 'text-[9px]',
    };
  }, [itemsPerPage]);

  // Sincroniza se defaultSede mudar ao abrir
  React.useEffect(() => {
    if (isOpen && defaultSede && defaultSede !== 'TODAS') {
      setSelectedSede(defaultSede);
    }
  }, [isOpen, defaultSede]);

  // Lista unificada de dispensas (prop ou localStorage)
  const allDispensas = useMemo(() => {
    if (dispensas && dispensas.length > 0) {
      return dispensas;
    }
    return storageService.getDispensasSptf();
  }, [dispensas]);

  /**
   * Checagem Completa e Unificada de Status do Colaborador na Data Selecionada
   * Identifica FÉRIAS, DISPENSAS (SPTF), ATESTADOS, LICENÇAS e PRESENÇA REGULAR
   */
  const checkEmployeeStatusForDate = (emp: Employee, targetDate: string): EmployeeDayStatus => {
    const normalizedTarget = toISODate(targetDate);
    const empStatusLower = (emp.status || '').toLowerCase().trim();

    // -------------------------------------------------------------
    // 1. CHECAGEM DE FÉRIAS
    // -------------------------------------------------------------
    const isStatusVacation = empStatusLower === 'férias' || empStatusLower === 'ferias';
    const dataInicioFerias = toISODate(emp.dataInicioStatus || emp.data_inicio_status);
    const dataFimFerias = toISODate(emp.dataFimStatus || emp.data_fim_status);

    let isVacation = false;
    let returnDate: string | undefined = undefined;

    // 1.1 Período cadastrado no colaborador
    if (dataInicioFerias && dataFimFerias) {
      if (normalizedTarget >= dataInicioFerias && normalizedTarget <= dataFimFerias) {
        isVacation = true;
        returnDate = formatDateBR(dataFimFerias);
      }
    } else if (isStatusVacation) {
      isVacation = true;
      returnDate = dataFimFerias ? formatDateBR(dataFimFerias) : undefined;
    }

    // 1.2 Registro em TimeRecord
    if (!isVacation && records && records.length > 0) {
      const rec = records.find(r => {
        if (r.matricula !== emp.matricula) return false;
        const recDate = toISODate(r.dataRegistro || r.data_ocorrencia);
        if (recDate !== normalizedTarget) return false;
        const tipo = String(r.tipoOcorrencia || (r as any).tipo_ocorrencia || (r as any).occurrenceType || '').toUpperCase();
        const cod = String(r.codigoOcorrencia || '').toUpperCase();
        const obs = String(r.observacao || '').toUpperCase();
        return tipo === 'FERIAS' || cod === 'FE' || obs.includes('FERIAS') || obs.includes('FÉRIAS');
      });

      if (rec) {
        isVacation = true;
        returnDate = dataFimFerias ? formatDateBR(dataFimFerias) : (rec.observacao || undefined);
      }
    }

    if (isVacation) {
      const formattedReturn = returnDate ? (returnDate.toUpperCase().startsWith('RET') ? returnDate : `RET: ${returnDate}`) : 'FÉRIAS';
      return {
        isSpecial: true,
        type: 'FERIAS',
        badge: 'Férias',
        entrada: 'FÉRIAS',
        saida: formattedReturn,
        details: returnDate ? `Férias (Retorno em ${returnDate})` : 'Em gozo de férias regulamentares'
      };
    }

    // -------------------------------------------------------------
    // 2. CHECAGEM DE DISPENSA (SPTF / FOLGA / COMPENSAÇÃO)
    // -------------------------------------------------------------
    // 2.1 Busca nas Guias de Dispensa SPTF
    if (allDispensas && allDispensas.length > 0) {
      const dispensaFound = allDispensas.find(d => {
        if (d.matricula !== emp.matricula) return false;
        if (d.status === 'CANCELADA') return false;
        const dispDate = toISODate(d.data);
        return dispDate === normalizedTarget;
      });

      if (dispensaFound) {
        let saidaTexto = 'SPTF';
        if (dispensaFound.numeroGuia) {
          saidaTexto = dispensaFound.numeroGuia;
        } else if (dispensaFound.horarioInicio && dispensaFound.horarioFim) {
          saidaTexto = `${dispensaFound.horarioInicio}-${dispensaFound.horarioFim}`;
        }

        return {
          isSpecial: true,
          type: 'DISPENSA',
          badge: 'Dispensa',
          entrada: 'DISPENSA',
          saida: saidaTexto,
          details: dispensaFound.numeroGuia ? `Guia ${dispensaFound.numeroGuia} (${dispensaFound.totalHoras || 0}h)` : `Dispensa SPTF (${dispensaFound.totalHoras || 0}h)`
        };
      }
    }

    // 2.2 Busca nos Registros de Ponto (TimeRecord)
    if (records && records.length > 0) {
      const recDispensa = records.find(r => {
        if (r.matricula !== emp.matricula) return false;
        const recDate = toISODate(r.dataRegistro || r.data_ocorrencia);
        if (recDate !== normalizedTarget) return false;
        const tipo = String(r.tipoOcorrencia || (r as any).tipo_ocorrencia || (r as any).occurrenceType || '').toUpperCase();
        const cod = String(r.codigoOcorrencia || '').toUpperCase();
        const obs = String(r.observacao || '').toUpperCase();
        return (
          tipo.includes('DISPENSA') || 
          tipo.includes('COMPENSACAO') || 
          tipo === 'FOLGA_COMPENSATORIA' || 
          cod === 'D' || 
          cod === 'COMP' || 
          obs.includes('DISPENSA') || 
          obs.includes('SPTF') || 
          obs.includes('FOLGA')
        );
      });

      if (recDispensa) {
        const obsUpper = String(recDispensa.observacao || '').toUpperCase();
        const tipoUpper = String(recDispensa.tipoOcorrencia || '').toUpperCase();
        const isSptf = obsUpper.includes('SPTF') || tipoUpper.includes('SPTF') || tipoUpper === 'DISPENSA_SPTF';
        return {
          isSpecial: true,
          type: 'DISPENSA',
          badge: 'Dispensa',
          entrada: 'DISPENSA',
          saida: isSptf ? 'SPTF' : 'COMPENSAÇÃO',
          details: recDispensa.observacao || 'Dispensa regulamentar'
        };
      }
    }

    // 2.3 Status do Colaborador
    if (empStatusLower.includes('dispensa') || empStatusLower.includes('folga') || (emp.motivoStatus || '').toUpperCase().includes('DISPENSA')) {
      return {
        isSpecial: true,
        type: 'DISPENSA',
        badge: 'Dispensa',
        entrada: 'DISPENSA',
        saida: 'SPTF',
        details: emp.observacao_status || 'Dispensa'
      };
    }

    // -------------------------------------------------------------
    // 3. CHECAGEM DE ATESTADO MÉDICO OU LICENÇA
    // -------------------------------------------------------------
    if (records && records.length > 0) {
      const recMed = records.find(r => {
        if (r.matricula !== emp.matricula) return false;
        const recDate = toISODate(r.dataRegistro || r.data_ocorrencia);
        if (recDate !== normalizedTarget) return false;
        const tipo = (r.tipoOcorrencia || '').toUpperCase();
        const cod = (r.codigoOcorrencia || '').toUpperCase();
        return tipo === 'ATESTADO_MEDICO' || cod === 'AT';
      });

      if (recMed) {
        return {
          isSpecial: true,
          type: 'ATESTADO',
          badge: 'Atestado',
          entrada: 'ATESTADO',
          saida: 'MÉDICO',
          details: recMed.observacao || 'Atestado Médico'
        };
      }

      const recLic = records.find(r => {
        if (r.matricula !== emp.matricula) return false;
        const recDate = toISODate(r.dataRegistro || r.data_ocorrencia);
        if (recDate !== normalizedTarget) return false;
        const tipo = (r.tipoOcorrencia || '').toUpperCase();
        const cod = (r.codigoOcorrencia || '').toUpperCase();
        return tipo === 'LICENCA' || cod === 'LIC';
      });

      if (recLic || empStatusLower.includes('licença') || empStatusLower.includes('licenca')) {
        return {
          isSpecial: true,
          type: 'LICENCA',
          badge: 'Licença',
          entrada: 'LICENÇA',
          saida: 'REGISTRADA',
          details: 'Licença'
        };
      }
    }

    // -------------------------------------------------------------
    // 4. REGULAR (ATIVO / PRESENTE)
    // -------------------------------------------------------------
    return {
      isSpecial: false,
      type: 'REGULAR',
      badge: 'Presente',
      entrada: '',
      saida: '',
      details: 'Disponível para entrada e saída regular'
    };
  };

  // Determina o texto institucional da Sede / Destacamento
  const headerDestacamento = useMemo(() => {
    const sedeUpper = selectedSede.toUpperCase();
    if (sedeUpper === 'KO') {
      return 'DESTACAMENTO DE ENGENHARIA DA COMARA DE COARI-AM (DECO-KO)';
    }
    if (sedeUpper === 'BE') {
      return 'COMISSÃO DE AEROPORTOS DA REGIÃO AMAZÔNICA • SEDE BELÉM (COMARA-BE)';
    }
    if (sedeUpper === 'MN') {
      return 'DESTACAMENTO DE APOIO MANAUS (DAMN-MN)';
    }

    // Busca se existe no cadastro de canteiros
    const foundSite = constructionSites.find(s => 
      (s.code || s.codigo || s.branch || s.sede || '').toUpperCase() === sedeUpper
    );
    if (foundSite) {
      const name = (foundSite.name || foundSite.nome || `CANTEIRO ${sedeUpper}`).toUpperCase();
      return `DESTACAMENTO DE ENGENHARIA DA COMARA (${name} - ${sedeUpper})`;
    }

    return `DESTACAMENTO DE ENGENHARIA DA COMARA (SPTF-${sedeUpper})`;
  }, [selectedSede, constructionSites]);

  // Lista de Colaboradores Processada (com identificação de Sede Fixa vs Prestação de Serviço Fora de Sede)
  const processedEmployeeList = useMemo((): ProcessedPortariaEmployee[] => {
    const selectedSedeUpper = selectedSede.toUpperCase();

    const filtered = employees.filter((emp) => {
      const sedeAtual = (emp.sede_atual || emp.sede || '').toUpperCase();
      const sedeFixa = (emp.sede_origem || emp.sede || '').toUpperCase();

      // Filtro de Canteiro / Sede
      if (selectedSedeUpper !== 'TODAS') {
        if (sedeAtual !== selectedSedeUpper && sedeFixa !== selectedSedeUpper) {
          return false;
        }
      }

      // Filtro de Status (exclui desligados da lista diária de portaria)
      if (onlyActiveAndVacation) {
        const st = (emp.status || '').toLowerCase();
        if (st === 'inativo' || st === 'desligado' || st === 'demitido') {
          return false;
        }
      }

      // Filtro de Busca Textual
      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase().trim();
        const matchNome = emp.nome.toLowerCase().includes(q);
        const matchMat = emp.matricula.toLowerCase().includes(q);
        const matchFunc = (emp.funcao || emp.cargo || '').toLowerCase().includes(q);
        if (!matchNome && !matchMat && !matchFunc) return false;
      }

      return true;
    });

    // Mapeia e classifica: Efetivo Fixo (Local) vs Em Missão/Serviço Fora de Sede
    const mapped = filtered.map((emp) => {
      const sedeAtual = (emp.sede_atual || emp.sede || '').toUpperCase();
      const sedeFixa = (emp.sede_origem || emp.sede || '').toUpperCase();

      const isOutstation = selectedSedeUpper !== 'TODAS'
        ? (sedeFixa !== selectedSedeUpper && sedeAtual === selectedSedeUpper)
        : (Boolean(emp.sede_atual) && emp.sede_atual !== (emp.sede_origem || emp.sede));

      const statusInfo = checkEmployeeStatusForDate(emp, selectedDate);

      return {
        emp,
        statusInfo,
        isOutstation,
        sedeFixa,
        sedeAtual
      };
    }).filter((item) => {
      if (statusFilter === 'PRESENTES') {
        return item.statusInfo.type === 'REGULAR';
      }
      if (statusFilter === 'FERIAS_DISPENSAS') {
        return item.statusInfo.isSpecial;
      }
      return true;
    });

    // Ordenação: se separateOutstation for true, coloca os do canteiro primeiro (grupo 0) e os de fora por último (grupo 1)
    // Dentro de cada grupo, ordenação alfabética estrita para não mudar a ordem mensalmente
    mapped.sort((a, b) => {
      if (separateOutstation && selectedSedeUpper !== 'TODAS') {
        const groupA = a.isOutstation ? 1 : 0;
        const groupB = b.isOutstation ? 1 : 0;
        if (groupA !== groupB) {
          return groupA - groupB;
        }
      }
      return a.emp.nome.localeCompare(b.emp.nome, 'pt-BR', { sensitivity: 'base' });
    });

    // Atribui numeração sequencial contínua (ITEM 1, 2, 3...)
    return mapped.map((item, index) => ({
      ...item,
      itemNumber: index + 1
    }));
  }, [employees, selectedSede, onlyActiveAndVacation, filterSearch, selectedDate, records, allDispensas, statusFilter, separateOutstation]);

  // Contagens Estatísticas do Dia
  const stats = useMemo(() => {
    let total = processedEmployeeList.length;
    let ferias = 0;
    let dispensasCount = 0;
    let atestados = 0;
    let licenca = 0;
    let locais = 0;
    let foraSede = 0;

    processedEmployeeList.forEach(item => {
      if (item.statusInfo.type === 'FERIAS') ferias++;
      else if (item.statusInfo.type === 'DISPENSA') dispensasCount++;
      else if (item.statusInfo.type === 'ATESTADO') atestados++;
      else if (item.statusInfo.type === 'LICENCA') licenca++;

      if (item.isOutstation) {
        foraSede++;
      } else {
        locais++;
      }
    });

    const regulares = total - ferias - dispensasCount - atestados - licenca;

    return {
      total,
      ferias,
      dispensasCount,
      atestados,
      licenca,
      regulares,
      locais,
      foraSede
    };
  }, [processedEmployeeList]);

  // Divisão em Folhas Físicas A4 Individuais (com cabeçalho em todas as páginas e "Folha X de Y")
  const pages = useMemo(() => {
    const totalCount = processedEmployeeList.length;
    if (totalCount === 0) {
      return [{
        pageIndex: 0,
        pageNumber: 1,
        items: [] as ProcessedPortariaEmployee[]
      }];
    }

    const calculatedTotalPages = Math.ceil(totalCount / itemsPerPage) || 1;
    const pageList = [];

    for (let p = 0; p < calculatedTotalPages; p++) {
      const pageItems = processedEmployeeList.slice(p * itemsPerPage, (p + 1) * itemsPerPage);
      pageList.push({
        pageIndex: p,
        pageNumber: p + 1,
        items: pageItems
      });
    }

    return pageList;
  }, [processedEmployeeList, itemsPerPage]);

  const totalPages = pages.length;

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const emissionDateStr = new Date().toLocaleDateString('pt-BR');
  const emissionTimeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div 
      id="portaria-attendance-modal-backdrop"
      className="printable-modal fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible print:m-0 print:block"
      role="dialog"
      aria-modal="true"
    >
      {/* ============================================================== */}
      {/* ESTILOS DE IMPRESSÃO (@MEDIA PRINT) ISOLADOS PARA A FOLHA A4   */}
      {/* ============================================================== */}
      <style dangerouslySetInnerHTML={{ __html: `
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
          /* Oculta tudo que estiver fora do container de impressão da portaria */
          body * {
            visibility: hidden !important;
          }
          #folha-portaria-impressao, #folha-portaria-impressao * {
            visibility: visible !important;
          }
          #folha-portaria-impressao {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .portaria-page-sheet {
            box-sizing: border-box !important;
            width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            max-height: none !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
          }
          .portaria-page-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .no-print {
            display: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .portaria-footer-row {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-top: 4px !important;
            padding-top: 2px !important;
          }
        }
      `}} />

      <div 
        className={`w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden border transition-all print:max-h-none print:overflow-visible print:border-none print:shadow-none print:rounded-none print:p-0 print:w-full print:max-w-none ${
          isDark 
            ? 'bg-[#16243D] border-[#243756] text-white' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Header com controles e botões (Oculto na Impressão) */}
        <div className={`no-print p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#0F1B33] border-[#243756]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full font-mono border ${
                isDark ? 'bg-[#243756] text-blue-400 border-[#335075]' : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                Controle de Portaria
              </span>
              <span className={`text-xs font-mono ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                Entrada e Saída de Servidores
              </span>
            </div>
            <h2 className="text-lg font-bold mt-1 tracking-tight flex items-center gap-2 flex-wrap">
              <span>Relação de Entrada e Saída</span>
              <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-mono">
                {stats.total} servidores • {totalPages} folha{totalPages > 1 ? 's' : ''} (A4)
              </span>
              {stats.foraSede > 0 && (
                <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-mono">
                  {stats.foraSede} fora de sede ao final
                </span>
              )}
              {stats.ferias > 0 && (
                <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-mono">
                  {stats.ferias} férias
                </span>
              )}
              {stats.dispensasCount > 0 && (
                <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono">
                  {stats.dispensasCount} dispensa
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-portaria-imprimir-topo"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 active:scale-[0.98] cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir {totalPages} Folha{totalPages > 1 ? 's' : ''} A4</span>
            </button>
            <IconButton
              id="btn-portaria-fechar-topo"
              icon={X}
              variant="ghost"
              size="md"
              tooltip="Fechar Janela"
              aria-label="Fechar"
              onClick={onClose}
            />
          </div>
        </div>

        {/* Barra de Filtros e Parâmetros (Oculto na Impressão) */}
        <div className={`no-print p-3.5 sm:p-4 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${
          isDark ? 'bg-[#11203A] border-[#243756]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Seletor de Canteiro / Sede */}
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
              <label className="font-semibold text-[11px] uppercase tracking-wider text-slate-400">
                Sede:
              </label>
              <select
                id="select-portaria-sede"
                value={selectedSede}
                onChange={(e) => setSelectedSede(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg font-medium border text-xs focus:outline-hidden cursor-pointer ${
                  isDark 
                    ? 'bg-[#0B1426] border-[#243756] text-white focus:border-blue-500' 
                    : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                }`}
              >
                <option value="KO">Sede KO (Coari)</option>
                <option value="BE">Sede BE (Belém)</option>
                <option value="MN">Sede MN (Manaus)</option>
                {Array.isArray(constructionSites) && constructionSites.map((site) => {
                  const code = (site.code || site.codigo || site.branch || site.sede || '').toUpperCase();
                  if (['KO', 'BE', 'MN'].includes(code)) return null;
                  return (
                    <option key={site.id || code} value={code}>
                      Sede {code} ({site.name || site.nome || code})
                    </option>
                  );
                })}
                <option value="TODAS">Todas as Sedes (Geral)</option>
              </select>
            </div>

            {/* Data de Referência */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
              <label className="font-semibold text-[11px] uppercase tracking-wider text-slate-400">
                Data:
              </label>
              <input
                id="input-portaria-data"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`px-2 py-1 rounded-lg border text-xs focus:outline-hidden ${
                  isDark 
                    ? 'bg-[#0B1426] border-[#243756] text-white focus:border-blue-500' 
                    : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                }`}
              />
            </div>

            {/* Seletor de Linhas por Folha A4 */}
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-400 shrink-0" />
              <label className="font-semibold text-[11px] uppercase tracking-wider text-slate-400">
                Pessoas/Folha:
              </label>
              <select
                id="select-portaria-itens-pagina"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className={`px-2 py-1 rounded-lg font-medium border text-xs focus:outline-hidden cursor-pointer ${
                  isDark 
                    ? 'bg-[#0B1426] border-[#243756] text-white focus:border-blue-500' 
                    : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                }`}
              >
                <option value={30}>30 pessoas / folha</option>
                <option value={35}>35 pessoas / folha</option>
                <option value={40}>40 pessoas / folha</option>
                <option value={45}>45 pessoas / folha</option>
                <option value={50}>50 pessoas / folha</option>
              </select>
            </div>

            {/* Checkbox: Separar efetivo fixo dos colaboradores fora de sede */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none ml-1 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded-lg border border-blue-500/30 transition-colors">
              <input
                id="check-portaria-separar-forasede"
                type="checkbox"
                checked={separateOutstation}
                onChange={(e) => setSeparateOutstation(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className={`text-[11px] font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                Separar fora de sede por último
              </span>
            </label>

            {/* Toggle para preencher data na folha impressa */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none ml-1">
              <input
                id="check-portaria-preencher-data"
                type="checkbox"
                checked={fillDateInPrint}
                onChange={(e) => setFillDateInPrint(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className={`text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Imprimir data
              </span>
            </label>
          </div>

          {/* Filtro por status e busca rápida */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              id="select-portaria-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`px-2 py-1 rounded-lg text-xs border focus:outline-hidden cursor-pointer ${
                isDark 
                  ? 'bg-[#0B1426] border-[#243756] text-white focus:border-blue-500' 
                  : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
              }`}
            >
              <option value="TODOS">Todos ({stats.total})</option>
              <option value="PRESENTES">Apenas Presentes ({stats.regulares})</option>
              <option value="FERIAS_DISPENSAS">Férias & Dispensas ({stats.ferias + stats.dispensasCount})</option>
            </select>

            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                id="input-portaria-busca"
                type="text"
                placeholder="Filtrar servidor..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-1 rounded-lg text-xs border focus:outline-hidden ${
                  isDark 
                    ? 'bg-[#0B1426] border-[#243756] text-white placeholder-slate-500 focus:border-blue-500' 
                    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Área de Visualização com Folhas A4 Pagadas (Scrollable no Modal, Printable no A4) */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-900/50 flex flex-col items-center gap-6 print:p-0 print:overflow-visible print:bg-white print:block print:gap-0">
          <div id="folha-portaria-impressao" className="w-full flex flex-col items-center gap-6 print:gap-0 print:block">
            {pages.map(({ pageIndex, pageNumber, items }) => {
              // Verifica se a primeira linha deste bloco é o início da seção "Fora de Sede"
              const firstItem = items[0];
              const isFirstPage = pageIndex === 0;

              return (
                <div 
                  key={pageIndex}
                  id={`folha-portaria-pagina-${pageNumber}`}
                  className="portaria-page-sheet bg-white text-black p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-[210mm] min-h-[280mm] font-sans flex flex-col justify-between print:p-0 print:m-0 print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none print:min-h-0 print:h-auto print:block"
                  style={{
                    fontFamily: '"Liberation Sans", Arial, Helvetica, sans-serif',
                    color: '#000000',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  {/* CONTEÚDO SUPERIOR DA FOLHA (CABEÇALHO FIXO + LINHA DE DATA + TABELA) */}
                  <div>
                    {/* CABEÇALHO INSTITUCIONAL REPETIDO EM TODAS AS FOLHAS */}
                    <div className="text-center mb-2">
                      <p className="text-xs font-bold tracking-wide uppercase leading-tight m-0 text-black">
                        {instSettings?.subordinacao ? instSettings.subordinacao.split('•')[0].trim().toUpperCase() : 'COMANDO DA AERONÁUTICA'}
                      </p>
                      <p className="text-xs font-bold tracking-wide uppercase leading-tight mt-0.5 m-0 text-black">
                        {instSettings?.nomeInstituicao ? instSettings.nomeInstituicao.toUpperCase() : 'COMISSÃO DE AEROPORTOS DA REGIÃO AMAZÔNICA'}
                      </p>
                      <p className="text-xs font-bold tracking-wide uppercase leading-tight mt-0.5 m-0 text-black">
                        {headerDestacamento}
                      </p>
                      <p className="text-xs font-black tracking-wide uppercase leading-tight mt-1 underline m-0 text-black">
                        REGISTRO DE ENTRADA E SAÍDA DE SERVIDORES
                      </p>
                    </div>

                    {/* LINHA DE DATA E CANTEIRO REPETIDA EM TODAS AS FOLHAS */}
                    <div className="flex items-center justify-between border-t border-b border-black py-1 mb-1 text-[10.5px] font-bold">
                      <div className="flex items-center">
                        <span>DATA: </span>
                        {fillDateInPrint && selectedDate ? (
                          <span className="ml-1 tracking-wider">
                            {formatDateBR(selectedDate)} ({getDayOfWeekName(selectedDate)})
                          </span>
                        ) : (
                          <span className="ml-1 font-mono tracking-widest">
                            _____/_____/_________ (____________________)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Folha {pageNumber} de {totalPages}
                        </span>
                        <span className="tracking-wider">
                          SPTF—{selectedSede.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* TABELA DE ENTRADA E SAÍDA DESTE LOTE/PÁGINA */}
                    <table 
                      className={`w-full border-collapse ${rowMetrics.tableText} text-black`}
                      style={{ border: '1.5px solid #000000' }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: '#F8F9FA' }}>
                          <th 
                            rowSpan={2} 
                            className={`text-center font-bold px-1 ${rowMetrics.headerPy} border border-black uppercase ${rowMetrics.headerText}`}
                            style={{ width: '5%', border: '1px solid #000000' }}
                          >
                            ITEM
                          </th>
                          <th 
                            rowSpan={2} 
                            className={`text-center font-bold px-1.5 ${rowMetrics.headerPy} border border-black uppercase ${rowMetrics.headerText}`}
                            style={{ width: '38%', border: '1px solid #000000' }}
                          >
                            NOME
                          </th>
                          <th 
                            rowSpan={2} 
                            className={`text-center font-bold px-1.5 ${rowMetrics.headerPy} border border-black uppercase ${rowMetrics.headerText}`}
                            style={{ width: '33%', border: '1px solid #000000' }}
                          >
                            FUNÇÃO
                          </th>
                          <th 
                            rowSpan={2} 
                            className={`text-center font-bold px-1 ${rowMetrics.headerPy} border border-black uppercase ${rowMetrics.headerText}`}
                            style={{ width: '8%', border: '1px solid #000000' }}
                          >
                            MATR.
                          </th>
                          <th 
                            colSpan={2} 
                            className={`text-center font-bold px-1 ${rowMetrics.headerPy} border border-black uppercase ${rowMetrics.headerText}`}
                            style={{ width: '16%', border: '1px solid #000000' }}
                          >
                            HORÁRIO
                          </th>
                        </tr>
                        <tr style={{ backgroundColor: '#F8F9FA' }}>
                          <th 
                            className={`text-center font-bold px-1 ${rowMetrics.headerPy} border border-black uppercase ${rowMetrics.headerSubText}`}
                            style={{ width: '8%', border: '1px solid #000000' }}
                          >
                            ENTRADA
                          </th>
                          <th 
                            className={`text-center font-bold px-1 ${rowMetrics.headerPy} border border-black uppercase ${rowMetrics.headerSubText}`}
                            style={{ width: '8%', border: '1px solid #000000' }}
                          >
                            SAÍDA
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-6 border border-black text-gray-500 italic">
                              Nenhum servidor encontrado para os parâmetros selecionados.
                            </td>
                          </tr>
                        ) : (
                          items.map(({ itemNumber, emp, statusInfo, isOutstation, sedeFixa }, idx) => {
                            const isSpecial = statusInfo.isSpecial;
                            const isVacation = statusInfo.type === 'FERIAS';
                            const isDispensa = statusInfo.type === 'DISPENSA';

                            // Identifica se é o primeiro colaborador "Fora de Sede" nesta lista
                            const isPreviousLocal = idx > 0 ? !items[idx - 1].isOutstation : (pageIndex > 0 ? !processedEmployeeList[(pageIndex * itemsPerPage) - 1]?.isOutstation : false);
                            const showOutstationBanner = separateOutstation && selectedSede !== 'TODAS' && isOutstation && (idx === 0 || isPreviousLocal);

                            return (
                              <React.Fragment key={emp.matricula}>
                                {showOutstationBanner && (
                                  <tr 
                                    style={{
                                      backgroundColor: '#FEF3C7',
                                      pageBreakInside: 'avoid',
                                      breakInside: 'avoid'
                                    }}
                                  >
                                    <td 
                                      colSpan={6} 
                                      className={`px-2 ${rowMetrics.bannerPy} border border-black font-bold uppercase ${rowMetrics.bannerText} tracking-wider text-black text-left`}
                                      style={{ border: '1px solid #000000' }}
                                    >
                                      COLABORADORES EM MISSÃO / PRESTANDO SERVIÇO FORA DE SEDE ({stats.foraSede} SERVIDORES)
                                    </td>
                                  </tr>
                                )}

                                <tr 
                                  className="hover:bg-slate-50 transition-colors"
                                  style={{
                                    pageBreakInside: 'avoid',
                                    breakInside: 'avoid',
                                    backgroundColor: isVacation ? '#F8FAFC' : (isDispensa ? '#FEFCE8' : (isOutstation ? '#FFFBEB' : 'transparent'))
                                  }}
                                >
                                  {/* 1. ITEM */}
                                  <td 
                                    className={`text-center font-bold px-1 ${rowMetrics.itemPy} border border-black ${rowMetrics.itemText}`}
                                    style={{ border: '1px solid #000000' }}
                                  >
                                    {itemNumber}
                                  </td>

                                  {/* 2. NOME */}
                                  <td 
                                    className={`text-left font-bold px-1.5 ${rowMetrics.itemPy} border border-black uppercase ${rowMetrics.nameText} truncate max-w-[200px]`}
                                    style={{ border: '1px solid #000000' }}
                                    title={emp.nome}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="truncate">{emp.nome.toUpperCase()}</span>
                                      {isOutstation && (
                                        <span 
                                          className={`font-mono font-bold ${rowMetrics.badgeText} rounded border border-amber-500 bg-amber-100 text-amber-900 shrink-0`}
                                          title={`Sede de Origem: ${sedeFixa}`}
                                        >
                                          ORIGEM: {sedeFixa}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* 3. FUNÇÃO */}
                                  <td 
                                    className={`text-left px-1.5 ${rowMetrics.itemPy} border border-black uppercase ${rowMetrics.funcText} leading-tight`}
                                    style={{ border: '1px solid #000000' }}
                                  >
                                    {(emp.funcao || emp.cargo || 'SERVENTE DE OBRAS').toUpperCase()}
                                  </td>

                                  {/* 4. MATRÍCULA */}
                                  <td 
                                    className={`text-center font-mono font-semibold px-1 ${rowMetrics.itemPy} border border-black ${rowMetrics.matText}`}
                                    style={{ border: '1px solid #000000' }}
                                  >
                                    {emp.matricula}
                                  </td>

                                  {/* 5. ENTRADA */}
                                  <td 
                                    className={`text-center px-1 ${rowMetrics.itemPy} border border-black ${rowMetrics.statusText} font-bold ${
                                      isSpecial ? 'text-black font-black' : ''
                                    }`}
                                    style={{ 
                                      border: '1px solid #000000'
                                    }}
                                  >
                                    {statusInfo.entrada}
                                  </td>

                                  {/* 6. SAÍDA */}
                                  <td 
                                    className={`text-center px-1 ${rowMetrics.itemPy} border border-black ${rowMetrics.statusText} font-bold ${
                                      isSpecial ? 'text-black font-mono font-semibold' : ''
                                    }`}
                                    style={{ 
                                      border: '1px solid #000000'
                                    }}
                                  >
                                    {statusInfo.saida}
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* RODAPÉ OFICIAL INDIVIDUAL DE CADA FOLHA COM "FOLHA X DE Y" */}
                  <div 
                    className="portaria-footer-row mt-2.5 pt-1 text-[8.5px] text-gray-800 flex justify-between items-center border-t border-black font-medium shrink-0"
                    style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                  >
                    <span>COMARA • Sistema de Gestão SPTF — Controle de Portaria</span>
                    <span className="font-bold font-mono text-[9.5px] text-black">
                      Folha {pageNumber} de {totalPages}
                    </span>
                    <span>Emitido em: {emissionDateStr} às {emissionTimeStr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer do Modal (Oculto na Impressão) */}
        <div className={`no-print p-3.5 sm:p-4 border-t flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#0F1B33] border-[#243756]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Estrutura da Impressão:
            </span>
            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
              Documento dividido em <strong>{totalPages} folha{totalPages > 1 ? 's' : ''}</strong> com cabeçalho institucional em todas as páginas e numeração <strong>"Folha X de {totalPages}"</strong>.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-portaria-fechar-rodape"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer ${
                isDark 
                  ? 'bg-[#16243D] text-slate-300 border-[#243756] hover:bg-[#1E3252]' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Fechar
            </button>
            <button
              type="button"
              id="btn-portaria-imprimir-rodape"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-[0.98] cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir ({totalPages} folha{totalPages > 1 ? 's' : ''})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
