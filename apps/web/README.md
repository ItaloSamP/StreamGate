# StreamGate Web

Frontend React + Vite + TypeScript do StreamGate. O app entrega a superficie publica, autenticacao, workspace operacional e command center do produto.

## Experiencia Principal

- Landing publica do produto.
- Login, cadastro, reset, logout e bootstrap de sessao via API real.
- Workspace protegido com sidebar, topbar, notification bell, role gating e estados operacionais.
- Dashboard command center com snapshot REST expandido, WebSocket Action Cable, polling fallback, exports server-side e alert actions persistentes.
- Upload Center com arquivo local, `public_link` e ingestao admin-only por perfis S3/HTTP.
- Jobs, analytics, warehouse ClickHouse, lineage, quarantine, events, audit, operations, notifications e settings.

## Rotas

| Rota | Uso | Acesso |
| --- | --- | --- |
| `/dashboard` | command center operacional | admin/operator |
| `/upload` | arquivo local, link publico e ingestao por conector | admin/operator; conectores admin-only |
| `/jobs`, `/jobs/:id` | execucao e detalhe de job | admin/operator |
| `/analytics` | KPIs e breakdowns | admin/operator |
| `/clickhouse` | warehouse, fallback, source health e SLO | admin/operator |
| `/etl-explorer` | lineage por job | admin/operator |
| `/quarantine`, `/quarantine/:id` | registros rejeitados | admin/operator |
| `/events` | event log operacional | admin/operator |
| `/audit`, `/audit/:id` | auditoria | admin |
| `/operations` | retry, resolve e replay DLQ | admin |
| `/notifications` | inbox, arquivadas, regras e canais | admin/operator |
| `/settings` | defaults e perfis de conectores | admin/operator; configuracao sensivel admin-only |

## Camada De Dados

Chamadas HTTP devem passar por:

- `src/lib/api-client.ts`
- `src/lib/streamgate-api.ts`

Essa camada centraliza base URL, auth token, query params, envelopes, erro humano, request/trace IDs e contratos TypeScript.

Para realtime, `src/lib/dashboard-realtime.ts` cria ticket curto, assina o canal Action Cable e cai para polling quando necessario.

Para upload, `src/lib/upload-flow.ts` centraliza signed URL, registro e helpers compartilhados entre dashboard e Upload Center.

## Regras De UI

- Workspace operacional e denso, utilitario e orientado a investigacao.
- Loading, empty, error, denied, success, stale e degraded sao estados de produto, nao detalhes secundarios.
- Dados ausentes viram empty state honesto; fixtures invisiveis nao sao permitidas.
- Payloads, URLs, headers, object keys e credenciais devem ser mascarados antes de preview ou export.
- Operador nao ve controles sensiveis de auditoria, DLQ, conectores ou operacoes admin.
- Admin pode ver detalhes tecnicos mascarados e controles sensiveis auditaveis.

## Desenvolvimento Local

```bash
pnpm install
pnpm dev
```

Com a stack completa:

```powershell
powershell -ExecutionPolicy Bypass -File ..\..\scripts\dev\dev-up.ps1 -Mode app
```

## Qualidade

```bash
pnpm lint
pnpm test:run
pnpm test:integration
pnpm build
```

Gate coordenado na raiz:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 frontend
```

## Estrutura De Testes

- `tests/unit`: adapters, componentes, paginas e fluxo de UI com jsdom.
- `tests/integration`: integracao Vitest contra backend real/local.
- `e2e`: Playwright para fluxos de navegador.
- `reports`: saidas locais geradas pelos runners.

## Verificacao Visual

Ao alterar UI, verificar pelo menos:

- `/dashboard`
- `/upload`
- `/settings`
- `/clickhouse`
- `/etl-explorer`
- `/analytics`
- `/events`
- `/quarantine`

Checar desktop e mobile para overlap, corte de texto, controles inertes, regressao de role gating e ausencia de dados demo escondidos.

## Referencias

- [Frontend foundations](../../docs/guides/frontend/frontend-foundations.md)
- [Workspace map](../../docs/guides/frontend/frontend-workspace-map.md)
- [API docs](../../docs/guides/backend/api-docs.md)
- [Testing baseline](../../docs/guides/quality/testing-baseline.md)
- [Threat model](../../docs/guides/security/streamgate-threat-model.md)
