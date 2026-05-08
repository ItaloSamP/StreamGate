# SOC 2 Type I Control Matrix

Este pacote registra o desenho de controles para a entrega SaaS da branch `release`. Ele nao substitui auditoria formal; ele define evidencias esperadas, owners e bloqueios externos para uma leitura Type I.

## Escopo

- Produto: StreamGate SaaS sem billing nesta release.
- Infra: AWS EKS, RDS Postgres, S3, ElastiCache Redis, Amazon MQ/RabbitMQ compativel, ClickHouse Cloud, AWS Secrets Manager, External Secrets e IRSA.
- Identidade: MFA TOTP planejado, OIDC com Google Workspace validado, SAML fora de escopo.
- Conectores: S3, HTTP, Google Drive e OAuth delegated sem credenciais claras em UI, eventos, logs, screenshots ou contratos.

## Matriz

| Controle | Desenho | Evidencia versionada | Owner | Gate |
| --- | --- | --- | --- | --- |
| Acesso administrativo | `/settings` e `/api/v1/saas/readiness` sao admin-only; operador nao recebe chamada nem conteudo SOC 2. | Testes unitarios web e request Rails de readiness. | Platform | `pnpm test:run`, `rails test` |
| Least privilege | ServiceAccount Helm usa IRSA; secrets entram via External Secrets. | `infra/helm/streamgate/templates/serviceaccount.yaml`, `externalsecret.yaml`. | DevOps | Helm template/lint no CI |
| Segredos | Lease credentials nao circulam em broker, worker claim ou respostas publicas; OAuth e cloud secrets ficam fora de contratos e exemplos. | OpenAPI, `packages/contracts`, worker specs e validador operacional. | Backend | `ruby scripts/ci/validate-operational-contracts.rb` |
| Change management | GitHub Actions oficiais validam frontend, backend, contratos, docker, e2e e release readiness. | `.github/workflows/release-readiness-ci.yml` e workflows existentes. | Engineering | GitHub branch protection |
| Vulnerabilidades | Brakeman, bundle-audit, npm audit, secret scan, container scan, IaC/Helm scan e DAST leve sao gates de release. | Workflow de readiness e `scripts/ci/ci-local.ps1`. | Security | CI security jobs |
| Logging e auditoria | Mutacoes sensiveis exigem RBAC, motivo, auditoria e idempotencia; eventos realtime sao mascarados. | Request tests, browser sweep e threat model. | Backend | `ci-local backend`, Playwright |
| Backup e restore | RDS snapshots, S3 versioning/lifecycle e restore drill documentado antes de producao. | Runbook de release e checklist de bloqueios externos. | DevOps | Drill manual com evidencia |
| Observabilidade | OpenTelemetry, Prometheus, Grafana, Loki e Alertmanager com RED/USE e SLO operacional. | Helm `ServiceMonitor` e `PrometheusRule`; docs de release threat model. | SRE | Observability smoke |
| Retencao | Retention policy por organizacao e quotas aparecem no centro SaaS; billing fica fora. | Readiness API/UI e contrato `saas-readiness-response.v1`. | Product | Contract validator |
| Vendor/cloud | AWS, ClickHouse Cloud e Google Workspace aparecem como dependencias externas formais. | `external_blockers` no readiness e este documento. | Platform | Release exception review |

## Bloqueios Externos

- `aws_account`: conta/projeto AWS de producao, VPC, EKS e IAM finais.
- `google_oauth_client`: OAuth consent screen, client ID e redirect URIs validados no Google Workspace.
- `clickhouse_cloud_workspace`: workspace/regiao, allowlist e credenciais gerenciadas.
- `soc2_auditor`: auditor independente para validar desenho e evidencias.
- `production_dns_tls`: dominio, certificados e politica de renovacao.

## Criterio De Fechamento

Uma release pode ser promovida quando os gates locais e GitHub Actions estiverem verdes, os bloqueios externos tiverem owner/data/risco registrados, e nenhuma evidencia expuser segredo, token OAuth, lease credential, signed URL completa, payload bruto ou credencial operacional.
