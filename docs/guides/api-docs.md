# Swagger/OpenAPI da API

A API Rails do StreamGate usa OpenAPI como contrato publico versionado da v1.

## O que ja ficou pronto na Sprint 2

- gems `rswag-api` e `rswag-ui` no `Gemfile` da API
- rota de documentacao em `/api-docs`
- configuracao de `openapi_root` apontando para `apps/api/openapi`
- arquivo oficial `apps/api/openapi/v1/openapi.yaml`
- endpoints de auth reais documentados: `register`, `login`, `logout`, `me`, `session/refresh` e reset de senha
- contrato de erro de auth fechado com codigos estaveis para frontend e CI

## Como ativar localmente

```bash
cd apps/api
bundle install
bundle exec rails server
```

Depois disso, a UI deve ficar disponivel em:

- [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Contrato de erro de auth (v1)

Codigos documentados no OpenAPI:

- `invalid_credentials`
- `access_denied`
- `session_expired`
- `rate_limited`

Envelope de erro padrao:

```json
{
  "error": {
    "code": "rate_limited",
    "message": "Muitas tentativas. Aguarde alguns instantes antes de tentar novamente.",
    "request_id": "req_xxx",
    "trace_id": "trace_xxx"
  }
}
```

## Status HTTP relevantes para auth

- `200`: sucesso (`login`, `logout`, `me`, `refresh`, reset)
- `201`: cadastro com sessao inicial
- `401`: credencial invalida, token invalido ou sessao expirada
- `403`: acesso negado para recurso protegido
- `422`: validacao de payload
- `429`: throttle de auth excedido

## Estrategia recomendada daqui para frente

- manter `apps/api/openapi/v1/openapi.yaml` como fonte unica de contrato
- atualizar OpenAPI no mesmo PR de qualquer endpoint novo
- manter exemplos de request/response sincronizados com testes de request
- preservar nomes de `error.code` como contrato estavel para frontend
- registrar no roadmap qualquer alteracao de contrato com impacto de UX

## Relacao com outros documentos

- estrategia de sessao e auth: [docs/adr/0003-authentication-and-session-strategy.md](C:/estudos/StreamGate/docs/adr/0003-authentication-and-session-strategy.md)
- guia operacional de auth: [docs/guides/authentication-guide.md](C:/estudos/StreamGate/docs/guides/authentication-guide.md)
- setup e envs: [docs/guides/setup.md](C:/estudos/StreamGate/docs/guides/setup.md)
