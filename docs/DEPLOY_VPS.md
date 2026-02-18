# 🚀 Guia Completo de Deploy em VPS - GovChat

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Setup Rápido (Automático)](#setup-rápido-automático)
3. [Setup Manual (Passo a Passo)](#setup-manual-passo-a-passo)
4. [Configuração Pós-Deploy](#configuração-pós-deploy)
5. [Atualizações](#atualizações)
6. [Monitoramento](#monitoramento)
7. [Troubleshooting](#troubleshooting)
8. [Segurança](#segurança)

---

## 📋 Pré-requisitos

### Servidor VPS
- **Sistema Operacional**: Ubuntu 22.04 LTS (recomendado)
- **CPU**: Mínimo 1 vCPU (2 vCPU recomendado para produção)
- **RAM**: Mínimo 1GB (2GB recomendado)
- **Disco**: Mínimo 20GB SSD
- **Rede**: IP público estático

### Acesso
- Acesso SSH com usuário root ou sudo
- Chave SSH configurada (recomendado)
- Firewall liberado para portas 22 (SSH), 80 (HTTP), 443 (HTTPS)

### Domínio (Opcional mas Recomendado)
- Domínio apontando para o IP da VPS
- Acesso ao DNS para configurar registros A/AAAA

### Repositório
- Repositório Git do projeto
- Token de acesso (se privado)

---

## 🚀 Setup Rápido (Automático)

### Opção 1: Script Automatizado

```bash
# 1. Conectar na VPS
ssh usuario@seu-ip-vps

# 2. Baixar e executar o script de setup
curl -o- https://raw.githubusercontent.com/seu-usuario/seu-repo/main/scripts/vps-setup.sh | bash

# Ou se já clonou o repositório:
cd /caminho/para/govchat
./scripts/vps-setup.sh seu-dominio.gov.br
```

O script automático irá:
✅ Atualizar o sistema
✅ Instalar Node.js, Nginx, Certbot
✅ Configurar firewall
✅ Clonar o repositório
✅ Instalar dependências
✅ Gerar build
✅ Configurar Nginx
✅ Configurar SSL (se domínio fornecido)

**Tempo estimado**: 5-10 minutos

---

## 🛠️ Setup Manual (Passo a Passo)

### 1. Conectar na VPS

```bash
ssh usuario@seu-ip-vps
```

### 2. Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Instalar Dependências

```bash
# Ferramentas essenciais
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx ufw

# Node.js v20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node -v   # deve mostrar v20.x.x
npm -v    # deve mostrar v10.x.x
```

### 4. Configurar Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

### 5. Criar Diretório do Projeto

```bash
sudo mkdir -p /var/www/govchat
sudo chown $USER:$USER /var/www/govchat
cd /var/www/govchat
```

### 6. Clonar Repositório

```bash
# Repositório público
git clone https://github.com/seu-usuario/seu-repo.git .

# Repositório privado (com token)
git clone https://TOKEN@github.com/seu-usuario/seu-repo.git .

# Ou via SSH
git clone git@github.com:seu-usuario/seu-repo.git .
```

### 7. Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.production.template .env

# Editar com suas configurações
nano .env
```

**Configuração mínima do `.env`:**

```env
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_PROJECT_ID="seu-projeto-id"
VITE_APP_URL="https://seu-dominio.gov.br"
```

### 8. Instalar Dependências e Build

```bash
cd /var/www/govchat

# Instalar dependências
npm install

# Gerar build de produção
npm run build

# Verificar build
ls -lh dist/
```

### 9. Configurar Nginx

```bash
# Copiar configuração
sudo cp scripts/nginx-govchat.conf /etc/nginx/sites-available/govchat

# Editar com seu domínio
sudo nano /etc/nginx/sites-available/govchat
# Substitua: seu-dominio.gov.br pelo seu domínio real

# Ativar site
sudo ln -s /etc/nginx/sites-available/govchat /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 10. Configurar SSL com Let's Encrypt

```bash
# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.gov.br -d www.seu-dominio.gov.br

# Seguir instruções interativas
# Aceitar termos de serviço
# Fornecer email para notificações

# Testar renovação automática
sudo certbot renew --dry-run
```

### 11. Verificar Instalação

```bash
# Status do Nginx
sudo systemctl status nginx

# Acessar no navegador
# http://seu-dominio.gov.br (redirecionará para https)
# https://seu-dominio.gov.br
```

---

## ⚙️ Configuração Pós-Deploy

### 1. Configurar Domínio no Supabase

Acesse: https://app.supabase.com/project/SEU_PROJECT_ID/auth/url-configuration

Adicione nas **Site URL** e **Redirect URLs**:
- `https://seu-dominio.gov.br`
- `https://seu-dominio.gov.br/auth/callback`

### 2. Testar Autenticação

1. Acesse `https://seu-dominio.gov.br`
2. Tente fazer login/cadastro
3. Verifique se funciona corretamente

### 3. Configurar Edge Functions (se necessário)

```bash
# Instalar Supabase CLI (se precisar fazer deploy de functions)
npm install -g supabase

# Login no Supabase
supabase login

# Deploy das Edge Functions
cd /var/www/govchat
supabase functions deploy
```

### 4. Configurar Variáveis Secretas

No dashboard do Supabase:
**Project > Edge Functions > Secrets**

Adicione:
- `LOVABLE_API_KEY`: para chatbot com IA
- Outras chaves secretas que suas Edge Functions usam

### 5. Configurar Backup Automático

```bash
# Criar cron job para backup diário
crontab -e

# Adicionar linha (backup às 2h da manhã):
0 2 * * * cd /var/www/govchat && tar -czf /var/backups/govchat-$(date +\%Y\%m\%d).tar.gz dist .env
```

---

## 🔄 Atualizações

### Atualização Manual

```bash
cd /var/www/govchat
./scripts/update.sh
```

O script fará:
- ✅ Backup do build atual
- ✅ Pull das atualizações do Git
- ✅ Instalação de dependências (se necessário)
- ✅ Novo build
- ✅ Reload do Nginx

### Atualização Específica de Branch

```bash
./scripts/update.sh develop
```

### Rollback em Caso de Erro

```bash
cd /var/www/govchat/backups
ls -lt  # ver backups disponíveis

# Restaurar backup
tar -xzf dist-20240115_143022.tar.gz -C ..
sudo systemctl reload nginx
```

---

## 📊 Monitoramento

### Verificar Status do Sistema

```bash
cd /var/www/govchat
./scripts/monitor.sh
```

Mostra:
- Status do Nginx
- Conectividade HTTP
- Uso de disco
- Uso de memória
- Últimos erros
- Status do SSL

### Logs em Tempo Real

```bash
# Logs de acesso
sudo tail -f /var/log/nginx/govchat_access.log

# Logs de erro
sudo tail -f /var/log/nginx/govchat_error.log

# Ambos
sudo tail -f /var/log/nginx/govchat_*.log
```

### Monitoramento Automático

```bash
# Adicionar ao cron para verificação a cada 5 minutos
crontab -e

# Adicionar:
*/5 * * * * /var/www/govchat/scripts/monitor.sh >> /var/log/govchat-monitor.log 2>&1
```

---

## 🔧 Troubleshooting

### Problema: Site não carrega (502 Bad Gateway)

**Causa**: Nginx não encontra os arquivos

**Solução**:
```bash
# Verificar se dist existe
ls -la /var/www/govchat/dist

# Se não existir, gerar build
cd /var/www/govchat
npm run build

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Problema: Página em branco

**Causa**: Configuração incorreta do SPA fallback

**Solução**:
```bash
# Verificar configuração do Nginx
sudo nano /etc/nginx/sites-available/govchat

# Garantir que tem esta linha:
# try_files $uri $uri/ /index.html;

# Testar e reiniciar
sudo nginx -t
sudo systemctl restart nginx
```

### Problema: CSS/JS não carrega

**Causa**: Permissões incorretas

**Solução**:
```bash
sudo chown -R www-data:www-data /var/www/govchat/dist
sudo chmod -R 755 /var/www/govchat/dist
```

### Problema: Login não funciona

**Causa**: Domínio não autorizado no Supabase

**Solução**:
1. Acesse Supabase Dashboard
2. Project > Authentication > URL Configuration
3. Adicione seu domínio nas URLs permitidas

### Problema: SSL não renova

**Causa**: Certbot não configurado

**Solução**:
```bash
# Testar renovação
sudo certbot renew --dry-run

# Se falhar, reconfigurar
sudo certbot --nginx -d seu-dominio.gov.br
```

### Problema: Disco cheio

**Solução**:
```bash
# Limpar logs antigos
sudo journalctl --vacuum-time=7d

# Limpar cache do npm
npm cache clean --force

# Limpar builds antigos
cd /var/www/govchat/backups
ls -lt | tail -n +6 | awk '{print $9}' | xargs rm -f
```

---

## 🔒 Segurança

### 1. Firewall

```bash
# Verificar regras
sudo ufw status verbose

# Permitir apenas portas necessárias
sudo ufw deny 8080  # Bloquear Vite dev server em produção
```

### 2. Nginx Security Headers

Já configurados em `nginx-govchat.conf`:
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ X-XSS-Protection
- ✅ Strict-Transport-Security (HTTPS)

### 3. Atualizações de Segurança

```bash
# Atualizar sistema regularmente
sudo apt update && sudo apt upgrade -y

# Atualizar dependências do Node
cd /var/www/govchat
npm audit
npm audit fix
```

### 4. Fail2Ban (Proteção contra força bruta)

```bash
# Instalar
sudo apt install fail2ban -y

# Configurar para Nginx
sudo nano /etc/fail2ban/jail.local

# Adicionar:
[nginx-http-auth]
enabled = true
[nginx-noscript]
enabled = true
[nginx-badbots]
enabled = true

# Reiniciar
sudo systemctl restart fail2ban
```

### 5. Rotação de Chaves

- Rotacione chaves do Supabase a cada 6 meses
- Use `.env` em vez de valores hardcoded
- Nunca commite `.env` no Git

---

## 📞 Suporte

### Logs Úteis

```bash
# Sistema
sudo journalctl -u nginx -f

# Aplicação
tail -f /var/log/nginx/govchat_access.log
tail -f /var/log/nginx/govchat_error.log

# Monitor custom
tail -f /var/log/govchat-monitor.log
```

### Comandos Úteis

```bash
# Reiniciar Nginx
sudo systemctl restart nginx

# Recarregar configuração (sem downtime)
sudo systemctl reload nginx

# Verificar sintaxe do Nginx
sudo nginx -t

# Status de serviços
sudo systemctl status nginx
sudo systemctl status certbot.timer

# Espaço em disco
df -h

# Uso de memória
free -h

# Processos
htop  # ou top
```

---

## 🎉 Conclusão

Seu sistema GovChat está agora em produção!

**Próximos passos recomendados:**
1. ✅ Configure monitoramento (Sentry, New Relic, etc.)
2. ✅ Configure backup automático do banco Supabase
3. ✅ Teste todos os fluxos críticos
4. ✅ Treine sua equipe
5. ✅ Configure alertas de downtime

**Manutenção regular:**
- Atualizações de segurança: semanal
- Backups: diário
- Monitoramento de logs: contínuo
- Rotação de certificados SSL: automático (Let's Encrypt)

---

**Desenvolvido com ❤️ para o setor público brasileiro**
