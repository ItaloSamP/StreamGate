# ADR 0003: Estrategia de autenticacao e sessao da Sprint 2

## Status

Aceita

## Contexto

A Sprint 1 estruturou dominio, contratos e fundacao da API, mas a autenticacao ainda estava mockada no frontend e ausente no backend. Sem uma estrategia explicita, havia risco de espalhar suposicoes diferentes sobre sessao, expiracao, erro de auth e bootstrap de usuario.

## Decisao

A Sprint 2 congela as seguintes decisoes para a v1:

1. A API adota autenticacao por token Bearer com sessao persistida em banco (`auth_sessions`).
2. O token retornado ao cliente nunca e armazenado em texto puro no banco; apenas `token_digest`.
3. Sessao tem expiracao (`expires_at`) e revogacao explicita (`revoked_at`).
4. `POST /api/v1/auth/session/refresh` aplica rotacao de token: revoga a sessao anterior e emite nova sessao.
5. `GET /api/v1/auth/me` e o bootstrap oficial da sessao para o frontend.
6. Codigos de erro de auth padronizados na v1:
   - `invalid_credentials`
   - `session_expired`
   - `access_denied`
   - `rate_limited`
7. Reset de senha usa token temporario com digest e expira por TTL configuravel.
8. Fronteira entre autenticacao e autorizacao:
   - autenticacao valida identidade/sessao;
   - autorizacao por papel continua em policies, com papeis iniciais `operator`, `admin` e `service_account`.
9. Hardening inicial de auth na Sprint 2:
   - throttle configuravel por IP e identificador para login/register/reset;
   - logs de falha sem vazamento de segredo;
   - CORS configuravel por env e sem cookies por padrao (`AUTH_COOKIE_ENABLED=false`).

## Consequencias

### Positivas

- frontend ganha bootstrap real (`me`) sem depender de mock;
- sessao passa a ser revogavel e auditavel;
- erro de auth fica estavel para UX e contratos;
- base pronta para evoluir RBAC fino nas proximas sprints;
- protecao inicial contra abuso por repeticao de tentativas.

### Custos e trade-offs

- estado de sessao passa a exigir tabela e limpeza operacional;
- refresh com rotacao aumenta controle de seguranca, mas adiciona logica de token no backend;
- reset de senha fica funcional sem email transacional nesta fase, com token de depuracao apenas em ambiente local/teste;
- throttle exige ajuste de limites por ambiente para evitar falso bloqueio em testes de carga.

## Itens explicitamente adiados

- federacao/OAuth externo;
- MFA;
- gestao de dispositivos/sessoes por painel de usuario;
- RBAC granular por modulo/acao;
- estrategia final de cookie HttpOnly para producao web, que permanece como evolucao de hardening.
