/**
 * localCache.ts - Gerenciador central de cache local em memória e localStorage
 * para otimização de leitura e contenção de cotas do Cloud Firestore.
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const MEMORY_CACHE = new Map<string, CacheEntry<any>>();
const CACHE_PREFIX = 'sptf_cache_v2_';

// TTLs padrão recomendados (em milissegundos)
export const CACHE_TTLS = {
  STATIC_FAST: 60 * 1000,         // 1 minuto
  MEDIUM: 5 * 60 * 1000,           // 5 minutos
  LONG: 15 * 60 * 1000,           // 15 minutos
  STATIC_PERSISTENT: 60 * 60 * 1000, // 1 hora
};

export const CACHE_KEYS = {
  ADMIN_USERS: 'admin_users',
  CANTEIROS_OBRAS: 'canteiros_obras',
  SYSTEM_CONFIG: 'system_config',
  INSTITUTION_SETTINGS: 'institution_settings',
  COLABORADORES: 'colaboradores',
  LANCAMENTOS: 'lancamentos',
  INSALUBRIDADE: 'insalubridade_records',
  CONTRACHEQUES: 'contracheques',
  DISPENSAS_SPTF: 'dispensas_sptf',
};

export const localCache = {
  /**
   * Obtém dado do cache (primeiro em memória, depois localStorage).
   * Retorna null se expirado ou não existente.
   */
  getCache<T>(key: string): T | null {
    const now = Date.now();

    // 1. Tenta recuperar da memória rápida
    const mem = MEMORY_CACHE.get(key);
    if (mem) {
      if (now - mem.timestamp < mem.ttlMs) {
        return mem.data as T;
      }
      // Expirou na memória
      MEMORY_CACHE.delete(key);
    }

    // 2. Tenta recuperar do localStorage persistente
    try {
      const storageKey = `${CACHE_PREFIX}${key}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: CacheEntry<T> = JSON.parse(raw);
        if (now - parsed.timestamp < parsed.ttlMs) {
          // Re-hidrata memória para próximas leituras instantâneas
          MEMORY_CACHE.set(key, parsed);
          return parsed.data;
        } else {
          // Expirado no storage
          localStorage.removeItem(storageKey);
        }
      }
    } catch (e) {
      console.warn(`[localCache] Erro ao ler cache para '${key}':`, e);
    }

    return null;
  },

  /**
   * Salva dado no cache em memória e no localStorage.
   */
  setCache<T>(key: string, data: T, ttlMs: number = CACHE_TTLS.MEDIUM): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttlMs,
    };

    // Salva na memória
    MEMORY_CACHE.set(key, entry);

    // Salva no localStorage com tratamento seguro de quota do browser
    try {
      const storageKey = `${CACHE_PREFIX}${key}`;
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (e) {
      console.warn(`[localCache] Erro ao persistir cache para '${key}' no localStorage:`, e);
    }
  },

  /**
   * Verifica se existe cache válido sem necessariamente desserializar tudo.
   */
  hasValidCache(key: string): boolean {
    const now = Date.now();
    const mem = MEMORY_CACHE.get(key);
    if (mem && (now - mem.timestamp < mem.ttlMs)) {
      return true;
    }

    try {
      const storageKey = `${CACHE_PREFIX}${key}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return (now - parsed.timestamp < parsed.ttlMs);
      }
    } catch {
      return false;
    }
    return false;
  },

  /**
   * Remove item específico ou limpa todo o cache gerenciado.
   */
  clearCache(key?: string): void {
    if (key) {
      MEMORY_CACHE.delete(key);
      try {
        localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      } catch (e) {
        console.warn(`[localCache] Erro ao limpar '${key}':`, e);
      }
    } else {
      MEMORY_CACHE.clear();
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(CACHE_PREFIX)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        console.warn('[localCache] Erro ao limpar todo o cache:', e);
      }
    }
  },
};
