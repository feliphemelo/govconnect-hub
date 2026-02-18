# 🚀 Guia de Deploy - GovChat com Backend Node.js

## ✅ INSTALADOR COMPLETO CRIADO!

O instalador `install-with-backend.sh` configura **TUDO AUTOMATICAMENTE**:

- ✅ Backend Node.js + Express + TypeScript
- ✅ Frontend React + Vite
- ✅ PostgreSQL local
- ✅ Nginx com proxy reverso
- ✅ SSL/HTTPS automático
- ✅ PM2 para gerenciar backend
- ✅ Empresa e administrador no banco
- ✅ Comandos globais úteis

---

## 📋 Pré-requisitos

### 1. **VPS com Ubuntu 22.04+ ou Debian 11+**
- Mínimo 1 GB RAM (recomendado 2 GB)
- 10 GB de disco
- Acesso root via SSH

### 2. **Domínio Configurado**
- DNS apontando para o IP da VPS
- Tipo: A Record
- Nome: seu-dominio (ex: `atendimento.nextplan`)
- Valor: IP da VPS
- TTL: 300 (5 minutos)

**Importante:** Configure o DNS **ANTES** de rodar o instalador para SSL automático!

---

## 🚀 Instalação (2 Comandos)

### 1. Baixar e executar o instalador

```bash
wget https://github.com/feliphemelo/govconnect-hub/raw/main/install-with-backend.sh
chmod +x install-with-backend.sh
sudo ./install-with-backend.sh
```

### 2. Responder as perguntas

O instalador vai perguntar:

1. **Domínio**: `atendimento.nextplan.tec.br`
2. **Nome da Empresa**: `NextPlan Tecnologia`
3. **Email do Administrador**: `feliphe@nextplan.tec.br`
4. **Nome Completo**: `Feliphe Melo`
5. **Senha**: `********` (mínimo 8 caracteres)
6. **Confirmar senha**: `********`

### 3. Aguardar instalação (~15 minutos)

O instalador vai:
- ✅ Atualizar sistema
- ✅ Instalar Node.js 20, PostgreSQL, Nginx, PM2
- ✅ Configurar banco de dados
- ✅ Clonar repositório
- ✅ Instalar dependências (frontend + backend)
- ✅ Executar migrations
- ✅ Build frontend e backend
- ✅ Configurar Nginx e SSL
- ✅ Criar empresa e admin no banco
- ✅ Iniciar backend com PM2

---

## ✅ Após a Instalação

### Acessar o Sistema

```
URL: https://seu-dominio.com
Email: (o que você definiu)
Senha: (a que você definiu)
```

### Comandos Úteis

```bash
# Atualizar sistema (git pull + rebuild + restart)
govchat-update

# Fazer backup do banco
govchat-backup-db

# Ver logs (backend + nginx)
govchat-logs

# Status do backend
pm2 status

# Logs do backend em tempo real
pm2 logs govchat-backend

# Status do Nginx
systemctl status nginx

# Status do PostgreSQL
systemctl status postgresql

# Reiniciar backend
pm2 restart govchat-backend

# Reiniciar Nginx
systemctl restart nginx
```

### Credenciais Salvas

As credenciais ficam salvas em:
```
/var/www/govchat/CREDENCIAIS_INSTALACAO.txt
```

Para ver:
```bash
cat /var/www/govchat/CREDENCIAIS_INSTALACAO.txt
```

---

## 🏗️ Arquitetura Instalada

```
Internet
    │
    ▼
┌─────────────┐
│   Nginx     │  :80 → :443 (redirect)
│  (Reverse   │  :443 → Frontend (/)
│   Proxy)    │  :443 → Backend (/api)
└─────────────┘
    │         │
    │         └──────────┐
    │                    │
    ▼                    ▼
┌─────────────┐    ┌──────────────┐
│  Frontend   │    │   Backend    │
│  (Vite)     │    │  (Node.js)   │
│ /dist       │    │  PM2: port   │
│             │    │  3001        │
└─────────────┘    └──────────────┘
                         │
                         ▼
                   ┌──────────────┐
                   │  PostgreSQL  │
                   │  (Local)     │
                   └──────────────┘
```

### URLs

- **Frontend**: `https://seu-dominio.com/`
- **Backend API**: `https://seu-dominio.com/api/`
- **Health Check**: `https://seu-dominio.com/api/health`

