# Setup do Ambiente

## Objetivo
Este guia consolida diretrizes de setup para uso consistente no projeto.

## Estado atual
Conteudo alinhado ao estado operacional atual; atualizar em cada mudanca relevante.

## Regras/Contratos
- As regras normativas deste tema estao descritas nas secoes tecnicas abaixo.
- Mudancas devem manter alinhamento com roadmap, ADRs e READMEs.

## Validacao/Evidencias
- Validar coerencia com README raiz, docs/README e roadmap da release atual.
- Registrar atualizacoes desta pagina no closeout do ciclo de entrega correspondente.

## Referencias
- [Roadmap mestre](C:/estudos/StreamGate/docs/planning/)
- [Governanca de documentacao](C:/estudos/StreamGate/docs/guides/operations/documentation-governance.md)


## Ambiente recomendado

O setup principal do projeto e `WSL2 + Ubuntu + Docker Desktop com integracao WSL`.

No Windows, a recomendacao pratica e:

- usar o Windows apenas como host
- manter o repositorio principal dentro do filesystem Linux, por exemplo `~/projects/streamgate`
- abrir o projeto pelo Ubuntu com `code .`
- usar os scripts `.sh` em `scripts/` como fluxo padrao

Os scripts `.ps1` continuam disponiveis apenas como fallback para Windows puro.

A raiz de `scripts/` agora expoe apenas os comandos principais; helpers internos ficam organizados em `scripts/bootstrap`, `scripts/dev`, `scripts/ci`, `scripts/compose`, `scripts/reports` e `scripts/smokes`.

A classificacao operacional atual para ambientes, checks e falhas conhecidas esta em [docs/guides/platform/devops-baseline.md](C:/estudos/StreamGate/docs/guides/platform/devops-baseline.md).

Em desenvolvimento e teste, a API Rails carrega automaticamente o `.env` da raiz do repositorio durante o boot, sem sobrescrever variaveis ja exportadas no processo. Isso evita que comandos diretos como `bundle exec rails test` dependam de um wrapper manual so para popular credenciais locais. Para desabilitar esse comportamento em diagnosticos especificos, defina `STREAMGATE_SKIP_DOTENV=1`.

## O que voce precisa instalar

Instale nesta ordem:

1. `Git`
2. `Docker Desktop`
3. `WSL2`
4. `Ubuntu` no WSL
5. `Node.js 22 LTS`
6. `Ruby 3.4.x`
7. `Rails 8.1.x`

Opcional, mas recomendado logo no inicio:

1. `VS Code`
2. extensao `Ruby LSP`
3. extensao `ESLint`
4. extensao `Prettier`
5. extensao `Docker`
6. extensao `Remote - WSL`

## Como organizar o repositorio

Se voce estava trabalhando em `C:\estudos\StreamGate`, a migracao recomendada e:

```bash
mkdir -p ~/projects/streamgate
cp -a /mnt/c/estudos/StreamGate/. ~/projects/streamgate/
cd ~/projects/streamgate
```

Depois disso, trate `~/projects/streamgate` como a copia principal do projeto.
Nao use o repositorio no Windows como origem diaria de trabalho.

## Ferramentas recomendadas no Ubuntu

### Base do sistema

```bash
sudo apt update
sudo apt install -y curl git build-essential rsync unzip jq
```

### Node

