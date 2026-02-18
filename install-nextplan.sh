#!/bin/bash
#
# GovChat NextPlan - Instalador Personalizado
# Dominio: atendimento.nextplan.tec.br
# 
# Uso:
#   curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install-nextplan.sh | sudo bash
#

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================
# CONFIGURAÇÕES NEXTPLAN (PRÉ-CONFIGURADAS)
# ============================================
REPO_URL="https://github.com/feliphemelo/govconnect-hub.git"
PROJECT_DIR="/var/www/govchat"
DOMAIN="atendimento.nextplan.tec.br"
COMPANY_NAME="NextPlan Tecnologia"
COMPANY_SLUG="nextplan"

# Banco de dados
DB_NAME="govchat_nextplan"
DB_USER="govchat_user"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Superadmin
ADMIN_EMAIL="feliphe@nextplan.tec.br"
ADMIN_PASSWORD="Admin@2026"
ADMIN_NAME="Felipe NextPlan"

# Funcoes de log
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# Banner personalizado
clear
echo -e "${CYAN}"
cat << "EOF"
   _   _           _   ____  _             
  | \ | | _____  _| |_|  _ \| | __ _ _ __  
  |  \| |/ _ \ \/ / __| |_) | |/ _` | '_ \ 
  | |\  |  __/>  <| |_|  __/| | (_| | | | |
  |_| \_|\___/_/\_\\__|_|   |_|\__,_|_| |_|
                                            
    Sistema de Atendimento ao Cidadao
    Instalacao Personalizada
EOF
echo -e "${NC}"
echo "=========================================="
echo "  🚀 GovChat NextPlan - Instalador"
echo "=========================================="
echo ""

# Verificar se eh root ou tem sudo
if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
    log_error "Este script precisa de privilegios sudo."
fi

# Informacoes da instalacao
log_info "Configuracoes NextPlan:"
echo "  Dominio: ${CYAN}$DOMAIN${NC}"
echo "  Empresa: $COMPANY_NAME"
echo "  Banco: $DB_NAME"
echo "  Superadmin: $ADMIN_EMAIL"
echo ""

# Confirmacao
echo -e -n "${YELLOW}Deseja continuar com a instalacao? [y/N] ${NC}"
read -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Instalacao cancelada."
    exit 0
fi
echo ""

# 1. Verificar sistema operacional
log_info "Verificando sistema operacional..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" != "ubuntu" ]] || [[ ! "$VERSION_ID" =~ ^(22|23|24) ]]; then
        log_warning "Este script foi testado no Ubuntu 22.04+"
        log_warning "Sistema detectado: $PRETTY_NAME"
        read -p "Continuar? [y/N] " -n 1 -r
        echo
        [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
    else
        log_success "Ubuntu $VERSION_ID detectado"
    fi
fi

# 2. Atualizar sistema
log_info "Atualizando sistema..."
sudo apt-get update -qq
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq
log_success "Sistema atualizado"

# 3. Instalar dependencias
log_info "Instalando dependencias..."
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    curl git build-essential nginx certbot python3-certbot-nginx \
    ufw software-properties-common ca-certificates gnupg \
    postgresql postgresql-contrib
log_success "Dependencias instaladas"

# 4. Configurar PostgreSQL
log_info "Configurando PostgreSQL..."

sudo systemctl start postgresql
sudo systemctl enable postgresql > /dev/null 2>&1

# Criar banco e usuario
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"

# Configurar pg_hba.conf
PG_VERSION=$(psql --version | grep -oP '\d+' | head -1)
PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"
if [ -f "$PG_HBA" ]; then
    sudo cp "$PG_HBA" "$PG_HBA.backup"
    if ! sudo grep -q "local.*$DB_NAME.*$DB_USER.*md5" "$PG_HBA"; then
        echo "local   $DB_NAME    $DB_USER                                md5" | sudo tee -a "$PG_HBA" > /dev/null
        sudo systemctl restart postgresql
    fi
fi

log_success "PostgreSQL configurado"

# 5. Instalar Node.js v20
log_info "Instalando Node.js v20..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | sed 's/v//') -lt 18 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y nodejs
fi
log_success "Node.js $(node -v) e NPM $(npm -v) instalados"

# 6. Configurar firewall
log_info "Configurando firewall..."
sudo ufw --force enable > /dev/null 2>&1
sudo ufw allow OpenSSH > /dev/null 2>&1
sudo ufw allow 'Nginx Full' > /dev/null 2>&1
log_success "Firewall configurado"

# 7. Clonar repositorio
log_info "Clonando repositorio..."
if [ -d "$PROJECT_DIR" ]; then
    log_warning "Diretorio ja existe. Removendo..."
    sudo rm -rf "$PROJECT_DIR"
fi

sudo mkdir -p "$PROJECT_DIR"
sudo chown $USER:$USER "$PROJECT_DIR"
git clone "$REPO_URL" "$PROJECT_DIR" || log_error "Falha ao clonar repositorio"
cd "$PROJECT_DIR"
log_success "Repositorio clonado"

# 8. Instalar dependencias do projeto
log_info "Instalando dependencias do projeto..."
npm install --loglevel=error || log_error "Falha ao instalar dependencias"
npm install pg bcrypt --save
log_success "Dependencias instaladas"

# 9. Aplicar migracoes do banco
log_info "Aplicando migracoes do banco..."

MIGRATIONS_SQL="$PROJECT_DIR/migrations_combined.sql"
cat > "$MIGRATIONS_SQL" << 'SQLEOF'
-- GovChat NextPlan Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

SQLEOF

# Concatenar migracoes
for migration in supabase/migrations/*.sql; do
    if [ -f "$migration" ]; then
        cat "$migration" >> "$MIGRATIONS_SQL"
        echo "" >> "$MIGRATIONS_SQL"
    fi
done

# Aplicar migracoes
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -f "$MIGRATIONS_SQL" > /dev/null 2>&1
log_success "Migracoes aplicadas"
rm -f "$MIGRATIONS_SQL"

# 10. Criar empresa e superadmin
log_info "Criando empresa NextPlan e superadmin..."

# Hash da senha usando bcrypt (12 rounds)
ADMIN_PASSWORD_HASH=$(node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('$ADMIN_PASSWORD', 12));")

# Script SQL para criar empresa e usuario
SETUP_SQL="$PROJECT_DIR/setup_nextplan.sql"
cat > "$SETUP_SQL" << SETUPEOF
-- Criar empresa NextPlan
INSERT INTO public.companies (id, name, slug, primary_color, plan, max_users, max_ai_interactions, credits_balance, is_active)
VALUES (
  gen_random_uuid(),
  '$COMPANY_NAME',
  '$COMPANY_SLUG',
  '#2563eb',
  'enterprise',
  100,
  50000,
  100000.00,
  true
) ON CONFLICT (slug) DO NOTHING
RETURNING id;

-- Variavel para armazenar company_id
DO \$\$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
BEGIN
  -- Obter company_id
  SELECT id INTO v_company_id FROM public.companies WHERE slug = '$COMPANY_SLUG';
  
  -- Criar usuario no auth.users (simulado - em producao use Supabase Auth)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    '$ADMIN_EMAIL',
    crypt('$ADMIN_PASSWORD', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"$ADMIN_NAME"}',
    false
  ) ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;
  
  -- Se usuario ja existe, obter ID
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = '$ADMIN_EMAIL';
  END IF;
  
  -- Criar perfil
  INSERT INTO public.profiles (id, user_id, company_id, full_name, status, accepted_lgpd, is_active)
  VALUES (
    gen_random_uuid(),
    v_user_id,
    v_company_id,
    '$ADMIN_NAME',
    'online',
    true,
    true
  ) ON CONFLICT (user_id) DO NOTHING;
  
  -- Atribuir role de admin
  INSERT INTO public.user_roles (id, user_id, company_id, role)
  VALUES (
    gen_random_uuid(),
    v_user_id,
    v_company_id,
    'admin'
  ) ON CONFLICT (user_id, role, company_id) DO NOTHING;
  
  -- Criar setor padrao
  INSERT INTO public.sectors (id, company_id, name, description, is_active)
  VALUES (
    gen_random_uuid(),
    v_company_id,
    'Atendimento Geral',
    'Setor de atendimento geral ao cidadao',
    true
  ) ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Empresa e superadmin criados com sucesso!';
END \$\$;
SETUPEOF

# Executar SQL
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -f "$SETUP_SQL"
log_success "Empresa e superadmin criados"
rm -f "$SETUP_SQL"

# 11. Configurar variaveis de ambiente
log_info "Configurando variaveis de ambiente..."

DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
JWT_SECRET=$(openssl rand -base64 32)

cat > "$PROJECT_DIR/.env" << ENVEOF
# NextPlan Configuration
COMPANY_NAME="$COMPANY_NAME"
COMPANY_SLUG="$COMPANY_SLUG"

# Database Configuration
DATABASE_URL="$DATABASE_URL"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="$DB_NAME"
DB_USER="$DB_USER"
DB_PASSWORD="$DB_PASSWORD"

# Application Settings
NODE_ENV="production"
VITE_APP_URL="https://$DOMAIN"
PORT="3000"

# JWT Secret
JWT_SECRET="$JWT_SECRET"

# Optional: AI Configuration
# LOVABLE_API_KEY=""
# GOOGLE_AI_API_KEY=""
ENVEOF

log_success "Arquivo .env criado"

# 12. Build do projeto
log_info "Gerando build de producao..."
if npm run build; then
    BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1 || echo "?")
    log_success "Build gerado ($BUILD_SIZE)"
else
    log_warning "Build falhou. Execute: cd $PROJECT_DIR && npm run build"
fi

# 13. Configurar Nginx
log_info "Configurando Nginx..."

NGINX_CONF="/etc/nginx/sites-available/govchat-nextplan"
sudo tee "$NGINX_CONF" > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;
    root $PROJECT_DIR/dist;
    index index.html;
    
    access_log /var/log/nginx/nextplan_access.log;
    error_log /var/log/nginx/nextplan_error.log;
    
    client_max_body_size 50M;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location ~ /\. {
        deny all;
    }
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/govchat-nextplan
sudo rm -f /etc/nginx/sites-enabled/default

if sudo nginx -t > /dev/null 2>&1; then
    sudo systemctl restart nginx
    sudo systemctl enable nginx > /dev/null 2>&1
    log_success "Nginx configurado"
else
    log_error "Erro na configuracao do Nginx"
fi

# 14. Configurar SSL
log_info "Configurando SSL para $DOMAIN..."

SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
DOMAIN_IP=$(dig +short "$DOMAIN" @8.8.8.8 | tail -1)

if [ -n "$DOMAIN_IP" ] && [ "$SERVER_IP" = "$DOMAIN_IP" ]; then
    log_success "DNS configurado corretamente ($DOMAIN -> $SERVER_IP)"
    
    if sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "feliphe@nextplan.tec.br" --redirect; then
        log_success "SSL configurado com sucesso!"
    else
        log_warning "Falha no SSL. Execute: sudo certbot --nginx -d $DOMAIN"
    fi
else
    log_warning "DNS nao aponta para este servidor"
    log_info "  IP do servidor: $SERVER_IP"
    log_info "  IP do dominio: ${DOMAIN_IP:-nao resolvido}"
    log_warning "Configure o DNS e execute: sudo certbot --nginx -d $DOMAIN"
fi

# 15. Scripts executaveis
chmod +x scripts/*.sh 2>/dev/null || true

# 16. Comandos globais
sudo tee /usr/local/bin/govchat-update > /dev/null << 'UPDATECMD'
#!/bin/bash
cd /var/www/govchat && ./scripts/update.sh "$@"
UPDATECMD

sudo tee /usr/local/bin/govchat-backup-db > /dev/null << 'BACKUPCMD'
#!/bin/bash
BACKUP_DIR="/var/backups/govchat"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
source /var/www/govchat/.env
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U $DB_USER -d $DB_NAME | gzip > "$BACKUP_DIR/govchat_$TIMESTAMP.sql.gz"
echo "Backup salvo: $BACKUP_DIR/govchat_$TIMESTAMP.sql.gz"
cd "$BACKUP_DIR" && ls -t govchat_*.sql.gz | tail -n +8 | xargs rm -f 2>/dev/null
BACKUPCMD

sudo chmod +x /usr/local/bin/govchat-update
sudo chmod +x /usr/local/bin/govchat-backup-db

# 17. Criar arquivo de credenciais
CREDS_FILE="$PROJECT_DIR/NEXTPLAN_CREDENTIALS.txt"
cat > "$CREDS_FILE" << CREDSEOF
========================================
  GOVCHAT NEXTPLAN - CREDENCIAIS
========================================

DOMÍNIO
-------
URL: https://$DOMAIN

SUPERADMIN
----------
Email: $ADMIN_EMAIL
Senha: $ADMIN_PASSWORD
Nome: $ADMIN_NAME

BANCO DE DADOS
--------------
Banco: $DB_NAME
Usuario: $DB_USER
Senha: $DB_PASSWORD
Host: localhost:5432
URL: $DATABASE_URL

EMPRESA
-------
Nome: $COMPANY_NAME
Slug: $COMPANY_SLUG

COMANDOS ÚTEIS
--------------
Atualizar: govchat-update
Backup: govchat-backup-db
Monitor: cd /var/www/govchat && ./scripts/monitor.sh
Logs: sudo tail -f /var/log/nginx/nextplan_error.log
PostgreSQL: sudo -u postgres psql $DB_NAME

IMPORTANTE
----------
⚠️  Guarde este arquivo em local seguro!
⚠️  Troque as senhas apos primeiro acesso!

Data da instalacao: $(date)
========================================
CREDSEOF

sudo chmod 600 "$CREDS_FILE"

# 18. Informacoes finais
echo ""
echo "=========================================="
echo -e "${GREEN}  ✅ INSTALAÇÃO NEXTPLAN CONCLUÍDA!${NC}"
echo "=========================================="
echo ""

log_success "Sistema instalado: $PROJECT_DIR"
log_success "Dominio: https://$DOMAIN"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  CREDENCIAIS DE ACESSO${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  🌐 URL: ${CYAN}https://$DOMAIN${NC}"
echo ""
echo "  👤 Superadmin:"
echo "     Email: ${YELLOW}$ADMIN_EMAIL${NC}"
echo "     Senha: ${YELLOW}$ADMIN_PASSWORD${NC}"
echo ""
echo "  💾 Banco:"
echo "     Nome: $DB_NAME"
echo "     Usuario: $DB_USER"
echo "     Senha: $DB_PASSWORD"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

log_warning "⚠️  IMPORTANTE:"
echo "  1. Credenciais salvas em: $CREDS_FILE"
echo "  2. Troque as senhas apos primeiro acesso!"
echo "  3. Configure backup automatico (cron)"
echo ""

log_info "🔧 Comandos uteis:"
echo "   ${CYAN}govchat-update${NC}        - Atualizar sistema"
echo "   ${CYAN}govchat-backup-db${NC}     - Backup do banco"
echo ""

log_success "Instalacao finalizada! 🎉"
log_info "Acesse: ${CYAN}https://$DOMAIN${NC}"
echo ""