---

## 🔧 Troubleshooting

### Site não abre

1. **Verificar DNS**:
```bash
nslookup seu-dominio.com
# Deve retornar o IP da sua VPS
```

2. **Verificar Nginx**:
```bash
systemctl status nginx
sudo nginx -t
```

3. **Verificar Backend**:
```bash
pm2 status
pm2 logs govchat-backend --lines 50
```

4. **Verificar PostgreSQL**:
```bash
systemctl status postgresql
```

5. **Ver logs**:
```bash
govchat-logs
```

### Erro "Load failed"

```bash
# Verificar se backend está rodando
pm2 status

# Verificar logs do backend
pm2 logs govchat-backend

# Reiniciar backend
pm2 restart govchat-backend

# Verificar health check
curl https://seu-dominio.com/api/health
```

### SSL não foi configurado

Se o DNS não estava configurado durante a instalação:

```bash
sudo certbot --nginx -d seu-dominio.com
```

### Reinstalar

```bash
# O instalador detecta instalação anterior e faz limpeza automática
sudo ./install-with-backend.sh
```

---

## 📊 Monitoramento

### PM2 (Backend)

```bash
# Dashboard interativo
pm2 monit

# Status
pm2 status

# Logs
pm2 logs govchat-backend

# Restart
pm2 restart govchat-backend

# Stop
pm2 stop govchat-backend

# Delete
pm2 delete govchat-backend
```

### Nginx

```bash
# Logs de acesso
tail -f /var/log/nginx/access.log

# Logs de erro
tail -f /var/log/nginx/error.log

# Testar configuração
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

### PostgreSQL

```bash
# Status
systemctl status postgresql

# Conectar ao banco
sudo -u postgres psql -d govchat_nome-empresa

# Ver tabelas
\dt

# Ver conexões ativas
SELECT * FROM pg_stat_activity;
```

---

## 🔄 Atualizar Sistema

### Atualização Automática

```bash
govchat-update
```

Isso vai:
1. `git pull` (baixar atualizações)
2. Instalar dependências (backend + frontend)
3. Build backend e frontend
4. Restart backend (PM2)
5. Reload Nginx

### Atualização Manual

```bash
cd /var/www/govchat

# Pull
git pull origin main

# Backend
cd backend
npm install
npm run build
pm2 restart govchat-backend

# Frontend
cd ..
npm install
npm run build

# Nginx
sudo systemctl reload nginx
```

---

## 💾 Backup e Restore

### Backup Automático

```bash
# Backup manual
govchat-backup-db

# Backup automático diário (cron)
echo "0 2 * * * /usr/local/bin/govchat-backup-db" | sudo crontab -
```

Backups ficam em: `/var/backups/govchat/`

### Restore

```bash
# Listar backups
ls -lh /var/backups/govchat/

# Restore
sudo -u postgres psql -d govchat_nome-empresa < /var/backups/govchat/govchat_20240218_020000.sql
```

---

## 🔒 Segurança

### Recomendações

1. **Alterar senha no primeiro acesso**
2. **Configurar firewall**:
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

3. **Backups regulares** (cron)
4. **Atualizar sistema** regularmente:
```bash
sudo apt update && sudo apt upgrade -y
govchat-update
```

5. **Monitorar logs**:
```bash
govchat-logs
```

---

## 📞 Suporte

### Problemas?

1. Ver logs: `govchat-logs`
2. Verificar status: `pm2 status && systemctl status nginx postgresql`
3. Abrir issue no GitHub: https://github.com/feliphemelo/govconnect-hub/issues

### Documentação

- **Backend**: `/var/www/govchat/backend/README.md`
- **Migrations**: `/var/www/govchat/supabase/migrations/`
- **GitHub**: https://github.com/feliphemelo/govconnect-hub

---

## 🎉 Pronto!

Seu sistema GovChat está instalado e funcionando com:

- ✅ Backend próprio (Node.js + Express)
- ✅ Frontend React
- ✅ PostgreSQL local
- ✅ HTTPS/SSL
- ✅ PM2 gerenciando backend
- ✅ Nginx como proxy
- ✅ Comandos úteis
- ✅ Backups automáticos (se configurado)

**Acesse**: https://seu-dominio.com

**Repositório**: https://github.com/feliphemelo/govconnect-hub
