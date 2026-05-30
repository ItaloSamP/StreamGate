# 🤖 AGENTS (AG Kit)

Guia de referência para a atuação de Agentes Autônomos (IA) operando no ecossistema **StreamGate**. 
Este arquivo funciona como um adendo ao `GEMINI.md` para prover contexto topológico. Todo agente ativo deve aderir estritamente às normas documentadas.

## 🗺️ Mapa Topológico e Domínios

O ecossistema adota Bounded Contexts estritos. Nunca espalhe regras de negócio ou referencie bibliotecas erradas entre as fronteiras:

- `apps/api`: Servidor transacional (Ruby on Rails). Fonte da verdade para Auth, Segurança, Conectores e Mutação de Status. Respeite os namespaces em `app/domains/`.
- `apps/web`: O Command Center (React, Vite, Tailwind). Aplicação focada no usuário final. Mutações e Consultas devem obrigatoriamente usar os adaptadores em `src/lib/api/` e NUNCA realizar chamadas fetch soltas ou `axios` aleatórios.
- `apps/worker`: Escravo de alta performance (Ruby puro). Responsável por engolir as filas do **RabbitMQ**, processar integrações de IO pesado (ClamAV) e enviar telemetria analítica ao **ClickHouse**.
- `packages/contracts`: A lei máxima do repositório. Definições OpenAPI (`yaml`/`json`). Qualquer mudança na API precisa ser versionada e descrita primeiro nos contratos.
- `scripts`: A base da infraestrutura dev. O bootstrap e o ambiente Docker.
- `docs/guides`: Nossos hubs documentais (`user-manual.md`, `architecture.md`, `devops-runbook.md`).

## ⚖️ Leis Fundamentais de Atuação

1. **Test-Driven Operations**: Não proponha PRs se você alterar regras de negócio sem atualizar as respectivas suítes (RSpec/Minitest para backend, Vitest/Playwright para frontend).
2. **Idempotência Operacional**: Mutacoes na infraestrutura, uploads ou liberação de quarentenas requerem chaves de idempotência (`Idempotency-Key`) no cabeçalho.
3. **Privacidade e Auditoria**: O StreamGate lida com Segurança Zero-Trust. Evite usar `console.log` para payload sensível ou senhas; toda alteração de permissionamento deve ocorrer por vias de Eventos (Event Sourcing) ou gerando entradas no DB de Auditoria.
4. **Sem Arquivos Órfãos**: Nunca crie componentes front-end soltos fora dos domínios do *Feature-Sliced Design* (`src/features/*`). Componentes puros de UI devem ir para `src/components/ui/`.

## 🛡️ Gates Oficiais e Certificação

Antes de sugerir um merge para a `main`, o Agente deve validar seu próprio trabalho contra o Master Checklist do AG Kit e os scripts locais:

- Validação Mestre (AG Kit):
  - `python .agents/scripts/checklist.py .`
- Testes Locais de Fast-Feedback:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 frontend`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 backend`
- Orquestração Definitiva de Relatórios:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout`

## 📚 Referências Essenciais

- 🏠 **[Hub de Documentação Principal](docs/README.md)**
- 📖 **[Manual do Usuário Final](docs/guides/user-manual.md)**
- 🏗️ **[Arquitetura do Sistema](docs/guides/architecture.md)**
- 🛠️ **[DevOps Runbook](docs/guides/devops-runbook.md)**
