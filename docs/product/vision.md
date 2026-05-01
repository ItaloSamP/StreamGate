# Visao do Produto: StreamGate

## Objetivo deste documento

Este arquivo e a fonte unica da ideia e da visao de produto do StreamGate.

Regra de governanca:

- direcao de produto deve ser atualizada primeiro aqui;
- roadmap, checklist e demais docs devem referenciar este arquivo para evitar conflito de visao.

## Resumo executivo

O StreamGate existe para receber dados em alto volume, processa-los de forma assincrona e transformar esse processamento em duas visoes complementares:

- operacional, com foco em status, auditoria, diagnostico e resolucao de falhas;
- analitica, com foco em consulta de alto volume e indicadores.

A evolucao do produto segue uma estrategia equilibrada entre operacao e conectividade (`dual-track`):

- manter confiabilidade operacional e rastreabilidade ponta a ponta;
- ampliar flexibilidade de entrada e saida de dados sem perder governanca.

Leitura de status em `2026-05-01`:

- operacao segura (`retry`, `resolve`, `dlq replay request/approve/execute`) ja esta materializada;
- artefatos finais (`processed_dataset`, `quality_report`, `audit_report`) ja estao materializados;
- notificacoes `in_app`, `email` e `webhook` ja estao materializadas;
- dashboard v3 evoluiu para command center data-driven, com REST expandido, realtime/polling, exports e alert actions persistentes;
- conectores de entrada `s3` e `http_url` estao materializados no corte API+worker, via perfis admin-only e lease interno, sem UI admin nova;
- `google_drive` e `oauth_delegated` continuam discovery-only.

## Problema

Organizacoes que ingerem grandes volumes de dados enfrentam friccao em tres frentes ao mesmo tempo:

- entrada: nem todo fluxo nasce de upload local; parte dos dados ja esta em outras plataformas;
- operacao: falhas costumam ser dificeis de diagnosticar e caras de corrigir;
- experiencia: fluxos muito tecnicos afastam usuarios novos e fluxos muito simplificados travam usuarios avancados.

Sem separacao clara entre ingestao, processamento, diagnostico e entrega de resultados, o sistema acumula acoplamento, retrabalho e baixa previsibilidade operacional.

## Proposta de valor

O StreamGate entrega uma arquitetura orientada a eventos com separacao clara entre frontend, API, storage, mensageria, processamento e leitura analitica.

Diferenciais-chave:

- ingestao multicanal (arquivo local, link externo e conectores);
- processamento assincrono desacoplado por eventos;
- suporte a retries, idempotencia e quarentena;
- diagnostico guiado para reduzir tempo de investigacao;
- produtividade com templates e presets;
- entrega de artefatos finais (dados processados + relatorio operacional/auditoria);
- separacao entre dados brutos, operacionais e analiticos;
- caminho claro de evolucao de ambiente local para cluster.

## Perfis de usuario

### Operacao interna

Precisa acompanhar jobs, identificar falhas, revisar quarentena, aplicar retry e confirmar SLA operacional.

### Cliente externo (self-service)

Precisa enviar dados por fluxos simples, acompanhar progresso, entender erros sem linguagem tecnica excessiva e baixar resultados com confianca.

### Analise

Precisa consumir dashboards e consultas agregadas sem impactar o banco operacional.

### Engenharia e suporte

Precisa investigar eventos, reprocessar cargas, auditar trilhas e manter o pipeline confiavel.

## Escopo funcional da v1

### Ingestao multicanal

- upload local via SPA;
- ingestao por link externo possui corte inicial como `public_link`; `oauth_delegated` continua evolucao futura;
- conectores S3/HTTP possuem corte funcional API+worker para perfis admin-only, aquisicao por lease interno e processamento no pipeline padrao;
- `google_drive` continua planejado/discovery-only;
- entrada inicial suporta CSV, JSON, NDJSON, ZIP com exatamente um arquivo suportado, XLSX e Parquet quando o runtime nativo estiver disponivel.

### Fluxo principal

