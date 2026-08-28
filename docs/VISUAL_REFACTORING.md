# Refatoração Visual — Documentação

## 1. Classificação de Dispositivos por Tela

| Tela / Página | Componente | Dispositivo Principal | Observações |
|---|---|---|---|
| Login | `CollaboratorLandingView` | Ambos | Funciona em celular e desktop |
| Login Admin | `AdminLoginModal` | Ambos | Modal de acesso RH/admin |
| Dashboard | `LookerDashboard` | Desktop | Uso intenso em monitores; consulta mobile ok |
| Calendário | `DashboardCalendarView` | Desktop | Visão calendário integrada ao dashboard |
| Cadastro de Colaboradores | `EmployeeManagement` | Mobile | Fluxo otimizado para touch (< 768px) |
| Canteiros | `CanteirosManagement` | Ambos | Cadastro + encarregados |
| Insalubridade | `InsalubrityManagement` | Desktop | Tabelas complexas, matrizes NR-15 |
| Matriz Simples | `InsalubritySimpleMatrixView` | Desktop | Matriz diária de atividades |
| Contracheques | `ContrachequesManagement` | Ambos | Importação PDF + espelhos |
| Relatórios | `ExecutiveReportsView` | Desktop | Tabelas largas, não prioriza mobile |
| Extrato Individual | `EmployeeStatement` | Ambos | Extrato detalhado por colaborador |
| Portal do Colaborador | `EmployeeSelfServicePortal` | Ambos | Self-service do colaborador |
| Portal de Campo | `SiteSupervisorMobileView` | Mobile | Uso em campo, touch, uma mão |
| Gestão de Campo | `FieldManagerView` | Mobile | Saldos da equipe em tempo real |
| Permissões Admin | `AdminPermissionsManagement` | Desktop | RBAC, gestão de perfis |
| Auditoria | `AuditTrailView` | Desktop | Logs imutáveis, tabelas largas |
| Arquitetura | `GoogleArchitectureSpec` | Desktop | Documentação técnica do sistema |
| Configurações | `SettingsPage` | Desktop | Parametrização do sistema |
| Backup | `BackupRestorePanel` | Desktop | Exportação/restauração Firestore |
| Lançamento Diário | `DailyEntryModal` | Ambos | Modal de lançamento de horas |
| Lançamento em Lote | `QuickBatchEntryModal` | Ambos | Múltiplos colaboradores simultaneamente |
| Dispensa SPTF | `SptfDispensaModal` | Ambos | Guia oficial 2 vias A4 |
| Importar Folha | `ImportContrachequeModal` | Desktop | Múltiplos PDFs |
| Importar Insalubridade | `ImportInsalubrityMatrixModal` | Desktop | Matriz de campo |
| Conversão Insalubridade | `InsalubrityConversionModal` | Desktop | Apontamentos → cálculos NR-15 |
| Esqueci a Senha | `ForgotPasswordModal` | Ambos | Recuperação de senha |
| Bloqueio Admin | `AdminLockScreen` | Ambos | Tela de bloqueio por inatividade |
| Timeout Sessão | `SessionTimeoutModal` | Ambos | Aviso de expiração de sessão |

## 2. Sistema de Design — Guia de Estilos

### Paleta Institucional Aeronáutica

**Dark mode (navy institucional):**
| Token | Valor | Uso |
|---|---|---|
| `--surface-base` | `#0B1426` | Fundo principal |
| `--surface-secondary` | `#0F1B33` | Inputs, inner surfaces |
| `--surface-header` | `#11203A` | Header, navegação |
| `--surface-card` | `#16243D` | Cards |
| `--surface-card-elevated` | `#1E3252` | Cards elevados |
| `--surface-border` | `#243756` | Bordas |
| `--surface-border-subtle` | `#335075` | Bordas sutis |
| `--text-primary` | `#E2E8F0` | Texto principal |
| `--text-secondary` | `#CBD5E1` | Texto secundário |
| `--text-muted` | `#94A3B8` | Texto muted |
| `--text-subtle` | `#64748B` | Texto subtle |
| `--brand-primary` | `#3B82F6` | Azul aeronáutico (brand) |

**Light mode (slate institucional):**
| Token | Valor | Uso |
|---|---|---|
| `--surface-base` | `#F1F5F9` | Fundo principal |
| `--surface-card` | `#FFFFFF` | Cards |
| `--surface-border` | `#E2E8F0` | Bordas |
| `--text-primary` | `#0F172A` | Texto principal |
| `--text-muted` | `#64748B` | Texto muted |
| `--brand-primary` | `#2563EB` | Azul institucional |

