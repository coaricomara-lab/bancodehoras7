# Implantar uma nova instância

## Visão geral

Este guia documenta a implantação oficial do projeto e os requisitos mínimos para que a aplicação funcione com segurança, resiliência operacional e conformidade com LGPD.

## Pré-requisitos

- Node.js 18 ou superior.
- Conta no Firebase / Google Cloud com acesso de administrador.
- Firebase CLI instalado:

  ```bash
  npm install -g firebase-tools
  ```

- Acesso ao projeto Google AI Studio / Applets caso a instância seja provisionada por ambiente dinâmico.

## 1. Configuração do projeto Firebase

1. Crie um novo projeto Firebase e adicione um aplicativo Web.
2. Ative o módulo Authentication e habilite o provedor de e-mail/senha.
3. Crie o banco Firestore no modo de produção.
4. Publique as regras de segurança do projeto:

  ```bash
  npm run deploy:rules
  ```

5. No Firebase Console, confirme o checklist obrigatório de domínios autorizados:

  - Authentication
  - Settings
  - Authorized Domains
  - Adicionar a URL pública da aplicação, como:
    - `https://bamcodehoras.ai.studio/`
    - `https://<seu-projeto>.ai.studio/`
    - qualquer domínio próprio publicado em produção
  - Se a aplicação estiver em domínio customizado ou App Engine / hosting, incluir também esse domínio.

> Importante: sem os domínios autorizados, o login por e-mail/senha falha mesmo quando a autenticação está ativa no projeto.

## 2. Variáveis de ambiente

Copie o modelo de ambiente e preencha os valores do app Web:

```bash
cp .env.example .env
```

Preencha as chaves do Firebase e mantenha as credenciais fora do código-fonte. As variáveis podem ser injetadas dinamicamente em ambiente AI Studio / Applets sem necessidade de digitar senhas no terminal, respeitando a política de resiliência do ambiente.

Campos esperados:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_DATABASE_ID` apenas quando houver banco nomeado

## 3. Admin Master padrão e auto-seed

A primeira inicialização do sistema deve garantir automaticamente a criação da conta administrativa principal no Firebase Authentication e no Firestore.

Credenciais oficiais do Admin Master do projeto:

- E-mail: `admin@comara.mil.br`
- Senha: `Comara123#`

O mecanismo de auto-seed do sistema cria essa conta dinamicamente na primeira inicialização, caso a base esteja limpa ou o registro ainda não exista. Esse processo preserva a identidade administrativa do sistema e evita depender da criação manual em ambiente novo.

### Fluxo esperado do auto-seed

1. Aplicação inicia.
2. O módulo de autenticação verifica se o Admin Master já existe.
3. Caso não exista, provisiona a conta `admin@comara.mil.br` com a senha `Comara123#`.
4. Cria também o registro administrativo em Firestore, mantendo `role: SUPER_ADMIN` e acesso completo.
5. A aplicação segue com o bootstrap normal do sistema.

## 4. Validação local e implantação

- Instale as dependências:

  ```bash
  npm install
  ```

- Faça login na Firebase CLI e associe o projeto local:

  ```bash
  firebase login
  firebase use --add
  ```

- Inicie a aplicação localmente para validar a instância:

  ```bash
  npm run dev
  ```

- Verifique a aplicação com:

  ```bash
  curl -f http://localhost:3000/
  ```

## 5. LGPD, CPF e dados sensíveis

O projeto deve respeitar a regra de minimização de dados e armazenamento seguro:

- Armazenar apenas `cpfHash` em SHA-256 para comparações e desduplicação.
- Armazenar `cpfMascarado` no formato `***.XXX.XXX-**` para exibição em interfaces e relatórios.
- Nunca persistir o CPF completo em texto plano no Firestore.
- Manter `seedTrainingData()` e `clearAllOperationalData()` intactos para suporte de treinamento, reset operacional seguro e reposicionamento do ambiente sem destruir a infraestrutura administrativa crítica.

## 6. Resiliência e reset operacional

Em ambientes do Google AI Studio / Applets, as variáveis e segredos podem ser injetados de forma dinâmica sem necessidade de digitar manualmente senhas no terminal. O provisionamento do projeto deve ser feito de modo que:

- A conta master oficial permaneça consistente;
- o bootstrap do ambiente crie ou valide o Admin Master;
- dados operacionais possam ser limpos por rotina específica sem apagar a identidade do sistema;
- o treinamento e a carga de dados demo não substituam os controles de produção.

## 7. Boas práticas finais

- Cada instância deve usar seu próprio projeto Firebase e seu próprio `.env`.
- Autenticação, Firestore e dados ficam completamente isolados por ambiente.
- O tema visual da interface continua sendo controlado por [src/constants/designTokens.ts](src/constants/designTokens.ts) e [src/index.css](src/index.css), com base naval institucional (`#0B1426`) para modo escuro.
- A porta do Vite continua sendo `3000`, conforme [docker-compose.base44.yml](docker-compose.base44.yml).

## 8. Checklist de deploy

- [ ] Projeto Firebase criado
- [ ] Authentication habilitado com e-mail/senha
- [ ] Authorized Domains com URL pública adicionada
- [ ] Firestore criado em modo produção
- [ ] Regras publicadas
- [ ] `.env` preenchido
- [ ] Auto-Seed validado
- [ ] Admin Master `admin@comara.mil.br` / `Comara123#` acessível
- [ ] LGPD validada para `cpfHash` e `cpfMascarado`
- [ ] Validação local concluída em `http://localhost:3000/`

Cada cópia deve usar seu próprio projeto Firebase e seu próprio `.env`. Assim, autenticação, Firestore e dados ficam isolados entre as instâncias.