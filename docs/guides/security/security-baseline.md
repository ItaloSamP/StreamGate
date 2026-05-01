# Baseline de Seguranca

## Objetivo
Este guia consolida diretrizes de security baseline para uso consistente no projeto.

## Estado atual
Conteudo alinhado ao estado operacional atual. O baseline historico do baseline inicial continua valido como metodo, mas o estado operacional atual ja inclui auth real na API, upload assinado, worker RabbitMQ real, operacao segura mutavel, artefatos finais, notificacoes `in_app/email/webhook`, reports/smokes oficiais e repo readiness operacional.


## Estado atual detalhado
Conteudo alinhado ao estado operacional atual; atualizar em cada mudanca relevante de auth, upload, worker, broker, artefatos, notificacoes, auditoria, quarentena, CI, smokes ou reports.

## Regras/Contratos
- As regras normativas deste tema estao descritas nas secoes tecnicas abaixo.
- Mudancas devem manter alinhamento com roadmap, ADRs e READMEs.

## Validacao/Evidencias
- Validar coerencia com README raiz, docs/README e roadmap da release atual.
- Registrar atualizacoes desta pagina no closeout do ciclo de entrega correspondente.


## Objetivo detalhado

Este guia fixa a base minima de seguranca do StreamGate na baseline inicial. Ele existe para impedir que o projeto siga evoluindo com suposicoes soltas sobre auth, segredos, superficies de ataque e validacao de seguranca.

A baseline inicial nao fecha seguranca de produto. Ela fecha o metodo minimo para que as proximos ciclos de entrega nao espalhem risco por falta de padrao.

## Leitura do estado atual

Hoje o repositorio saiu do baseline puramente estrutural e ja possui um runtime operacional real expandido:

- a API expoe auth, upload assinado, jobs, analytics, quarantine, DLQ, audit, mutacoes operacionais, artefatos e notificacoes no namespace `/api/v1`
- o frontend autenticado consome dados reais da API; o armazenamento local guarda apenas sessao/token de desenvolvimento e o command center ja inclui inbox de notificacoes, artefatos e operacoes admin-only
- o worker possui runtime real de fila RabbitMQ para `upload.received.v1`, com CSV/ZIP, retry, DLQ, artefatos finais e emissao de notificacoes operacionais
- o `compose.yaml` sobe PostgreSQL, Redis, RabbitMQ, MinIO, ClickHouse, API, frontend e worker real no profile `full`
- o fluxo real de upload, leitura operacional, artefatos, notificacoes e auditoria existe para o corte operacao segura, ainda sem conectores externos funcionais

Isso significa que a maior parte do risco atual esta em:

- defaults locais reaproveitados fora do ambiente local
- segredos e portas administrativas expostos por configuracao operacional ruim
- payloads operacionais de quarantine/DLQ/audit/notificacoes expondo dado sensivel sem masking ou escopo correto
- eventos de broker invalidos, replayados ou venenosos afetando integridade de jobs e artefatos
- mutacoes sensiveis sendo executadas sem trilha forte de motivo, auditoria e idempotencia
- futuras superficies de conectores externos entrando sem trilha de revisao proporcional

## Superficies de ataque oficiais do baseline inicial

| Superficie | Estado atual | Principal risco nesta fase | Evidencia base |
| --- | --- | --- | --- |
| Auth | API Rails com sessao bearer e frontend guardado por token local | token local indevido em ambiente compartilhado ou sessao expirada tratada incorretamente | `apps/api/app/controllers/api/v1/auth`, `apps/web/src/lib/auth.ts` |
| Upload | fluxo assinado real com registro idempotente e limites de tipo/tamanho | abuso de signed URL, storage_key ou metadata se validacao regredir | `apps/api/app/controllers/api/v1/uploads_controller.rb`, `apps/api/openapi/v1/openapi.yaml` |
| Storage | MinIO local com bucket privado e Active Storage local na API | reuso de credenciais simples e exposicao indevida de console/storage | `compose.yaml`, `apps/api/config/storage.yml` |
| Broker | RabbitMQ com evento `upload.received.v1`, fila oficial e DLQ | payload invalido, replay, poison message ou abuso de retry | `apps/worker/lib/worker/runtime/consumer.rb`, `packages/contracts/README.md` |
| Dashboard | workspace autenticado com dados reais, inbox e painel admin-only | exposicao indevida de auditoria/DLQ/operations ou regressao de masking visual | `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/components/app/workspace-config.ts` |
| Analytics/Audit/Quarantine | endpoints reais com filtros, paginacao, mutacoes controladas e masking server-side | vazamento por contrato, serializer, state machine ou fixture sensivel | `apps/api/app/controllers/api/v1`, `apps/api/app/services/operational_payload_sanitizer.rb` |
| Artefatos | listagem e download seguro de saida final | signed URL longa demais, auditoria ausente ou metadata sensivel exposta | `apps/api/app/controllers/api/v1/job_artifacts_controller.rb`, `apps/api/app/services/artifacts/download_url_service.rb` |
| Notificacoes | inbox persistida e outbox de deliveries | abuso de webhook/email, payload sensivel sem masking ou ownership quebrado | `apps/api/app/controllers/api/v1/notifications_controller.rb`, `apps/api/app/services/notifications` |

