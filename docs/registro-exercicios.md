# Registro dos exercícios

Este documento acompanha as duas listas recebidas: exercícios **1 a 5** e **7 a 10**. Os anexos não apresentam exercício 6.

## Exercício 1 — Criando e usando .env

**Sintoma:** módulos importados antes do carregamento do dotenv recebem `undefined`; `PORT` chega como texto e a impressão de todo o ambiente pode expor dados sensíveis.

**Comando de reprodução:** executar a versão defeituosa com `ts-node src/app.ts` antes de corrigir a ordem dos imports.

**Resultado esperado:** ambiente carregado antes de qualquer leitura, porta numérica e logs seletivos.

**Resultado obtido no cenário defeituoso:** `database.ts` é executado durante a resolução do import, antes de `dotenv.config()`; qualquer entrada de `process.env` é `string | undefined`.

**Hipótese:** o problema está na ordem de carregamento e na ausência de uma borda única de configuração.

**Como foi investigado:** ordem dos imports, tipo das variáveis de ambiente e comportamento da concatenação de texto.

**Causa encontrada:** leitura de ambiente espalhada e tardia.

**Correção aplicada:** `src/config/index.ts` carrega o arquivo primeiro, valida e converte os valores; os demais módulos importam `config`.

**Validação:** `config.port` é `number`, `config.db.host` é texto obrigatório e nenhum log imprime senha ou chave.

Observações:
- variáveis de ambiente chegam como texto porque o ambiente do processo é uma coleção de pares chave/valor textuais;
- espaços ao redor de `=` são normalizados pelo dotenv; aspas de delimitação não fazem parte do valor;
- imprimir `process.env` inteiro pode revelar tokens, senhas e dados do sistema;
- centralizar a configuração evita conversões e regras diferentes em cada módulo.

---

## Exercício 2 — Separando ambientes

**Sintoma:** desenvolvimento e produção podem usar a mesma configuração quando o arquivo errado é carregado ou quando uma variável já existente impede a substituição.

**Resultado esperado:** `start:dev` usa desenvolvimento; `start:prod` usa produção; ambiente inválido falha na subida.

**Hipótese:** seleção de ambiente, precedência e caminho relativo estavam misturados.

**Causa encontrada:** no cenário original há atribuição dentro do `if`, carregamento genérico antes do arquivo específico e caminho dependente do diretório atual.

**Correção aplicada:** `cross-env` define `NODE_ENV`; `src/config/index.ts` ancora os arquivos na raiz do projeto e seleciona `.env.dev` ou `.env.prod`. `override: false` mantém a variável do sistema com prioridade, comportamento mais adequado a deploys.

**Comprovação preparada:**
- `examples/env/development.env.example` usa `DB_HOST=db.dev.local`;
- `examples/env/production.env.example` usa `DB_HOST=db.prod.exemplo`;
- o startup imprime somente o nome do ambiente, arquivo de origem e host, sem segredos.

Sem `NODE_ENV`, o padrão adotado é `development`. Valores diferentes de `development` e `production` são recusados.

---

## Exercício 3 — Segurança no Git

**Sintoma:** `.env` pode continuar aparecendo no status mesmo depois de ser colocado no `.gitignore`, e um padrão amplo como `.env*` também esconde `.env.example`.

**Causa:** o `.gitignore` não deixa de rastrear arquivos que já estavam no índice; além disso, o padrão original também alcança o arquivo de exemplo.

**Correção aplicada no repositório:**

```gitignore
.env
.env.*
!.env.example
```

Para um arquivo que já tivesse sido rastreado, a correção seria:

```bash
git rm --cached .env
git commit -m "remove .env do versionamento"
```

Verificação:

```bash
git check-ignore -v .env .env.dev .env.prod .env.example
```

O esperado é `.env`, `.env.dev` e `.env.prod` ignorados, enquanto `.env.example` permanece versionável.

Se uma chave real tiver ido para o Git, é necessário **revogar/rotacionar a credencial**, atualizar o ambiente seguro, auditar possíveis usos e avaliar a limpeza do histórico. Apagar o arquivo no commit mais novo não torna o segredo antigo inacessível.

O clone limpo é orientado pelo README e pelos exemplos versionados.

