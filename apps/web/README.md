# StreamGate Web

Frontend React do StreamGate.

## Papel do app

A aplicacao web e responsavel por:

- apresentar a experiencia publica do produto
- autenticar o usuario
- iniciar uploads
- acompanhar jobs, quarentena e dashboards
- manter a linguagem visual oficial do projeto

## Estado atual

Hoje o frontend ja possui uma base relevante:

- landing page
- login, cadastro e reset
- route guard
- dashboard shell
- auth mock para viabilizar a experiencia inicial
- testes basicos de UX/logica

A troca do auth mock por integracao real esta prevista no roadmap mestre.

## Comandos locais

```bash
pnpm install
pnpm dev --host
pnpm lint
pnpm build
pnpm test:run
```

## Pilares de implementacao

Toda evolucao do frontend deve respeitar estes principios:

- preservar o modelo visual ja aprovado
- nao criar componentes paralelos sem necessidade
- tratar loading, empty state e erro como parte da entrega
- manter coerencia com `frontend-skill`, `web-design-guidelines`, `tailwind-design-system` e `vercel-react-best-practices`

## Proximo passo esperado

A evolucao planejada do frontend esta em [docs/planning/streamgate-full-sprints-roadmap.md](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md), com foco em:

1. auth real
2. fluxo real de upload
3. dashboard operacional com dados reais
4. dashboard analitico