### Componentes Base (`src/components/ui/`)

- **Button**: 6 variantes (primary, secondary, ghost, danger, success, outline) × 4 tamanhos
- **Card / CardHeader / CardBody**: Superfície padronizada com borda token
- **Input**: Label, ícone, erro, hint
- **Badge**: 6 variantes semânticas (neutral, brand, success, danger, warning, purple)

### Padrões de Consistência

- **Inputs**: `focus:ring-2 focus:ring-{color}/20` em TODOS os inputs (166/166)
- **Botões**: `active:scale-[0.98]` + `shadow-lg shadow-blue-600/20` em botões primários (282 botões)
- **Cards**: `rounded-2xl border border-[var(--surface-border)]`
- **Tooltips**: `InfoTooltip` touch-friendly (hover no desktop, tap no mobile)

## 3. Componentes de Despoluição

### InfoTooltip (atualizado)
- **Arquivo**: `src/components/InfoTooltip.tsx`
- **Comportamento**: Hover no desktop (mouse), tap no mobile (touch)
- **Acessibilidade**: Fecha ao clicar fora (outside-click) e tecla Escape
- **API inalterada**: Mesma interface, comportamento adicionado sem quebrar compatibilidade

### HelpButton (novo)
- **Arquivo**: `src/components/HelpButton.tsx`
- **Uso**: Textos longos de ajuda que não cabem em tooltip (multi-parágrafo)
- **Comportamento**: Botão "?" discreto → modal leve com scroll
- **Touch-friendly**: Funciona em mobile (tap) e desktop (click)

## 4. Inventário de Informações Movidas para Tooltips

| Tela | Texto Original (resumido) | Localização Atual | Nova Localização |
|---|---|---|---|
| Login | "Regras SPTF com multiplicadores automáticos (1.0x...)" | Parágrafo no rodapé | `InfoTooltip` ao lado do cadeado |
| Login | "➔ Clique aqui para criar sua senha agora" | Emoji + texto no erro | Link limpo "Criar senha agora →" |
| Dashboard | "A base de dados foi limpa com sucesso. Não há registros..." | Parágrafo longo no empty state | Texto encurtado: "Base limpa. Importe via CSV." |
| Auditoria | "Rastreamento e auditoria em tempo real de emissões de dispensas..." | Subtítulo longo | `InfoTooltip` no subtítulo curto |
| Canteiros | "Cadastro, acompanhamento de encarregados e controle das frentes..." | Subtítulo longo | `InfoTooltip` no subtítulo curto |
| Insalubridade | "Controle de adicionais fixos contratuais e apontamentos..." | Subtítulo longo | `InfoTooltip` no subtítulo curto |
| Contracheques | "Gestão de Folha de Pagamento, importação de PDF..." | Subtítulo longo | `InfoTooltip` no subtítulo curto |
| Contracheques | "Clique em Importar Folha (PDF) para carregar o arquivo..." | Instrução no empty state | Texto encurtado: "Importe a folha oficial (PDF)" |
| Relatórios | "Emissão analítica e sintética de Banco de Horas e Insalubridade..." | Subtítulo longo | `InfoTooltip` no subtítulo curto |
| Backup | "Exportação completa das coleções configuradas e restauração..." | Subtítulo longo | `InfoTooltip` no subtítulo curto |
| Permissões | "Controle estrito de perfis de acesso: Apenas e-mails..." | Subtítulo longo | `InfoTooltip` no subtítulo curto |
| Configurações | "Personalize a identidade da Organização Militar, cargos..." | Subtítulo longo | `InfoTooltip` no subtítulo curto |
| Dispensa SPTF | "Emita novas guias de dispensa na aba Nova Guia..." | Subtítulo longo | `InfoTooltip` no subtítulo curto |
| Importar Folha | "Selecione múltiplos arquivos PDF de uma só vez (5 a 15)..." | Subtítulo longo | `InfoTooltip` no subtítulo curto |
| Lote | "Cadastre horas para múltiplos colaboradores ou equipes..." | Subtítulo longo | `InfoTooltip` no subtítulo curto |
| Gestão de Campo | "Visualização rápida de saldos da equipe em tempo real..." | Subtítulo longo | `InfoTooltip` no subtítulo curto |

## 5. Verificação

- **TypeScript**: `tsc --noEmit` — compila sem erros
- **Dev server**: Vite + HMR ativo, servindo na porta 3000
- **Zero cores neutras antigas** restantes (migração completa)
- **166/166 inputs** com focus rings
- **282 botões** com feedback táctil (`active:scale`)
- **Nenhuma funcionalidade removida ou alterada** — apenas texto realocado e cores atualizadas
