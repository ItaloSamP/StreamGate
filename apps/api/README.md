# StreamGate API Core

O coração do sistema StreamGate. Construído usando o **Ruby on Rails 7.1** operando em modo puro API.

Sua responsabilidade abrange:

- Interagir com os clientes consumindo a plataforma (React Dashboard ou usuários de APIs terceiras via tokens).
- Gerenciar Identidade, Autenticação JWT e Integrações OIDC delegadas.
- Orquestração Operacional (Disparar links de Signed URLs para S3).
- Gerar eventos no RabbitMQ para que o Worker assíncrono execute as demandas pesadas.

## 🛠 Tecnologias Principais

- **Ruby 3.3.0 + Rails 7.1 (API-Only)**
- **PostgreSQL 16** (Armazena configurações, estado dos jobs, logs de auditoria e usuários).
- **RabbitMQ** (Publicação das intenções de processamento via mensagens AMQP).
- **RSpec + FactoryBot** para cobertura maciça de testes unitários e de integração.
- **Rswag** para documentação via Swagger/OpenAPI.

## ⚙️ Principais Funcionalidades

### 1. Ingestão Segura via Storage
A API Core **nunca** aceita o upload binário direto via endpoints POST (isso causaria timeouts de I/O em grandes fluxos). Ao invés disso, a API assina uma URL do Object Storage (S3/MinIO), responde pro frontend, e o frontend sobe os dados. Uma vez recebido no bucket, o frontend pede para a API *registrar* a subida, criando o registro do Job.

### 2. Autenticação Multi-camadas (RBAC & OIDC)
- **Operador Comum:** Apenas vê métricas e jobs.
- **Admin:** Pode delegar perfis de autenticação OAuth (Google Drive Delegated Access). A API criptografa Refresh Tokens.

### 3. Rate Limiting, Filtros e Paginação
Utiliza Rack::Attack nativo (ou middlewares custom) para proteção e predição de DDOS. A API entrega cabeçalhos completos de paginação.

### 4. DLQ & Quarentena
Controla a visualização das mensagens na DLQ (Dead Letter Queue) do RabbitMQ através do Painel e permite replay das mensagens de volta para as filas principais caso o erro de integração tenha sido solucionado.

---

## 🚀 Como Iniciar

Este app funciona em harmonia com os containers do ambiente geral. Para rodar a API isoladamente ou no seu host:

### 1. Preparação (Host)
Tenha o Ruby 3.3.0 instalado, ou utilize o `dev-up.sh app`.

```bash
cd apps/api
bundle install
```

### 2. Banco de dados
Configure o PostgreSQL:

```bash
bundle exec rails db:create
bundle exec rails db:migrate
bundle exec rails db:seed
```

### 3. Rodando o Servidor

```bash
bundle exec rails server -p 3000
```
*(A API fica acessível na porta 3000 por padrão. Utilize Postman, cURL ou o Frontend para interagir).*

---

## 🧪 Rodando os Testes

O `rspec` testa toda a API simulando as inserções de banco e o envio pro RabbitMQ de forma virtual (sem a necessidade estrita de RabbitMQ up para testes unitários isolados).

```bash
bundle exec rails test
```
*Garante o coverage de modelos, controllers, middlewares e policies.*

## 📚 Documentação Viva (OpenAPI)
Nós mantemos a doc via Rswag na pasta `spec/integration` (quando gerado) ou usando contratos estáticos em `packages/contracts`.
Sempre que adicionar uma nova rota no Rails, ela deverá possuir o seu descritivo de input/output lá.