Recomendado com `nvm`:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
nvm alias default 22
corepack enable
corepack prepare pnpm@latest --activate
```

### Ruby

Padrao atual do projeto:

- `Ruby 3.4.4`
- `Rails 8.1.3`

Para projetos Ruby dentro do repositorio, prefira instalar gems localmente:

```bash
bundle config set --local path vendor/bundle
```

### Docker Desktop

No Windows, confira:

- WSL2 habilitado
- integracao da distro `Ubuntu` ligada em `Settings > Resources > WSL Integration`
- Linux containers ativos

## Como preparar o repositorio

Na raiz do projeto, dentro do Ubuntu:

```bash
cp .env.example .env
find scripts -name '*.sh' -exec chmod +x {} +
./scripts/bootstrap/check-prereqs.sh
```

## Perfis do compose

O fluxo principal agora e controlado por perfis:

- `infra`: apenas infraestrutura de apoio
- `full`: infraestrutura + `api` + `web` + `worker`

Comandos principais:

```bash
./scripts/dev/dev-up.sh
./scripts/dev/dev-up.sh full
./scripts/dev/dev-down.sh
```

O `dev-up` faz preparacao incremental do Docker antes de subir:

- puxa imagens externas de infraestrutura quando elas nao existem mais no host;
- calcula fingerprints de build de `api`, `web` e `worker`;
- rebuilda seletivamente quando uma imagem local sumiu ou quando `Dockerfile`, `.dockerignore`, manifestos de dependencias ou `compose.yaml` mudaram.

Assim, limpar dados/imagens do Docker nao exige decorar comandos extras: rode o `dev-up` ou o `run-all-reports` novamente e o script decide entre pull, rebuild seletivo e compose up.

Ou diretamente com Docker Compose:

```bash
docker compose up -d
docker compose --profile full up -d
docker compose down
```

## Servicos locais e acessos

Depois de subir o compose, voce deve ter:

### Infra

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- RabbitMQ AMQP: `localhost:5672`
- RabbitMQ painel: [http://localhost:15672](http://localhost:15672)
- MinIO API: [http://localhost:9000](http://localhost:9000)
- MinIO Console: [http://localhost:9001](http://localhost:9001)
- ClickHouse HTTP: [http://localhost:8123](http://localhost:8123)

### Aplicacao no profile `full`

- API Rails: [http://localhost:3000](http://localhost:3000)
- Frontend Vite: [http://localhost:5173](http://localhost:5173)

## Nota sobre o MinIO

Voce vera dois containers relacionados ao MinIO:

- `streamgate-minio`: servidor principal, deve ficar `Up`
- `streamgate-minio-init`: container one-shot de inicializacao, deve terminar em `Exited (0)`

Esse `minio-init` nao deve ficar rodando. Ele sobe, cria/configura o bucket e encerra com sucesso.
No `docker ps -a` ele aparece parado; isso e esperado.

## Nota sobre o worker no profile `full`

O `worker` do profile `full` executa o runtime real de consumo RabbitMQ do runtime operacional.
Ele consome eventos `upload.received.v1`, processa arquivos CSV/ZIP no corte inicial, atualiza estados de job e alimenta leituras operacionais de analytics/quarantine/audit.
Para validar a trilha completa, use o runner de smokes em `scripts/smokes`.

## Como rodar cada app fora do compose

### Frontend

```bash
cd ~/projects/streamgate/apps/web
pnpm install
pnpm dev --host
```

### API

A API usa as variaveis do `compose` para conectar no PostgreSQL local.

```bash
cd ~/projects/streamgate/apps/api
bundle exec rails db:prepare
bundle exec rails server
```

### Worker

```bash
cd ~/projects/streamgate/apps/worker
bundle exec rspec
```

## Scripts principais no WSL

Na raiz do projeto:

```bash
./scripts/bootstrap/check-prereqs.sh
./scripts/dev/dev-up.sh
./scripts/dev/dev-up.sh full
./scripts/dev/dev-down.sh
./scripts/compose/compose-health-tests.sh
./scripts/reports/run-all-reports.sh
./scripts/smokes/run-smokes.sh
./scripts/ci/ci-local.sh
```

O `./scripts/ci/ci-local.sh` reproduz localmente os workflows oficiais com blocos separados por workflow, passos individuais e um resumo final mostrando claramente o que passou ou falhou.

Workflows disponiveis:

```bash
./scripts/ci/ci-local.sh frontend
./scripts/ci/ci-local.sh backend
./scripts/ci/ci-local.sh docker
./scripts/ci/ci-local.sh e2e
```

## Fallback para Windows puro

Se voce precisar rodar o projeto fora do WSL, ainda existem os scripts PowerShell:

```powershell
.\\scripts\\bootstrap\\check-prereqs.ps1
.\\scripts\\dev\\dev-up.ps1
.\\scripts\\dev\\dev-up.ps1 -Mode full
.\\scripts\\dev\\dev-down.ps1
.\\scripts\\compose\\compose-health.tests.ps1
powershell -ExecutionPolicy Bypass -File .\\scripts\\reports\\run-all-reports.ps1 -Profile full-closeout
powershell -ExecutionPolicy Bypass -File .\\scripts\\smokes\\run-smokes.ps1
.\\scripts\\ci\\ci-local.ps1
```

No PowerShell, para escolher workflow especifico:

```powershell
.\\scripts\\ci\\ci-local.ps1 -Workflow frontend
.\\scripts\\ci\\ci-local.ps1 -Workflow backend
.\\scripts\\ci\\ci-local.ps1 -Workflow docker
.\\scripts\\ci\\ci-local.ps1 -Workflow e2e
```

Mas o fluxo recomendado segue sendo o `WSL/Compose-first`, deixando o host Windows para checks rapidos, suporte local e diagnostico.

## Como abrir os reports locais

Para gerar o pacote final de evidencias:

```bash
PROFILE=full-closeout bash scripts/reports/run-all-reports.sh
```

No PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout
```

