# StreamGate Observability

Perfil de release para observabilidade open-source em AWS EKS.

## Stack

- OpenTelemetry Collector para traces e metricas de API, worker e web.
- Prometheus Operator para scrape, SLOs e alert rules.
- Grafana para dashboards RED/USE.
- Loki + Promtail ou Alloy para logs de aplicacao e cluster.
- Alertmanager para alertas de page/warn.

## Sinais Obrigatorios

| Servico | RED | USE | Eventos seguros |
| --- | --- | --- | --- |
| API | request rate, 4xx/5xx, latency p95 | CPU, memoria, conexoes DB | sem payload bruto, signed URL ou credential |
| Worker | jobs processados, falhas terminais, DLQ, latency | CPU, memoria, conexoes broker/storage | somente IDs e mensagens mascaradas |
| Web | Web Vitals, console error count, API failures | bundle/load health | screenshots sem segredo |
| Broker | publish/consume rate, queue depth, nack/DLQ | conexoes, channels, memoria | eventos sem lease credential claro |

## Gate

- Helm renderiza `ServiceMonitor` e `PrometheusRule`.
- Browser sweep falha em console errors e estados degradados incoerentes.
- Contract validator barra exemplos com credenciais claras.
- Full-closeout deve anexar links para dashboards ou screenshots mascarados quando ambiente de staging existir.
