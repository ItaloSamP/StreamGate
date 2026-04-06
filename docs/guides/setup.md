# Setup do Ambiente

## Ambiente recomendado

O setup principal do projeto e `WSL2 + Ubuntu + Docker Desktop com integracao WSL`.

No Windows, a recomendacao pratica e:

- usar o Windows apenas como host
- manter o repositorio principal dentro do filesystem Linux, por exemplo `~/projects/streamgate`
- abrir o projeto pelo Ubuntu com `code .`
- usar os scripts `.sh` em `scripts/` como fluxo padrao

Os scripts `.ps1` continuam disponiveis apenas como fallback para Windows puro.

A raiz de `scripts/` agora expoe apenas os comandos principais; helpers internos ficam organizados em `scripts/bootstrap`, `scripts/dev`, `scripts/ci` e `scripts/compose`.

A classificacao operacional real da Sprint 0 para ambientes, checks e falhas conhecidas esta em [docs/guides/devops-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md).

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

O `worker` ainda nao possui loop real de consumo de filas implementado no codigo do projeto.
Por isso, o container do `worker` no `profile full` sobe como ambiente de desenvolvimento pronto para a gem, mantendo o processo ativo e validando que o pacote `worker` carrega corretamente.
Quando o runtime do worker for implementado, esse comando pode ser trocado pelo processo real de consumo.

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
./scripts/ci/ci-local.sh
```

O `./scripts/ci/ci-local.sh` reproduz localmente os tres workflows do GitHub Actions com blocos separados por workflow, passos individuais e um resumo final mostrando claramente o que passou ou falhou.

Se quiser validar apenas um workflow:

```bash
./scripts/ci/ci-local.sh frontend
./scripts/ci/ci-local.sh backend
./scripts/ci/ci-local.sh docker
```

## Fallback para Windows puro

Se voce precisar rodar o projeto fora do WSL, ainda existem os scripts PowerShell:

```powershell
.\\scripts\\bootstrap\\check-prereqs.ps1
.\\scripts\\dev\\dev-up.ps1
.\\scripts\\dev\\dev-up.ps1 -Mode full
.\\scripts\\dev\\dev-down.ps1
.\\scripts\\ci\\ci-local.ps1
```

Mas o fluxo recomendado segue sendo o `WSL-first`.

## CI atual

O projeto tem tres workflows separados:

- `frontend-ci.yml`
- `backend-ci.yml`
- `docker-ci.yml`

Eles rodam quando houver alteracoes nas areas relevantes do frontend, backend ou docker.

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


## Mapa oficial de servicos e variaveis (Sprint 1)

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

Esses nomes estao alinhados com:

- `apps/api/config/database.yml`
- `apps/web/src/lib/api-client.ts`
- scripts de CI e compose em `scripts/`

## Padrao de encoding para scripts locais

Para previsibilidade entre WSL e PowerShell, os scripts oficiais da raiz agora seguem estas regras:

- scripts `.sh` exportam locale UTF-8 de forma explicita (`LANG` e `LC_CTYPE`)
- scripts `.ps1` inicializam `InputEncoding`, `OutputEncoding` e `$OutputEncoding` em UTF-8 sem BOM

Isso reduz problemas de caracteres em logs, parsing de saida e execucao de automacoes em ambientes mistos.
