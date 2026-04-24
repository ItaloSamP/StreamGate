# Sprint 6 backend/worker partial closeout

Este closeout marca somente o recorte backend/worker/documentacao implementado nesta etapa. A Sprint 6 completa continua aberta para a trilha frontend, UX final, smokes ponta a ponta e fechamento geral da v1.

## Entregue

- Endpoints `GET /api/v1/analytics/dashboard`, `GET /api/v1/analytics/warehouse` e `GET /api/v1/analytics/lineage?job_id=...`.
- `POST /api/v1/uploads/public-link` com `Idempotency-Key`, URL mascarada, `url_hash`, upload/job `external_link` e acquisition `public_link`.
- `uploads.source_type`, `upload_acquisitions` e `operational_warnings`.
- Worker com `PublicLinkFetcher`, validacao SSRF, stream para MinIO, SHA-256 e evento derivado `upload.received.v1`.
- Parser do worker expandido para JSON array, JSON `{ "records": [...] }` e ZIP com protecao contra zip slip e zip bomb.
- Contratos, exemplos, OpenAPI, guia da API, vision, final delivery guide, threat model e roadmap sincronizados.

## Validado neste recorte

- `bundle exec rspec spec/processing/sprint6_parser_spec.rb spec/runtime/public_link_fetcher_spec.rb spec/runtime/consumer_spec.rb`
- `ruby scripts/ci/validate-operational-contracts.rb`
- `bundle exec rails routes -g analytics`
- `bundle exec rails routes -g public-link`

## Pendencias fora deste closeout parcial

- Testes Rails completos dependem de PostgreSQL local/Compose ativo.
- Smoke focal `public_link` ponta a ponta ainda precisa rodar com stack completa.
- Trilha frontend da Sprint 6 ainda deve consumir os contratos novos e remover fixtures enganosas da dashboard.
