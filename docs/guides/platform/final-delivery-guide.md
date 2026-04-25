# Guia de Fechamento do Produto

## Objetivo

Este guia traduz o estado real do StreamGate apos o fechamento da Sprint 5 em um plano pratico para chegar a uma entrega de produto sem lacunas escondidas.

Ele existe para responder quatro perguntas de forma objetiva:

- o que ja e produto funcional de verdade;
- o que hoje ainda e principalmente scaffold visual ou superficie preparada;
- o que falta para chamar o StreamGate de entrega pronta, e nao apenas base promissora;
- em que ordem devemos fechar o restante para evitar retrabalho, desvios de prioridade e buracos de release.

Este documento nao substitui a visao de produto nem o roadmap mestre. Ele e a ponte entre os dois: pega a visao aprovada, compara com o estado entregue e orienta a fase de fechamento.

## Como ler este guia

Use este documento como referencia principal quando a pergunta for "o que falta para entregar o produto".

Relacao com os outros documentos:

- `docs/product/vision.md`: define a visao e a direcao de produto.
- `docs/planning/streamgate-full-sprints-roadmap.md`: registra a cadencia de sprints, gates e evidencias de fechamento.
- `docs/sprints/SPRINT-05-closeout.md`: registra o fechamento funcional da Sprint 5.
- este guia: transforma o estado atual em trilha de finalizacao do produto.

Regra de uso:

- se uma frente estiver marcada aqui como `scaffold` ou `parcial`, ela nao deve ser tratada como entrega final, mesmo que a UI esteja forte;
- se uma frente estiver marcada como `funcional`, ela ja pode ser usada como base real para wiring, refinamento e validacao final;
- se uma decisao de produto mudar, atualize primeiro `docs/product/vision.md` e depois sincronize este guia.

## Estado real do produto em 2026-04-22

A base do produto deixou de ser um esqueleto. O StreamGate ja tem um nucleo operacional consistente, com backend, worker, frontend, contratos, docs e gates reais para a espinha dorsal da v1.

Leitura sintetica:

- o nucleo operacional do produto esta materializado;
- o shell do workspace e a dashboard caminham para a forma final do produto, mas parte dessa superficie ainda mistura dado real com scaffold;
- a maior distancia para a entrega final nao esta mais na fundacao tecnica, e sim em fechar as superficies finais, a exploracao analitica e a conectividade futura aprovada na visao.

Termometro pragmatico de maturidade:

- `v1 operacional forte`: perto;
- `visao final completa do produto`: ainda existe um bloco relevante pela frente.

## Matriz: funcional x scaffold x faltando

### Ja funcional de verdade

Estas frentes ja devem ser tratadas como produto real:

| Frente | Estado | Observacoes |
| --- | --- | --- |
| Auth e sessao | `funcional` | login, protecao de rotas, bootstrap de sessao e UX de expiracao real |
| Upload local | `funcional` | signed URL, registro de upload, criacao de job e listagens reais |
| Pipeline assincrono | `funcional` | API, worker, RabbitMQ, idempotencia e estado de job reais |
| Quarantine e DLQ | `funcional` | leituras operacionais, detalhes e replay controlado |
| Safe operations | `funcional` | retry, resolve e replay request/approve/execute com RBAC, auditoria e idempotencia |
| Artefatos finais | `funcional` | `processed_dataset`, `quality_report`, `audit_report`, historico e signed download |
| Notificacoes | `funcional` | `in_app`, `email`, `webhook`, inbox, arquivamento, filtros e teste de webhook |
| Auditoria | `funcional` | trilha navegavel, eventos operacionais e detalhes por recurso |
| Docs/contratos/gates | `funcional` | OpenAPI, contracts, smokes, reports, closeout e repo readiness |

### Ja forte visualmente, mas ainda parcial como produto final

Estas frentes ja ajudam muito na experiencia final, mas ainda nao devem ser lidas como completamente entregues:

| Frente | Estado | O que falta |
| --- | --- | --- |
| Dashboard v3 | `parcial` | wiring completo card a card, consolidacao dos blocos que ainda usam scaffold/derivacao local |
| Shell do workspace | `parcial` | fechamento fino de fidelidade visual, consistencia entre todas as rotas e eliminacao de pequenos desvios de UX |
| ClickHouse | `funcional backend/worker` | warehouse OLAP minimo com job + registros, fallback honesto e contrato pronto para front |
| ETL Explorer | `funcional backend/worker` | lineage por job com batches, attempts, quarantine, artifacts, warnings e audit refs |
| Camada analitica visivel no front | `parcial` | leituras mais profundas, exploracao consistente e melhor narrativa entre operacional x analitico |

