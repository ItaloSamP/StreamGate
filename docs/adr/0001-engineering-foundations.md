# ADR 0001 - Fundacoes de Engenharia e Execucao do StreamGate

- **Status:** Aceita
- **Data:** 2026-04-01

## Contexto

O projeto ja possui uma base promissora de monorepo, frontend, compose e CI, mas ainda esta numa zona tipica de arranque: algumas camadas ja contam a historia do produto, enquanto outras ainda contam a historia do template que as originou.

Sem uma decisao explicita de metodo, o risco natural e este:

- frontend avanca mais rapido que backend e inventa contratos tacitos;
- backend implementa endpoints sem dominio fechado;
- worker nasce atrasado e herda responsabilidades demais;
- Docker, CI, Swagger e documentacao ficam sempre um ciclo de entrega atras do codigo.

Esta ADR existe para fixar a ordem certa de construcao do produto e a responsabilidade de cada camada.

## Decisao

### 1. A API e o centro de orquestracao, nao o lugar de processamento pesado

A API Rails sera responsavel por:

- autenticacao e autorizacao;
- emissao de URLs assinadas;
- registro de uploads, jobs e auditoria;
- consulta de visao operacional;
- exposicao de endpoints analiticos preparados.

A API nao deve:

- receber e processar arquivos grandes inline;
- assumir o papel de worker ou ETL;
- concentrar regras que pertencem ao runtime assincrono.

### 2. O worker e um app de producao, nao uma gem utilitaria

O worker existe para:

- consumir eventos do broker;
- ler arquivos do storage;
- processar lotes;
- aplicar validacoes;
- persistir resultados operacionais e analiticos;
- registrar progresso, falha e replay.

O worker nao e acessorio. Ele e parte central do produto e deve ser tratado com o mesmo rigor de contrato, teste e observabilidade da API.

### 3. O frontend deve evoluir por contratos reais, mas preservar o modelo visual ja validado

A base visual ja construida em `apps/web` nao deve ser descartada. O projeto passa a assumir:

- o design atual como baseline oficial;
- `frontend-skill`, `web-design-guidelines`, `tailwind-design-system` e `vercel-react-best-practices` como referencias recorrentes;
- dados reais substituindo mocks sem resetar a experiencia.

### 4. O projeto e WSL-first no Windows

No contexto atual, o fluxo de desenvolvimento no Windows puro cria atrito desnecessario, especialmente em testes e automacao. O ambiente recomendado passa a ser:

- Windows como host;
- WSL2 + Ubuntu como ambiente de trabalho;
- Docker Desktop com integracao WSL;
- scripts `.sh` como fluxo principal;
- scripts `.ps1` apenas como fallback.

### 5. Swagger/OpenAPI e parte da definicao de pronto do backend

Endpoints novos ou alterados so sao considerados prontos quando:

- o contrato OpenAPI foi atualizado;
- exemplos de request/response relevantes foram incluidos;
- a documentacao publica bate com o comportamento real.

### 6. Cado ciclo de entrega fecha com evidencias, nao com percepcao

Nao basta parecer que funciona. Cado ciclo de entrega deve encerrar com:

- documentacao atualizada;
- testes planejados executados;
- CI relevante verde;
- servicos Docker do escopo saudaveis;
- riscos e pendencias registrados.

## Consequencias

### Positivas

- o projeto ganha ordem de construcao mais previsivel;
- frontend, backend e worker param de disputar a narrativa do dominio;
- Swagger, Docker e CI deixam de ser manutencao tardia;
- onboarding tecnico fica mais claro.

### Custos assumidos

- mais documentacao no inicio;
- mais disciplina de contrato antes de implementar feature;
- mais revisoes estruturais em ciclo de entrega de fundacao.

## Decisoes derivadas

As decisoes abaixo passam a valer como extensao pratica desta ADR:

- `docs/planning/` e o backlog executivo principal;
- `.agents/skills/README.md` e o catalogo oficial de skills recorrentes do projeto;
- `apps/web/README.md`, `apps/api/README.md` e `apps/worker/README.md` devem sempre refletir o estado real de cada app;
- `infra/k8s/` so deixa de ser placeholder depois que a stack estiver funcional e endurecida em Docker.
