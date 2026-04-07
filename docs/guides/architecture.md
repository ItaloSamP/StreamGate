# Arquitetura Base

## Visao geral

O StreamGate foi desenhado para ingestao de arquivos grandes com processamento assincrono. A regra principal da arquitetura e separar responsabilidades para evitar acoplamento excessivo:

- a SPA nao processa dados; ela apenas orquestra a experiencia do usuario
- a API nao recebe arquivos pesados; ela emite URLs assinadas, registra metadados e controla jobs
- o worker faz o processamento pesado
- o RabbitMQ desacopla ingestao e execucao
- o PostgreSQL guarda o estado operacional
- o ClickHouse guarda a camada analitica
- o MinIO guarda os arquivos brutos

As convencoes detalhadas de backend, envelopes de erro, nomenclatura oficial e rastreabilidade foram consolidadas em [Fundacoes do backend](C:/estudos/StreamGate/docs/guides/backend-foundations.md).

## Fluxo principal

1. O usuario solicita upload na SPA.
2. A API gera URL assinada do MinIO.
3. O frontend envia o arquivo direto ao MinIO.
4. A API registra o upload e publica um evento no RabbitMQ.
5. O worker consome o evento, processa o arquivo em lotes e aplica validacoes.
6. Registros invalidos vao para quarentena no PostgreSQL.
7. Dados operacionais ficam no PostgreSQL.
8. Dados analiticos sao carregados no ClickHouse.
9. A SPA consome a API para status operacional e dashboards.

## Estrutura sugerida do monorepo

### `apps/web`

Responsavel por:

- upload de arquivos
- tela de acompanhamento de jobs
- dashboards
- autenticacao no cliente

### `apps/api`

Responsavel por:

- autenticacao e autorizacao
- emissao de URL assinada
- criacao e consulta de jobs
- trilha de auditoria
- leitura de dados operacionais e analiticos

### `apps/worker`

Responsavel por:

- consumo de eventos
- leitura do arquivo bruto
- validacao, sanitizacao e idempotencia
- envio de invalidos para quarentena
- carga em PostgreSQL e ClickHouse

### `packages/contracts`

Responsavel por centralizar:

- contratos de eventos
- schemas de payload
- nomenclatura de filas, exchanges e routing keys
- exemplos de mensagens

## Decisoes DevOps iniciais

- `Docker Compose` para ambiente local
- `GitHub Actions` para CI
- health checks em todos os servicos criticos
- variaveis em `.env`
- padronizacao de portas locais
- documentacao desde o dia zero

## Evolucao planejada

Quando a v1 estabilizar, a migracao natural e:

- trocar compose local por manifests Helm ou Kustomize
- escalar workers horizontalmente
- adicionar tracing distribuido
- migrar polling curto para SSE ou WebSocket
- separar pipelines de deploy por ambiente

## Decisoes de prontidao (Sprint 2.5)

- Contrato e naming de rotas operacionais de upload/job ficam oficialmente em namespace /api/v1, evitando drift com auth e OpenAPI.
- Sprint 2.5 e gate estrutural: ajustes pontuais de base sao permitidos; abertura de pacote funcional novo continua proibida.
- Itens de ingestao por external_link, oauth_delegated e conectores (google_drive, s3, http_url) permanecem fora do escopo da Sprint 3 base.
