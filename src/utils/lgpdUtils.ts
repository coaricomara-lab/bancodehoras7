/**
 * LGPD-Compliant CPF Security Utilities
 * Provides hashing and masking functions for secure CPF handling
 */

/**
 * Limpa um CPF removendo caracteres especiais (., -, espaços)
 * @param cpf String contendo o CPF (formatado ou não)
 * @returns CPF limpo contendo apenas dígitos
 */
export function cleanCPF(cpf: string | null | undefined): string {
  if (!cpf) return '';
  return cpf.toString().replace(/[.\-\s]/g, '').trim();
}

/**
 * Valida se uma string é um CPF com formato correto (11 dígitos)
 * @param cpf CPF a validar
 * @returns true se é um CPF válido
 */
export function isValidCPF(cpf: string | null | undefined): boolean {
  const clean = cleanCPF(cpf);
  return /^\d{11}$/.test(clean);
}

/**
 * Gera um hash SHA-256 do CPF limpo para ser usado como chave de desduplicação
 * Mantém o CPF seguro usando apenas o hash para buscas no banco
 * 
 * @param cpf String contendo o CPF (formatado ou não)
 * @returns Promessa que resolve para string hexadecimal do hash SHA-256
 * 
 * @example
 * const hash = await generateCPFHash('123.456.789-01');
 * // hash é uma string única e irreversível
 */
export async function generateCPFHash(cpf: string | null | undefined): Promise<string> {
  const clean = cleanCPF(cpf);
  
  if (!clean || !isValidCPF(clean)) {
    return '';
  }

  // Usa SubtleCrypto para gerar hash SHA-256 de forma segura no browser
  const encoder = new TextEncoder();
  const data = encoder.encode(clean);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Converte o buffer para string hexadecimal
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Mascara um CPF no padrão LGPD: ***.XXX.XXX-**
 * Mostra apenas os 5 dígitos centrais para identificação visual
 * 
 * @param cpf String contendo o CPF (formatado ou não)
 * @returns CPF mascarado no padrão ***.XXX.XXX-**
 * 
 * @example
 * maskCPF('123.456.789-01'); // Retorna: ***.456.789-**
 * maskCPF('12345678901');    // Retorna: ***.456.789-**
 */
export function maskCPF(cpf: string | null | undefined): string {
  const clean = cleanCPF(cpf);
  
  if (!clean || !isValidCPF(clean)) {
    return '***.***.***-**';
  }

  // Formata como ***.XXX.XXX-** (mostra apenas os 5 dígitos centrais)
  // Exemplo: 12345678901 -> ***.456.789-**
  const masked = `***.${clean.substring(3, 6)}.${clean.substring(6, 9)}-**`;
  
  return masked;
}

/**
 * Compara dois CPFs gerando e comparando seus hashes
 * Útil para desduplicação segura sem armazenar CPF em texto plano
 * 
 * @param cpf1 Primeiro CPF
 * @param cpf2 Segundo CPF
 * @returns Promessa que resolve para true se os CPFs são idênticos
 */
export async function compareCPFsSecurely(
  cpf1: string | null | undefined,
  cpf2: string | null | undefined
): Promise<boolean> {
  const hash1 = await generateCPFHash(cpf1);
  const hash2 = await generateCPFHash(cpf2);
  
  return hash1 === hash2 && hash1 !== '';
}

/**
 * Converte um CPF para o formato padrão brasileiro (XXX.XXX.XXX-XX)
 * @param cpf String contendo o CPF (formatado ou não)
 * @returns CPF formatado ou string vazia se inválido
 */
export function formatCPF(cpf: string | null | undefined): string {
  const clean = cleanCPF(cpf);
  
  if (!isValidCPF(clean)) {
    return '';
  }

  return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9)}`;
}