### Aprovado na visao, mas ainda nao materializado

Estas frentes continuam fora da entrega funcional atual:

| Frente | Estado | Leitura |
| --- | --- | --- |
| `google_drive` | `discovery-only` | aprovado na visao, sem implementacao funcional |
| `s3` | `discovery-only` | aprovado na visao, sem implementacao funcional |
| `http_url` | `discovery-only` | aprovado na visao, sem implementacao funcional |
| `oauth_delegated` | `discovery-only` | aprovado na visao, sem implementacao funcional |
| tempo real alem de polling curto | `futuro` | nao e bloqueador da entrega atual |
| automacao completa de cluster | `futuro` | fora da entrega imediata |

## O que significa "produto entregue"

O StreamGate so deve ser tratado como entregue quando todos os itens abaixo forem verdade ao mesmo tempo.

### 1. O fluxo principal esta inteiro

Fluxo minimo de entrega:

- usuario autenticado entra no workspace final;
- inicia ingestao por pelo menos um caminho suportado oficialmente;
- acompanha jobs e estados com clareza;
- entende falhas e consegue navegar por quarantine, audit e operacao segura;
- recebe ou consulta notificacoes relevantes;
- baixa os artefatos finais corretos;
- o time interno consegue auditar, resolver, reprocessar e explicar o que aconteceu.

### 2. A dashboard nao e mais so uma tela bonita

A dashboard final precisa ser lida como command center real:

- cada bloco principal tem papel claro;
- o usuario entende o que e leitura real e o que ainda nao existe;
- nao existem cards "cenograficos" que parecam prontos mas escondam ausencia de produto;
- os drilldowns saem da dashboard para paginas reais e consistentes.

### 3. O produto fecha a narrativa de ingestao e operacao

A entrega final nao pode parecer duas metades desconectadas.

Sinais de fechamento real:

- ingestao, jobs, notificacoes, artefatos e auditoria contam a mesma historia;
- UI operacional, contratos e docs usam a mesma linguagem;
- roles `admin` e `operator` compartilham a mesma espinha visual, mudando apenas profundidade e mutacao permitida.

### 4. A release nao depende de contexto escondido

A entrega nao pode depender de memoria oral da equipe.

Antes de chamar de entregue, precisamos ter:

- docs sincronizadas com o produto real;
- gates oficiais reproduziveis;
- limite claro entre `implementation` e `environment` nos runners;
- checklist final de release/rollback seguido;
- backlog residual explicitamente classificado como `pos-v1`, e nao esquecido.

## Gaps reais para a entrega final

### Bloco A - Fechar o workspace final

Objetivo: fazer o shell e a dashboard representarem o produto final sem mascarar ausencia de logica.

Escopo:

- fechar a fidelidade visual do shell autenticado em relacao ao prototipo aprovado;
- concluir a dashboard v3 como command center real;
- revisar bloco por bloco da dashboard e classificar cada um em `real`, `derivado` ou `placeholder transitivo`;
- remover qualquer area que passe impressao falsa de feature pronta sem trilha de materializacao definida.

Sinais de pronto:

- sidebar e topbar fixas, consistentes e finais;
- dashboard navegavel, densa e confiavel;
- cards principais ligados a fontes de dados reais ou a placeholders explicitamente controlados;
- `ClickHouse` e `ETL Explorer` com superficies coerentes, mesmo que ainda limitadas.

### Bloco B - Fechar a experiencia de ingestao da v1

Objetivo: transformar a entrada de dados em um fluxo finalizado do ponto de vista de produto, e nao apenas de infraestrutura funcional.

Escopo:

- revisar `UploadPage` contra a visao de fluxo hibrido (`guided` e `advanced`);
- decidir o que entra de forma real no fechamento da v1 e o que fica claramente postergado;
- garantir coerencia entre dashboard, CTA global `+ Upload` e jornada completa de ingestao;
- revisar mensagens de erro, validacao, estados de progresso e handoff para acompanhamento do job.