## Threat model inicial

O threat model inicial do repositorio foi consolidado em [streamgate-threat-model.md](C:/estudos/StreamGate/docs/guides/security/streamgate-threat-model.md).

Ele deve ser tratado como referencia obrigatoria antes de abrir ciclos de entrega que materializem:

- auth real
- upload assinado
- runtime real do worker
- dashboards com dados reais
- reprocessamento, auditoria ou analytics de producao

Na operacao segura, auth real, upload assinado, runtime do worker, dashboards operacionais, analytics, quarantine, DLQ, audit, artefatos finais, notificacoes persistidas e operacoes seguras foram materializados para o ambiente local/CI. Por isso, novas mudancas nessas superficies devem tratar este baseline como controle vivo, nao como apenas planejamento.

## Controles entregues na operacao segura

- `Idempotency-Key` obrigatoria em `retry`, `resolve`, `replay request/approve/execute` e `webhook test`, com persistencia de reuso equivalente.
- Replay de DLQ em tres etapas (`request -> approve -> execute`) com bloqueio de self-approval.
- Auditoria obrigatoria para mutacoes sensiveis, `download-url` de artefatos e envio de notificacoes.
- `Notification`, `NotificationSetting` e `WebhookDelivery` persistidos; `email/webhook` saem por outbox interno com retry/backoff.
- Signed URL curta para download de artefatos, sempre acompanhada de `expires_at`.
- Retencao configuravel para artefatos, notificacoes, deliveries, replay requests e idempotency keys.
- Masking de payload em auditoria, notificacoes e deliveries, alem de role gating admin-only nas superficies sensiveis.

## Scanners oficiais por camada

A baseline inicial define os scanners oficiais do projeto por camada, mesmo quando parte deles ainda entra como baseline de adocao e nao como gate totalmente automatizado.

### Frontend

- `pnpm audit --prod` para dependencia publicada no bundle
- revisao manual com `security-best-practices` para auth client-side, storage, navegacao, renderizacao e consumo de API

### API Rails

- `bundle exec brakeman -q` como scanner SAST principal
- `bundle exec bundle-audit check --update` como scanner de dependencias Ruby quando a gem estiver disponivel no fluxo local/CI
- revisao manual com `security-threat-model` e `review-codebase` quando houver novas superficies HTTP, auth ou upload

### Worker Ruby

- `bundle exec bundle-audit check --update` para dependencias Ruby do worker quando a gem estiver disponivel
- revisao manual obrigatoria de contratos, retries, storage, broker, DLQ e idempotencia enquanto o runtime ainda e pequeno

### Docker e Compose

- `docker compose config` continua obrigatorio para validar definicao e interpolacao
- `trivy config compose.yaml` passa a ser o scanner oficial de configuracao assim que a trilha de CI local incorporar a ferramenta
- `trivy image` ou equivalente passa a ser o scanner oficial de imagens quando os containers deixarem de ser apenas baseline local

### Politica pratica

- se o scanner oficial ja existir no ambiente da task, ele deve ser executado
- se ainda nao existir no ambiente, a task deve registrar isso explicitamente e manter a revisao manual proporcional ao risco
- ausencia de scanner automatizado nao remove a obrigacao de revisao de seguranca

## Politica minima de segredos, `.env` e arquivos sensiveis

### Regras obrigatorias

