import React from 'react';
import { 
  HorariosInstituicao, 
  RegrasCalculoInstituicao 
} from '../../types/institutionConfig';
import { CardSection, FormInput, FormSelect, ToggleSwitch } from './FormControls';
import { 
  Clock, 
  Calculator, 
  ShieldAlert, 
  CalendarDays, 
  Zap, 
  Lock, 
  Utensils 
} from 'lucide-react';

interface HorariosRegrasTabProps {
  horarios: HorariosInstituicao;
  regrasCalculo: RegrasCalculoInstituicao;
  onUpdateHorarios: (updated: Partial<HorariosInstituicao>) => void;
  onUpdateRegras: (updated: Partial<RegrasCalculoInstituicao>) => void;
  isDark: boolean;
}

const ARREDONDAMENTO_OPTIONS = [
  { value: '0.5', label: '0,5 hora (30 minutos) • Padrão COMARA' },
  { value: '0.25', label: '0,25 hora (15 minutos)' },
  { value: '1.0', label: '1,0 hora cheia (60 minutos)' },
];

export const HorariosRegrasTab: React.FC<HorariosRegrasTabProps> = ({
  horarios,
  regrasCalculo,
  onUpdateHorarios,
  onUpdateRegras,
  isDark,
}) => {
  const multiplicadores = regrasCalculo.multiplicadores || {
    segundaSexta: 1.0,
    sabado: 1.5,
    domingoFeriado: 2.0,
  };

  const bancoHoras = regrasCalculo.bancoHoras || {
    validadeMeses: 12,
    limiteMaximoHorasPositivas: 80,
    limiteMaximoHorasNegativas: -30,
    limiteDiarioHorasExtras: 2,
    arredondarPara: '0.5',
    aplicarTravaAlmocoDispensas: true,
    permitirSaldoNegativo: true,
  };

  const tratamentoFeriados = regrasCalculo.tratamentoFeriados || {
    considerarComoDomingo: true,
    permitirLancamentoFeriado: true,
    exigirAutorizacaoPrevia: true,
  };

  return (
    <div className="space-y-6">
      {/* 1. SEÇÃO: JORNADA & HORÁRIO DE ALMOÇO */}
      <CardSection
        title="Jornada Padrão e Intervalo Intrajornada (Almoço)"
        description="Definição dos horários institucionais de expediente e aplicação da regra mandatória de almoço."
        icon={Clock}
        isDark={isDark}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <FormInput
            label="Início do Intervalo de Almoço"
            type="time"
            value={horarios.inicioAlmoco}
            onChange={(e) => onUpdateHorarios({ inicioAlmoco: e.target.value })}
            icon={Utensils}
            isDark={isDark}
            required
          />

          <FormInput
            label="Término do Intervalo de Almoço"
            type="time"
            value={horarios.fimAlmoco}
            onChange={(e) => onUpdateHorarios({ fimAlmoco: e.target.value })}
            icon={Clock}
            isDark={isDark}
            required
          />

          <FormInput
            label="Carga Horária Diária Padrão (Horas)"
            type="number"
            min={4}
            max={12}
            step={1}
            value={horarios.cargaHorariaDiaria}
            onChange={(e) => onUpdateHorarios({ cargaHorariaDiaria: Number(e.target.value) || 8 })}
            isDark={isDark}
            required
          />
        </div>

        <div className="space-y-3 pt-2">
          <ToggleSwitch
            label="Trava Automática de Almoço (1h) em Lançamentos"
            description="Se ativada, quando o colaborador lançar horário de entrada e saída que abranja o intervalo (ex: 08:00 às 18:00), o sistema deduz automaticamente 1h de almoço conforme a CLT/Estatuto."
            checked={horarios.aplicarTravaAlmoco}
            onChange={(val) => onUpdateHorarios({ aplicarTravaAlmoco: val })}
            isDark={isDark}
          />

          <ToggleSwitch
            label="Trava de Almoço na Emissão de Dispensas de SPTF"
            description="Impede dispensas contínuas durante o intervalo regulamentar de almoço sem o devido fracionamento."
            checked={bancoHoras.aplicarTravaAlmocoDispensas}
            onChange={(val) =>
              onUpdateRegras({
                bancoHoras: { ...bancoHoras, aplicarTravaAlmocoDispensas: val },
                aplicarTravaAlmocoDispensas: val,
              })
            }
            isDark={isDark}
          />
        </div>
      </CardSection>

      {/* 2. SEÇÃO: MULTIPLICADORES DE HORAS EXTRAS */}
      <CardSection
        title="Multiplicadores Oficiais de Horas Extras"
        description="Fatores de conversão e bonificação para cômputo no saldo credor de banco de horas."
        icon={Calculator}
        isDark={isDark}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            label="Segunda a Sexta-feira"
            type="number"
            min={1.0}
            max={3.0}
            step={0.1}
            value={multiplicadores.segundaSexta}
            onChange={(e) =>
              onUpdateRegras({
                multiplicadores: {
                  ...multiplicadores,
                  segundaSexta: Number(e.target.value) || 1.0,
                },
                multiplicadorSegundaSexta: Number(e.target.value) || 1.0,
              })
            }
            helperText="1.0x = hora regular normal (1h trabalhada = 1h creditada)"
            isDark={isDark}
          />

          <FormInput
            label="Sábados"
            type="number"
            min={1.0}
            max={3.0}
            step={0.1}
            value={multiplicadores.sabado}
            onChange={(e) =>
              onUpdateRegras({
                multiplicadores: {
                  ...multiplicadores,
                  sabado: Number(e.target.value) || 1.5,
                },
                multiplicadorSabado: Number(e.target.value) || 1.5,
              })
            }
            helperText="1.5x = 50% de acréscimo (1h trabalhada = 1h30 creditada)"
            isDark={isDark}
          />

          <FormInput
            label="Domingos e Feriados Oficiais"
            type="number"
            min={1.0}
            max={4.0}
            step={0.1}
            value={multiplicadores.domingoFeriado}
            onChange={(e) =>
              onUpdateRegras({
                multiplicadores: {
                  ...multiplicadores,
                  domingoFeriado: Number(e.target.value) || 2.0,
                },
                multiplicadorDomingoFeriado: Number(e.target.value) || 2.0,
              })
            }
            helperText="2.0x = 100% de acréscimo (1h trabalhada = 2h creditadas)"
            isDark={isDark}
          />
        </div>
      </CardSection>

      {/* 3. SEÇÃO: LIMITES E REGRAS DO BANCO DE HORAS */}
      <CardSection
        title="Parâmetros de Validade e Limites do Banco de Horas"
        description="Regras de expiração, arredondamento e tetos de saldo para gestão de passivos."
        icon={Zap}
        isDark={isDark}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <FormInput
            label="Validade do Saldo (Meses)"
            type="number"
            min={1}
            max={24}
            value={bancoHoras.validadeMeses}
            onChange={(e) =>
              onUpdateRegras({
                bancoHoras: {
                  ...bancoHoras,
                  validadeMeses: Number(e.target.value) || 12,
                },
              })
            }
            helperText="Prazo máximo para compensação FIFO antes de prescrição/liquidação."
            isDark={isDark}
          />

          <FormInput
            label="Teto Máximo Positivo (+ Horas)"
            type="number"
            min={10}
            max={300}
            value={bancoHoras.limiteMaximoHorasPositivas}
            onChange={(e) =>
              onUpdateRegras({
                bancoHoras: {
                  ...bancoHoras,
                  limiteMaximoHorasPositivas: Number(e.target.value) || 80,
                },
              })
            }
            helperText="Alerta o RH se o colaborador acumular saldo acima desse limite."
            isDark={isDark}
          />

          <FormSelect
            label="Fração de Arredondamento de Horas"
            value={bancoHoras.arredondarPara || '0.5'}
            onChange={(e) =>
              onUpdateRegras({
                bancoHoras: {
                  ...bancoHoras,
                  arredondarPara: e.target.value as any,
                },
                arredondarPara: e.target.value as any,
              })
            }
            options={ARREDONDAMENTO_OPTIONS}
            isDark={isDark}
          />
        </div>

        <div className="space-y-3 pt-2">
          <ToggleSwitch
            label="Permitir Saldo Devedor / Negativo no Banco de Horas"
            description="Permite que colaboradores realizem dispensas parciais ou acumulem débitos temporários para futura compensação."
            checked={bancoHoras.permitirSaldoNegativo}
            onChange={(val) =>
              onUpdateRegras({
                bancoHoras: { ...bancoHoras, permitirSaldoNegativo: val },
              })
            }
            isDark={isDark}
          />

          <ToggleSwitch
            label="Equiparar Feriados Nacionais e Locais a Domingos (2.0x)"
            description="Aplica o fator dobrado automaticamente para datas catalogadas como feriados oficiais."
            checked={tratamentoFeriados.considerarComoDomingo}
            onChange={(val) =>
              onUpdateRegras({
                tratamentoFeriados: {
                  ...tratamentoFeriados,
                  considerarComoDomingo: val,
                },
              })
            }
            isDark={isDark}
          />
        </div>
      </CardSection>
    </div>
  );
};
