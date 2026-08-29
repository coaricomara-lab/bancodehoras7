# Implantar uma nova instância

## Pré-requisitos

- Node.js 18 ou superior.
- Uma conta no Firebase/Google Cloud.
- Firebase CLI instalada: `npm install -g firebase-tools`.

## Passo a passo

- Clone o projeto e entre na pasta:

  ```bash
  git clone <URL_DO_REPOSITORIO>
  cd <PASTA_DO_PROJETO>
  ```

- Instale as dependências:

  ```bash
  npm install
  ```

- No Firebase Console, crie um novo projeto e adicione um aplicativo Web.

- No mesmo projeto, ative Authentication e habilite o provedor **E-mail/senha**. Crie o banco Firestore no modo de produção.

- Copie o modelo de ambiente e preencha os valores exibidos na configuração do aplicativo Web:

  ```bash
  cp .env.example .env
  ```

  Preencha `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID` e `VITE_FIREBASE_APP_ID`. Preencha `VITE_FIREBASE_DATABASE_ID` somente para um banco nomeado.

- Faça login na Firebase CLI e associe o projeto local ao projeto recém-criado:

  ```bash
  firebase login
  firebase use --add
  ```

- Publique as regras de segurança:

  ```bash
  npm run deploy:rules
  ```

- Inicie a aplicação localmente para validar a instância:

  ```bash
  npm run dev
  ```

Cada cópia deve usar seu próprio projeto Firebase e seu próprio `.env`. Assim, autenticação, Firestore e dados ficam isolados entre as instâncias.