export interface CargoInstituicao {
  id: string;
  nome: string;
  ordem: number;
  tratamento?: 'Chefe' | 'Encarregado' | 'Diretor' | 'Gerente' | 'Comandante' | 'Fiscal' | 'Outro';
  departamento?: string;
  ativo?: boolean;
}

export interface SedeInstituicao {
  id: string;
  nome: string;
  codigo: string;
  endereco: string;
  telefone?: string;
  email?: string;
  responsavel?: string;
  ativa: boolean;
}

export interface HorariosInstituicao {
  inicioAlmoco: string;
  fimAlmoco: string;
  cargaHorariaDiaria: number; // Ex: 8 horas
  diasUteis: number[]; // [1, 2, 3, 4, 5] (Segunda a Sexta)
  aplicarTravaAlmoco: boolean;
  toleranciaMinutos?: number;
}

export interface MultiplicadoresHoras {
  segundaSexta: number; // Ex: 1.0
  sabado: number; // Ex: 1.5
  domingoFeriado: number; // Ex: 2.0
}

export interface TratamentoFeriados {
  considerarComoDomingo: boolean;
  permitirLancamentoFeriado: boolean;
  exigirAutorizacaoPrevia: boolean;
}

export interface RegrasBancoHoras {
  validadeMeses: number; // Ex: 6 ou 12 meses
  limiteMaximoHorasPositivas: number; // Ex: 40 ou 100 horas
  limiteMaximoHorasNegativas: number; // Ex: -20 horas
  limiteDiarioHorasExtras: number; // Ex: 2 horas
  arredondarPara: '0.25' | '0.5' | '1.0';
  aplicarTravaAlmocoDispensas: boolean;
  permitirSaldoNegativo: boolean;
}

export interface RegrasCalculoInstituicao {
  multiplicadores: MultiplicadoresHoras;
  tratamentoFeriados: TratamentoFeriados;
  bancoHoras: RegrasBancoHoras;
  
  // Propriedades legadas / retrocompatibilidade direta
  multiplicadorSegundaSexta?: number;
  multiplicadorSabado?: number;
  multiplicadorDomingoFeriado?: number;
  arredondarPara?: '0.25' | '0.5' | '1.0';
  aplicarTravaAlmocoDispensas?: boolean;
}

export interface DocumentosModeloInstituicao {
  tituloDispensa: string;
  cabecalhoRelatorio: string;
  rodapeRelatorio: string;
  textoPadraoDispensa: string;
  textoPadraoRelatorio: string;
  textoPadraoMotivoDispensa: string;
  portariaRegulamentar?: string;
  termoCompromisso?: string;
  instrucaoNormativa?: string;
}

export interface InstitutionSettings {
  nomeInstituicao: string;
  siglaInstituicao: string;
  subordinacao?: string; // Ex: Comando da Aeronáutica / Ministério da Defesa
  cnpj?: string;
  endereco: string;
  telefone: string;
  email: string;
  logoUrl: string;
  website?: string;
  cargos: CargoInstituicao[];
  sedes: SedeInstituicao[];
  horarios: HorariosInstituicao;
  regrasCalculo: RegrasCalculoInstituicao;
  documentosModelo: DocumentosModeloInstituicao;
  versao: number;
  atualizadoEm?: string;
  atualizadoPor?: string;
  atualizadoPorEmail?: string;
}