Depois da execucao, abra `docs/reports/index.html` no navegador. Esse hub aponta para:

- coverage HTML do frontend unit/integration;
- Playwright HTML report do E2E;
- SimpleCov HTML da API e do worker;
- logs e resumo dos smokes;
- logs e resumo do CI local.

Perfis oficiais de gate:

- `fast`: `ci-local` por workflow (`frontend`, `backend`, `e2e`, `docker`);
- `operational`: `scripts/smokes/run-smokes.(ps1|sh)` para runtime, artefatos, notificacoes e operacao segura;
- `full-closeout`: `scripts/reports/run-all-reports.(ps1|sh)` no fechamento relevante, sem rerodar `ci-local all` em cascata.

Os reports sao artefatos locais, sobrescritos em cada nova execucao e ignorados pelo Git.

## CI atual

O projeto tem quatro workflows separados:

- `frontend-ci.yml`
- `backend-ci.yml`
- `docker-ci.yml`
- `e2e-auth-ci.yml`

Eles rodam quando houver alteracoes nas areas relevantes do frontend, backend ou docker, e o `e2e-auth` cobre a trilha ponta a ponta de autenticacao.

## Como pensar o desenvolvimento daqui para frente

### Fase 1: infraestrutura local

Objetivo:

- subir todos os servicos de apoio
- validar conexoes
- estabilizar variaveis de ambiente

### Fase 2: integracao base

Objetivo:

- conectar API ao PostgreSQL, Redis, RabbitMQ e MinIO
- definir eventos em `packages/contracts`
- preparar o worker para consumir filas

### Fase 3: produto

Objetivo:

- implementar upload assinado
- criar fluxo de jobs
- processar arquivos e alimentar PostgreSQL e ClickHouse
- construir painel operacional e analitico

## Mapa oficial de servicos e variaveis (fundacao de autenticacao)

Para evitar drift entre frontend, backend, compose e contratos, este projeto passa a assumir estes nomes como oficiais:

### Servicos de infraestrutura no `compose.yaml`

- `postgres`
- `redis`
- `rabbitmq`
- `minio`
- `clickhouse`

### Variaveis de ambiente de banco usadas pela API

- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_TEST_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

### Variavel de integracao frontend -> API

- `VITE_API_BASE_URL`

### Variaveis de auth e sessao usadas pela API

- `AUTH_SESSION_TTL_HOURS`
- `AUTH_PASSWORD_RESET_TTL_MINUTES`
- `AUTH_TOKEN_PEPPER`
- `AUTH_SESSION_TRANSPORT`
- `AUTH_COOKIE_ENABLED`
- `AUTH_CSRF_MODE`

### Variaveis de throttle de auth (hardening fundacao de autenticacao)

