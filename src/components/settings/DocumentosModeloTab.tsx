import React from 'react';
import { DocumentosModeloInstituicao } from '../../types/institutionConfig';
import { CardSection, FormInput, FormTextarea } from './FormControls';
import { 
  FileText, 
  Printer, 
  ShieldCheck, 
  ScrollText, 
  HelpCircle 
} from 'lucide-react';

interface DocumentosModeloTabProps {
  documentos: DocumentosModeloInstituicao;
  onChange: (updated: Partial<DocumentosModeloInstituicao>) => void;
  isDark: boolean;
}

export const DocumentosModeloTab: React.FC<DocumentosModeloTabProps> = ({
  documentos,
  onChange,
  isDark,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. SEÇÃO: DISPENSA OFICIAL DE SPTF (2 VIAS A4) */}
      <CardSection
        title="Modelos de Guia de Dispensa de SPTF (2 Vias A4)"
        description="Textos que compõem o cabeçalho, autorização de chefia e termo de ciência do colaborador na emissão das guias de dispensa impressas."
        icon={Printer}
        isDark={isDark}
        badge="Impressão"
      >
        <div className="space-y-4">
          <FormInput
            label="Título Principal da Guia de Dispensa"
            value={documentos.tituloDispensa || ''}
            onChange={(e) => onChange({ tituloDispensa: e.target.value })}
            placeholder="Ex: GUIA OFICIAL DE DISPENSA DO SPTF"
            isDark={isDark}
            required
          />

          <FormTextarea
            label="Texto Padrão de Autorização da Dispensa"
            value={documentos.textoPadraoDispensa || ''}
            onChange={(e) => onChange({ textoPadraoDispensa: e.target.value })}
            placeholder="Ex: Fica autorizada a dispensa do serviço para compensação de horas acumuladas no Banco de Horas SPTF..."
            rows={3}
            isDark={isDark}
            helperText="Parágrafo que descreve a concessão da folga compensatória pelo encarregado/chefe imediato."
          />

          <FormTextarea
            label="Termo de Compromisso e Ciência do Colaborador"
            value={documentos.termoCompromisso || ''}
            onChange={(e) => onChange({ termoCompromisso: e.target.value })}
            placeholder="Ex: Declaro ciência de que as horas ora compensadas foram devidamente apuradas e debitadas do meu saldo..."
            rows={3}
            isDark={isDark}
            helperText="Texto posicionado acima do campo de assinatura do colaborador na 2ª via."
          />

          <FormInput
            label="Portaria / Norma Regulamentadora de Referência"
            value={documentos.portariaRegulamentar || ''}
            onChange={(e) => onChange({ portariaRegulamentar: e.target.value })}
            placeholder="Ex: Portaria COMARA nº 124/SPTF/2024 e Normas de Gestão de Pessoal Militar/Civil."
            isDark={isDark}
            helperText="Citada no rodapé das dispensas como fundamentação jurídica."
          />
        </div>
      </CardSection>

      {/* 2. SEÇÃO: RELATÓRIOS & EXTRATOS EXECUTIVOS */}
      <CardSection
        title="Cabeçalhos e Rodapés de Relatórios & Extratos FIFO"
        description="Textos padronizados para timbrado de relatórios analíticos em PDF e planilhas impressas de auditoria."
        icon={ScrollText}
        isDark={isDark}
      >
        <div className="space-y-4">
          <FormInput
            label="Cabeçalho Timbrado de Relatórios"
            value={documentos.cabecalhoRelatorio || ''}
            onChange={(e) => onChange({ cabecalhoRelatorio: e.target.value })}
            placeholder="Ex: COMISSÃO DE AEROPORTOS DA REGIÃO AMAZÔNICA • SISTEMA DE GESTÃO DO BANCO DE HORAS SPTF"
            isDark={isDark}
            required
          />

          <FormTextarea
            label="Texto Descritivo Padrão de Apuração FIFO"
            value={documentos.textoPadraoRelatorio || ''}
            onChange={(e) => onChange({ textoPadraoRelatorio: e.target.value })}
            placeholder="Ex: Extrato oficial de apuração e liquidação do banco de horas por metodologia cronológica FIFO."
            rows={2}
            isDark={isDark}
          />

          <FormTextarea
            label="Rodapé Oficial de Conformidade Legal e LGPD"
            value={documentos.rodapeRelatorio || ''}
            onChange={(e) => onChange({ rodapeRelatorio: e.target.value })}
            placeholder="Ex: Documento gerado eletronicamente em conformidade com as Normas Internas e a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)."
            rows={2}
            isDark={isDark}
            helperText="Aparece centralizado no fim de todas as páginas geradas para fiscalização."
          />
        </div>
      </CardSection>
    </div>
  );
};
