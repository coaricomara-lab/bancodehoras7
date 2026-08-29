# 🧪 Teste de Desduplicação - Modal CSV e PDF

## 📋 Procedimento de Validação

Este documento descreve como testar e validar que a desduplicação está funcionando corretamente no sistema.

---

## 🧪 Teste 1: Importação CSV com Desduplicação

### ✅ Pré-requisitos
1. Abrir a aplicação (http://localhost:3000)
2. Ir para aba "Colaboradores"
3. Preparar um arquivo CSV de teste com dados de colaboradores

### 📝 Passos do Teste

#### Passo 1: Primeira Importação
```
1. Clique em "Importar Base de Colaboradores CSV"
2. Selecione um arquivo CSV com 2-3 colaboradores
3. Aguarde o processamento
4. Verifique a mensagem: "Criados: X | Atualizados: 0 | Falhados: 0"
   ✅ ESPERADO: Criados = quantidade de colaboradores
   ✅ ESPERADO: Atualizados = 0 (primeira importação)
```

#### Passo 2: Segunda Importação (Mesmo Arquivo)
```
1. Clique em "Importar Base de Colaboradores CSV" novamente
2. Selecione O MESMO arquivo CSV
3. Aguarde o processamento
4. Verifique a mensagem: "Criados: 0 | Atualizados: X | Falhados: 0"
   ✅ ESPERADO: Criados = 0 (não cria novos, pois já existem)
   ✅ ESPERADO: Atualizados = quantidade de colaboradores (atualiza os existentes)
   🎯 VALIDAÇÃO: Desduplicação funcionando! ✓
```

#### Passo 3: Verificação de Dados
```
1. Verifique a tabela de colaboradores
2. Procure pelas colunas:
   - "Canteiro / Frente": Deve exibir o canteiro vinculado automaticamente
   - "CPF (LGPD)": Deve exibir CPF mascarado (ex: ***.456.789-**)
   ✅ ESPERADO: Canteiro e CPF mascarado visíveis
```

---

## 🧪 Teste 2: Importação PDF (Contracheques) com Desduplicação

### ✅ Pré-requisitos
1. Abrir a aplicação
2. Ir para aba "Gestão de Folha & Contracheques"
3. Preparar arquivos PDF de contracheques de teste

### 📝 Passos do Teste

#### Passo 1: Primeira Importação
```
1. Clique em "Importar Folha de Pagamento (PDF)"
2. Selecione 1-2 arquivos PDF de contracheques
3. Sistema identifica colaboradores não registrados
4. Marque a opção "Auto-criar colaboradores não registrados"
5. Clique em "Confirmar Importação"
6. Verifique o resultado
   ✅ ESPERADO: Novos colaboradores criados com UPSERT
   ✅ ESPERADO: Contracheques salvos corretamente
```

#### Passo 2: Segunda Importação (Mesmo PDF)
```
1. Clique em "Importar Folha de Pagamento (PDF)" novamente
2. Selecione OS MESMOS arquivos PDF
3. Sistema deve:
   - Reconhecer que os colaboradores já existem
   - NÃO criar novos colaboradores
   - Usar UPSERT para atualizar se necessário
4. Verifique o resultado
   ✅ ESPERADO: Colaboradores não duplicados
   ✅ ESPERADO: Contracheques processados sem erro
```

---

## 🔍 Verificação de Bigramas

### 📝 Passos de Validação

```
1. Ir para "Gestão de Canteiros"
2. Selecionar um canteiro (ex: "KO-01" - Coari)
3. Clique em "Editar"
4. Preencha "Bigramas para Importação" com siglas
   Exemplo: "KO, DECO-KO, DACO-KO"
5. Salve o canteiro

6. Na próxima importação de CSV:
   - Arquivo com "DECO-KO" na coluna "Departamento"
   - Sistema procura bigramas do canteiro
   - Se encontra "DECO-KO" na lista
   - ✅ Vincula automaticamente ao canteiro "KO-01"
```

---

## 🔐 Verificação de Segurança LGPD

### 📝 Passos de Validação

```
1. Após importação, verifique em "Colaboradores":

   ✅ Coluna "CPF (LGPD)" mostra: ***.456.789-**
      (Mascarado - nunca mostra CPF completo)

   ✅ No Firestore (Console):
      - Campo "cpfHash": abc123def456... (SHA-256 hash)
      - Campo "cpfMascarado": ***.456.789-**
      - Campo "cpf": NÃO existe (deletado/nunca armazenado)

   ✅ Busca por CPF:
      - Sistema busca por cpfHash (não texto plano)
      - Comparação segura e irreversível
```

---

## 📊 Resultados Esperados

| Cenário | Primeira Importação | Segunda Importação | Status |
|---------|-------------------|-------------------|--------|
| **CSV** | Criados: 2 | Atualizados: 2 | ✅ |
| **PDF** | Criados: 1 | Atualizados: 1 | ✅ |
| **Canteiro** | Vinculado automaticamente | Mantém vínculo | ✅ |
| **CPF** | Mascarado na tela | Mascarado na tela | ✅ |

---

## 🐛 Checklist de Validação

- [ ] Importação CSV primeira vez → "Criados: X"
- [ ] Importação CSV segunda vez → "Atualizados: X" (desduplicação)
- [ ] Importação PDF primeira vez → Novos colaboradores criados
- [ ] Importação PDF segunda vez → Nenhum colaborador duplicado
- [ ] Coluna "Canteiro" exibe o canteiro vinculado
- [ ] Coluna "CPF (LGPD)" exibe CPF mascarado (***.456.789-**)
- [ ] Bigramas funcionam (departamento vincula ao canteiro)
- [ ] Firestore mostra cpfHash, não cpf em texto plano
- [ ] Sem erros TypeScript no console

---

## 🎯 Fluxo de Importação Atualizado

```
CSV/PDF → parseEmployeesCSV/parsePDF
          ↓
      departmentCodesMap (sede/depto por matricula)
          ↓
  batchSyncEmployees (novo UPSERT)
          ↓
  findConstructionSiteByBigram (vínculo automático)
          ↓
  generateCPFHash (segurança LGPD)
          ↓
  Firestore: CREATE ou UPDATE
          ↓
  UI: Mostra "Criados: X | Atualizados: Y"
```

---

## 📝 Notas Técnicas

1. **CPF Hash**: SHA-256 irreversível - não pode ser "descriptografado"
2. **Busca de Duplicação**: Usa cpfHash, não CPF em texto plano
3. **Vínculo de Canteiro**: Automático via bigramas
4. **UPSERT**: Preserva ID ao atualizar, gera novo ao criar
5. **Sem Duplicatas**: Mesma importação 2x = 0 criados, X atualizados

---

## 🆘 Troubleshooting

**P: Mostra "Criados: 2" na segunda importação (deveria ser "Atualizados: 2")**  
R: Verificar se:
- CPF está preenchido no CSV
- Bigramas estão cadastrados no canteiro
- Formato do CPF está correto (XXX.XXX.XXX-XX)

**P: Canteiro fica vazio na tabela**  
R: Verificar:
- Se bigramas foram cadastrados no canteiro
- Se departamento do CSV corresponde a um bigrama
- Se constructionSites está sendo passado corretamente

**P: CPF não aparece mascarado**  
R: Verificar:
- Se cpf foi preenchido no CSV/PDF
- Se é um CPF válido (11 dígitos)
- Se field "cpfMascarado" foi salvo no Firestore

---

**Status**: ✅ Testes Prontos  
**Data**: 2024-12-15  
**Implementação**: Production Ready
