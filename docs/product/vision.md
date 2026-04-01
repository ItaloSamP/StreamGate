# Visao do Produto: StreamGate

## Resumo executivo

O StreamGate existe para receber arquivos massivos, processa-los de forma assincrona e transformar esse processamento em duas visoes complementares:

- operacional, com foco em status, auditoria e tratamento de falhas
- analitica, com foco em consulta de alto volume e dashboards

O produto resolve o gargalo de pipelines sincronicos e centralizados, que costumam gerar lentidao, baixa rastreabilidade, falhas operacionais e pouca confiabilidade no acompanhamento do processamento.

## Problema

Organizacoes que ingerem grandes volumes de dados precisam:

- aceitar uploads extensos sem sobrecarregar a API
- processar dados em lotes com resiliencia
- manter trilha de auditoria por arquivo, job e lote
- separar registros validos de registros com erro
- consultar rapidamente o estado operacional e os indicadores analiticos

Sem essa separacao, o sistema tende a acumular acoplamento entre upload, processamento e consulta, dificultando escala e manutencao.

## Proposta de valor

O StreamGate entrega uma arquitetura orientada a eventos com separacao clara entre frontend, API, storage, mensageria, processamento e leitura analitica.

Diferenciais-chave:

- upload direto para object storage via URL assinada
- processamento assincrono desacoplado por eventos
- suporte a retries, idempotencia e quarentena
- separacao entre dados brutos, operacionais e analiticos
- caminho claro de evolucao de ambiente local para cluster

## Perfis de usuario

### Operacao

Precisa acompanhar jobs, identificar falhas, revisar quarentena e confirmar se o processamento terminou dentro do prazo esperado.

### Analise

Precisa consumir dashboards e consultas agregadas sem impactar o banco operacional.

### Engenharia e suporte

Precisa investigar eventos, reprocessar cargas, auditar trilhas e manter o pipeline confiavel.

## Escopo funcional da v1

### Fluxos principais

- solicitar upload pela SPA
- obter URL assinada via API
- enviar arquivo diretamente ao MinIO
- confirmar upload e registrar job
- publicar evento de processamento no RabbitMQ
- consumir o evento no worker
- validar, higienizar e processar arquivo em lotes
- enviar invalidos para quarentena com motivo explicito
- persistir dados operacionais no PostgreSQL
- persistir dados analiticos no ClickHouse
- expor status e indicadores para o frontend

### Estados de job

- `pending`
- `processing`
- `completed`
- `failed`
- `quarantined_with_warnings`

### Eventos de dominio iniciais

- `upload.received`
- `etl.validation.failed`
- `etl.batch.loaded`
- `etl.job.completed`

## Arquitetura funcional

| Camada | Tecnologia | Responsabilidade |
| --- | --- | --- |
| Frontend | React + Vite + TypeScript | Upload, acompanhamento de jobs e dashboards |
| API | Ruby on Rails API-only | Autenticacao, orquestracao de uploads, jobs e leitura para a SPA |
| Object storage | MinIO | Armazenamento bruto e upload multipart |
| Mensageria | RabbitMQ | Eventos de ingestao e processamento |
| Worker | Ruby | ETL, validacao, retries, idempotencia e carga |
| OLTP | PostgreSQL | Metadados, auditoria, status e quarentena |
| OLAP | ClickHouse | Consultas analiticas e agregacoes |
| Suporte | Redis | Cache, estado volatil e evolucao para atualizacao quase em tempo real |

## Ciclo de vida dos dados

### Extract

O frontend solicita URL assinada, envia o arquivo ao MinIO e confirma o envio pela API.

### Transform

O worker consome o evento, processa o arquivo em lotes, valida conteudo, aplica regras de idempotencia e separa erros rastreaveis em quarentena.

### Load

O PostgreSQL recebe o estado operacional e o ClickHouse recebe os dados preparados para exploracao analitica.

### Analytics

O frontend consulta a API para ler status operacionais a partir do PostgreSQL e metricas agregadas a partir do ClickHouse.

Na v1, a atualizacao deve ser quase em tempo real via polling curto, com possibilidade de evolucao para SSE ou WebSocket.

## Requisitos nao funcionais

- suportar uploads grandes sem passar payload pela API
- garantir rastreabilidade por arquivo, job e lote
- tolerar reinicio de worker sem perda de mensagens em fila duravel
- evitar duplicacao de carga em reprocessamentos
- permitir diagnostico rapido por logs, health checks e trilha de auditoria
- manter fronteiras claras entre leitura operacional e leitura analitica

## Casos de validacao prioritarios

- upload com falha parcial de rede e retomada sem corromper o job
- reprocessamento do mesmo arquivo sem duplicar registros validos
- linhas invalidas indo para quarentena com motivo rastreavel
- reinicio de worker sem perda de mensagens
- dashboard refletindo dados dentro da janela esperada

## Direcionamentos para desenvolvimento

Para manter o projeto alinhado com essa visao, o desenvolvimento deve priorizar:

1. contratos de eventos em `packages/contracts`
2. modelo de job e trilha de auditoria na API
3. fluxo de upload assinado ponta a ponta
4. runtime real do worker com processamento em lotes
5. persistencia inicial no PostgreSQL e carga analitica minima no ClickHouse
6. painel operacional antes de dashboards avancados

## Fora do escopo imediato

- tempo real completo por WebSocket
- automacao completa de deploy em cluster
- observabilidade avancada com tracing distribuido
- multi-tenant e politicas complexas de segregacao
- orquestracao de multiplos tipos de pipeline alem da ingestao principal

## Resultado esperado

O StreamGate deve se tornar a base confiavel para ingestao, processamento auditavel e exploracao analitica de grandes volumes de dados, com uma estrutura que permita crescer sem reescrever os fundamentos da plataforma.
