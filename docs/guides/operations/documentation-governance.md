# Governanca de Documentacao

## Objetivo
Este guia consolida diretrizes de documentation governance para uso consistente no projeto.

## Estado atual
Conteudo alinhado ao fechamento da Sprint 3 e ao planejamento da Sprint 4; atualizar em cada mudanca relevante.


## Regras/Contratos
- As regras normativas deste tema estao descritas nas secoes tecnicas abaixo.
- Mudancas devem manter alinhamento com roadmap, ADRs e READMEs.

## Validacao/Evidencias
- Validar coerencia com README raiz, docs/README e roadmap da release atual.
- Registrar atualizacoes desta pagina no closeout da sprint correspondente.


## Objetivo detalhado

Garantir documentacao profissional, consistente e intuitiva de ponta a ponta no StreamGate.

## Estado atual detalhado

- a documentacao foi reorganizada por dominio em `docs/guides/`.
- os arquivos-ponte da raiz de `docs/guides` foram removidos; apenas `docs/guides/README.md` permanece como indice.
- skill geral de documentacao adotada via `find-skills`: `documentation-writer`.

## Regras de governanca

- toda entrega que altera comportamento deve atualizar documentacao impactada no mesmo ciclo.
- roadmap, guias tecnicos, ADRs e READMEs devem contar a mesma historia de estado atual.
- links internos devem apontar para caminhos oficiais da nova estrutura.
- toda task de documentacao deve usar `documentation-writer` como skill obrigatoria base.
- reestruturacoes editoriais amplas exigem `brainstorming` antes da mudanca.
- mudancas de contrato/API exigem `api-documenter` + `openapi` no mesmo ciclo.
- docs historicos de sprint (closeout) permanecem como registro factual.

## Stack de skills para documentacao

- `find-skills`: descoberta e rastreabilidade de skills.
- `documentation-writer` (obrigatoria): padrao editorial geral (Diataxis) para qualquer atividade documental.
- `brainstorming` (obrigatoria em reestruturacoes): alinhamento de estrutura e intencao antes de reescrita grande.
- `api-documenter` + `openapi` (obrigatorias em mudanca contratual): contratos e docs de API/OpenAPI.

## Padrao editorial minimo

Cada guia ativo deve, sempre que aplicavel, manter:

1. `Objetivo`
2. `Estado atual`
3. `Regras/Contratos`
4. `Validacao/Evidencias`
5. `Referencias`

## Processo de atualizacao

1. identificar impacto documental da mudanca.
2. atualizar arquivos do dominio afetado.
3. atualizar `README.md`, `docs/README.md` e roadmap quando houver impacto transversal.
4. validar links internos e coerencia entre docs.
5. registrar no closeout da sprint os documentos atualizados.

## Validacao e evidencias

- varredura de links internos dos hubs principais:
  - `README.md`
  - `docs/README.md`
  - `docs/planning/streamgate-full-sprints-roadmap.md`
  - `apps/*/README.md`
  - `packages/contracts/README.md`
- checklist de transicao entre sprints executado.

## Referencias

- [Checklist de reavaliacao entre sprints](C:/estudos/StreamGate/docs/guides/quality/sprint-reassessment-checklist.md)
- [Definition of Done](C:/estudos/StreamGate/docs/guides/quality/definition-of-done.md)
- [Roadmap mestre](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md)
