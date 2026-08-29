# Guia de Integração: Employee Sync Service

Este guia mostra como integrar o `employeeSyncService` com os fluxos de importação CSV e PDF (Contracheques).

## Visão Geral

O `employeeSyncService` fornece:
- **Desduplicação LGPD-compliant**: usa hash SHA-256 de CPF para busca segura
- **Busca de canteiro por bigrama**: vincula colaboradores automaticamente via `bigramasImportacao`
- **UPSERT atômico**: cria ou atualiza registros preservando IDs originais
- **CPF mascarado**: exibe `***.XXX.XXX-**` em telas/relatórios

## Funcionalidades Principais

### 1. `findConstructionSiteByBigram(departmentCode, sites)`

Encontra um canteiro usando o código de departamento do arquivo.

```typescript
import { employeeSyncService } from '../services/employeeSyncService';

// Encontrar canteiro para "DECO-KO"
const site = employeeSyncService.findConstructionSiteByBigram('DECO-KO', constructionSites);
if (site) {
  console.log(`Canteiro encontrado: ${site.nome} (ID: ${site.id})`);
}
```

### 2. `syncEmployeeUpsert(employeeData, departmentCode, sites)`

Sincroniza um único colaborador (cria ou atualiza).

```typescript
const result = await employeeSyncService.syncEmployeeUpsert(
  {
    matricula: '13974',
    nome: 'JOÃO SILVA',
    funcao: 'OPERADOR DE MOTONÍVEL',
    sede: 'KO',
    cpf: '123.456.789-01', // Será hashado internamente
    dataAdmissao: '2024-01-15'
  },
  'DECO-KO', // Código do departamento do arquivo
  constructionSites
);

if (result.success) {
  console.log(`${result.action}: ${result.nome} (${result.matricula})`);
  // Retorna: "updated: JOÃO SILVA (13974)" ou "created: JOÃO SILVA (13974)"
}
```

### 3. `batchSyncEmployees(employees, deptCodeMap, sites, onProgress)`

Sincroniza múltiplos colaboradores com progresso.

```typescript
const departmentMap = {
  '13974': 'DECO-KO',
  '13975': 'DACO-KO',
  '13976': 'KO'
};

const results = await employeeSyncService.batchSyncEmployees(
  employeesFromCSV,
  departmentMap,
  constructionSites,
  (progress) => {
    console.log(`${progress.processed}/${progress.total} (${progress.percent}%)`);
  }
);

const stats = employeeSyncService.getSyncStatistics(results);
console.log(`Criados: ${stats.created}, Atualizados: ${stats.updated}, Falhados: ${stats.failed}`);
```

---

## Exemplo: Integração com CSV

### Arquivo de origem
```csv
Matricula,Nome,Funcao,CPF,Departamento
13974,JOÃO SILVA,OPERADOR DE MOTONÍVEL,123.456.789-01,DECO-KO
13975,MARIA SANTOS,CHEFE,987.654.321-09,DACO-KO
```

### Código de integração

```typescript
import Papa from 'papaparse';
import { employeeSyncService } from '../services/employeeSyncService';
import { Employee } from '../types';

async function importEmployeesFromCSV(
  file: File,
  constructionSites: ConstructionSite[]
) {
  return new Promise<void>((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        try {
          // Mapear rows para Employee + departamento
          const employees: Partial<Employee>[] = [];
          const deptMap: Record<string, string> = {};

          for (const row of results.data) {
            const matricula = String(row.Matricula || '').trim();
            const deptCode = String(row.Departamento || '').trim().toUpperCase();

            employees.push({
              matricula,
              nome: String(row.Nome || '').trim(),
              funcao: String(row.Funcao || '').trim(),
              cpf: String(row.CPF || '').trim(),
              sede: 'KO' // Padrão
            });

            if (matricula && deptCode) {
              deptMap[matricula] = deptCode;
            }
          }

          // Sincronizar todos em lote
          const results = await employeeSyncService.batchSyncEmployees(
            employees,
            deptMap,
            constructionSites,
            (progress) => {
              console.log(`Importando: ${progress.percent}%`);
            }
          );

          const stats = employeeSyncService.getSyncStatistics(results);
          console.log(`
            ✓ Criados: ${stats.created}
            ✓ Atualizados: ${stats.updated}
            ✗ Falhados: ${stats.failed}
          `);

          resolve();
        } catch (err) {
          reject(err);
        }
      },
      error: reject
    });
  });
}
```

---

## Exemplo: Integração com Contracheques PDF

### Código de integração