Sinais de pronto:

- upload local e claramente o caminho oficial da v1;
- UX de ingestao esta pronta para usuario final, nao so para time interno;
- qualquer caminho nao implementado esta rotulado como futuro e nao confunde o usuario.

### Bloco C - Materializar a fronteira analitica

Objetivo: reduzir o gap entre a promessa analitica do produto e o que o usuario realmente consegue explorar hoje.

Escopo:

- definir o papel real de `Analytics`, `ClickHouse` e `ETL Explorer` na v1;
- escolher o minimo util que precisa estar vivo para justificar a camada analitica na entrega;
- ligar consultas, filtros e visualizacoes a dados consistentes;
- evitar tres superficies diferentes contando a mesma historia sem um criterio claro.

Sinais de pronto:

- o usuario entende onde ve leitura operacional e onde faz exploracao analitica;
- existe uma superficie analitica que entrega valor real, nao apenas promessa arquitetural;
- o nome `ClickHouse` nao aparece so como placeholder de tecnologia, mas como parte compreensivel do produto.

### Bloco D - Decidir o que e v1 e o que e pos-v1 em conectividade

Objetivo: impedir que conectores discovery-only fiquem em limbo e contaminem a leitura de entrega.

Escopo:

- decidir explicitamente se a entrega final inclui somente `upload local` ou tambem algum primeiro caminho de `external_link`;
- manter `google_drive`, `s3`, `http_url` e `oauth_delegated` fora da narrativa de entregue enquanto nao houver implementacao funcional;
- ajustar docs e UI para refletir essa fronteira sem ambiguidade.

Sinais de pronto:

- a narrativa comercial e tecnica do produto nao promete mais do que a v1 realmente entrega;
- o backlog de conectores fica priorizado, mas sem ser confundido com feature pronta.

Estado Sprint 6 backend/worker:

- `public_link` entra como primeiro caminho funcional de `external_link`;
- `oauth_delegated`, `google_drive`, `s3` e `http_url` continuam fora da entrega;
- dashboard, warehouse e lineage passam a ter endpoints reais para o frontend, com `event_log`, ClickHouse real para warehouse, fallback `postgres_derived`, warnings tecnicos e empty states honestos.

### Bloco E - Fechamento de produto e release

Objetivo: transformar o estado "quase pronto" em entrega confiavel.

Escopo:

- rodada final de UX e consistencia por papel;
- revisao de docs centrais (`vision`, roadmap, workspace map, api docs, security, closeout da release);
- validacao final dos gates oficiais;
- registro do backlog residual aceito para a fase seguinte.

Sinais de pronto:

- existe uma leitura unica e coerente do que foi entregue;
- a release pode ser explicada para engenharia, operacao e stakeholder sem contradicao;
- o backlog residual esta nomeado, priorizado e separado da entrega.

## Ordem recomendada para finalizar o produto sem retrabalho

### Etapa 1 - Fechar shell e dashboard primeiro

Motivo:

- e o ponto onde o usuario percebe mais rapidamente se o produto parece final ou inacabado;
- varios fluxos ja estao funcionais, mas ainda aparecem dentro de uma moldura que nao comunica produto fechado;
- sem essa etapa, o wiring seguinte fica espalhado e sujeito a retrabalho visual.

Prioridade dentro da etapa:

1. shell autenticado final;
2. dashboard v3 com classificacao dos blocos;
3. consistencia de navegacao e estados de permissao.

### Etapa 2 - Fechar a jornada de ingestao da v1

Motivo:

- a dashboard passa a apontar para `+ Upload` como CTA principal;
- a ingestao e a porta de entrada funcional do produto atual;
- qualquer ambiguidade aqui contamina a leitura da entrega inteira.

Prioridade dentro da etapa:

1. ajustar UX final do upload local;
2. decidir o papel de `guided` e `advanced` na v1;
3. alinhar mensagens, estados e handoff para jobs.

### Etapa 3 - Materializar a superficie analitica minima

Motivo:

- sem isso, a visao analitica continua parecendo promessa mais do que entrega;
- essa etapa precisa acontecer depois do shell, para evitar construir exploracao em cima de uma arquitetura visual ainda instavel.

Prioridade dentro da etapa:

1. definir papel de `Analytics`, `ClickHouse` e `ETL Explorer`;
2. tornar pelo menos uma dessas superficies claramente util e real;
3. eliminar redundancias entre elas.

### Etapa 4 - Fechar a narrativa de release

Motivo:

- essa e a etapa que impede "entrega que ainda depende de contexto";
- sem ela, o produto pode ate funcionar, mas segue dificil de explicar, manter e evoluir.

Prioridade dentro da etapa:

1. sincronizar docs centrais;
2. reexecutar gates oficiais;
3. revisar backlog residual;
4. escrever closeout de release.

## O que nao pode ficar invisivel daqui para frente

Itens que devem ser sempre classificados explicitamente:

- o que e dado real;
- o que e scaffold visual temporario;
- o que e discovery-only;
- o que e bloqueador de release;
- o que e backlog pos-v1.

Regra pratica:

- se uma superficie ainda depender de placeholder para parecer completa, registrar isso na propria task e no closeout da frente;
- se uma feature estiver aprovada na visao, mas nao entregue, nao deixar a UI ou a doc sugerirem o contrario;
- se um runner falhar por ambiente, registrar o residual sem misturar com regressao de implementacao.

## Checklist oficial para declarar a entrega pronta

### Produto

- [ ] shell autenticado finalizado e coerente com o prototipo aprovado
- [ ] dashboard v3 fechada como command center real
- [ ] upload local fechado como experiencia final da v1
- [ ] superfices analiticas com papel real definido e implementado no minimo util
- [ ] backlog de conectores e ingestao externa classificado sem ambiguidade

### Backend e worker

- [ ] pipeline assincrono validado ponta a ponta
- [ ] operacao segura validada com RBAC, motivo, auditoria e idempotencia
- [ ] artefatos finais validos e baixaveis
- [ ] notificacoes e deliveries coerentes com eventos operacionais
- [ ] auditoria navegavel e explicavel por recurso

### Frontend

- [ ] rotas principais coerentes entre shell, dashboard e modulos
- [ ] estados de denied/error/loading consistentes em superficies sensiveis
- [ ] visual final sem cards cenograficos ou lacunas de produto disfarcadas
- [ ] mobile/tablet utilizaveis nas rotas principais

### Documentacao

- [ ] `docs/product/vision.md` reflete exatamente a entrega
- [ ] `docs/planning/streamgate-full-sprints-roadmap.md` sincronizado com o estado real
- [ ] `docs/guides/frontend/frontend-workspace-map.md` descreve o workspace final
- [ ] `docs/guides/backend/api-docs.md` e OpenAPI sincronizados
- [ ] docs de seguranca e release atualizadas
- [ ] closeout final de release escrito

### Testes e operacao

- [ ] fast gates relevantes verdes
- [ ] smoke operacional verde
- [ ] full-closeout verde ou residual de ambiente explicitamente classificado
- [ ] hub `docs/reports/index.html` atualizado
- [ ] backlog residual aceito explicitamente

## Recomendacao de governanca daqui para frente

Para fechar o produto com eficiencia, toda nova frente deve nascer com tres rotulos explicitos:

- `entrega real agora`
- `scaffold para wiring posterior`
- `futuro / discovery-only`

Isso evita tres tipos de desperdicio:

- gastar tempo fechando visual de algo que ainda nao tem papel funcional decidido;
- assumir como entregue algo que ainda depende de muito wiring;
- abrir novas frentes enquanto as ja aprovadas seguem sem fechamento.

Regra de prioridade recomendada:

1. fechar o que ja esta quase pronto e tem impacto direto na narrativa de produto;
2. materializar o minimo util das superficies que hoje ainda sao scaffold;
3. empurrar conectores e expansoes para a fase seguinte so depois da entrega principal ficar limpa.

## Referencias

- [Visao do produto](C:/estudos/StreamGate/docs/product/vision.md)
- [Roadmap mestre](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md)
- [Closeout Sprint 5](C:/estudos/StreamGate/docs/sprints/SPRINT-05-closeout.md)
- [Mapa do workspace frontend](C:/estudos/StreamGate/docs/guides/frontend/frontend-workspace-map.md)
- [Roadmap DevOps](C:/estudos/StreamGate/docs/guides/platform/devops-roadmap.md)
- [Hub de reports](C:/estudos/StreamGate/docs/reports/index.html)
