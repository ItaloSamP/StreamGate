# 💻 Automações e Scripts (DevOps Local)

A pasta `scripts/` é o coração das operações de desenvolvimento, orquestração e CI/CD local do **StreamGate**. O uso de automações garante que todo engenheiro rode o projeto exatamente do mesmo jeito através de containers efêmeros e infraestrutura provisionada, anulando falhas operacionais e a clássica desculpa do "na minha máquina funciona".

## 🚀 Organização dos Fluxos de Trabalho

Os nossos fluxos (Workflows) estão divididos funcionalmente de acordo com a fase de desenvolvimento e entrega. Todos os scripts primários foram desenvolvidos em PowerShell (`.ps1`) visando o forte ecosistema Windows com compatibilidade multi-plataforma e possuem fallback em Bash (`.sh`) para CI em Linux/macOS.

### 1. Ambiente Local (`dev/` e `compose/`)

Scripts voltados para o bootstraping e manutenção do ecosistema isolado. Eles se comunicam intensivamente com os manifestos Docker em `compose.yaml`.

- `dev-up.ps1`: Inicializador mestre da aplicação.
  - `-Mode infra`: Sobe estritamente os contêineres de base (Postgres, RabbitMQ, ClickHouse, Minio, Redis).
  - `-Mode app`: Sobe infraestrutura e as instâncias em dev da API e Web (React). Ideal para focar 100% no desenvolvimento front/backend sem rodar workers.
  - `-Mode full`: O pacote completo. API, Web, Worker e todas as dependências rodando em harmonia.
- `dev-down.ps1`: A **Guilhotina**. Derruba todo e qualquer contêiner associado ao StreamGate e, importantíssimo, destrói e recicla volumes efêmeros e networks.

### 2. Integração Contínua Local (`ci/`)

Scripts idênticos e simétricos ao fluxo real operado pelas Actions do GitHub. Garantem Qualidade do Código (Code Quality).

- `ci-local.ps1`: Ponto de entrada paramétrico.
  - `frontend`: Executa Lint, verificação de tipos rigorosa (TypeScript) e suíte unitária completa da UI.
  - `backend`: Executa inspeção de sintaxe (Rubocop) e bateria de testes massiva do Rails e Worker via RSpec/Minitest.
  - `e2e`: Invoca a execução Playwright Headless para testar fluxos reais através dos navegadores locais.
  - `all`: Sequência total que varre todo o código em bateria (pode demorar alguns minutos).
- `validate-operational-contracts.rb`: A apólice de seguro contra quebra de API. Compara se o desenvolvimento da API mudou algum JSON de contrato OpenAPI inadvertidamente.

### 3. Operação de Smokes (`smokes/`)

- `run-smokes.ps1`: Um fluxo avançado projetado para testar agressivamente integrações de alta latência e IO intenso. Ele orquestra conectividade *Ponta-a-Ponta* contra RabbitMQ e Data Warehouses. Executado mandatoriamente antes do lançamento para garantir que a infraestrutura real irá "suportar" o software.

### 4. Relatórios de Qualidade (`reports/`)

- `run-all-reports.ps1`: O orquestrador máximo e gerente do **Closeout Gate**. Ele repassa todos os comandos das subpastas acima para gerar evidências de QA e Segurança. O resultado sai em relatórios HTML e JUnit exportados permanentemente em `docs/reports`. Exige que se defina um `-Profile` (`fast`, `operational`, ou `full-closeout`).

## ⚖️ Regras de Ouro e Governança

1. **Idempotência Obrigatória**: Qualquer novo script deve ter tratamento de erro maduro (`try/catch`). Se o script "explodir" pela metade e for rodado novamente, não deve duplicar registros no DB ou falhar por sujeira em volumes locais.
2. **Saída Colorida (UX de Terminal)**: Scripts críticos devem prover mensagens de log com coloração semântica (`Verde = Pass`, `Amarelo = Aviso`, `Vermelho = Erro Crítico/Fatal`).
3. **Fronteiras Docker**: Nunca instale bibliotecas globalmente na sua máquina (`npm i -g`, `gem install global`). Nossos scripts isolam dependências inteiramente pelo Docker Compose. Caso algo falhe com pacotes ausentes, force uma limpeza (`dev-down.ps1`) e rebuilde.
