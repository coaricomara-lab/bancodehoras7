# Prompt de Provisionamento Firebase e Auto-Seed

Atue como Senior Technical Writer e DevOps Engineer. Precisamos provisionar corretamente a instância do projeto no Firebase para produção, com foco em segurança, auto-seed do Admin Master, domínios autorizados, reset de dados operacionais e conformidade LGPD.

## Objetivo

Provisionar o projeto com as configurações oficiais do código atual e manter as regras de negócio e operacionais intactas.

## Regras obrigatórias

1. Use como credencial oficial do Admin Master padrão:
   - E-mail: `admin@comara.mil.br`
   - Senha: `Comara123#`
2. Caso a base esteja vazia, o sistema deve realizar auto-seed ao iniciar, criando automaticamente a conta master no Firebase Authentication e no Firestore.
3. Preserve o motor de desduplicação por hash SHA-256 do CPF: `cpfHash` e `cpfMascarado` devem continuar sendo a regra para armazenamento e exibição.
4. Mantenha intactas as rotinas de `seedTrainingData()` e `clearAllOperationalData()`;
5. A limpeza operacional deve remover dados de operação e treinamento sem destruir a identidade administrativa do sistema.
6. O projeto deve seguir a LGPD:
   - CPF completo nunca deve ser persistido em texto plano.
   - O armazenamento deve usar `cpfHash` (SHA-256) e `cpfMascarado` no formato `***.XXX.XXX-**`.
7. O ambiente Google AI Studio / Applets pode receber variáveis de ambiente dinamicamente; não force a entrada manual de senhas no terminal.

## Checklist obrigatório do Firebase Console

Antes de liberar a autenticação, valide as configurações em:

- Authentication
- Settings
- Authorized Domains

Inclua a URL pública da aplicação, por exemplo:

- `https://bamcodehoras.ai.studio/`
- `https://<projeto>.ai.studio/`
- domínios PRD customizados, se aplicável

A aplicação só deve funcionar com os domínios autorizados incluídos.

## Sequência de provisionamento

1. Criar projeto Firebase.
2. Habilitar Authentication com provedor E-mail/senha.
3. Criar Firestore no modo de produção.
4. Publicar regras de segurança do projeto.
5. Adicionar os domínios autorizados no Firebase Console.
6. Configurar o arquivo `.env` com as variáveis do app Web.
7. Validar o auto-seed do `admin@comara.mil.br`.
8. Validar login funcional e fluxo de bootstrap.
9. Confirmar que a interface usa as paletas e tokens de design oficiais em `src/constants/designTokens.ts` e `src/index.css`.
10. Confirmar porta do Vite `3000` no `docker-compose.base44.yml`.

## Validação final

O provisionamento e a documentação oficial só estão prontos quando:

- a conta master oficial existe e pode autenticar;
- o auto-seed funciona em base limpa;
- os domínios de autenticação estão liberados;
- o CPF é armazenado como hash e máscara, nunca em texto plano;
- as regras de segurança e reset operacional foram preservadas;
- o projeto está pronto para produção com documentação sanitizada.
