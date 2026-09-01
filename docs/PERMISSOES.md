# Mapa de Permissões — COMARA SPTF (RH Cloud)

Documento de referência da auditoria de permissões: perfis de usuário, funcionalidades, coleções do Firestore e regras de acesso (leitura/escrita). Este mapa espelha a lógica implementada em `src/services/rbacService.ts` (RBAC client-side) e em `firestore.rules` (backstop server-side).

---

## 1. Perfis existentes

O sistema usa **6 perfis canônicos**. Aliases legados são normalizados em tempo de execução por `rbacService.normalizeRole()`.

| Perfil canônico | Aliases legados aceitos | Escopo | Descrição |
|---|---|---|---|
| `SUPER_ADMIN` | — | GLOBAL | TI: acesso irrestrito, configurações, auditoria e gestão de acessos. |
| `RH_ADMIN` | `GESTOR_RH` | GLOBAL | RH Sede: acesso global a todos os canteiros, folha, contracheques e auditoria. |
| `GERENTE_CANTEIRO` | `GERENTE`, `GERENTE_CAMPO`, `ROLE_GERENTE`, `AUDITOR` | CANTEIRO | Somente leitura das horas e relatórios do seu canteiro ativo. |
| `CHEFE_CANTEIRO` | `ENCARREGADO_CANTEIRO` | CANTEIRO | Operacional de campo: lançamentos, insalubridade e dispensas do seu canteiro. |
| `CHEFE_DA` | `ENCARREGADO_DA` | CANTEIRO | Gestão administrativa do canteiro: auditoria local, relatórios e gestão do canteiro. |
| `AUX_DA` | `AUXILIAR_DA` | CANTEIRO | Auxiliar de campo: lançamentos de horas e emissão de dispensas no canteiro ativo. |
| `NENHUM` | — | NENHUM | Usuário pendente de aprovação. Sem acesso a dados; vê apenas manual e tela de pendência. |

> A normalização ocorre em `rbacService.normalizeRole`. O `NENHUM` é o perfil atribuído no auto-cadastro de um novo login Google não master (`authService`); ele só passa a ter acesso após um `SUPER_ADMIN` aprovar e definir um perfil.

---

## 2. Mapeamento de funcionalidades por perfil

Legenda: ✅ permitido · 🔒 leitura · ✏️ escrita · ❌ negado · 🌐 global · 🏢 restrito ao canteiro ativo

| Funcionalidade | SUPER_ADMIN | RH_ADMIN | GERENTE_CANTEIRO | CHEFE_CANTEIRO | CHEFE_DA | AUX_DA | NENHUM |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Dashboard / Relatórios | 🌐 | 🌐 | 🔒 🏢 | 🔒 🏢 | 🔒 🏢 | ❌ | ❌ |
| Consultar colaboradores | 🌐 | 🌐 | 🔒 🏢 | 🔒 🏢 | 🔒 🏢 | 🔒 🏢 | ❌ |
| Cadastrar / editar colaborador | 🌐 | 🌐 | ❌ | ❌ | ❌ | ❌ | ❌ |
| Excluir colaborador / lançamento | 🌐 | 🌐 | ❌ | ❌ | ❌ | ❌ | ❌ |
| Lançar horas (individual/lote) | 🌐 | 🌐 | ❌ | ✏️ 🏢 | ✏️ 🏢 | ✏️ 🏢 | ❌ |
| Aprovar / homologar horas | 🌐 | 🌐 | ❌ | ✅ 🏢 | ✅ 🏢 | ❌ | ❌ |
| Lançar / validar insalubridade | 🌐 | 🌐 | ❌ | ✏️ 🏢 | ✏️ 🏢 | ❌ | ❌ |
| Emitir Dispensa SPTF | 🌐 | 🌐 | ❌ | ✏️ 🏢 | ✏️ 🏢 | ✏️ 🏢 | ❌ |
| Contracheques / importar folha | 🌐 | 🌐 | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gerenciar canteiros | 🌐 | 🌐 | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configurações do sistema / instituição | 🌐 | 🌐 | ❌ | ❌ | ❌ | ❌ | ❌ |
| Trilha de auditoria (visualizar) | 🌐 | 🌐 | ❌ | ❌ | 🔒 🏢 | ❌ | ❌ |
| Gerenciar usuários / permissões | 🌐 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Portal do colaborador (autoatendimento) | — | — | — | — | — | — | ✅ (apenas consulta própria) |

