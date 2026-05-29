# StreamGate Documentation

Bem-vindo ao portal de documentação do StreamGate. O objetivo desta pasta é atuar como uma base de conhecimento persistente para novos desenvolvedores e mantenedores. 

## 🗺️ O que você encontra aqui

- **`guides/`**: Manuais passo a passo para configuração de infraestrutura, runbooks operacionais, e procedimentos de disaster recovery. (Ex: *Como recuperar do zero caso o RabbitMQ perca todos os volumes*).
- **`planning/`**: Artefatos, escopos, RFCs (Request for Comments) e arquivos do ciclo de vida de releases (ex: `release-implementation-plan.md`, `release-tasks.md`). É aqui onde as intenções de arquitetura futuras e o progresso da IA são registrados.
- **`reports/`**: Logs estáticos, saídas HTML do vitest coverage, rspec coverage e relatórios consolidados das execuções do CI. É a base de rastreabilidade de saúde de código.
- **`assets/`**: Imagens, diagramas Mermaid, e capturas de tela usadas para ilustrar a documentação nos Readmes e neste portal.

## ✍️ Princípios de Escrita

Quando adicionar um documento novo:
1. **Evite Clichês:** Sem parágrafos enchendo linguiça. Seja direto.
2. **Contexto Antes da Ação:** Se for um guia, explique o problema *antes* de jogar 10 scripts na tela.
3. **Mantenha Versionado junto do Código:** Atualizou a lógica do DLQ na API? A doc do *Worker Runtime Runbook* também deve mudar na mesma Pull Request.

---
*"Documentação obsoleta é pior que nenhuma documentação. O código muda; o texto acompanha."*