- `AUTH_LOGIN_LIMIT_PER_IP`
- `AUTH_LOGIN_LIMIT_PER_IDENTIFIER`
- `AUTH_REGISTER_LIMIT_PER_IP`
- `AUTH_PASSWORD_RESET_REQUEST_LIMIT_PER_IP`
- `AUTH_PASSWORD_RESET_REQUEST_LIMIT_PER_IDENTIFIER`
- `AUTH_PASSWORD_RESET_CONFIRM_LIMIT_PER_IP`
- `AUTH_THROTTLE_WINDOW_SECONDS`

### Variaveis de readiness de upload (gate de prontidao)

- `UPLOAD_STORAGE_ENDPOINT`
- `UPLOAD_STORAGE_BUCKET`
- `UPLOAD_STORAGE_REGION`
- `UPLOAD_SIGNED_URL_TTL_SECONDS`
- `UPLOAD_SIGNED_URL_MODE`

Essas variaveis ainda nao ativam o fluxo funcional da entrega de upload/job por si sozinhas, mas passam a ser oficiais para evitar drift entre compose, CI e API antes da implementacao de upload assinado.

### Variaveis oficiais de upload/job (entrega de upload/job)

- `UPLOAD_STORAGE_ENDPOINT`
- `UPLOAD_STORAGE_BUCKET`
- `UPLOAD_STORAGE_REGION`
- `UPLOAD_STORAGE_ACCESS_KEY`
- `UPLOAD_STORAGE_SECRET_KEY`
- `UPLOAD_SIGNED_URL_TTL_SECONDS`
- `UPLOAD_SIGNED_URL_MODE`
- `UPLOAD_ALLOWED_CONTENT_TYPES`
- `UPLOAD_VERIFY_OBJECT_BEFORE_REGISTER`
- `UPLOAD_SIGNED_URL_LIMIT_PER_IP`
- `UPLOAD_REGISTER_LIMIT_PER_IP`
- `UPLOAD_THROTTLE_WINDOW_SECONDS`
- `MINIO_CORS_ALLOWED_ORIGIN`

Essas variaveis sustentam a trilha base de upload assinado (`signed-url -> PUT -> register`) e as listagens reais de uploads/jobs.

### Validacao operacional recomendada (runtime operacional)

Para rodar todos os smokes com lifecycle completo do Compose:

```bash
bash scripts/smokes/run-smokes.sh
```

No PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smokes\run-smokes.ps1
```

Smokes individuais:

```bash
python scripts/smokes/compose-smoke.py
python scripts/smokes/upload-signed-smoke.py
python scripts/smokes/worker-operational-smoke.py
```

Suite de testes da trilha:

```bash
cd apps/api
bundle exec rails test

cd ../web
pnpm lint
pnpm test:run
pnpm test:integration
pnpm test:e2e
```

Regra de aceite:

- `WSL/CI` e o ambiente oficial de gate;
- falhas exclusivas de host Windows devem ser classificadas como ambiente quando nao reproduzirem em `WSL/CI`.
### Variaveis de CORS da API

- `API_CORS_ALLOWED_ORIGINS`
- `API_CORS_ALLOW_CREDENTIALS`

Esses nomes estao alinhados com:

- `apps/api/config/database.yml`
- `apps/api/config/initializers/auth_runtime.rb`
- `apps/api/config/initializers/cors.rb`
- `apps/web/src/lib/api-client.ts`
- scripts de CI e compose em `scripts/`

No `compose.yaml`, essas variaveis de auth/CORS/frontend tambem tem valores default para evitar quebra de `docker compose` quando o `.env` local estiver desatualizado.

## Padrao de encoding para scripts locais

Para previsibilidade entre WSL e PowerShell, os scripts oficiais da raiz agora seguem estas regras:

- scripts `.sh` exportam locale UTF-8 de forma explicita (`LANG` e `LC_CTYPE`)
- scripts `.ps1` inicializam `InputEncoding`, `OutputEncoding` e `$OutputEncoding` em UTF-8 sem BOM

Isso reduz problemas de caracteres em logs, parsing de saida e execucao de automacoes em ambientes mistos.
