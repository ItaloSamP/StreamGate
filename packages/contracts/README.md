# StreamGate Contracts

Repositório central de Single Source of Truth (SSOT) para contratos de schemas de API, eventos de fila RabbitMQ e payloads entre os domínios do StreamGate.

## 🛠 Tecnologias e Conceitos

- **JSON Schema / OpenAPI 3.x**
- **Domain-Driven Design (DDD):** Isolamento semântico entre os limites do que a Web sabe, do que a API provê, e do que o Worker consome.

## 📁 Organização

- `events/`: Contém os schemas JSON puros que definem a tipagem forte de como uma mensagem no RabbitMQ deve se parecer para o Worker consumi-la sem surpresas (ex: `upload.received.v1.json`).
- `api/`: Documentos OpenAPI para exportação ou geração de Clients.
- `shared/`: Objetos compostos ou schemas reutilizáveis.

## 🤝 Por que usar este package?

No passado, os microserviços (API vs Worker) precisavam de gambiarras para ter certeza que um não quebraria o outro com `NoMethodError` ao receber chaves hash incorretas no payload de `enqueue`.

Ao separar isso no `packages/contracts`:
1. Quando a API atualiza uma rota ou o payload emitido pra fila, ela precisa modificar o contrato aqui.
2. Scripts de Validação E2E no `scripts/ci/validate-operational-contracts.rb` vão rodar nos testes confirmando que o schema modificado aqui é igual ao esperado lá no Worker.
3. Se houver falha de validação estrutural no CI, nós impedimos o Deploy de forma precoce.

## 🚀 Uso local

Para rodar a validação agnóstica de contratos no seu workflow:

```bash
cd packages/contracts
# Caso existam dependências do linter OpenAPI localmente:
npm install ou yarn
npm run validate
```

*Sempre certifique-se de sincronizar modificações aqui junto do código consumidor em um mesmo commit para manter o Monorepo atômico.*
