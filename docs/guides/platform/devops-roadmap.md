# Roadmap DevOps

Este guia descreve a operacao local e remota oficial do StreamGate: scripts, gates, reports, CI, smokes e criterios de release.

## Estado Atual

- `scripts/bootstrap`, `scripts/dev`, `scripts/compose`, `scripts/ci`, `scripts/smokes` e `scripts/reports` sao os caminhos oficiais.
- `ci-local` valida trilhas isoladas com logs e resumo HTML.
- `run-smokes` valida runtime ponta a ponta.
- `run-all-reports` consolida evidencias para fechamento relevante.
- GitHub Actions e o CI remoto oficial.
- CircleCI nao possui configuracao versionada no repositorio; qualquer check externo deve ser diagnosticado como integracao externa.
- O caminho pesado recomendado continua `WSL/Compose-first`, com PowerShell suportado para operacao local e fallback.

## Perfis De Gate

### Fast

Use para feedback por trilha:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 frontend
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 backend
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 e2e
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 docker
```

Regras:

- prefira um workflow por vez;
- use `-SkipInstallSteps` quando o bootstrap ja estiver pronto;
- use `-ResumeFromStep "<workflow :: step>"` para retomar diagnostico sem repetir tudo.

### Operational

Use quando a mudanca tocar worker, filas, artefatos, notificacoes, conectores, safe operations ou runtime:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smokes\run-smokes.ps1
```

Cobertura esperada:

- auth operacional;
- upload assinado;
- processamento real;
- artifacts finais;
- notificacoes;
- public link;
- auditoria persistida;
- operacoes seguras.

### Full Closeout

Use em release, PR grande ou mudanca critica:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout
```

`run-all-reports` consolida evidencias por perfil e nao deve virar substituto automatico de toda investigacao pequena.
O smoke de public link possui fixture CSV publica padrao; `SMOKE_PUBLIC_LINK_URL` fica reservado para override de rede ou dataset controlado.

## CI Remoto

Workflows oficiais:

- `frontend-ci.yml`: install, lint, unit tests e build de `apps/web`.
- `backend-ci.yml`: API Rails, worker Ruby, RuboCop e checks de seguranca Ruby.
- `docker-ci.yml`: Compose, imagens e smoke de Docker.
- `e2e-auth-ci.yml`: stack de app, integracao auth e Playwright Chromium.

Politica:

- PR para `dev` deve aguardar todos os checks obrigatorios.
- Falha de GitHub Actions exige log do primeiro job/step quebrado antes de qualquer fix.
- Falha externa nao-GitHub Actions deve ser registrada com URL, provedor e status.
- CircleCI so bloqueia se existir check externo configurado no repositorio remoto ou politica do branch protection.

## Reports

| Runner | Saida |
| --- | --- |
| `ci-local` | `scripts/ci/reports/summary.json`, `report.html`, logs por step |
| `run-smokes` | `scripts/smokes/reports/summary.json`, `report.html`, diagnosticos |
| `run-all-reports` | `docs/reports/index.html` e links para reports por area |

Reports devem ser regeneraveis. Nao versionar lixo de execucao fora do hub oficial quando ele fizer parte do fechamento.

## Release E Rollback

Checklist oficial: [release-rollback-checklist.md](release-rollback-checklist.md).

Regras:

- nao promover release com smoke operacional vermelho;
- nao ignorar drift entre OpenAPI, contracts e implementacao;
- classificar falha antes de seguir;
- decidir rollback antes de executar mudanca sensivel;
- merge para `dev` so com checks verdes ou excecao explicitamente documentada.

## Repo Readiness

O repositorio possui:

- `CODEOWNERS`;
- Dependabot;
- issue templates;
- PR template;
- `AGENTS.md`;
- workflows GitHub Actions separados;
- scripts oficiais para dev, CI, smokes e reports.

## Referencias

- [Setup](setup.md)
- [Testing baseline](../quality/testing-baseline.md)
- [Release/rollback checklist](release-rollback-checklist.md)
- [Worker runbook](../operations/worker-runtime-runbook.md)
- [Hub de reports](../../reports/index.html)
