# COMARA SPTF – RH Cloud

Sistema de gestão operacional e administrativa para acompanhamento de horas, colaboradores, canteiros, insalubridade, dispensas SPTF, contracheques e relatórios executivos. A aplicação foi construída em React + TypeScript com integração ao Firebase (Authentication + Firestore) e com mecanismos de fallback local para operação resiliente.

## Visão geral

O produto centraliza o ciclo de gestão de pessoal e produção em ambiente de obra, permitindo:

- cadastro e manutenção de colaboradores;
- gestão de canteiros e atribuição de responsabilidades;
- controle de banco de horas e registros de ponto;
- homologação e acompanhamento de laudos de insalubridade;
- importação e validação de contracheques e folhas;
- relatórios executivos por sede, canteiro e desempenho;
- portal interno para colaboradores e painel administrativo com RBAC.

A interface principal roda no navegador e se adapta a diferentes perfis: administração central, RH, gestores de canteiro, chefias de DA e usuários operacionais de campo.

## Stack tecnológico

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- Lucide React
- PDF/CSV handling para importação e processamento de dados

## Principais módulos

- Dashboard executivo
- Gestão de colaboradores
- Gestão de canteiros
- Acompanhamento de horas / banco de horas
- Insalubridade
- Relatórios e auditoria
- Contracheques
- Portal do colaborador
- Backup e restauração de dados
- Configurações institucionais

## Perfis e permissões

O sistema usa role-based access control com perfis como:

- SUPER_ADMIN
- RH_ADMIN
- GERENTE_CANTEIRO
- CHEFE_CANTEIRO
- CHEFE_DA
- AUX_DA
- AUDITOR

Além disso, há aliases e compatibilidade retroativa para registros legados, como GESTOR_RH, ENCARREGADO_CANTEIRO e ENCARREGADO_DA. A regra de acesso é centralizada em `src/services/rbacService.ts`.

## Arquitetura resumida

A aplicação segue uma estrutura orientada a UI + serviços + persistência:

- `src/App.tsx`: orquestra o estado global, autenticação, subscriptions do Firestore e navegação por abas.
- `src/components/`: telas e componentes visuais do sistema.
- `src/services/`: autenticação, Firebase, seed, auditoria, RBAC, sincronização e cache local.
- `src/types.ts`: modelos centrais do domínio.
- `src/constants/`: tokens e configurações visuais do design system.
- `firebase.json` e `firestore.rules`: regras do banco.

O fluxo de dados prioriza Firestore em nuvem, mas possui fallback para armazenamento local em cache quando o banco está indisponível, sem interromper o uso operacional.

## Requisitos

- Node.js 18+
- npm
- Conta Firebase com projeto configurado
- Firebase CLI (opcional para deploy de regras)
- Docker + Docker Compose (opcional para ambiente de execução local)

## Configuração do ambiente

Crie um arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Preencha as variáveis esperadas:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
```

> O projeto também suporta configuração do Firebase por `firebase-applet-config.json`, usada como fallback em ambientes dinâmicos.

## Execução local

### Opção 1: npm

```bash
npm install
npm run dev
```

A aplicação fica disponível em:

- http://localhost:3000

### Opção 2: Docker

```bash
docker compose -f docker-compose.base44.yml up -d
```

O ambiente de desenvolvimento monta o código em volume e expõe a aplicação na porta 3000.

## Verificação e validação

Para comprovar que o projeto compila corretamente:

```bash
npm run lint
```

Para gerar build de produção:

```bash
npm run build
```

Para visualizar o build localmente:

```bash
npm run preview
```

Para publicar as regras do Firestore:

```bash
npm run deploy:rules
```

## Firebase e autenticação

A autenticação é feita com Firebase Authentication. O sistema suporta:

- login via Google;
- login por e-mail/senha;
- auto-provisionamento de conta administrativa em ambiente novo;
- persistência local do estado de sessão.

Além disso, o projeto inclui lógica para verificar permissões, detectar problemas de quota e tratar erros de acesso ao Firestore com fallback local.

## Admin Master e bootstrap

O padrão de implantação do sistema considera a criação automática do admin principal em caso de ambiente novo. A conta esperada é:

- E-mail: `admin@comara.mil.br`
- Senha: `Comara123#`

Esse bootstrap é executado no início da inicialização por meio do módulo de autenticação e do seed administrativo.

## Regras de segurança e LGPD

O sistema considera boas práticas de minimização de dados, especialmente para CPF:

- o CPF completo não deve ser persistido em texto plano;
- o projeto usa `cpfHash` (SHA-256) para comparação e desduplicação;
- a exibição em telas utiliza `cpfMascarado` no formato `***.XXX.XXX-**`;
- as regras e o fluxo de dados foram desenhados para preservar confiabilidade e reduzir exposição de dados sensíveis.

## Estrutura do repositório

```text
.
├── src/
│   ├── App.tsx
│   ├── components/
│   ├── constants/
│   ├── contexts/
│   ├── hooks/
│   ├── services/
│   ├── types.ts
│   └── utils/
├── public/
├── docs/
├── .env.example
├── firebase.json
├── firestore.rules
├── firebase-applet-config.json
├── docker-compose.base44.yml
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── AGENTS.md
├── ARCHITECTURE.md
├── DEPLOY.md
├── PROMPT_INICIALIZACAO_FIREBASE.md
├── README.md
└── ...
```

## Fluxo operacional recomendado

1. Configure o projeto Firebase e as permissões de autenticação.
2. Ajuste as variáveis do `.env`.
3. Instale dependências com `npm install`.
4. Inicie a aplicação localmente.
5. Faça login com o perfil administrativo adequado.
6. Verifique os módulos de canteiros, colaboradores, horas e relatórios.
7. Faça testes com dados de demonstração ou dados reais da operação.

## Observações importantes

- O backend principal do sistema é o Firebase; o app foi desenhado para aproveitar o Firestore e autenticação em nuvem.
- Em cenários com indisponibilidade do banco ou permissão negada, o sistema alterna para cache local para manter o funcionamento.
- O tema visual institucional é controlado por tokens e CSS customizados em `src/constants/designTokens.ts` e `src/index.css`.
- A porta de desenvolvimento do Vite é `3000` e a aplicação está configurada para aceitar hosts externos em desenvolvimento.

## Licença

Este projeto não declara uma licença explícita no repositório. Consulte a organização do responsável pelo projeto antes de redistribuir ou publicar cópias externas.

## Referências úteis

- `AGENTS.md`: instruções de desenvolvimento e notas operacionais.
- `ARCHITECTURE.md`: diagrama e visão de arquitetura.
- `DEPLOY.md`: checklist e processo de implantação.
- `firestore.rules`: regras do banco para segurança.

---
