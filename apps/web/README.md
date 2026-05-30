# 🎨 Command Center (Frontend Web)

O Command Center é a interface de administração e de usuário do StreamGate. É uma SPA moderna que interage com a API Rails via contratos OpenAPI restritos.

## 🏗️ Arquitetura Orientada a Features (Domains)

Para garantir escalabilidade no frontend, evitamos pastas gigantes e monóliticas como `src/components` ou `src/pages`. Ao invés disso, seguimos uma abordagem de Features (semelhante ao Bounded Contexts do Backend).

A estrutura principal reside em `src/features/`:
- `auth`: Telas de Login, Setup MFA, Callbacks OIDC.
- `uploads`: Submissão de arquivos, gestão de links públicos, perfis de conectores.
- `analytics`: Dashboards de KPI, relatórios operacionais.
- `operations`: Controle da DLQ, logs de auditoria (Eventos), permissões, quarentena e webhooks.

## 🛠️ Stack Tecnológico

- **React 18** + **Vite**
- **Tailwind CSS** para design system.
- **Lucide React** para iconografia.
- **Vitest** + **Testing Library** para unit/integration tests.

## 🚀 Como Executar

O ambiente completo cuida disso. Caso queira rodar isolado:
```bash
pnpm install
pnpm dev
```

## 🧪 Qualidade e Testes

O frontend garante sua robustez mantendo cobertura de testes:
```bash
pnpm test:run
pnpm build
```
