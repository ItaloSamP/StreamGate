# Regras de Compatibilidade de Contratos

## Principios

- toda mudanca de contrato precisa manter compatibilidade aditiva dentro da mesma versao maior;
- remocao, renomeacao ou mudanca de semantica exige nova versao de payload;
- exemplos em `examples/` devem refletir schemas reais em `schemas/`;
- OpenAPI e contratos de evento devem evoluir no mesmo ciclo da mudanca de backend.

## Compatibilidade minima por tipo

### HTTP

- adicionar campos opcionais e compativel;
- mudar tipo de campo ou tornar campo opcional em obrigatorio quebra contrato;
- `error.code` e contrato, nao texto livre.

### Eventos

- `event_name` e `payload_version` identificam o contrato;
- payload novo deve ser publicado como nova versao quando houver quebra;
- campos de rastreabilidade sao obrigatorios sempre que o contexto existir.
