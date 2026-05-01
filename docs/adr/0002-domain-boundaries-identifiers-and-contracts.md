# ADR 0002: Fronteiras de dominio, identificadores e contratos da fundacao do dominio

## Status

Aceita

## Contexto

A API Rails saiu do baseline inicial como esqueleto tecnico, sem entidades, sem contratos executaveis e sem uma convencao de identificadores. O risco imediato era permitir que frontend, backend, worker e documentacao crescessem com naming, estados e rastreabilidade divergentes.

## Decisao

A fundacao do dominio congela as seguintes decisoes:

1. O dominio operacional inicial e composto por `User`, `Upload`, `Job`, `JobBatch`, `QuarantineRecord`, `ProcessingAttempt` e `AuditEvent`.
2. O estado transacional e auditavel fica no PostgreSQL. A camada analitica futura sera derivada para ClickHouse a partir desses fatos.
3. Os identificadores oficiais do dominio sao strings prefixadas no formato `<prefixo>_<32 hex>`.
4. `Job` passa a ser o agregado operacional central para ligacao entre upload, lotes, tentativas, quarentena e auditoria.
5. A API cresce com `services`, `policies` e `serializers` desde o inicio para impedir concentracao de regra em controllers.
6. O contrato publico do projeto passa a reservar envelope de sucesso, erro, paginacao e filtros antes da proliferacao de endpoints.
7. `packages/contracts` deixa de ser placeholder e passa a guardar schemas, exemplos, versao publicada e regra de compatibilidade.

## Consequencias

### Positivas

- a linguagem do dominio fica consistente entre stacks;
- a API ganha fundacao para auth, upload e worker sem retrabalho estrutural;
- a trilha de rastreabilidade nasce junto com o dominio, nao depois;
- contratos e OpenAPI passam a evoluir com base material, nao apenas aspiracional.

### Custos e trade-offs

- ha mais arquivos desde cedo, porque a arquitetura deixa de ficar implodida dentro de controllers;
- os IDs ficam mais verbosos, mas ganham legibilidade operacional e coesao entre sistemas;
- alguns modelos parecem mais ricos do que o uso imediato da fundacao do dominio, mas isso evita renomear entidades no meio da v1.

## Itens explicitamente adiados

- sessao real e autorizacao por papel em endpoints publicos;
- worker de fila executando processamento pesado;
- endpoints operacionais completos;
- camada analitica em ClickHouse;
- replay operacional e politicas finas de RBAC.
