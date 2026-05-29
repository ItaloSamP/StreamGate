# StreamGate Data Worker

Motor assíncrono de consumo, processamento, e persistência final de dados em grande volume do StreamGate. O **Data Worker** é o aplicativo desenhado para processar cargas "sujas" antes que elas entrem no ecossistema relacional.

## 🛠 Tecnologias Principais

- **Ruby 3.3.0** (Em runtime puro de processo isolado, sem Rails!).
- **RabbitMQ (Bunny)** (Cliente AMQP nativo).
- **ClickHouse** (Destino final das cargas massivas processadas).
- **Aws-sdk-s3** (Acesso de leitura para puxar CSVs, Zips, JSONs ou conectores).
- **Parsers de Alta Performance** (Lazy enumerators, ndjson e CSV otimizados).

## ⚙️ Anatomia do Processamento

### O Padrão Consumidor
O Worker utiliza um design modular orientado a eventos. Ele subscreve tópicos chave como:
- `upload.received.v1`
- `upload.public_link.requested.v1`
- `connector.ingestion.requested.v1`

Quando a mensagem chega, as seguintes etapas ocorrem:
1. **Reserva Idempotente:** Usa o PostgreSQL (tabela `worker_consumed_events`) pra ter certeza que a mensagem não foi e não será processada duas vezes se duplicada pelo Broker.
2. **Download em Memória/Streaming:** Obtém o arquivo apontado pelo bucket S3 ou pela fonte Http / OAuth do Google Drive.
3. **Parse em Fluxo (Lazy Streaming):** Graças aos nossos parsers assíncronos (`Enumerator::Lazy`), o app processa linha por linha evitando OOM (Out-of-memory) em arquivos de 50GB.
4. **Tratamento de Exceções & Quarentena:** Linhas malformadas, schemas estourados e problemas semânticos vão ser anotados, processados e inseridos de forma assíncrona na Quarentena.
5. **Carga Analítica (ClickHouse Warehouse):** Se tudo ocorreu bem, os blocos carregam de fato os dados pesados pro Data Warehouse via inserts maciços.
6. **DLQ Cycle Management:** Se por um acaso o processamento ou conexão falhar de forma retentativa (Transient), a mensagem voltará pra fila um número de vezes. Caso a falha seja estrutural (Poison Pill), a mensagem será roteada via Dead-Letter Routing para o DLQ.

## 🚀 Como Executar

Por ser um Daemon independente do Rails, ele é bastante enxuto:

```bash
cd apps/worker

# Instalação de Gems
bundle install

# Executar o processo daemon (geralmente gerenciado pelo Docker no ambiente completo)
bin/worker
```

Você pode subir mais de uma réplica do Worker sem preocupação, a idempotência no DB e as filas do RabbitMQ garantem uma concorrência segura (Round-Robin nativo do RabbitMQ).

---

## 🧪 Rodando os Testes

Este projeto possui uma suíte extensa cobrindo os testes de comportamento (especialmente os parsers, tratamentos de filas DLQ, limitadores, falhas de conectores).

```bash
bundle exec rspec
```
