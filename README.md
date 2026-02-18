# 🏛️ GovChat - Sistema de Atendimento ao Cidadão

Sistema completo de atendimento via WhatsApp para órgãos governamentais, com chatbot inteligente, gestão de filas, relatórios e muito mais.

[![Deploy](https://img.shields.io/badge/Deploy-VPS-blue)](docs/DEPLOY_VPS.md)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-v20-339933?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org)

---

## 🚀 Instalação Rápida em VPS

### Opção 1: NextPlan (Pré-configurado) 🌟

```bash
curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install-nextplan.sh | sudo bash
```

**Configuração:**
- Domínio: `atendimento.nextplan.tec.br`
- Superadmin: `feliphe@nextplan.tec.br`
- PostgreSQL local incluído

📚 **[Guia NextPlan](INSTALL_NEXTPLAN.md)**

---

### Opção 2: Com Supabase Cloud (Recomendado para começar)

```bash
curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install.sh | sudo bash
```

**Com domínio:**
```bash
curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install.sh | sudo bash -s seu-dominio.gov.br
```

**Tempo de instalação:** ~10 minutos

---

### Opção 3: Com PostgreSQL Local (Auto-hospedado)

```bash
curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install-local-db.sh | sudo bash
```

**Com domínio:**
```bash
curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install-local-db.sh | sudo bash -s seu-dominio.gov.br
```

**Tempo de instalação:** ~15 minutos  
**Vantagens:** Controle total, sem custos cloud, dados 100% locais

📚 **[Guia Completo PostgreSQL Local](docs/DEPLOY_POSTGRESQL.md)**

---

## ✨ Funcionalidades

### 🤖 Chatbot Inteligente
- Atendimento automático 24/7
- IA com Google Gemini 2.5 Flash
- Personalidades configuráveis (formal, casual, normal)
- Base de conhecimento customizável
- Escalamento para atendimento humano

### 👥 Gestão de Atendimento
- Dashboard com métricas em tempo real
- Sistema de filas por setor
- Status de atendentes (online/offline/ocupado)
- Atribuição automática e manual de conversas
- Histórico completo de mensagens

### 📊 Relatórios e Análises
- Gráficos mensais detalhados
- Estatísticas de atendimento
- Relatórios de performance
- Exportação de dados

### 🔐 Multi-tenancy e Segurança
- Suporte a múltiplas empresas
- Sistema de roles (admin, manager, agent, broadcaster)
- Row Level Security (RLS) no banco
- White-label (logo e cores personalizadas)
- Autenticação segura com Supabase

### 📢 Recursos Avançados
- Envio em massa (broadcasts)
- Enquetes interativas
- Assinaturas digitais de documentos
- Chat interno da equipe
- Construtor de fluxos visuais
- Sistema de créditos
- Webhooks para integrações

---

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Autenticação**: Supabase Auth
- **IA**: Google Gemini 2.5 Flash via Lovable AI Gateway
- **Deploy**: Nginx + SSL (Let's Encrypt)

---

## 📦 O que o instalador faz?

O script `install.sh` automatiza completamente a instalação:

✅ Atualiza o sistema operacional
✅ Instala Node.js v20, Nginx, Certbot
✅ Configura firewall (UFW)
✅ Clona o repositório
✅ Instala todas as dependências
✅ Gera build de produção
✅ Configura Nginx otimizado
✅ Configura SSL com Let's Encrypt (se domínio fornecido)
✅ Cria comando global `govchat-update`

---

## 📋 Requisitos da VPS

- **Sistema**: Ubuntu 22.04 LTS (ou superior)
- **CPU**: 1 vCPU (2 vCPU recomendado)
- **RAM**: 1GB (2GB recomendado)
- **Disco**: 20GB SSD
- **Acesso**: SSH com sudo

---

## 🎯 Configuração Pós-Instalação

### 1. Configure as Variáveis de Ambiente

```bash
nano /var/www/govchat/.env
```

Adicione suas credenciais do Supabase:

```env
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_chave_aqui"
VITE_SUPABASE_PROJECT_ID="seu_project_id"
```

### 2. Execute o Build (se não foi feito automaticamente)

```bash
cd /var/www/govchat
npm run build
```

### 3. Configure o Domínio no Supabase

Acesse: https://app.supabase.com/project/SEU_PROJECT_ID/auth/url-configuration

Adicione nas **Redirect URLs**:
- `https://seu-dominio.gov.br`
- `https://seu-dominio.gov.br/auth/callback`

### 4. Acesse o Sistema

Abra o navegador e acesse:
- Com domínio: `https://seu-dominio.gov.br`
- Com IP: `http://seu-ip-vps`

---

## 🔄 Atualização do Sistema

### Comando Global

```bash
govchat-update
```

### Ou manualmente

```bash
cd /var/www/govchat
./scripts/update.sh
```

---

## 📊 Monitoramento

### Verificar Status

```bash
cd /var/www/govchat
./scripts/monitor.sh
```

### Ver Logs

```bash
# Logs de erro
sudo tail -f /var/log/nginx/govchat_error.log

# Logs de acesso
sudo tail -f /var/log/nginx/govchat_access.log
```

---

## 📚 Documentação

- **[Guia Rápido (5 min)](QUICKSTART_VPS.md)** - Deploy rápido
- **[Guia Completo](docs/DEPLOY_VPS.md)** - Documentação detalhada
- **[Scripts](scripts/README.md)** - Documentação dos scripts
- **[Deploy Manual](DEPLOY.md)** - Deploy passo a passo

---

## 💻 Desenvolvimento Local

### Clonar o Repositório

```bash
git clone https://github.com/feliphemelo/govconnect-hub.git
cd govconnect-hub
```

### Instalar Dependências

```bash
npm install
```

### Configurar Variáveis

```bash
cp .env.production.template .env
nano .env
```

### Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:8080`

---

## 🏗️ Estrutura do Projeto

```
govconnect-hub/
├── src/                      # Código fonte
│   ├── components/          # Componentes React
│   ├── pages/               # Páginas da aplicação
│   ├── hooks/               # React hooks
│   ├── integrations/        # Integrações (Supabase)
│   └── lib/                 # Utilitários
├── supabase/                # Backend
│   ├── migrations/          # Migrações do banco
│   └── functions/           # Edge Functions
├── scripts/                 # Scripts de deploy
│   ├── install.sh          # Instalador principal
│   ├── vps-setup.sh        # Setup da VPS
│   ├── update.sh           # Atualização
│   └── monitor.sh          # Monitoramento
├── docs/                    # Documentação
└── dist/                    # Build de produção
```

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Verificar código
npm run test         # Executar testes

# Produção
govchat-update                          # Atualizar sistema
cd /var/www/govchat && ./scripts/monitor.sh  # Monitorar
sudo systemctl reload nginx             # Recarregar Nginx
sudo certbot renew                      # Renovar SSL
```

---

## 🚨 Troubleshooting

### Site não carrega

```bash
sudo systemctl status nginx
sudo nginx -t
cd /var/www/govchat && npm run build
sudo systemctl reload nginx
```

### Login não funciona

- Verifique se o domínio está nas Redirect URLs do Supabase
- Verifique as variáveis no `.env`

### SSL não funciona

```bash
sudo certbot --nginx -d seu-dominio.gov.br
```

### Disco cheio

```bash
# Limpar logs antigos
sudo journalctl --vacuum-time=7d

# Limpar cache do npm
npm cache clean --force
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🙏 Agradecimentos

- [Lovable](https://lovable.dev) - Plataforma de desenvolvimento
- [Supabase](https://supabase.com) - Backend as a Service
- [shadcn/ui](https://ui.shadcn.com) - Componentes UI
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS

---

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/feliphemelo/govconnect-hub/issues)
- **Documentação**: [docs/DEPLOY_VPS.md](docs/DEPLOY_VPS.md)

---

## 🎉 Deploy Agora!

```bash
curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install.sh | sudo bash -s seu-dominio.gov.br
```

**Desenvolvido com ❤️ para o setor público brasileiro**