- solicitar ingestao pela SPA;
- obter credencial/URL assinada ou autorizacao de aquisicao remota via API;
- trazer arquivo para o ambiente bruto (MinIO) com rastreabilidade;
- confirmar ingestao e registrar job;
- publicar evento de processamento no RabbitMQ;
- consumir evento no worker;
- validar, higienizar e processar em lotes;
- enviar invalidos para quarentena com motivo explicito;
- persistir dados operacionais no PostgreSQL;
- persistir dados analiticos no ClickHouse;
- quando ClickHouse estiver indisponivel, expor fallback honesto `postgres_derived` com SLO e aviso tecnico;
- expor status e indicadores para o frontend;
- disponibilizar download de `processed_dataset` e `quality_report`/`audit_report` no final do processo.

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

## Principios de UX do produto

### Fluxo de ingestao hibrido

- modo `guided` (wizard) para orientar quem precisa de seguranca operacional;
- modo `advanced` para usuarios experientes com menor friccao.

### Observabilidade + produtividade

- observabilidade operacional: timeline de job, status por etapa e diagnostico orientado;
- produtividade: templates/presets, filtros salvos, acoes em lote e reuso de configuracoes.

### Comunicacao de estado

- notificacoes em `in_app`, `email` e `webhook` para eventos relevantes;
- estados de loading, erro e sucesso claros, acionaveis e consistentes.

## Governanca e confianca

- RBAC inicial por papel e modulo;
- trilha de auditoria navegavel por job, usuario e acao;
- politica de retencao configuravel por workspace;
- rastreabilidade por `request_id`, `trace_id`, `upload_id`, `job_id` e `batch_id`.

## Arquitetura funcional

| Camada | Tecnologia | Responsabilidade |
| --- | --- | --- |
| Frontend | React + Vite + TypeScript | Ingestao hibrida, acompanhamento de jobs, dashboards e downloads finais |
| API | Ruby on Rails API-only | Autenticacao, autorizacao, orquestracao de ingestao, jobs, auditoria e entrega de artefatos |
| Object storage | MinIO | Armazenamento bruto, upload direto e artefatos de saida |
| Mensageria | RabbitMQ | Eventos de ingestao e processamento |
| Worker | Ruby | ETL, validacao, retries, idempotencia e carga |
| OLTP | PostgreSQL | Metadados, auditoria, status e quarentena |
| OLAP | ClickHouse | Consultas analiticas e agregacoes |
| Suporte | Redis | Cache, estado volatil e evolucao para atualizacao quase em tempo real |

## Ciclo de vida dos dados

### Extract

A origem pode ser `local_file`, `external_link` ou `connector`. A API valida contexto, registra rastreabilidade e garante aquisicao segura para o ambiente bruto.

### Transform

O worker consome o evento, processa em lotes, valida conteudo, aplica idempotencia e separa erros rastreaveis em quarentena.

### Load

O PostgreSQL recebe estado operacional e o ClickHouse recebe dados preparados para exploracao analitica. Na v1, ClickHouse armazena uma camada por job e uma camada por registro com metadados, status, colunas presentes, contagens e HMAC-SHA256; payload bruto de registros nao e replicado no warehouse.

### Delivery

Ao final, o produto entrega artefatos de resultado para consumo humano e tecnico (dados processados e relatorios operacionais/auditoria).

### Analytics

O frontend consulta a API para ler status operacionais e metricas agregadas. O command center operacional adiciona realtime por ticket curto + Action Cable, mantendo polling como fallback. Quando ClickHouse estiver indisponivel, a API retorna fallback honesto `postgres_derived`, SLO e aviso tecnico sem interromper a entrega operacional.

## Interfaces e conceitos de produto

- `source_type`: `upload`, `external_link`, `connector`
- `link_mode`: `public_link`, `oauth_delegated`
- `connector_type` wave 1: `s3`, `http_url` funcionais no corte API+worker; `google_drive` planejado
- `output_artifact_type`: `processed_dataset`, `quality_report`, `audit_report`
- `ui_mode`: `guided`, `advanced`
- `notification_channel`: `in_app`, `email`, `webhook`
- `retention_policy_scope`: `workspace`