> **Tenancy (canteiro):** `GERENTE_CANTEIRO`, `CHEFE_CANTEIRO`, `CHEFE_DA` e `AUX_DA` veem e operam **apenas** os dados do seu canteiro/sede ativo (`sede_atual`, `sede`, `employeeSede`, `secaoCanteiro`). O filtro é aplicado client-side por `rbacService.filterEmployeesByTenancy`, `filterRecordsByTenancy`, `filterInsalubrityByTenancy` e `filterDispensasByTenancy`.

---

## 3. Coleções do Firestore e regras de acesso

| Coleção | Conteúdo | Leitura | Escrita | Exclusão |
|---|---|---|---|---|
| `colaboradores` | Cadastro de colaboradores | **Pública** (portal) | SUPER_ADMIN, RH_ADMIN | SUPER_ADMIN, RH_ADMIN |
| `colaboradores_auth` | Credenciais de autoatendimento (hash de senha) | **Pública** (validação de login) | SUPER_ADMIN, RH_ADMIN | SUPER_ADMIN, RH_ADMIN |
| `lancamentos` | Banco de horas / lançamentos | **Pública** (extrato) | SUPER_ADMIN, RH_ADMIN, CHEFE_CANTEIRO, CHEFE_DA, AUX_DA | SUPER_ADMIN, RH_ADMIN, CHEFE_CANTEIRO, CHEFE_DA, AUX_DA |
| `dispensas_sptf` | Guias de dispensa | **Pública** (consulta) | SUPER_ADMIN, RH_ADMIN, CHEFE_CANTEIRO, CHEFE_DA, AUX_DA | SUPER_ADMIN, RH_ADMIN, CHEFE_CANTEIRO, CHEFE_DA, AUX_DA |
| `contracheques` | Folha / contracheques (dado sensível — LGPD) | **Pública** (espelho do colaborador) | SUPER_ADMIN, RH_ADMIN | SUPER_ADMIN, RH_ADMIN |
| `resumo_mensal` | Resumo mensal consolidado | Autenticada (global + canteiro) | SUPER_ADMIN, RH_ADMIN | SUPER_ADMIN, RH_ADMIN |
| `canteiros_obras` | Canteiros de obras | **Pública** | SUPER_ADMIN, RH_ADMIN | SUPER_ADMIN, RH_ADMIN |
| `insalubridade_records` | Laudos de insalubridade | **Pública** | SUPER_ADMIN, RH_ADMIN, CHEFE_CANTEIRO, CHEFE_DA | SUPER_ADMIN, RH_ADMIN, CHEFE_CANTEIRO, CHEFE_DA |
| `system_config` | Configurações do sistema | **Pública** (branding) | SUPER_ADMIN, RH_ADMIN | SUPER_ADMIN, RH_ADMIN |
| `institution_settings` | Identidade / instituição | **Pública** (branding) | SUPER_ADMIN, RH_ADMIN | SUPER_ADMIN, RH_ADMIN |
| `logs_acesso` | Logs de acesso do autoatendimento | SUPER_ADMIN, RH_ADMIN, CHEFE_DA | **Pública** (gravado sem Firebase Auth) | — |
| `logs_auditoria` | Trilha de auditoria | SUPER_ADMIN, RH_ADMIN, CHEFE_DA | Admin autenticado ativo | SUPER_ADMIN |
| `admin_users` | Usuários administrativos | Autenticada | SUPER_ADMIN + próprio usuário | SUPER_ADMIN |
| `usuarios_sistema` | Espelho de admin_users | SUPER_ADMIN + próprio usuário | SUPER_ADMIN + próprio usuário | SUPER_ADMIN |
| `system_logs` | Logs de sistema | SUPER_ADMIN | SUPER_ADMIN | SUPER_ADMIN |
| `logs` | Logs (legado) | SUPER_ADMIN | SUPER_ADMIN | SUPER_ADMIN |
| `canteiros` (alias) | Canteiros (legado) | **Pública** | SUPER_ADMIN, RH_ADMIN | SUPER_ADMIN, RH_ADMIN |
| `insalubridade` (alias) | Insalubridade (legado) | **Pública** | SUPER_ADMIN, RH_ADMIN, CHEFE_CANTEIRO, CHEFE_DA | SUPER_ADMIN, RH_ADMIN, CHEFE_CANTEIRO, CHEFE_DA |

