# Setup do Ambiente

## O que voce precisa instalar

Instale nesta ordem:

1. `Git`
2. `Docker Desktop`
3. `Node.js 22 LTS`
4. `Ruby 3.4.x`
5. `Rails 8.1.x`

Opcional, mas recomendado logo no inicio:

1. `VS Code`
2. extensao `Ruby LSP`
3. extensao `ESLint`
4. extensao `Prettier`
5. extensao `Docker`

## O que ja foi ajustado nesta maquina

Eu validei no ambiente atual:

- `Git`: instalado
- `Docker`: instalado
- `Docker Compose`: instalado
- `Node`: instalado
- `Ruby`: instalado
- `Rails`: instalado
- `pnpm`: instalado

Pontos de atencao no Windows:

- o `npm` pode falhar no PowerShell por causa da policy de execucao do Windows
- se isso acontecer, use `npm.cmd` ou ajuste a policy do usuario

## Como corrigir o problema do npm no PowerShell

Abra um PowerShell como usuario comum e rode:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Depois feche e abra o terminal novamente.

Se preferir nao mudar isso agora, use `npm.cmd` em vez de `npm` dentro do PowerShell.

## Ferramentas recomendadas

### Node

Se precisar reinstalar ou preparar outra maquina:

```powershell
corepack enable
npm.cmd install -g pnpm
```

Por que usar `pnpm`:

- melhor performance em monorepo
- menos espaco em disco
- instalacao deterministica

### Ruby

Padrao atual do projeto:

- `Ruby 3.4.4`
- `Rails 8.1.3`

Para projetos Ruby dentro do repositorio, prefira instalar gems localmente:

```powershell
bundle config set --local path vendor/bundle
```

### Docker Desktop

No Windows, confira:

- WSL2 habilitado
- integracao do Docker com sua distribuicao WSL, se for usar Linux containers
- virtualizacao habilitada na BIOS, se o Docker reclamar

## Como preparar o repositorio

Na raiz do projeto:

```powershell
Copy-Item .env.example .env
.\scripts\check-prereqs.ps1
.\scripts\dev-up.ps1
```

## Servicos locais e acessos

Depois de subir o compose, voce deve ter:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- RabbitMQ AMQP: `localhost:5672`
- RabbitMQ painel: [http://localhost:15672](http://localhost:15672)
- MinIO API: [http://localhost:9000](http://localhost:9000)
- MinIO Console: [http://localhost:9001](http://localhost:9001)
- ClickHouse HTTP: [http://localhost:8123](http://localhost:8123)

## Como rodar cada app

### Frontend

```powershell
Set-Location .\apps\web
pnpm dev
```

### API

A API usa as variaveis do `compose` para conectar no PostgreSQL local.

```powershell
Set-Location .\apps\api
bundle exec rails db:prepare
bundle exec rails server
```

### Worker

```powershell
Set-Location .\apps\worker
bundle exec rspec
```

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
