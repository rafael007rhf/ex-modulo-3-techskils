# Exercícios — Módulo 3 Tech Skills

Resolução prática das listas de **Variáveis de Ambiente com dotenv (1 a 5)** e **Segredos, Config e Trabalho em Equipe (7 a 10)** em Node.js + TypeScript.

> Os anexos fornecidos não contêm um exercício 6; por isso o repositório segue a numeração 1–5 e 7–10.

## O que foi implementado

- carregamento de ambiente antes do uso das variáveis;
- configuração centralizada em `src/config`;
- `PORT` convertida e validada como número;
- ambientes de desenvolvimento e produção;
- `.env` e variações fora do Git, mantendo `.env.example`;
- validação obrigatória com Joi e alternativa com `env-schema`;
- tratamento de porta ocupada (`EADDRINUSE`);
- chave de API somente no ambiente e enviada por cabeçalho;
- configuração congelada em tempo de execução;
- verificação automática das chaves do arquivo de ambiente;
- expansão de `LOG_PATH=./logs/${NODE_ENV}.log` com `dotenv-expand`;
- criação automática da pasta de logs e bloqueio de caminhos fora de `logs/`;
- documentação com o registro de investigação pedido nas listas.

## Requisitos

- Node.js 18+
- npm

## Primeiro uso

```bash
npm install

cp examples/env/development.env.example .env.dev
```

Edite `.env.dev` e defina uma **chave fictícia local** em `API_KEY`. O arquivo é ignorado pelo Git.

Depois:

```bash
npm run start:dev
```

A verificação de ambiente roda automaticamente antes da aplicação. Se faltar uma chave prevista em `.env.example`, a aplicação nem inicia.

Acesse:

```text
GET http://localhost:3000/health
```

A rota responde a porta realmente usada pelo servidor.

## Desenvolvimento e produção

Para desenvolvimento:

```bash
cp examples/env/development.env.example .env.dev
# preencha API_KEY somente no arquivo local
npm run start:dev
```

Para simular produção localmente:

```bash
cp examples/env/production.env.example .env.prod
# preencha API_KEY somente no arquivo local
npm run start:prod
```

Em um deploy real, as variáveis normalmente devem vir do ambiente/gerenciador de segredos do provedor. O código aceita isso sem exigir um arquivo `.env.prod`, mas o script didático `start:prod` verifica o arquivo local para reproduzir o exercício.

## Scripts

| Comando | Finalidade |
| --- | --- |
| `npm run start:dev` | valida `.env.dev` e sobe em development |
| `npm run start:prod` | valida `.env.prod` e sobe em production |
| `npm run check:env -- .env.dev` | compara as chaves com `.env.example` |
| `npm run demo:freeze` | demonstra que a configuração não pode ser alterada |
| `npm run demo:env-schema` | executa a validação alternativa com env-schema |
| `npm run typecheck` | verifica os tipos sem gerar build |

## Segurança no Git

O projeto ignora:

```text
.env
.env.*
```

e abre exceção somente para:

```text
!.env.example
```

Se um segredo real for commitado por engano, removê-lo do arquivo **não resolve o incidente**. A credencial deve ser revogada/rotacionada, o acesso deve ser auditado e, quando necessário, o histórico deve ser saneado.

## Estrutura

```text
src/
  app.ts
  db.ts
  logger.ts
  weather.ts
  config/
    index.ts
    types.ts
    validators.ts
scripts/
  check-env.ts
  demo-env-schema.ts
  demo-freeze.ts
examples/env/
  development.env.example
  production.env.example
docs/
  registro-exercicios.md
  check-env-missing.txt
```

A explicação de cada exercício, incluindo sintomas, hipóteses, causas, validações e respostas às perguntas, está em [docs/registro-exercicios.md](docs/registro-exercicios.md).
