export interface CargoAssinatura {
  id: string;
  nome: string;
  ordem: number;
  tratamento: 'Chefe' | 'Encarregado' | 'Diretor' | 'Gerente' | 'Comandante';
}

export interface SedeConfig {
  id: string;
  codigo: string;
  nome: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  ativa: boolean;
}

export interface HorariosRegras {
  inicioAlmoco: string;
  fimAlmoco: string;
  aplicarTravaAlmoco: boolean;
  cargaHorariaDiaria: number;
  diasUteis: number[];
}

export interface RegrasCalculo {
  multiplicadorSegundaSexta: number;
  multiplicadorSabado: number;
  multiplicadorDomingoFeriado: number;
  arredondarPara: '0.25' | '0.5' | '1.0';
  aplicarTravaAlmocoDispensas: boolean;
}

export interface DocumentoModelo {
  tituloDispensa: string;
  cabecalhoRelatorio: string;
  rodapeRelatorio: string;
  textoPadraoMotivoDispensa: string;
}

export interface InstitutionSettings {
  nomeInstituicao: string;
  siglaInstituicao: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  logoUrl?: string;
  cargos: CargoAssinatura[];
  sedes: SedeConfig[];
  horarios: HorariosRegras;
  regrasCalculo: RegrasCalculo;
  documentosModelo: DocumentoModelo;
  atualizadoEm?: string;
  atualizadoPor?: string;
}

export const DEFAULT_INSTITUTION_SETTINGS: InstitutionSettings = {
  nomeInstituicao: 'COMARA',
  siglaInstituicao: 'COMARA',
  cnpj: '00.394.429/0143-70',
  endereco: 'Av. Pedro Álvares Cabral, 7115 - Belém / PA',
  telefone: '(91) 3214-5000',
  email: 'comara@comara.aer.mil.br',
  logoUrl: '',
  cargos: [
    { id: 'cargo-1', nome: 'Chefe do Canteiro', ordem: 1, tratamento: 'Chefe' },
    { id: 'cargo-2', nome: 'Chefe da Divisão Administrativa', ordem: 2, tratamento: 'Chefe' },
    { id: 'cargo-3', nome: 'Engenheiro Fiscal / RH', ordem: 3, tratamento: 'Gerente' },
  ],
  sedes: [
    { id: 'sede-ko', codigo: 'KO', nome: 'Canteiro de Obras Coari', endereco: 'Coari / AM', ativa: true },
    { id: 'sede-be', codigo: 'BE', nome: 'Sede Belém', endereco: 'Belém / PA', ativa: true },
    { id: 'sede-mn', codigo: 'MN', nome: 'Destacamento Manaus', endereco: 'Manaus / AM', ativa: true },
  ],
  horarios: {
    inicioAlmoco: '12:00',
    fimAlmoco: '13:00',
    aplicarTravaAlmoco: true,
    cargaHorariaDiaria: 8,
    diasUteis: [1, 2, 3, 4, 5],
  },
  regrasCalculo: {
    multiplicadorSegundaSexta: 1.0,
    multiplicadorSabado: 1.5,
    multiplicadorDomingoFeriado: 2.0,
    arredondarPara: '0.5',
    aplicarTravaAlmocoDispensas: true,
  },
  documentosModelo: {
    tituloDispensa: 'Guia de Dispensa de SPTF',
    cabecalhoRelatorio: 'Relatório Oficial de Banco de Horas',
    rodapeRelatorio: 'Documento gerado eletronicamente em conformidade com a LGPD.',
    textoPadraoMotivoDispensa: 'COMPENSAÇÃO BANCO DE HORAS',
  },
};
