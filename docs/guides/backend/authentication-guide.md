# Guia de Autenticacao

## Objetivo
Este guia consolida diretrizes de authentication guide para uso consistente no projeto.

## Estado atual
Conteudo alinhado ao estado operacional atual; atualizar em cada mudanca relevante.


## Estado atual detalhado
Conteudo alinhado ao estado operacional atual; atualizar em cada mudanca relevante.

## Regras/Contratos
- As regras normativas deste tema estao descritas nas secoes tecnicas abaixo.
- Mudancas devem manter alinhamento com roadmap, ADRs e READMEs.

## Validacao/Evidencias
- Validar coerencia com README raiz, docs/README e roadmap da release atual.
- Registrar atualizacoes desta pagina no closeout do ciclo de entrega correspondente.

## Referencias
- [Roadmap mestre](C:/estudos/StreamGate/docs/planning/)
- [Governanca de documentacao](C:/estudos/StreamGate/docs/guides/operations/documentation-governance.md)


## Objetivo detalhado

Este guia consolida a estrategia de autenticacao real em uso no backend, frontend, CI e operacao local.

A referencia arquitetural principal continua em [ADR 0003](C:/estudos/StreamGate/docs/adr/0003-authentication-and-session-strategy.md) e na spec [OpenAPI v1](C:/estudos/StreamGate/apps/api/openapi/v1/openapi.yaml).

## Estrategia oficial da v1

- transporte de sessao: `Bearer` token no header `Authorization`
- persistencia de sessao: tabela `auth_sessions` na API
- armazenamento de token: somente `token_digest` no banco
- bootstrap do frontend: `GET /api/v1/auth/me`
- renovacao: `POST /api/v1/auth/session/refresh` com rotacao e revogacao da sessao anterior
- encerramento: `POST /api/v1/auth/logout` revoga a sessao atual

## Endpoints oficiais de auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/session/refresh`
- `POST /api/v1/auth/password/reset/request`
- `POST /api/v1/auth/password/reset/confirm`

## Contrato de erro de auth

Todos os erros usam envelope padrao:

```json
{
  "error": {
    "code": "invalid_credentials",
    "message": "Credenciais invalidas.",
    "request_id": "...",
    "trace_id": "..."
  }
}
```

Codigos obrigatorios na fundacao de autenticacao:

- `invalid_credentials`: credencial/token de reset invalido
- `access_denied`: token ausente, revogado ou sem permissao
- `session_expired`: sessao expirada
- `rate_limited`: limite de tentativas excedido (login/register/reset)

## Politicas de seguranca aplicadas

- senha com minimo de 12 caracteres e complexidade obrigatoria
- token com digest salgado por `AUTH_TOKEN_PEPPER`
- reset sem enumeracao de usuario na fase de request
- throttle configuravel por IP e identificador (email) para auth
- logs de falha de login sem vazamento de segredo

## Configuracao de ambiente

Variaveis principais de auth/sessao:

- `AUTH_SESSION_TTL_HOURS`
- `AUTH_PASSWORD_RESET_TTL_MINUTES`
- `AUTH_TOKEN_PEPPER`
- `AUTH_SESSION_TRANSPORT`
- `AUTH_COOKIE_ENABLED`
- `AUTH_CSRF_MODE`

Variaveis de throttle:

- `AUTH_LOGIN_LIMIT_PER_IP`
- `AUTH_LOGIN_LIMIT_PER_IDENTIFIER`
- `AUTH_REGISTER_LIMIT_PER_IP`
- `AUTH_PASSWORD_RESET_REQUEST_LIMIT_PER_IP`
- `AUTH_PASSWORD_RESET_REQUEST_LIMIT_PER_IDENTIFIER`
- `AUTH_PASSWORD_RESET_CONFIRM_LIMIT_PER_IP`
- `AUTH_THROTTLE_WINDOW_SECONDS`

Variaveis de CORS:

- `API_CORS_ALLOWED_ORIGINS`
- `API_CORS_ALLOW_CREDENTIALS`

## Fluxo frontend oficial

- `AuthProvider` controla bootstrap e ciclo de sessao
- `api-client` injeta bearer token de forma centralizada
- `ProtectedRoute` bloqueia rota protegida com redirecionamento para login
- sessao expirada invalida estado local e exige novo login

Arquivos de referencia:

- [auth-context.tsx](C:/estudos/StreamGate/apps/web/src/features/auth/auth-context.tsx)
- [protected-route.tsx](C:/estudos/StreamGate/apps/web/src/features/auth/protected-route.tsx)
- [api-client.ts](C:/estudos/StreamGate/apps/web/src/lib/api-client.ts)
- [streamgate-api.ts](C:/estudos/StreamGate/apps/web/src/lib/streamgate-api.ts)

## Testes oficiais da trilha

- API request/model: `docker compose exec -T api bundle exec rails test test/requests/auth_flow_test.rb`
- Web unit: `pnpm --dir apps/web test:run`
- Web integration (backend real): `pnpm --dir apps/web test:integration`
- E2E auth (Playwright): `pnpm --dir apps/web test:e2e`
- Runner local completo e2e-auth: `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 -Workflow e2e`

## Observacoes operacionais

- em Windows host, scripts PowerShell podem exigir `ExecutionPolicy Bypass`
- para evitar drift, manter `.env` alinhado com `.env.example` a cada fechamento de ciclo de entrega
- qualquer endpoint novo de auth deve atualizar OpenAPI, roadmap e este guia no mesmo PR