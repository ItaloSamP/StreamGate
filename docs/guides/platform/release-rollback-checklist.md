# Checklist De Release E Rollback

Checklist operacional para fechar uma release do StreamGate em ambiente local/Compose e CI remoto.

## Quando Usar

- PR grande envolvendo API, worker, web, contratos, scripts ou docs centrais.
- Fechamento de release.
- Mudanca em runtime, conectores, artifacts, notificacoes, auditoria ou safe operations.
- Preparacao para demonstracao relevante.

## Release Checklist

### 1. Sanidade Do Ambiente

- `.env` sincronizado com `.env.example`.
- Segredos locais presentes e nao versionados.
- Docker Desktop/WSL disponiveis para gates pesados.
- `SMOKE_PUBLIC_LINK_URL` revisado somente quando o smoke de public link precisar de fixture propria; por padrao o runner usa um CSV publico pequeno.
- Git remoto e branch alvo confirmados antes de PR/merge.

### 2. Contratos E Documentacao

- OpenAPI atualizado para endpoints novos ou alterados.
- `packages/contracts` atualizado com schemas e exemplos.
- README, runbook, threat model, API docs e workspace map sincronizados quando afetados.
- Roadmap e closeout registram evidencia real, nao intencao.

### 3. Gates Locais

Executar conforme risco:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 frontend
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 backend
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 e2e
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 docker
```

Fechamento operacional:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smokes\run-smokes.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout
```

### 4. Browser E UX

Validar rotas principais com Browser Use/IAB ou fallback documentado:

- `/dashboard`
- `/upload`
- `/settings`
- `/clickhouse`
- `/etl-explorer`
- `/analytics`
- `/events`
- `/quarantine`
- `/audit`

Checar desktop e mobile para texto cortado, overlap, controles inertes, role gating e ausencia de dados demo escondidos.

### 5. PR E CI Remoto

- Abrir PR para `dev` com template completo.
- Aguardar GitHub Actions: frontend, backend, docker e e2e-auth.
- Se falhar, capturar primeiro job/step e corrigir causa deterministica.
- CircleCI nao e gate versionado; se aparecer check externo, registrar diagnostico e tratar conforme politica do repositorio remoto.
- Merge somente com checks verdes.

## Criterios Para Abortar

Aborte o fechamento se:

- smoke operacional falhar;
- full-closeout falhar sem classificacao clara;
- contrato e implementacao divergirem;
- UI expuser segredo, payload sensivel ou controle indevido por role;
- rollback nao estiver claro para mudanca sensivel;
- PR remoto tiver check obrigatorio vermelho.

## Rollback

### App, API Ou Worker

1. Derrubar stack com `scripts/dev/dev-down`.
2. Voltar ao commit/tag anterior.
3. Subir stack no perfil necessario.
4. Rodar health e gate operacional minimo.

### Migrations

- Planejar rollback antes de aplicar.
- Validar impacto em dados e compatibilidade.
- Rodar testes backend relevantes depois do rollback.

### Scripts, CI Ou Reports

- Restaurar a versao anterior do script/config.
- Reexecutar o menor workflow afetado.
- Atualizar docs se a regra operacional tiver mudado.

## Evidencia Minima De Fechamento

- Comandos executados e status.
- Falhas classificadas.
- PR e checks remotos.
- Browser verification das rotas afetadas.
- Link ou referencia ao closeout.
