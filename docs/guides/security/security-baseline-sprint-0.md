# Baseline de Seguranca da Sprint 0

## Objetivo
Este guia consolida diretrizes de security baseline sprint 0 para uso consistente no projeto.

## Estado atual
Conteudo alinhado ao fechamento da Sprint 3 e ao planejamento da Sprint 4; atualizar em cada mudanca relevante.


## Estado atual detalhado
Conteudo alinhado ao fechamento da Sprint 3 e ao planejamento da Sprint 4; atualizar em cada mudanca relevante.

## Regras/Contratos
- As regras normativas deste tema estao descritas nas secoes tecnicas abaixo.
- Mudancas devem manter alinhamento com roadmap, ADRs e READMEs.

## Validacao/Evidencias
- Validar coerencia com README raiz, docs/README e roadmap da release atual.
- Registrar atualizacoes desta pagina no closeout da sprint correspondente.


## Objetivo detalhado

Este guia fixa a base minima de seguranca do StreamGate na Sprint 0. Ele existe para impedir que o projeto siga evoluindo com suposicoes soltas sobre auth, segredos, superficies de ataque e validacao de seguranca.

A Sprint 0 nao fecha seguranca de produto. Ela fecha o metodo minimo para que as proximas sprints nao espalhem risco por falta de padrao.

## Leitura do estado atual

Hoje o repositorio ainda esta em fase de fundacao:

- a API expoe apenas `GET /up` e uma base inicial de OpenAPI
- o frontend possui auth mock armazenado no browser para viabilizar a UX inicial
- o worker ainda nao possui runtime real de fila nem processamento de arquivo
- o `compose.yaml` ja sobe PostgreSQL, Redis, RabbitMQ, MinIO, ClickHouse, API, frontend e worker de smoke
- o fluxo real de upload, auth real, autorizacao e analytics real ainda nao existem

Isso significa que a maior parte do risco atual esta em:

- defaults inseguros reaproveitados fora do ambiente local
- confusao entre mock de frontend e autenticacao real
- segredos e portas administrativas expostos por configuracao operacional ruim
- futuras superficies ainda nao implementadas entrando sem trilha de revisao proporcional

## Superficies de ataque oficiais da Sprint 0

| Superficie | Estado atual | Principal risco nesta fase | Evidencia base |
| --- | --- | --- | --- |
| Auth | mock no frontend via `localStorage` e `sessionStorage` | sessao forjada no cliente se o mock for tratado como auth real | `apps/web/src/lib/auth.ts`, `apps/web/src/features/auth/protected-route.tsx` |
| Upload | previsto na visao do produto e no dashboard, mas sem endpoint real | entrar na Sprint 3 sem limites, validacao e contrato claros | `docs/product/vision.md`, `apps/web/src/components/app/dashboard-surface.tsx` |
| Storage | MinIO local com bucket privado e Active Storage local na API | reuso de credenciais simples e exposicao indevida de console/storage | `compose.yaml`, `apps/api/config/storage.yml` |
| Broker | RabbitMQ ja sobe no compose, mas sem produtor/consumidor reais | mensagens futuras sem contrato, authz ou naming rastreavel | `compose.yaml`, `packages/contracts/README.md` |
| Dashboard | shell autenticado e dados mockados | confundir UX protegida com autorizacao real de dados | `apps/web/src/pages/DashboardPage.tsx`, `docs/guides/frontend/frontend-foundations.md` |
| Analytics | ClickHouse previsto em compose e visao de produto | leitura analitica sem classificacao de dado e sem fronteira de acesso definida | `compose.yaml`, `docs/product/vision.md` |

## Threat model inicial

O threat model inicial do repositorio foi consolidado em [streamgate-threat-model.md](C:/estudos/StreamGate/docs/guides/security/streamgate-threat-model.md).

Ele deve ser tratado como referencia obrigatoria antes de abrir sprints que materializem:

- auth real
- upload assinado
- runtime real do worker
- dashboards com dados reais
- reprocessamento, auditoria ou analytics de producao

## Scanners oficiais por camada

A Sprint 0 define os scanners oficiais do projeto por camada, mesmo quando parte deles ainda entra como baseline de adocao e nao como gate totalmente automatizado.

### Frontend

- `pnpm audit --prod` para dependencia publicada no bundle
- revisao manual com `security-best-practices` para auth client-side, storage, navegacao, renderizacao e consumo de API

### API Rails

- `bundle exec brakeman -q` como scanner SAST principal
- `bundle exec bundle-audit check --update` como scanner de dependencias Ruby quando a gem estiver disponivel no fluxo local/CI
- revisao manual com `security-threat-model` e `review-codebase` quando houver novas superficies HTTP, auth ou upload

### Worker Ruby

- `bundle exec bundle-audit check --update` para dependencias Ruby do worker quando a gem estiver disponivel
- revisao manual obrigatoria de contratos, retries, storage e broker enquanto o runtime ainda e pequeno

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

### Leitura especifica da Sprint 0

- o arquivo [.env.example](C:/estudos/StreamGate/.env.example) hoje usa credenciais simples de desenvolvimento e isso e aceitavel apenas como baseline local
- essas credenciais nunca devem ser promovidas para preview, CI compartilhado ou producao
- o frontend atual usa `localStorage` e `sessionStorage` apenas para auth mock; nenhum token real deve usar esse caminho sem desenho explicito de seguranca

## Revisao de seguranca proporcional ao escopo

A partir da Sprint 0, revisao de seguranca deixa de ser opcional e passa a ser obrigatoria em proporcao ao tipo de entrega.

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

## Gaps conscientes que seguem para as proximas sprints

- auth real ainda nao existe
- nao ha autorizacao de dados reais no dashboard
- upload assinado ainda nao foi implementado
- broker e worker ainda nao validam eventos reais
- nao existe classificacao formal de dados sensiveis do dominio
- scanners de dependencia e imagem ainda nao foram incorporados como gate automatizado em toda a stack

## Referencias

- [Threat model inicial do repositorio](C:/estudos/StreamGate/docs/guides/security/streamgate-threat-model.md)
- [Definition of Done](C:/estudos/StreamGate/docs/guides/quality/definition-of-done.md)
- [Baseline DevOps da Sprint 0](C:/estudos/StreamGate/docs/guides/platform/devops-baseline-sprint-0.md)
- [Baseline de Testes da Sprint 0](C:/estudos/StreamGate/docs/guides/quality/testing-baseline-sprint-0.md)
- [Catalogo de skills do projeto](C:/estudos/StreamGate/.agents/skills/README.md)