```typescript
import { parsePaystubsFromPDF } from '../utils/pdfParser';
import { employeeSyncService } from '../services/employeeSyncService';

async function importPaystubsFromPDF(
  file: File,
  constructionSites: ConstructionSite[]
) {
  try {
    // Extrair dados do PDF
    const result = await parsePaystubsFromPDF(file);

    // Mapear PaystubRecords para Employee + departamento
    const employees: Partial<Employee>[] = [];
    const deptMap: Record<string, string> = {};

    for (const paystub of result.paystubs) {
      const matricula = paystub.matricula;
      // Se não há departamento no contracheque, usar a sede como fallback
      const deptCode = paystub.sede || 'KO';

      employees.push({
        matricula,
        nome: paystub.nome,
        funcao: paystub.cargo,
        cpf: paystub.cpf,
        sede: 'KO'
      });

      if (matricula && deptCode) {
        deptMap[matricula] = deptCode;
      }
    }

    // Sincronizar todos em lote
    const syncResults = await employeeSyncService.batchSyncEmployees(
      employees,
      deptMap,
      constructionSites,
      (progress) => {
        console.log(`Sincronizando: ${progress.percent}%`);
      }
    );

    const stats = employeeSyncService.getSyncStatistics(syncResults);
    console.log(`
      Contracheques importados:
      ✓ Criados: ${stats.created}
      ✓ Atualizados: ${stats.updated}
      ✗ Falhados: ${stats.failed}
    `);

  } catch (err) {
    console.error('Erro ao importar contracheques:', err);
  }
}
```

---

## Utilidades LGPD

### Mascarar CPF para exibição

```typescript
import { maskCPF, formatCPF } from '../utils/lgpdUtils';

const cpf = '123.456.789-01';
console.log(maskCPF(cpf));     // Retorna: ***.456.789-**
console.log(formatCPF(cpf));   // Retorna: 123.456.789-01
```

### Gerar hash para desduplicação

```typescript
import { generateCPFHash, compareCPFsSecurely } from '../utils/lgpdUtils';

// Gerar hash para armazenar
const hash = await generateCPFHash('123.456.789-01');
// hash: "abc123def456..." (irreversível)

// Comparar dois CPFs de forma segura
const sameEmployee = await compareCPFsSecurely(cpf1, cpf2);
```

---

## Fluxo de Desduplicação

```
1. Arquivo de importação (CSV/PDF) chega com:
   - Matrícula: "13974"
   - CPF: "123.456.789-01"
   - Departamento: "DECO-KO"

2. employeeSyncService faz:
   a) Hash CPF → SHA-256: "abc123..."
   b) Busca no Firestore por cpfHash
   c) Se encontrado → ATUALIZAR (preserva ID original)
   d) Se não → CRIAR novo (com cpfHash, cpfMascarado, canteiroId)

3) Resultado:
   ✓ Sem duplicatas
   ✓ CPF protegido (apenas hash armazenado visível)
   ✓ Canteiro vinculado automaticamente
   ✓ CPF exibido mascarado em telas
```

---

## Campos Salvos no Firestore

Após sincronização, o colaborador terá:

```json
{
  "id": "13974",
  "matricula": "13974",
  "nome": "JOÃO SILVA",
  "funcao": "OPERADOR DE MOTONÍVEL",
  "sede": "KO",
  "canteiroId": "site-uuid-001",        // ID do canteiro resolvido
  "cpfHash": "abc123def456...",         // Hash SHA-256 (irreversível)
  "cpfMascarado": "***.456.789-**",     // Exibição LGPD
  "dataAdmissao": "2024-01-15",
  "status": "Ativo",
  "criadoEm": "2024-12-15T10:30:00Z",
  "atualizadoEm": "2024-12-15T10:30:00Z"
}
```

---

## Configuração de Bigramas no Canteiro

Para que o matching funcione, cadastre bigramas no canteiro:

1. Abra **Gestão de Canteiros**
2. Crie/edite um canteiro
3. No campo **"Bigramas para Importação"**, informe: `KO, DECO-KO, DACO-KO`
4. Salve

Agora importações com departamento "DECO-KO" vincularão automaticamente a esse canteiro.

---

## Tratamento de Erros

```typescript
const result = await employeeSyncService.syncEmployeeUpsert(emp, 'DECO-KO', sites);

if (!result.success) {
  console.error(`Erro: ${result.message}`);
  // Exemplos:
  // "Matrícula e nome são obrigatórios"
  // "Erro ao sincronizar: Permission denied"
}
```

---

## Checklist de Implementação

- [ ] Atualizar `types.ts` com `bigramasImportacao` e `cpfHash`, `cpfMascarado`
- [ ] Criar `lgpdUtils.ts` com hash e máscara
- [ ] Criar `employeeSyncService.ts` com upsert e bigram matching
- [ ] Atualizar `CanteirosManagement.tsx` para permitir entrada de bigramas
- [ ] Atualizar `EmployeeManagement.tsx` para exibir CPF mascarado e canteiro resolvido
- [ ] Integrar `employeeSyncService` em fluxo de importação CSV
- [ ] Integrar `employeeSyncService` em fluxo de importação PDF
- [ ] Testar desduplicação com CPFs duplicados
- [ ] Testar vinculação de canteiro por bigrama
- [ ] Validar exibição mascarada de CPF em todas as telas
