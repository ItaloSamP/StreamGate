# 📖 Manual do Usuário - StreamGate

Bem-vindo ao StreamGate! Este manual ajudará você a entender como utilizar as principais funcionalidades do painel administrativo (Command Center).

## 📊 Dashboard Principal
A tela inicial fornece uma visão consolidada de todas as operações em andamento.
- **Métricas Chave**: Visualize o volume de uploads e os status de varreduras antimalware em tempo real.
- **Gráficos de Tendência**: Acompanhe o tráfego e a ingestão de dados da última semana.

## 📁 Gestão de Uploads
A plataforma permite enviar arquivos com segurança de múltiplas formas.
- **Upload Local**: Arraste e solte arquivos ou navegue pelo sistema para enviar.
- **Link Público**: Gere URLs seguras para que terceiros possam enviar arquivos diretamente para a sua quarentena (sem precisarem de credenciais).
- **Conectores**: Sincronize com Google Drive ou S3 buckets diretamente. 

## 🛡️ Operações e Quarentena (Segurança)
Todo arquivo passa por uma varredura intensa de malwares no backend.
- **Área de Quarentena**: Arquivos detectados como maliciosos ou de origem suspeita ficarão retidos nesta área. Administradores podem forçar a aprovação (se houver justificativa) ou expurgar o arquivo.
- **Logs de Auditoria**: Qualquer alteração, como liberação manual de arquivos em quarentena ou convites de novos membros, gera um log inalterável.

## ⚙️ Configurações (SaaS e Identity)
A aba de configurações é onde administradores governam o ambiente (Organization).
- **Perfis de Conectores**: Gerencie credenciais e tokens (ex: chaves do Google Drive).
- **Segurança e SSO**: Force autenticação multifator (MFA) ou ative login automático via provedores OIDC (Google Workspace, Microsoft Entra ID).
- **SaaS Readiness**: Acompanhe os limites de consumo da sua organização (storage total, banda).
