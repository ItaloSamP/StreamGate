# StreamGate Scripts & DevOps

Pasta central contendo os comandos oficiais do repositório para inicialização, CI Local, deploy e testes de sanidade/E2E operacionais.

Nossa regra de ouro: **Nenhuma ferramenta na máquina do desenvolvedor deve estar quebrando por depender de configurações mágicas**. O pipeline aqui é o mesmo do CI.

## 📁 Estrutura de Diretórios

- `ci/`: Contém os scripts executados por pipelines como GitHub Actions, GitLab CI ou localmente para fechamento completo de pull request.
  - Ex: `ci-local.ps1`, `validate-operational-contracts.rb`
- `dev/`: Contém os bootstraps primários.
  - Ex: `dev-up.sh` / `dev-up.ps1` (Para levantar toda a infra via Compose).
  - Ex: `dev-down.sh` / `dev-down.ps1`
- `reports/`: Ferramentas responsáveis por orquestrar execuções e consolidar os arquivos JUnit/Coverage gerados pela web, worker e api.
  - Ex: `run-all-reports.ps1`
- `smokes/`: Scripts dedicados para validar a aplicação End-to-End.
  - Ex: `run-smokes.ps1`

## 🚀 Uso Básico (Dia-a-Dia)

### Para rodar a Stack:
**No Windows:**
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev\dev-up.ps1 -Mode full
```

**No WSL/Linux:**
```bash
bash scripts/dev/dev-up.sh full
```

### Para Derrubar a Stack e limpar os Volumes Padrões:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev\dev-down.ps1
```

---

## 🔒 Gates de Qualidade

Para passar no Pente Fino, recomendamos sempre usar o script de CI isolado por camada antes do commit:

```powershell
# Apenas Frontend (Lint + Test + Build)
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 frontend

# Apenas Backend / API (Rspec)
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 backend

# Tudo! (Pesado, demora, use antes do fechamento de PR)
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 all
```

*Nota para Troubleshooting: Caso um gate falhe, use a flag `-ResumeFromStep` para retomar o passo com erro ao invés de perder tempo reinstalando o frontend.*
