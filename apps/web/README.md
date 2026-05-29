# StreamGate Web Command Center

Painel de controle visual e interface primária de operação do sistema StreamGate. É aqui onde o fluxo de Ingestão de Dados ganha vida.

## 🛠 Tecnologias Principais

- **React 18 + Vite** (Rapidez de build, Hot Module Replacement absurdo).
- **TypeScript** (Tipagem forte sincronizada aos contratos de Backend).
- **Tailwind CSS v4 + Tailwind Animate** (Design System com Glassmorphism, Micro-interaçoes e variaveis OkLCH).
- **React Router v6** (Navegação client-side limpa com Lazy Loading agressivo).
- **Radix UI Primitives** (Acessibilidade garantida com design sem restrições).

## 👁️‍🗨️ Princípios de Design & Arquitetura

O frontend do StreamGate não é apenas mais um dashboard; ele utiliza o conceito de **"Anti-Cliché"** UI/UX.

- **Vibrant Dark Mode**: Esqueça cinza sólido. Usamos fundos com gradientes radiais animados e tons profundos (`#0a0a0a` / `#050505`).
- **Glassmorphism Acentuado**: Blur de fundo, contornos semi-transparentes de luminosidade nas bordas.
- **Feedback Sensorial UI**: Elementos saltam e ganham glow ao hover. A sensação é de uma aplicação nativa e responsiva em tempo real.
- **Componentização Avançada**: Componentes grandes como a tela de *Upload* ou a tela de *Settings* foram quebrados em sub-painéis menores (`ConnectorProfilesPanel`, `GoogleDrivePanel`, `SecurityAdminPanel`) isolando as responsabilidades de estado.

## ⚡ Fluxos Importantes Suportados

1. **Upload via S3 Signed URLs:** O browser se comunica com a API para assinar uma key e depois envia diretamente ao bucket.
2. **Ingestões por Link Público:** Formulário simples onde um analista pode colar uma URL HTTPS, pro Worker baixar lá do outro lado.
3. **Delegação OAuth (Google Drive Connectors):** Fluxos em que um Admin autentica uma vez com a conta Google, e o frontend renderiza visualizadores nativos para navegar pelo Google Drive e selecionar os arquivos que precisam ser importados de forma granular.

---

## 🚀 Como Desenvolver

Estando na pasta raiz ou em `apps/web/`:

### Instalação

Utilizamos `pnpm` como gerenciador de pacotes ultra-rápido.

```bash
pnpm install
```

### Rodando o ambiente local de dev

```bash
pnpm dev
```
*(O painel ficará acessível geralmente em http://localhost:5173 - O Vite irá rotear as requisições API corretamente via proxy se configurado).*

---

## 🧪 Testes de Frontend

Usamos o **Vitest** + **Testing Library** para a camada de componentes.

```bash
# Rodar todos os testes no terminal
pnpm test:run

# Rodar testes de integração isolados
pnpm test:integration
```

## 🏗️ Build

Para compilar os artefatos estáticos prontos para subida (Nginx / S3 Edge, Vercel ou Netlify):

```bash
pnpm build
```
*(Isso vai gerar a pasta `dist` minificada e com assets assíncronos graças ao Lazy Loading)*.
