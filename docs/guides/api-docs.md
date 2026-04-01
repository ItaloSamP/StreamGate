# Swagger/OpenAPI da API

A API Rails do StreamGate agora esta preparada para servir documentacao OpenAPI/Swagger no futuro.

## O que ja ficou pronto

- gems `rswag-api` e `rswag-ui` adicionadas ao `Gemfile` da API
- rota de documentacao montada em `/api-docs` quando as gems estiverem disponiveis
- configuracao de `openapi_root` apontando para `apps/api/openapi`
- arquivo inicial `apps/api/openapi/v1/openapi.yaml`
- primeiro endpoint documentado: `GET /up`

## Como ativar localmente

Dentro de [apps/api/Gemfile](C:/estudos/StreamGate/apps/api/Gemfile), rode o bundle normalmente para instalar as gems novas.

Exemplo:

```bash
cd apps/api
bundle install
bundle exec rails server
```

Depois disso, a UI deve ficar disponivel em:

- [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Estrategia recomendada daqui para frente

- manter o arquivo OpenAPI fonte em `apps/api/openapi/v1/openapi.yaml`
- documentar cada recurso novo no mesmo PR em que o endpoint for criado
- padronizar tags por dominio, por exemplo `Uploads`, `Jobs`, `Quarantine`, `Analytics`
- adicionar exemplos de request e response assim que os contratos forem estabilizando
- quando a API crescer, separar a spec por arquivos e gerar um bundle final de OpenAPI

## Proximo passo natural

Quando os primeiros endpoints de negocio forem implementados, vale decidir entre:

1. manter a spec manual em YAML para ter mais controle no inicio
2. evoluir para geracao via request specs no futuro, caso o time queira acoplar documentacao a testes de contrato
