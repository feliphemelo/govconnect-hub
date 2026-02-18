# 🚀 Deploy Rápido em VPS - GovChat

## Guia em 5 Minutos

### Pré-requisitos
- VPS Ubuntu 22.04 com acesso SSH
- Domínio apontando para o IP (opcional)
- Credenciais do Supabase

---

## 🎯 Opção 1: Automático (Recomendado)

### Na sua VPS:

```bash
# 1. Conectar na VPS
ssh usuario@seu-ip-vps

# 2. Baixar o repositório
git clone https://github.com/seu-usuario/seu-repo.git /var/www/govchat
cd /var/www/govchat

# 3. Executar setup automático
./scripts/vps-setup.sh seu-dominio.gov.br

# 4. Configurar variáveis de ambiente
nano .env
# Adicione suas credenciais do Supabase

# 5. Gerar build
npm run build

# Pronto! Acesse: https://seu-dominio.gov.br
```

**Tempo total: ~10 minutos**

---

## 🛠️ Opção 2: Manual

```bash
# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx

# 3. Configurar firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# 4. Clonar projeto
sudo mkdir -p /var/www/govchat
sudo chown $USER:$USER /var/www/govchat
git clone SEU_REPO /var/www/govchat
cd /var/www/govchat

# 5. Configurar .env
cp .env.production.template .env
nano .env  # Edite com suas credenciais

# 6. Build
npm install
npm run build

# 7. Configurar Nginx
sudo cp scripts/nginx-govchat.conf /etc/nginx/sites-available/govchat
sudo nano /etc/nginx/sites-available/govchat  # Edite o domínio
sudo ln -s /etc/nginx/sites-available/govchat /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 8. SSL
sudo certbot --nginx -d seu-dominio.gov.br
```

---

## 📊 Comandos Úteis

### Atualizar sistema
```bash
cd /var/www/govchat
./scripts/update.sh
```

### Monitorar status
```bash
./scripts/monitor.sh
```

### Ver logs
```bash
sudo tail -f /var/log/nginx/govchat_error.log
```

### Reiniciar Nginx
```bash
sudo systemctl reload nginx
```

---

## ⚙️ Configuração do Supabase

### 1. Obter Credenciais

Acesse: https://app.supabase.com/project/SEU_PROJECT_ID/settings/api

Copie:
- `URL` → `VITE_SUPABASE_URL`
- `anon/public key` → `VITE_SUPABASE_PUBLISHABLE_KEY`
- `Project ID` → `VITE_SUPABASE_PROJECT_ID`

### 2. Configurar Domínio

Acesse: https://app.supabase.com/project/SEU_PROJECT_ID/auth/url-configuration

Adicione em **Redirect URLs**:
- `https://seu-dominio.gov.br`
- `https://seu-dominio.gov.br/auth/callback`

---

## 🔒 Segurança

✅ Firewall configurado automaticamente
✅ SSL com Let's Encrypt (renovação automática)
✅ Security headers no Nginx
✅ Row Level Security no Supabase
✅ Variáveis sensíveis em .env (não commitado)

---

## 🚨 Troubleshooting

### Site não carrega
```bash
# Verificar Nginx
sudo systemctl status nginx
sudo nginx -t

# Verificar build
ls -la /var/www/govchat/dist

# Recriar build
cd /var/www/govchat
npm run build
sudo systemctl reload nginx
```

### Login não funciona
- Verifique se o domínio está nas Redirect URLs do Supabase
- Verifique as variáveis no .env

### SSL não funciona
```bash
sudo certbot --nginx -d seu-dominio.gov.br
```

---

## 📞 Ajuda

- **Guia Completo**: `docs/DEPLOY_VPS.md`
- **Documentação Scripts**: `scripts/README.md`
- **Manual Original**: `DEPLOY.md`

---

**Deploy em produção em menos de 10 minutos! 🎉**