### SUPER_ADMIN — acesso total
O `match /{document=**}` (catch-all, avaliado por último) concede leitura e escrita totais ao `SUPER_ADMIN` em qualquer coleção, inclusive futuras. Para os demais perfis o catch-all nega; as regras específicas acima continuam concedendo acesso conforme o mapeamento.

---

## 4. Funções auxiliares das regras (`firestore.rules`)

| Função | Significado |
|---|---|
| `isAuthenticated()` | `request.auth != null` (login Firebase: e-mail/senha ou Google). |
| `isMasterEmail()` | E-mails master de TI (alinhado a `authService.isMasterAdminEmail`). |
| `hasAdminDoc()` / `adminData()` | Existência e dados do documento `admin_users/{email}`. |
| `rawRole()` / `adminStatus()` | `nivelAcesso`/`role` e `status` persistidos. |
| `isAdminActive()` | Admin ativo (`status=ativo`) com papel ≠ `NENHUM`. |
| `normalizeRole()` | Converte aliases legados num dos 6 perfis canônicos. |
| `isSuperAdmin()` / `isGestorRH()` / `isGlobalAdmin()` | Perfis globais. |
| `isGerenteCampo()` / `isChefeCanteiro()` / `isChefeDA()` / `isAuxDA()` | Perfis de canteiro. |
| `isFieldUser()` | Operacional de campo (CHEFE_CANTEIRO, CHEFE_DA, AUX_DA). |

---

## 5. Achados da auditoria (estado anterior)

Problemas identificados nas regras **anteriores** e corrigidos nesta versão:

1. **Escrita aberta a qualquer autenticado** — todas as coleções de dados usavam `allow write: if isAuthenticated()`, permitindo que qualquer admin autenticado (inclusive `NENHUM`/pendente e `GERENTE_CANTEIRO`) gravasse em colaboradores, contracheques, insalubridade, canteiros e configurações. Agora a escrita é controlada por papel.
2. **`logs_acesso` totalmente público** — `allow read, write: if true` expunha logs a qualquer pessoa. Agora a **escrita** permanece pública (necessária ao autoatendimento sem Firebase Auth), mas a **leitura** é restrita a auditores.
3. **Coleções ausentes** — `colaboradores_auth`, `resumo_mensal` e `logs_auditoria` não tinham regras explícitas (acesso negado por padrão). Agora têm regras definidas.
4. **Sem catch-all de Super Admin** — adicionado `match /{document=**}` garantindo acesso total ao `SUPER_ADMIN` em qualquer coleção.
5. **Pendentes (`NENHUM`) podiam gravar** — `isAdminActive()` agora bloqueia escrita de usuários pendentes/inativos, eliminando a "sessão fantasma".

---

## 6. Observações de segurança e LGPD

- **Leitura pública de contracheques:** mantida porque o espelho de contracheque do colaborador é consultado pelo portal de autoatendimento **sem Firebase Auth**. Recomenda-se, em evolução futura, autenticar o colaborador via Firebase Anonymous Auth ou token de matrícula para restringir a leitura ao próprio documento.
- **Canteiro (tenancy):** o isolamento por canteiro/sede é aplicado **client-side** pelos filtros de `rbacService`. As regras do Firestore garantem o backstop de papel (qual perfil escreve), mas não fazem o filtro de linha por canteiro (os campos de sede variam entre coleções). O endurecimento server-side do filtro de tenancy pode ser adicionado quando os campos de sede forem padronizados.
- **Fallback local:** quando o Firestore nega acesso (permissão/quota/offline), o app opera com cache local sem interromper o uso — mas a gravação só persiste na nuvem quando um perfil autorizado a executa.

---

## 7. Arquivos relacionados

- `firestore.rules` — regras server-side (esta versão).
- `src/services/rbacService.ts` — matriz RBAC client-side e filtros de tenancy.
- `src/services/authService.ts` — autenticação, auto-cadastro (`NENHUM`/pendente) e `isMasterAdminEmail`.
- `src/types.ts` — `AdminRole`, `AdminUser`, domínio.
- `src/components/AdminPermissionsManagement.tsx` — tela de gestão de usuários/permissoes.
