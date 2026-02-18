#!/bin/bash
#
# GovChat - Instalador Completo com Backend Node.js
# Sistema de Atendimento ao Cidadão
#
# Uso:
#   wget https://github.com/feliphemelo/govconnect-hub/raw/main/install-with-backend.sh
#   chmod +x install-with-backend.sh
#   sudo ./install-with-backend.sh
#

set -e

# Cores desabilitadas para compatibilidade
RED=''
GREEN=''
YELLOW=''
BLUE=''
CYAN=''
NC=''

# Funcoes de log
log_info() { echo "[INFO] $1"; }
log_success() { echo "[OK] $1"; }
log_warning() { echo "[WARNING] $1"; }
log_error() { echo "[ERROR] $1"; exit 1; }

# Banner
clear
cat << "EOF"
   _____           _____ _           _   
  / ____|         / ____| |         | |  
 | |  __  _____  | |    | |__   __ _| |_ 
 | | |_ |/ _ \ \ | |    | '_ \ / _` | __|
 | |__| | (_) \ \| |____| | | | (_| | |_ 
  \_____|\___/ \_\\_____|_| |_|\__,_|\__|
                                          
    Sistema de Atendimento ao Cidadao
    Instalador com Backend Node.js
EOF
echo ""
echo "=========================================="
echo "  Backend Proprio + PostgreSQL Local"
echo "=========================================="
echo ""

# Verificar se eh root
if [ "$EUID" -ne 0 ]; then
    log_error "Execute como root ou com sudo"
fi

# ============================================
# VERIFICAR E LIMPAR INSTALACAO ANTERIOR
# ============================================

PROJECT_DIR="/var/www/govchat"
BACKEND_DIR="$PROJECT_DIR/backend"

if [ -d "$PROJECT_DIR" ] || \
   sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw govchat || \
   [ -f /etc/nginx/sites-enabled/govchat ]; then
    
    log_warning "Instalacao anterior detectada!"
    echo ""
    echo "Foi encontrada uma instalacao anterior do GovChat."
    echo "Para continuar, e necessario fazer uma limpeza completa."
    echo ""
    echo "O que sera removido:"
    echo "  - Diretorio: $PROJECT_DIR"
    echo "  - Bancos de dados: govchat*"
    echo "  - Usuarios PostgreSQL: govchat*"
    echo "  - Configuracao Nginx: /etc/nginx/sites-*/govchat"
    echo "  - Certificados SSL (se existirem)"
    echo "  - Comandos globais: govchat-*"
    echo "  - Processos PM2"
    echo ""
    echo -n "Deseja fazer a limpeza completa? [y/N] "
    read -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Instalacao cancelada"
    fi
    
    log_info "Iniciando limpeza profunda..."
    
    # Parar servicos
    systemctl stop nginx 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    pm2 kill 2>/dev/null || true
    
    # Remover diretorio
    [ -d "$PROJECT_DIR" ] && rm -rf "$PROJECT_DIR"
    
    # Remover bancos de dados
    for db in $(sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -E 'govchat' | tr -d ' '); do
        [ ! -z "$db" ] && sudo -u postgres psql -c "DROP DATABASE IF EXISTS $db;" 2>/dev/null || true
    done
    
    # Remover usuarios PostgreSQL
    for user in $(sudo -u postgres psql -tAc "SELECT usename FROM pg_user WHERE usename LIKE 'govchat%';"); do
        [ ! -z "$user" ] && sudo -u postgres psql -c "DROP USER IF EXISTS $user;" 2>/dev/null || true
    done
    
    # Remover Nginx config
    rm -f /etc/nginx/sites-enabled/govchat /etc/nginx/sites-available/govchat
    
    # Remover SSL
    certbot delete --cert-name govchat 2>/dev/null || true
    
    # Remover comandos globais
    rm -f /usr/local/bin/govchat-*
    
    systemctl start nginx
    log_success "Limpeza concluida!"
fi

# ============================================
# COLETAR INFORMACOES
# ============================================

echo ""
echo "=========================================="
echo "  Configuracao Interativa"
echo "=========================================="
echo ""

# Dominio
while true; do
    echo -n "Dominio (ex: atendimento.nextplan.tec.br): "
    read DOMAIN
    if [[ $DOMAIN =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
        break
    else
        log_warning "Dominio invalido"
    fi
done

# Empresa
echo -n "Nome da Empresa: "
read COMPANY_NAME

# Email admin
while true; do
    echo -n "Email do Administrador: "
    read ADMIN_EMAIL
    if [[ $ADMIN_EMAIL =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        break
    else
        log_warning "Email invalido"
    fi
done

# Nome admin
echo -n "Nome Completo do Administrador: "
read ADMIN_NAME
ADMIN_NAME=${ADMIN_NAME:-"Administrador"}

# Senha
while true; do
    echo -n "Senha do Administrador (min 8 caracteres): "
    read -s ADMIN_PASSWORD
    echo ""
    if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
        log_warning "Senha muito curta"
        continue
    fi
    echo -n "Confirme a senha: "
    read -s ADMIN_PASSWORD_CONFIRM
    echo ""
    if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
        log_warning "Senhas nao coincidem"
        continue
    fi
    break
done

# Gerar valores
COMPANY_SLUG=$(echo "$COMPANY_NAME" | tr '[:upper:]' '[:lower:]' | tr -cd '[:alnum:]' | cut -c1-30)
DB_NAME="govchat_${COMPANY_SLUG}"
DB_USER="govchat_user"
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 32)

# Resumo
echo ""
echo "=========================================="
echo "  Resumo da Instalacao"
echo "=========================================="
echo ""
echo "Dominio: $DOMAIN"
echo "Empresa: $COMPANY_NAME ($COMPANY_SLUG)"
echo "Admin: $ADMIN_NAME <$ADMIN_EMAIL>"
echo "Banco: $DB_NAME"
echo ""
echo -n "Confirmar instalacao? [y/N] "
read -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_error "Instalacao cancelada"
fi

# ============================================
# INSTALACAO
# ============================================

log_info "Iniciando instalacao..."

# Detectar OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
else
    log_error "Sistema operacional nao suportado"
fi

if [[ ! "$OS" =~ ^(ubuntu|debian)$ ]] || [[ ! "$VER" =~ ^(22|24|11|12).*$ ]]; then
    log_error "Requer Ubuntu 22.04+ ou Debian 11+"
fi

# Atualizar sistema
log_info "Atualizando sistema..."
apt-get update -qq
apt-get upgrade -y -qq

# Instalar dependencias
log_info "Instalando dependencias..."
apt-get install -y -qq curl wget git nginx postgresql postgresql-contrib certbot python3-certbot-nginx build-essential

# Instalar Node.js 20
log_info "Instalando Node.js 20..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 20 ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

log_success "Node.js $(node -v) instalado"

# Instalar PM2 globalmente
log_info "Instalando PM2..."
npm install -g pm2

# Configurar PostgreSQL
log_info "Configurando PostgreSQL..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"

log_success "PostgreSQL configurado"

# Clonar repositorio
log_info "Clonando repositorio..."
REPO_URL="https://github.com/feliphemelo/govconnect-hub.git"
git clone "$REPO_URL" "$PROJECT_DIR"
cd "$PROJECT_DIR"

# ============================================
# BACKEND SETUP
# ============================================

log_info "Configurando backend..."

cd "$BACKEND_DIR"

# Instalar dependencias do backend (incluindo dev dependencies para build)
log_info "Instalando dependencias do backend..."
NODE_ENV=development npm install

# Criar .env do backend
cat > .env << ENDOFENV
NODE_ENV=production
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://$DOMAIN

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENDOFENV

log_success "Backend .env criado"

# Executar migrations
log_info "Executando migrations do banco..."

# Backend migrations (clean PostgreSQL, no Supabase)
for file in migrations/*.sql; do
    if [ -f "$file" ]; then
        log_info "Executando $(basename $file)..."
        PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -f "$file" 2>&1 || true
    fi
done

log_success "Migrations executadas"

# Build backend
log_info "Building backend..."
npm run build

# Configurar PM2
log_info "Configurando PM2..."
pm2 start dist/server.js --name govchat-backend
pm2 save

# Configurar PM2 para iniciar no boot
STARTUP_CMD=$(pm2 startup systemd -u root --hp /root | grep "sudo env")
if [ -n "$STARTUP_CMD" ]; then
    eval "$STARTUP_CMD"
fi

log_success "Backend configurado e rodando"

# ============================================
# FRONTEND SETUP
# ============================================

log_info "Configurando frontend..."

cd "$PROJECT_DIR"

# Criar .env do frontend
cat > .env << ENDOFENV
VITE_API_URL=https://$DOMAIN/api
VITE_DOMAIN=$DOMAIN
ENDOFENV

# Instalar dependencias do frontend
log_info "Instalando dependencias do frontend..."
npm install

# Build frontend
log_info "Building frontend..."
npm run build

log_success "Frontend built"

# ============================================
# NGINX CONFIGURATION
# ============================================

log_info "Configurando Nginx..."

cat > /etc/nginx/sites-available/govchat << 'ENDOFNGINX'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;

    # Frontend
    root /var/www/govchat/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache de assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Seguranca
    location ~ /\. {
        deny all;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
ENDOFNGINX

sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/govchat

ln -sf /etc/nginx/sites-available/govchat /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

log_success "Nginx configurado"

# ============================================
# SSL CONFIGURATION
# ============================================

log_info "Verificando DNS..."
DNS_IP=$(nslookup $DOMAIN | grep -A1 "Name:" | tail -1 | awk '{print $2}')
SERVER_IP=$(curl -4 -s ifconfig.me)

if [ "$DNS_IP" != "$SERVER_IP" ]; then
    log_warning "DNS nao aponta para este servidor!"
    log_warning "DNS resolve para: $DNS_IP"
    log_warning "IP deste servidor: $SERVER_IP"
    log_warning "SSL nao sera configurado automaticamente"
    log_warning "Configure o DNS e execute: sudo certbot --nginx -d $DOMAIN"
else
    log_info "Configurando SSL..."
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $ADMIN_EMAIL --redirect
    log_success "SSL configurado"
fi

# ============================================
# CRIAR EMPRESA E ADMIN NO BANCO
# ============================================

log_info "Criando empresa e administrador..."

# Gerar hash da senha (usando Node.js para bcrypt)
HASHED_PASSWORD=$(node -e "const bcrypt = require('bcrypt'); bcrypt.hash('$ADMIN_PASSWORD', 10, (e,h) => console.log(h))")

# SQL para criar empresa e admin
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME << ENDOFSQL
-- Criar empresa
INSERT INTO public.companies (name, slug, plan, max_users, max_ai_interactions, is_active, created_at, updated_at)
VALUES ('$COMPANY_NAME', '$COMPANY_SLUG', 'enterprise', 100, 50000, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING
RETURNING id;

-- Criar usuario admin
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, role, raw_user_meta_data, created_at, updated_at)
VALUES (
  '$ADMIN_EMAIL',
  '$HASHED_PASSWORD',
  NOW(),
  'authenticated',
  jsonb_build_object('full_name', '$ADMIN_NAME', 'company_id', (SELECT id FROM public.companies WHERE slug = '$COMPANY_SLUG')),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Atualizar role para admin
UPDATE public.user_roles 
SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = '$ADMIN_EMAIL');

-- Criar setor padrao
INSERT INTO public.sectors (company_id, name, description, is_active, created_at, updated_at)
VALUES (
  (SELECT id FROM public.companies WHERE slug = '$COMPANY_SLUG'),
  'Atendimento Geral',
  'Setor de atendimento geral ao publico',
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;
ENDOFSQL

log_success "Empresa e administrador criados"

# ============================================
# CRIAR COMANDOS GLOBAIS
# ============================================

log_info "Criando comandos globais..."

# govchat-update
cat > /usr/local/bin/govchat-update << 'ENDOFCMD'
#!/bin/bash
cd /var/www/govchat
git pull origin main
cd backend && npm install && npm run build
pm2 restart govchat-backend
cd .. && npm install && npm run build
systemctl reload nginx
echo "Sistema atualizado!"
ENDOFCMD
chmod +x /usr/local/bin/govchat-update

# govchat-backup-db
cat > /usr/local/bin/govchat-backup-db << ENDOFCMD
#!/bin/bash
BACKUP_DIR="/var/backups/govchat"
mkdir -p \$BACKUP_DIR
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump $DB_NAME > "\$BACKUP_DIR/govchat_\$TIMESTAMP.sql"
echo "Backup criado: \$BACKUP_DIR/govchat_\$TIMESTAMP.sql"
ENDOFCMD
chmod +x /usr/local/bin/govchat-backup-db

# govchat-logs
cat > /usr/local/bin/govchat-logs << 'ENDOFCMD'
#!/bin/bash
echo "=== Backend Logs ==="
pm2 logs govchat-backend --lines 50 --nostream
echo ""
echo "=== Nginx Error Logs ==="
tail -50 /var/log/nginx/error.log
ENDOFCMD
chmod +x /usr/local/bin/govchat-logs

log_success "Comandos globais criados"

# ============================================
# SALVAR CREDENCIAIS
# ============================================

CRED_FILE="$PROJECT_DIR/CREDENCIAIS_INSTALACAO.txt"

cat > "$CRED_FILE" << ENDOFCRED
========================================
  CREDENCIAIS DO SISTEMA GOVCHAT
========================================

URL do Sistema:
  https://$DOMAIN

Administrador:
  Email: $ADMIN_EMAIL
  Senha: $ADMIN_PASSWORD

Banco de Dados PostgreSQL:
  Host: localhost
  Porta: 5432
  Database: $DB_NAME
  Usuario: $DB_USER
  Senha: $DB_PASSWORD

Backend API:
  URL: https://$DOMAIN/api
  JWT Secret: $JWT_SECRET
  Health: https://$DOMAIN/api/health

Empresa:
  Nome: $COMPANY_NAME
  Slug: $COMPANY_SLUG

Comandos Uteis:
  - Atualizar sistema: govchat-update
  - Backup do banco: govchat-backup-db
  - Ver logs: govchat-logs
  - Status backend: pm2 status
  - Logs backend: pm2 logs govchat-backend
  - Status Nginx: systemctl status nginx
  - Status PostgreSQL: systemctl status postgresql
  - Logs Nginx: tail -f /var/log/nginx/error.log

========================================
  GUARDE ESTAS INFORMACOES COM SEGURANCA
========================================
ENDOFCRED

chmod 600 "$CRED_FILE"

# ============================================
# CONCLUSAO
# ============================================

clear
cat << "EOF"

========================================
  INSTALACAO CONCLUIDA COM SUCESSO!
========================================

EOF

cat "$CRED_FILE"

echo ""
echo "[INFO] Acesse o sistema em: https://$DOMAIN"
echo "[INFO] Email: $ADMIN_EMAIL"
echo "[INFO] Senha: (a que voce definiu)"
echo ""
echo "[WARNING] IMPORTANTE:"
echo "[WARNING] 1. Guarde as credenciais com seguranca"
echo "[WARNING] 2. Altere a senha no primeiro acesso"
echo "[WARNING] 3. Configure backup automatico (cron)"
echo ""
echo "[INFO] Comandos disponiveis:"
echo "  - govchat-update      (atualizar sistema)"
echo "  - govchat-backup-db   (backup do banco)"
echo "  - govchat-logs        (ver logs)"
echo ""

log_success "Instalacao concluida!"

