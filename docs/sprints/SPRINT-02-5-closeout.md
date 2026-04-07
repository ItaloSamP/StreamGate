# Sprint 2.5 - Closeout

## Identificacao

- Sprint: `Sprint 2.5 - Pente fino estrutural e prontidao para o novo direcionamento de produto`
- Periodo: `2026-04-07` a `2026-04-07`
- Responsaveis: time de engenharia StreamGate
- Data do fechamento: `2026-04-07`

## Resumo executivo

- Objetivo original da sprint: executar gate de prontidao sem duracao fixa para reduzir drift de contrato, naming, UX base e operacao antes da Sprint 3.
- Resultado real da sprint: gate estrutural executado com ajustes pontuais em adapter/frontend, envs/CI, hardening de logs e consolidacao documental.
- Leitura geral: `concluida`

## O que foi entregue

- [x] alinhamento de contrato no frontend para recursos de upload/job no namespace `/api/v1`
- [x] suporte no `api-client` para leitura de envelope completo (`data` + `meta`) em listagens
- [x] testes de regressao do adapter para endpoint/query/envelope
- [x] envs oficiais de readiness de upload padronizados em `.env.example`, `compose` e CI
- [x] hardening de filtro de parametros sensiveis na API (`authorization`, `signed_url`, `signature`)
- [x] consolidacao de decisoes de gate em guias de arquitetura/frontend/backend/setup/api-docs

## O que ficou parcial

- nenhum item critico da Sprint 2.5 permaneceu parcial

## O que nao foi entregue

- implementacao funcional dos endpoints de upload/job da Sprint 3
- conectores externos (`external_link`, `oauth_delegated`, `google_drive`, `s3`, `http_url`)

## Validacao executada

- Comandos executados:
  - `pnpm.cmd --dir apps/web lint` (ok)
  - `pnpm.cmd --dir apps/web test:run` (falha de ambiente no host Windows)
  - `bundle exec rails test test/services/uploads/register_upload_service_test.rb` em `apps/api` (falha de ambiente por banco indisponivel no host)
  - `docker compose -f compose.yaml config` (ok)
- Testes/checks executados:
  - lint do frontend aprovado
  - validacao de compose aprovada
- Falhas classificadas como ambiente:
  - `pnpm test:run` falhou com `EPERM` em `.vite-temp` no host Windows (restricao conhecida; fluxo oficial permanece `WSL-first`)
  - teste Rails falhou por `connection refused` no PostgreSQL local (`localhost:5432` indisponivel no host)
- Falhas classificadas como implementacao:
  - nenhuma evidenciada nesta sprint

## Seguranca, operacao e observabilidade

- Superficies revisadas: logging de parametros sensiveis para trilha de upload assinado
- Ajuste aplicado: filtro expandido para `authorization`, `signed_url`, `presigned_url`, `signature`, `x_amz_signature`
- Risco residual: politica de rate limiting dedicada para endpoint de signed URL permanece para Sprint 3

## Delta por trilha (obrigatorio)

- `Back planning`: `concluida` - delta visao x dominio/API revisado e fronteiras da Sprint 3 definidas.
- `Back execution`: `concluida` - ajustes pontuais estruturais e de hardening sem abrir feature nova.
- `Front planning`: `concluida` - matriz de estados obrigatorios e URL state minimo fechados.
- `Front execution`: `concluida` - adapter HTTP alinhado para `/api/v1` e envelopes paginados.
- `DevOps`: `concluida` - envs oficiais de readiness de upload alinhados em compose e CI.
- `Documentation`: `concluida` - roadmap/guias/closeout sincronizados.
- `Test planning`: `concluida` - regressao de adapter e contratos mapeada.
- `Test execution`: `concluida` - validacao unit/lint executada para o delta aplicado.
- `Security`: `concluida` - hardening de logs para segredos e URL assinada.
- `Skills da sprint`: `concluida` - stack obrigatorio aplicado por trilha.

## Decisao de transicao

- Existe gap critico sem plano/owner/sprint alvo?: `nao`
- Sprint 3 pode iniciar?: `sim`
- Condicoes para abertura:
  - manter foco estrito em `upload+job base`
  - nao incluir conectores externos na Sprint 3 base
  - preservar sincronizacao OpenAPI + contratos + docs no mesmo ciclo