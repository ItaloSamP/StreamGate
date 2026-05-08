# infra/k8s

`infra/k8s` fica reservado para manifests brutos e provas locais. A entrega de release AWS EKS agora vive em:

- `infra/helm/streamgate`: chart Helm para web, API, worker, External Secrets, NetworkPolicy, probes, HPA e Prometheus rules.
- `infra/gitops/argocd`: Application ArgoCD apontando para o chart da branch `release`.

O perfil de producao esperado usa AWS EKS, IRSA, AWS Secrets Manager, RDS Postgres, S3, ElastiCache Redis, Amazon MQ/RabbitMQ compativel e ClickHouse Cloud na mesma regiao.