---

## Exercício 4 — Variáveis obrigatórias

**Sintoma:** uma aplicação pode subir sem `API_KEY` e falhar só na primeira requisição.

**Hipótese:** o schema original descrevia tipos, mas não exigia presença, e o erro apenas gerava `console.warn`.

**Correção aplicada:** `src/config/validators.ts` usa Joi com:
- `DB_HOST`, `API_KEY` e `PAYMENT_URL` obrigatórias;
- `API_KEY` vazia inválida;
- `PORT` inteira entre 1 e 65535, com padrão 3000 apenas quando realmente ausente;
- `abortEarly: false`, para listar todas as chaves problemáticas;
- `unknown(true)`, para não rejeitar variáveis extras do sistema;
- uso do objeto validado/conver­tido em vez de reler o ambiente.

A mensagem de falha lista **nomes de chaves**, nunca valores.

### Comparação Joi x env-schema

| Ponto | Joi | env-schema |
| --- | --- | --- |
| Forma do schema | API encadeada em TypeScript/JS | JSON Schema sobre Ajv |
| Conversão | integrada à validação | Ajv faz coerção configurada pela biblioteca |
| Erros | fácil customização por `error.details` | boa padronização via JSON Schema |
| Reuso externo | bom no ecossistema Joi | JSON Schema é mais portátil |
| Uso neste projeto | validação principal | alternativa demonstrada em `demo:env-schema` |

Falhar na subida é preferível porque configuração inválida é defeito de inicialização, não algo que deve esperar tráfego real para aparecer.

---

## Exercício 5 — Porta com fallback

**Sintoma:** `process.env.PORT || 3000` transforma texto vazio em fallback silencioso; valor inválido pode chegar ao `listen`; a segunda instância em uma porta ocupada falha sem mensagem amigável.

**Correção aplicada:** a porta é validada no módulo de configuração e o servidor trata `EADDRINUSE`.

Comportamento definido:
- `PORT` ausente → 3000;
- `PORT=4000` → 4000;
- `PORT=` → erro de configuração, em vez de fallback acidental;
- `PORT=abc` → erro de configuração;
- mesma porta em duas instâncias → a segunda encerra com mensagem legível e código diferente de zero.

`||` usa o lado direito para qualquer valor falsy, incluindo texto vazio. `??` só usa fallback para `null` ou `undefined`. Para configuração, a decisão deve ser explícita; neste projeto, vazio é inválido.

A rota `/health` usa `server.address()` para informar a porta realmente vinculada pelo servidor, em vez de apenas repetir a entrada.

---

## Exercício 7 — Chaves de API

Os três pontos principais de exposição no trecho original são:
1. valor padrão embutido no código-fonte;
2. chave na URL de consulta — e, consequentemente, no log da URL e em infraestrutura que registra URLs;
3. chave incluída na mensagem de erro, que pode chegar a monitoramento.

O valor padrão é mais perigoso que a ausência porque mantém a aplicação aparentemente funcionando e esconde a configuração incorreta.

**Correção:** `src/weather.ts` lê a chave já validada por `config`, envia `Authorization: Bearer ...`, registra apenas status/statusText e nunca inclui a chave na URL ou no erro.

A função `maskSecret` mostra somente os últimos quatro caracteres quando houver necessidade operacional de distinguir credenciais. Mascarar reduz exposição; não equivale a esconder completamente.

### Chave no código x chave no ambiente

| Pergunta | Chave no código | Chave no ambiente |
| --- | --- | --- |
| Trocar exige o quê? | alterar código, revisar e implantar novamente | trocar a configuração/secret e reiniciar ou redeployar |
| Quem consegue lê-la? | qualquer pessoa/sistema com acesso ao código e histórico | somente quem possui acesso ao ambiente/secret store, se bem configurado |
| Dois ambientes, duas chaves? | exige ramificações ou código/config adicional arriscado | natural: cada ambiente recebe seu próprio valor |
| Se vazar? | além de rotacionar, é preciso tratar o histórico do código | rotacionar e auditar o local de configuração/logs; o código continua limpo |

Quando uma chave vaza: revogar/rotacionar, substituir nos ambientes legítimos, auditar uso, remover exposições em logs/histórico e investigar o alcance do incidente.

