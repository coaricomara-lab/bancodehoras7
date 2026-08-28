/**
 * Design Tokens do Sistema de Gestão SPTF — Paleta Institucional Aeronáutica
 * Padronização de cores, tipografia, espaçamentos, elevações e componentes.
 *
 * Paleta: azuis aeronáuticos institucionais + neutros navy (dark) / slate (light).
 * Estes tokens espelham as variáveis CSS definidas em index.css.
 */

export const designTokens = {
  colors: {
    // Superfícies e Fundos
    surface: {
      dark: {
        base: '#0B1426',        // navy-black institucional
        secondary: '#0F1B33',   // inputs / inner surfaces
        header: '#11203A',      // header / nav
        card: '#16243D',        // card background
        cardElevated: '#1E3252', // elevated card
        subtle: '#1B2D4A',      // hover / subtle surface
        border: '#243756',      // primary border
        borderSubtle: '#335075', // lighter border
      },
      light: {
        base: '#F1F5F9',        // slate-100
        secondary: '#F8FAFC',   // slate-50
        header: '#FFFFFF',
        card: '#FFFFFF',
        cardElevated: '#FFFFFF',
        subtle: '#F8FAFC',
        border: '#E2E8F0',      // slate-200
        borderSubtle: '#CBD5E1', // slate-300
      },
    },

    // Tipografia / Neutros
    text: {
      dark: {
        primary: '#E2E8F0',     // slate-200
        secondary: '#CBD5E1',   // slate-300
        muted: '#94A3B8',      // slate-400
        subtle: '#64748B',     // slate-500
      },
      light: {
        primary: '#0F172A',    // slate-900
        secondary: '#334155',  // slate-700
        muted: '#64748B',     // slate-500
        subtle: '#94A3B8',    // slate-400
      },
    },

    // Acentos Semânticos
    brand: {
      primary: '#3B82F6',       // Azul Aeronáutico (blue-500)
      primaryHover: '#2563EB',  // blue-600
      primaryDarkBg: 'rgba(59, 130, 246, 0.15)',
      primaryDarkBorder: 'rgba(59, 130, 246, 0.3)',
      primaryLightBg: '#EFF6FF',
      primaryLightBorder: '#BFDBFE',
    },
    success: {
      main: '#10B981',
      hover: '#059669',
      darkBg: 'rgba(16, 185, 129, 0.15)',
      darkBorder: 'rgba(16, 185, 129, 0.3)',
      lightBg: '#ECFDF5',
      lightBorder: '#A7F3D0',
      textDark: '#34D399',
      textLight: '#047857',
    },
    danger: {
      main: '#EF4444',
      hover: '#DC2626',
      darkBg: 'rgba(239, 68, 68, 0.15)',
      darkBorder: 'rgba(239, 68, 68, 0.3)',
      lightBg: '#FEF2F2',
      lightBorder: '#FECACA',
      textDark: '#F87171',
      textLight: '#B91C1C',
    },
    warning: {
      main: '#F59E0B',
      hover: '#D97706',
      darkBg: 'rgba(245, 158, 11, 0.15)',
      darkBorder: 'rgba(245, 158, 11, 0.3)',
      lightBg: '#FFFBEB',
      lightBorder: '#FDE68A',
      textDark: '#FBBF24',
      textLight: '#B45309',
    },
    purple: {
      main: '#8B5CF6',
      hover: '#7C3AED',
      darkBg: 'rgba(139, 92, 246, 0.15)',
      darkBorder: 'rgba(139, 92, 246, 0.3)',
      lightBg: '#F5F3FF',
      lightBorder: '#DDD6FE',
      textDark: '#A78BFA',
      textLight: '#6D28D9',
    },
  },

  // Escalas de raio de borda
  radius: {
    xs: 'rounded-md',      // 6px
    sm: 'rounded-lg',      // 8px
    md: 'rounded-xl',      // 12px
    lg: 'rounded-2xl',     // 16px
    pill: 'rounded-full',
  },

  // Tamanhos padronizados de botões de ação e ícones
  iconButton: {
    sizes: {
      xs: 'w-7 h-7 p-1',
      sm: 'w-8 h-8 p-1.5',
      md: 'w-9 h-9 p-2',
      lg: 'w-10 h-10 p-2.5',
    },
    iconSizes: {
      xs: 'w-3.5 h-3.5',
      sm: 'w-4 h-4',
      md: 'w-4.5 h-4.5',
      lg: 'w-5 h-5',
    },
  },

  // Transições consistentes
  transitions: {
    fast: 'transition-all duration-150 ease-in-out',
    normal: 'transition-all duration-200 ease-in-out',
    spring: 'transition-transform duration-150 active:scale-95',
  },
} as const;

export type DesignTokens = typeof designTokens;
