# Release Threat Model

Este threat model complementa `streamgate-threat-model.md` para a branch `release`, cobrindo a superficie SaaS final: organizacoes, identidade, Google Drive/OAuth delegated, conectores, malware scanning, quotas, AWS EKS, observabilidade e SOC 2 Type I.

## Ativos

- Dados de organizacao, membros, papeis e convites.
- Uploads, jobs, artefatos, quarentena, auditoria e eventos realtime.
- Credenciais de conectores, OAuth delegated, cloud services e worker interno.
- Contratos OpenAPI/eventos, screenshots de browser evidence e reports de release.
- Infra AWS EKS, Secrets Manager, RDS, S3, Redis, broker e ClickHouse Cloud.

## Fronteiras

| Fronteira | Entrada | Risco principal | Controle de release |
| --- | --- | --- | --- |
| Browser -> API | Auth, settings, uploads, analytics, events | role bypass, console leaks, controles inertes | Playwright release sweep, RBAC, mascaramento |
| API -> Broker | eventos operacionais | segredo em payload de evento | `connector.ingestion.requested.v1` carrega somente `lease_id` |
| Worker -> API interna | claim de lease | reuso de lease, forgery de worker | `X-Worker-Token`, status pending, TTL, sem token claro |
| API/worker -> storage externo | S3, HTTP, Google Drive | SSRF, signed URL leak, payload bruto em log | allowlist/denylist, masking, malware scan, audit |
| Cluster -> dependencias AWS | RDS, S3, Redis, broker, ClickHouse | egress excessivo, metadata service, credencial ampla | NetworkPolicy, IRSA, External Secrets, AWS managed services |
| Observability -> operadores | logs, traces, dashboards | dado sensivel em telemetria | OTel com atributos mascarados e regra de nao expor payload bruto |

## Ameacas E Mitigacoes

| ID | Ameaca | Impacto | Mitigacao versionada | Evidencia |
| --- | --- | --- | --- | --- |
| RTM-001 | Operador acessa readiness admin/SOC 2 | exposicao de controles internos | endpoint e UI admin-only | `saas_readiness_test.rb`, `operational-pages.test.tsx` |
| RTM-002 | Lease credential trafega em broker/worker | aquisicao indevida de conector | broker carrega `lease_id`; claim usa worker auth e TTL | contratos, worker specs, request tests |
| RTM-003 | OAuth delegated vaza em UI/log/evento | comprometimento Google Drive | readiness marca dependencia externa; secrets ficam fora de exemplos e screenshots | contract validator |
| RTM-004 | SSRF em HTTP/Drive connector | acesso a metadata/internal network | egress deny metadata/RFC1918 para internet; parser/SSRF tests obrigatorios | Helm NetworkPolicy e gates security |
| RTM-005 | Malware entra por upload/conector | propagacao ou processamento inseguro | malware scanning e quarentena auditavel como controle de release | readiness API e SOC 2 matrix |
| RTM-006 | Tenant isolation falha | vazamento cross-org | `organization_id` em leituras/mutacoes, role gating por org | request/model tests por dominio |
| RTM-007 | Observability captura payload bruto | vazamento por logs/traces | masking em events, OTel sem payload bruto, exemplos sanitizados | browser sweep, contract validator |
| RTM-008 | EKS pod recebe permissao ampla | escalacao cloud | IRSA por ServiceAccount, External Secrets e resource policies | Helm chart e IaC scan |
| RTM-009 | Falta de restore testado | perda de dados | backup/restore drill antes de promocao | SOC 2 matrix e release exception |
| RTM-010 | Dependencia externa bloqueia entrega | release ambigua | `external_blockers` com owner/risco/criterio | `/api/v1/saas/readiness` |

## Regras De Evidencia

- Nenhuma evidencia pode conter token OAuth de refresh, credencial OIDC, credencial de lease, bearer tokens, signed URL completa, payload bruto ou credencial cloud.
- Screenshots devem cobrir admin/operator, empty/degraded states, mobile overflow, ausencia de console errors e controles acionaveis ou honestamente desabilitados.
- Toda mudanca de endpoint/evento/schema atualiza OpenAPI, `packages/contracts`, exemplos, docs e testes no mesmo ciclo.

## Excecoes Formais

As excecoes abaixo nao sao bugs escondidos; sao dependencias externas que precisam ser resolvidas antes de producao real:

- AWS account/EKS final.
- Google OAuth client e Workspace consent screen.
- ClickHouse Cloud workspace e allowlist.
- Auditor SOC 2 Type I.
- DNS/TLS de producao.