## Requisitos nao funcionais

- suportar ingestao de arquivos grandes sem transferir payload pesado pela API;
- suportar aquisicao remota confiavel para links e conectores;
- garantir rastreabilidade por arquivo, job e lote;
- tolerar reinicio de worker sem perda de mensagens em fila duravel;
- evitar duplicacao de carga em reprocessamentos;
- manter seguranca de links externos, credenciais e artefatos de saida;
- permitir diagnostico rapido por logs, health checks e trilha de auditoria;
- manter fronteiras claras entre leitura operacional e leitura analitica;
- manter previsibilidade de entrega para usuario final (status e resultado claros).

## Casos de validacao prioritarios

- upload local com falha parcial de rede e retomada sem corromper o job;
- ingestao por link externo com validacao de acesso e rastreabilidade da aquisicao;
- ingestao de arquivo zipado com processamento consistente do conteudo;
- reprocessamento do mesmo arquivo sem duplicar registros validos;
- linhas invalidas indo para quarentena com motivo rastreavel;
- reinicio de worker sem perda de mensagens;
- dashboard refletindo dados dentro da janela esperada;
- download final de dataset e relatorio com coerencia de status e auditoria.

## Direcionamentos para desenvolvimento

Para manter o projeto alinhado com esta visao, o desenvolvimento deve priorizar:

1. contratos de eventos e interfaces em `packages/contracts`;
2. modelo de job, trilha de auditoria e governanca na API;
3. ingestao multicanal com rastreabilidade ponta a ponta;
4. runtime real do worker com processamento em lotes;
5. persistencia operacional no PostgreSQL e carga analitica no ClickHouse;
6. painel operacional robusto com UX observavel e produtiva;
7. entrega final de artefatos para consumo do usuario.

## Fora do escopo imediato

- tempo real completo por WebSocket;
- automacao completa de deploy em cluster;
- observabilidade avancada com tracing distribuido em todos os servicos;
- marketplace amplo de conectores alem da wave inicial;
- multi-tenant com politicas avancadas de segregacao;
- orquestracao de multiplos tipos de pipeline alem da ingestao principal.

## Decisoes aprovadas (datadas)

Data-base: `2026-04-07`

| Tema | Decisao | Status |
| --- | --- | --- |
| Estrategia de evolucao | Operacao e conectividade evoluem em paralelo (`dual-track`) | `aprovado` |
| Cadencia de entrega | Sem dependencia de ciclo de entrega curta para evolucao de produto | `aprovado` |
| Ingestao por link | Suporte a links publicos + evolucao para OAuth | `aprovado` |
| Conectores wave 1 | `S3` e `URL HTTP` funcionais em API+worker; `Google Drive` segue discovery-only | `parcialmente materializado` |
| Entrada de arquivos | CSV, JSON, NDJSON, ZIP seguro, XLSX e Parquet quando runtime nativo estiver disponivel | `aprovado` |
| Saida final | Dataset processado + relatorio operacional/auditoria | `aprovado` |
| UX de ingestao | Fluxo hibrido (`guided` + `advanced`) | `aprovado` |
| UX operacional | Priorizar observabilidade + produtividade | `aprovado` |
| Notificacoes | `in_app`, `email`, `webhook` | `materializado` |
| Governanca | RBAC inicial + trilha de auditoria navegavel + matriz configuravel por role/org | `aprovado` |
| Retencao | Politica configuravel por workspace operacional (`organization_id`) | `aprovado` |
| Diferencial inicial | Diagnostico guiado para reduzir tempo de resolucao | `futuro` |

## Resultado esperado

O StreamGate deve se tornar uma base confiavel para ingestao, processamento auditavel e exploracao analitica de grandes volumes de dados, com experiencia operacional forte e conectividade flexivel, sem perder previsibilidade, governanca e identidade de produto.