export const DEFAULT_INSTITUTION_SETTINGS: InstitutionSettings = {
  nomeInstituicao: 'Comissão de Aeroportos da Região Amazônica',
  siglaInstituicao: 'COMARA',
  subordinacao: 'Comando da Aeronáutica • Força Aérea Brasileira',
  cnpj: '00.394.429/0143-70',
  endereco: 'Av. Pedro Álvares Cabral, 7115 - Sacramenta, Belém - PA, 66610-020',
  telefone: '(91) 3214-5000',
  email: 'comara@comara.aer.mil.br',
  logoUrl: '/comara-logo.png',
  website: 'https://www.fab.mil.br/comara',
  versao: 1,
  cargos: [
    { id: 'cargo-1', nome: 'Chefe do Canteiro de Obras', ordem: 1, tratamento: 'Chefe', departamento: 'Divisão de Engenharia', ativo: true },
    { id: 'cargo-2', nome: 'Chefe da Divisão Administrativa (DA)', ordem: 2, tratamento: 'Chefe', departamento: 'Divisão Administrativa', ativo: true },
    { id: 'cargo-3', nome: 'Encarregado do Canteiro de Obras', ordem: 3, tratamento: 'Encarregado', departamento: 'Operações de Campo', ativo: true },
    { id: 'cargo-4', nome: 'Encarregado da Divisão Administrativa', ordem: 4, tratamento: 'Encarregado', departamento: 'Divisão Administrativa', ativo: true },
    { id: 'cargo-5', nome: 'Gestor / Analista de RH Sede', ordem: 5, tratamento: 'Gerente', departamento: 'Recursos Humanos', ativo: true },
    { id: 'cargo-6', nome: 'Engenheiro Fiscal / Supervisor de Campo', ordem: 6, tratamento: 'Fiscal', departamento: 'Fiscalização de Obras', ativo: true },
    { id: 'cargo-7', nome: 'Auxiliar Administrativo de Campo', ordem: 7, tratamento: 'Chefe', departamento: 'Administração Local', ativo: true }
  ],
  sedes: [
    { id: 'sede-ko', codigo: 'KO', nome: 'Canteiro de Obras Coari', endereco: 'Aeroporto de Coari, Estrada Coari-Mamiá, s/n - Coari / AM, CEP: 69460-000', telefone: '(97) 3561-2200', email: 'coari.comara@gmail.com', responsavel: 'Chefe do Canteiro KO', ativa: true },
    { id: 'sede-be', codigo: 'BE', nome: 'Sede Belém (Quartel-General)', endereco: 'Av. Pedro Álvares Cabral, 7115 - Belém / PA, CEP: 66610-020', telefone: '(91) 3214-5000', email: 'belem.comara@fab.mil.br', responsavel: 'Comandante / Chefe COMARA', ativa: true },
    { id: 'sede-mn', codigo: 'MN', nome: 'Destacamento de Apoio Manaus', endereco: 'Av. Rodrigo Otávio, 770 - Crespo, Manaus / AM, CEP: 69073-177', telefone: '(92) 3629-1000', email: 'manaus.comara@fab.mil.br', responsavel: 'Chefe do Destacamento MN', ativa: true }
  ],
  horarios: {
    inicioAlmoco: '12:00',
    fimAlmoco: '13:00',
    cargaHorariaDiaria: 8,
    diasUteis: [1, 2, 3, 4, 5],
    aplicarTravaAlmoco: true,
    toleranciaMinutos: 15
  },
  regrasCalculo: {
    multiplicadores: {
      segundaSexta: 1.0,
      sabado: 1.5,
      domingoFeriado: 2.0
    },
    tratamentoFeriados: {
      considerarComoDomingo: true,
      permitirLancamentoFeriado: true,
      exigirAutorizacaoPrevia: true
    },
    bancoHoras: {
      validadeMeses: 12,
      limiteMaximoHorasPositivas: 80,
      limiteMaximoHorasNegativas: -30,
      limiteDiarioHorasExtras: 2,
      arredondarPara: '0.5',
      aplicarTravaAlmocoDispensas: true,
      permitirSaldoNegativo: true
    },
    // Retrocompatibilidade
    multiplicadorSegundaSexta: 1.0,
    multiplicadorSabado: 1.5,
    multiplicadorDomingoFeriado: 2.0,
    arredondarPara: '0.5',
    aplicarTravaAlmocoDispensas: true
  },
  documentosModelo: {
    tituloDispensa: 'GUIA OFICIAL DE DISPENSA DO SPTF',
    cabecalhoRelatorio: 'COMISSÃO DE AEROPORTOS DA REGIÃO AMAZÔNICA • SISTEMA DE GESTÃO DO BANCO DE HORAS SPTF',
    rodapeRelatorio: 'Documento gerado eletronicamente em conformidade com as Normas Internas e a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).',
    textoPadraoDispensa: 'Fica autorizada a dispensa do serviço para compensação de horas acumuladas no Banco de Horas SPTF, conforme registrado no sistema institucional.',
    textoPadraoRelatorio: 'Extrato oficial de apuração e liquidação do banco de horas por metodologia cronológica FIFO.',
    textoPadraoMotivoDispensa: 'COMPENSAÇÃO DE BANCO DE HORAS SPTF',
    portariaRegulamentar: 'Portaria COMARA nº 124/SPTF/2024 e Normas de Gestão de Pessoal Militar/Civil.',
    termoCompromisso: 'Declaro ciência de que as horas ora compensadas foram devidamente apuradas e debitadas do meu saldo no banco de horas institucional.'
  }
};
