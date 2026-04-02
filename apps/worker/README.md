# StreamGate Worker

Worker Ruby do StreamGate.

## Papel do worker

O worker sera responsavel por:

- consumir eventos publicados pela API
- ler arquivos do storage
- processar lotes
- validar dados
- registrar progresso, falha, quarentena e replay
- alimentar as camadas operacional e analitica

## Estado atual

O worker ainda esta em fase de fundacao. Hoje ele existe como app separado no monorepo, mas ainda nao possui:

- runtime real de fila
- leitura de MinIO
- parsing em lotes
- retries
- quarentena
- replay operacional

## Comandos atuais

```bash
bundle install
bundle exec rspec
```

## Observacao importante

No ambiente Windows atual, o worker ainda possui um gap tecnico conhecido no gemspec relacionado ao uso de `git ls-files`. Esse ponto esta registrado no roadmap e deve ser corrigido na Sprint 0 antes da fundacao operacional do worker.

## Proximo passo esperado

A trilha de evolucao do worker esta detalhada em [docs/planning/streamgate-full-sprints-roadmap.md](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md), principalmente nas sprints de:

1. modelagem de dominio e contratos
2. worker real e processamento base
3. quarentena
4. reprocessamento e auditoria forte