- `.env` real nunca deve ser commitado
- `.env.example` pode conter apenas valores de desenvolvimento claramente nao produtivos
- nenhum segredo real deve aparecer em README, docs, imagens, scripts, fixtures ou exemplos de PR
- tokens, senhas, chaves e segredos devem ser filtrados em logs sempre que o framework permitir
- segredo de producao nao deve ser reaproveitado no ambiente local
- qualquer variavel enviada ao frontend deve ser tratada como publica por definicao

### Arquivos sensiveis do projeto

Tratar como sensiveis por padrao:

- `.env`
- `.kamal/secrets` e equivalentes futuros
- credenciais Rails
- artefatos de banco com dados reais
- dumps, exemplos de payload e fixtures que carreguem dados reais de cliente

### Leitura especifica do baseline inicial

- o arquivo [.env.example](C:/estudos/StreamGate/.env.example) hoje usa credenciais simples de desenvolvimento e isso e aceitavel apenas como baseline local
- essas credenciais nunca devem ser promovidas para preview, CI compartilhado ou producao
- o frontend atual usa `localStorage` e `sessionStorage` apenas para auth mock; nenhum token real deve usar esse caminho sem desenho explicito de seguranca

## Revisao de seguranca proporcional ao escopo

A partir do baseline inicial, revisao de seguranca deixa de ser opcional e passa a ser obrigatoria em proporcao ao tipo de entrega.

### Mudanca documental ou estrutural leve

- revisar se a documentacao alterou superficies, segredos, envs ou contratos
- atualizar guias de seguranca quando a narrativa operacional mudar

### Mudanca de frontend

- revisar auth client-side, rotas protegidas, navegacao, renderizacao de dados e uso de storage no browser
- usar `security-best-practices` junto das skills da trilha

### Mudanca de API

- revisar authn, authz, validacao, erros, logs, OpenAPI, segredos e scanners oficiais
- usar `security-threat-model` quando a mudanca abrir nova superficie HTTP ou de integracao

### Mudanca de worker, broker ou storage

- revisar contratos, idempotencia, retries, segregacao de dados, naming e origem dos eventos
- tratar filas, buckets e pipelines como fronteiras de confianca reais

### Mudanca de compose, CI ou infra

- revisar envs, portas expostas, credenciais, imagens, volumes e administracao remota
- garantir que defaults locais nao virem baseline de ambiente compartilhado

## Controles ja visiveis no repo

- bucket raw do MinIO inicializado como privado em `minio-init`
- filtros de parametros sensiveis configurados no Rails em [filter_parameter_logging.rb](C:/estudos/StreamGate/apps/api/config/initializers/filter_parameter_logging.rb)
- docs ja orientam que `.env` real nao deve subir para o Git
- bucket, fila, eventos e rastreabilidade ja possuem linguagem inicial consolidada em `packages/contracts` e nas fundacoes do backend
- payloads de quarantine, audit metadata e DLQ passam por sanitizacao backend antes de serem expostos por endpoints operacionais
- audit e DLQ sao admin-only; quarantine e analytics respeitam escopo por organizacao para operadores

## Gaps conscientes que seguem para as proximos ciclos de entrega

- auth real ainda precisa de hardening para ambiente compartilhado/producao, incluindo politica de cookies/CSRF/TLS conforme deploy
- conectores externos continuam discovery-only e precisam de threat model proprio antes de entrar na v1 funcional
- replay prevention hoje depende de idempotencia por `event_id`, aprovacao humana e auditoria; assinatura/autenticacao forte entre servicos ainda deve evoluir
- classificacao formal de dados sensiveis do dominio precisa ser aprofundada antes de dados reais de cliente
- politicas externas de allowlist/rate limit/observabilidade para deliveries `email/webhook` ainda precisam evoluir
- scanners de dependencia e imagem ainda nao foram incorporados como gate automatizado em toda a stack

## Referencias

- [Threat model inicial do repositorio](C:/estudos/StreamGate/docs/guides/security/streamgate-threat-model.md)
- [Definition of Done](C:/estudos/StreamGate/docs/guides/quality/definition-of-done.md)
- [Baseline DevOps](C:/estudos/StreamGate/docs/guides/platform/devops-baseline.md)
- [Baseline de Testes](C:/estudos/StreamGate/docs/guides/quality/testing-baseline.md)
- [Catalogo de skills do projeto](C:/estudos/StreamGate/.agents/skills/README.md)
