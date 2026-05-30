# 👷 Worker (Background Processing)

Este serviço é um executor assíncrono escrito em Ruby puro (sem Rails) para ingestão e processamento de alto throughput.

## 🌟 Visão Geral

O Worker é a espinha dorsal de processamento do StreamGate. Ele consome eventos do **RabbitMQ**, processa os payloads (ex: converte ZIP de CSV em Parquet), envia para S3 e carrega estatísticas no **ClickHouse**.

## 🛠️ Design Patterns

- **Sneakers**: Biblioteca subjacente para consumo RabbitMQ.
- **Circuit Breakers**: Interrupções quando S3 ou ClickHouse estão fora.
- **DLQ (Dead Letter Queue)**: Mensagens envenenadas ou erros transientes max-retried são roteadas automaticamente para filas de falha.
- **Polimorfismo de Processadores**: Eventos como `upload.received` ou `public_link.requested` são mapeados para classes específicas no namespace `Worker::Runtime`.

## 📦 Inicialização

```bash
# O script de stack global já engloba o worker, mas para debug pontual:
bundle exec sneakers run Worker::Runtime::Consumer
```

## 🧪 Testes

Testes RSpec rigorosos garantem a qualidade das transformações de dados.

```bash
bundle exec rspec
```
