# 💻 Automações e Scripts (DevOps Local)

A pasta `scripts/` é o coração das operações de desenvolvimento e CI/CD local do StreamGate. O uso de automações garante que todo desenvolvedor rode o projeto exatamente do mesmo jeito, eliminando a frase "na minha máquina funciona".

## 🚀 Como Usar os Scripts

Temos subpastas especializadas por ciclo de desenvolvimento:

### 1. Ambiente Local (`dev/` e `compose/`)

Para subir toda a infraestrutura ou partes isoladas.

- `dev-up.ps1 -Mode full`: Sobe Docker, API, Frontend e Worker.
- `dev-up.ps1 -Mode app`: Sobe infraestrutura e API (ideal para focar no Web).
- `dev-down.ps1`: Derruba todos os containers, limpando networks e dados efêmeros.

### 2. Integração Contínua Local (`ci/`)

Scripts para validações idênticas ao GitHub Actions.

- `ci-local.ps1 frontend`: Lint, type-check e testes unitários do web.
- `ci-local.ps1 backend`: Rubocop e RSpec/Minitest do rails e worker.
- `ci-local.ps1 e2e`: Execução do Playwright contra o ambiente local.
- `validate-operational-contracts.rb`: Garante que OpenAPI não tem quebras.

### 3. Operação e Smokes (`smokes/`)

- `run-smokes.ps1`: Executa testes *Ponta-a-Ponta* agressivos (Smokes) no runtime em andamento para validar conectividade com RabbitMQ, S3 e banco de dados em tempo real.

### 4. Relatórios de Qualidade (`reports/`)

- `run-all-reports.ps1`: Orquestra todas as camadas do `ci-local` gerando evidências tangíveis (`html`, `xml`) gravadas em `docs/reports` ao finalizar uma release. Usado para o *Closeout Gate*.

## ⚖️ Regras de Criação de Scripts

Qualquer novo script deve ser idôneo: se for abortado no meio, pode ser rodado de novo sem duplicar estados errados no banco ou na infraestrutura. Preferência estrita por `Powershell` (`.ps1`) para o ecossistema Windows primário, com fallback em `Bash` (`.sh`) para CI em Linux/macOS.
