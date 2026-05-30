# 🛠️ DevOps Runbook

Este documento atua como referência operacional rápida para SREs e Engenheiros DevOps mantendo o StreamGate em produção.

## 📦 Deployments e GitOps (ArgoCD)

Todo o ecossistema roda de maneira declarativa utilizando ArgoCD integrado ao cluster Kubernetes (AWS EKS, GKE, ou On-Premises).
- **Manifesto Mestre**: O manifesto principal encontra-se em `infra/gitops/argocd/streamgate-application.yaml`. Ele aponta para o helm chart local no diretório `infra/helm/streamgate`.
- **Sincronização**: O ArgoCD observa a branch principal (`main` ou `dev`) para detectar mudanças em `infra/helm/` e as aplica no cluster automaticamente (Self-Heal e Prune habilitados).

## ⚙️ Helm Configurations (`values.yaml`)

Se precisar ajustar a escalabilidade ou variáveis:
- **HPA (Horizontal Pod Autoscaler)**: A API do Rails utiliza limites de CPU/Memória padrão do Kubernetes (`metrics.server` necessário).
- **KEDA (Event-driven Autoscaling)**: O `worker` possui *ScaledObjects* do KEDA que reagem ao tamanho da fila do RabbitMQ. Se houver pico de uploads, centenas de workers são alocados.
- **ExternalSecrets**: As credenciais reais do RabbitMQ, Postgres, e chaves criptográficas (JWT) não existem no repo. Elas devem ser criadas no Secret Manager do seu cloud provider e referenciadas nos objetos do Helm.

## 🚨 Troubleshooting Rápido

1. **Worker "Preso" consumindo muita memória**:
   Verifique os logs do contêiner buscando falhas no ClamAV. Processamento de zips massivos pode explodir os OOM (Out-of-Memory) killers do K8s.
2. **APIs devolvendo 401 massivos**:
   Pode ocorrer se as chaves RSA/Ed25519 do ExternalSecrets tiverem sido rotacionadas de maneira assimétrica. Faça um rollout restart do deployment do API.
3. **Falhas no E2E em CI**:
   Verifique se o backend está vivo respondendo em `http://127.0.0.1:3000/health`.
