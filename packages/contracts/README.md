# 📜 StreamGate Contracts

Este pacote atua como a única fonte da verdade (SSOT) para comunicação entre o **Command Center (Frontend)** e a **API Server (Backend)**.

## 🌟 O que são os contratos?

Os contratos garantem que o frontend não envie payloads inesperados e o backend não retorne estruturas não documentadas. Usamos schemas **OpenAPI** (YAML/JSON) para definir rigidamente os Bounded Contexts.

## 🏗️ Estrutura de Domínios

Os arquivos estão mapeados por domínios, espelhando a infraestrutura das aplicações:

- `auth.yml`
- `uploads.yml`
- `analytics.yml`
- `operations.yml`
- `shared.yml` (Schemas genéricos como paginação e metadata padrão)

## ⚖️ Regras de Quebra de Contrato

- **Retrocompatibilidade é lei**: Você não pode simplesmente remover um campo do contrato porque o frontend pode estar em cache e ainda requerer este campo.
- Ao atualizar o `packages/contracts`, a API deve ser atualizada simultaneamente no mesmo PR/Ciclo.

Para validar os contratos:
```bash
ruby scripts/ci/validate-operational-contracts.rb
```
