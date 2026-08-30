import { useIdleTimer, UseIdleTimerOptions, UseIdleTimerReturn, getTimeoutForRole } from './useIdleTimer';

export interface UseInactivityTimeoutOptions {
  /**
   * Se o monitoramento está habilitado (geralmente `!!currentUser`)
   */
  enabled?: boolean;
  /**
   * Perfil de acesso do usuário (AUX_DA: 15 min, RH_ADMIN/Gestores/outros: 30 min)
   */
  role?: string | null;
  /**
   * Tempo em milissegundos para timeout de inatividade (opcional, padrão: 30 minutos ou adaptativo ao perfil)
   */
  timeoutMs?: number;
  /**
   * Tempo de aviso prévio em segundos (padrão: 60s)
   */
  warnSeconds?: number;
  /**
   * Callback disparado quando o timeout de inatividade for atingido (Auto-Logoff)
   */
  onTimeout: () => void;
  /**
   * Callback opcional disparado quando o aviso de inatividade for acionado
   */
  onWarning?: (remainingSeconds: number) => void;
}

/**
 * Hook de monitoramento de inatividade com auto-logout e aviso prévio.
 * Escuta eventos do usuário (mousemove, keydown, click, scroll, touchstart, wheel, pointerdown)
 * para resetar o temporizador de forma otimizada (throttled).
 */
export function useInactivityTimeout(options: UseInactivityTimeoutOptions): UseIdleTimerReturn {
  const customTimeoutSeconds = options.timeoutMs ? Math.floor(options.timeoutMs / 1000) : undefined;

  return useIdleTimer({
    enabled: options.enabled ?? true,
    role: options.role,
    warnSeconds: options.warnSeconds ?? 60,
    customTimeoutSeconds,
    onTimeout: options.onTimeout,
  });
}

export { useIdleTimer, getTimeoutForRole };
export type { UseIdleTimerOptions, UseIdleTimerReturn };