---

## Exercício 8 — Estrutura de projeto

**Sintoma:** `config.port` pode ser `string | undefined`, `config.db.host` pode ser alterado e módulos diferentes podem interpretar a mesma variável de formas diferentes.

**Causa:** leitura direta de ambiente, carregamento tardio e objeto compartilhado mutável.

**Correção aplicada:**
- todas as leituras de `process.env` do código de aplicação ficam em `src/config/index.ts`;
- Joi valida e converte na borda;
- `Config` não expõe `undefined` para campos obrigatórios;
- configuração raiz e objetos internos são congelados;
- `src/db.ts` consome `config.db.host`;
- campos estão agrupados em `db`, `api`, `payment`, `log` e `http`.

`const` impede reatribuir a variável que aponta para um objeto; não impede alterar propriedades internas. `Object.freeze` bloqueia essas alterações no objeto congelado, por isso os níveis internos também foram congelados.

A demonstração está em:

```bash
npm run demo:freeze
```

---

## Exercício 9 — Boas práticas em equipe

**Sintoma:** uma variável nova funciona só na máquina de quem a criou, enquanto colegas recebem erro por ausência. Tentar resolver compartilhando `.env` cria risco de segredo e conflitos.

**Causa:** o arquivo local tinha `PAYMENT_URL`, mas o exemplo versionado não acompanhava a mudança.

**Regra de equipe:** toda variável nova usada pela aplicação deve entrar em `.env.example` **no mesmo commit** que introduz seu uso. O exemplo contém nomes e valores ilustrativos, nunca credenciais reais.

`scripts/check-env.ts` compara **nomes das chaves**, não valores. Variáveis extras no arquivo local são permitidas; chaves presentes no exemplo e ausentes localmente interrompem a subida.

O script roda automaticamente antes de `start:dev` e `start:prod`.

Saída pedida para variável faltando: [check-env-missing.txt](check-env-missing.txt).

Se um `.env` com segredo tivesse sido commitado, o arquivo deveria ser removido do índice e a credencial rotacionada. Reescrever ou apagar só o commit visível não invalida uma chave já conhecida por terceiros.

---

## Exercício 10 — Variáveis dinâmicas

**Sintoma:** `LOG_PATH="./logs/${NODE_ENV}.log"` fica literal quando somente dotenv é usado.

**Causa:** dotenv lê pares chave/valor; expansão de referência entre variáveis não é sua responsabilidade padrão.

**Correção aplicada:** depois do `dotenv.config()`, `dotenv-expand` expande as referências. O padrão sem `NODE_ENV` é `development`.

Alvo implementado:

| Configuração | development | production |
| --- | --- | --- |
| LOG_PATH | `logs/development.log` | `logs/production.log` |
| LOG_LEVEL padrão | `debug` | `info` |
| formato | legível | JSON |
| stack em resposta | permitida | nunca |

`src/logger.ts` cria a pasta com `recursive: true` antes da primeira escrita.

O caminho configurado é resolvido a partir da raiz do projeto e depois comparado com a pasta `logs/`. Caminhos que escapem dessa pasta são recusados na subida. Isso reduz risco de escrita arbitrária causado por configuração externa malformada ou manipulada.

A interpolação do shell acontece antes de o processo receber os argumentos/variáveis; a interpolação no arquivo `.env` depende de uma biblioteca que interprete a referência. São etapas diferentes.

Centralizar as diferenças de ambiente em `config` evita condicionais de `NODE_ENV` espalhadas por módulos de negócio.

---

## Checklist final

- [x] dotenv carregado antes do consumo da configuração;
- [x] porta numérica e validada;
- [x] ambientes distintos e scripts portáteis;
- [x] `.env` fora do versionamento e `.env.example` mantido;
- [x] variáveis obrigatórias falham na subida;
- [x] erro de porta ocupada tratado;
- [x] chave de API fora do código/URL/log/erro;
- [x] configuração congelada;
- [x] script de verificação de chaves;
- [x] `dotenv-expand` para variável dinâmica;
- [x] diretório de log criado;
- [x] proteção contra `LOG_PATH` fora de `logs/`;
- [x] registro de causa, hipótese e validação documentado.
