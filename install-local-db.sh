#!/bin/bash
#
# GovChat - Instalador com PostgreSQL Local
# 
# Uso:
#   curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install-local-db.sh | bash
#
# Ou com domínio:
#   curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install-local-db.sh | bash -s seu-dominio.gov.br
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

# Configurações
REPO_URL="https://github.com/feliphemelo/govconnect-hub.git"
PROJECT_DIR="/var/www/govchat"
DOMAIN=${1:-""}
DB_NAME="govchat"
DB_USER="govchat_user"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Funções de log
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# Banner
clear
echo -e "${CYAN}"
cat << "EOF"
   ____            ____ _           _   
  / ___| _____   _/ ___| |__   __ _| |_ 
 | |  _ / _ \ \ / / |   | '_ \ / _` | __|
 | |_| | (_) \ V /| |___| | | | (_| | |_ 
  \____|\___/ \_/  \____|_| |_|\__,_|\__|
                                          
    Sistema de Atendimento ao Cidadão
    Com PostgreSQL Local
EOF
echo -e "${NC}"
echo "=========================================="
echo "  🚀 Instalador Automático - VPS"
echo "  💾 PostgreSQL Local"
echo "=========================================="
echo ""

# Verificar se é root ou tem sudo
if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
    log_error "Este script precisa de privilégios sudo. Execute: sudo bash install-local-db.sh"
fi

# Informações
log_info "Repositório: ${REPO_URL}"
log_info "Destino: ${PROJECT_DIR}"
log_info "Banco de dados: PostgreSQL Local"
if [ -n "$DOMAIN" ]; then
    log_info "Domínio: ${DOMAIN}"
else
    log_warning "Nenhum domínio fornecido (SSL não será configurado)"
fi
echo ""

# Confirmação
read -p "$(echo -e ${YELLOW}Deseja continuar com a instalação? [y/N] ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Instalação cancelada."
    exit 0
fi
echo ""

# 1. Verificar sistema operacional
log_info "Verificando sistema operacional..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" != "ubuntu" ]] || [[ ! "$VERSION_ID" =~ ^(22|23|24) ]]; then
        log_warning "Este script foi testado apenas no Ubuntu 22.04+"
        log_warning "Sistema detectado: $PRETTY_NAME"
        read -p "Deseja continuar mesmo assim? [y/N] " -n 1 -r
        echo
        [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
    else
        log_success "Ubuntu $VERSION_ID detectado"
    fi
fi

# 2. Atualizar sistema
log_info "Atualizando sistema (isso pode demorar)..."
sudo apt-get update -qq || log_error "Falha ao atualizar pacotes"
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq
log_success "Sistema atualizado"

# 3. Instalar dependências
log_info "Instalando dependências essenciais..."
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    curl \
    git \
    build-essential \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    software-properties-common \
    ca-certificates \
    gnupg \
    postgresql \
    postgresql-contrib \
    || log_error "Falha ao instalar dependências"
log_success "Dependências instaladas"

# 4. Configurar PostgreSQL
log_info "Configurando PostgreSQL..."

# Iniciar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql > /dev/null 2>&1

# Criar banco de dados e usuário
log_info "Criando banco de dados '$DB_NAME'..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || log_warning "Banco já existe"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" 2>/dev/null || log_warning "Usuário já existe"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"

# Configurar pg_hba.conf para permitir conexões locais
PG_VERSION=$(psql --version | grep -oP '\d+' | head -1)
PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"

if [ -f "$PG_HBA" ]; then
    # Backup do arquivo original
    sudo cp "$PG_HBA" "$PG_HBA.backup"
    
    # Adicionar regra para md5 authentication
    if ! sudo grep -q "local.*$DB_NAME.*$DB_USER.*md5" "$PG_HBA"; then
        echo "local   $DB_NAME    $DB_USER                                md5" | sudo tee -a "$PG_HBA" > /dev/null
        sudo systemctl restart postgresql
    fi
fi

log_success "PostgreSQL configurado"
log_info "  Banco: $DB_NAME"
log_info "  Usuário: $DB_USER"
log_info "  Senha: $DB_PASSWORD"

# 5. Instalar Node.js v20
log_info "Instalando Node.js v20 LTS..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | sed 's/v//') -lt 18 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y nodejs || log_error "Falha ao instalar Node.js"
fi
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
log_success "Node.js $NODE_VERSION e NPM $NPM_VERSION instalados"

# 6. Configurar firewall
log_info "Configurando firewall..."
sudo ufw --force enable > /dev/null 2>&1
sudo ufw allow OpenSSH > /dev/null 2>&1
sudo ufw allow 'Nginx Full' > /dev/null 2>&1
sudo ufw allow 5432/tcp > /dev/null 2>&1  # PostgreSQL
log_success "Firewall configurado"

# 7. Clonar repositório
log_info "Clonando repositório..."
if [ -d "$PROJECT_DIR" ]; then
    log_warning "Diretório $PROJECT_DIR já existe"
    read -p "Deseja removê-lo e reinstalar? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo rm -rf "$PROJECT_DIR"
        log_info "Diretório removido"
    else
        log_error "Instalação cancelada"
    fi
fi

sudo mkdir -p "$PROJECT_DIR"
sudo chown $USER:$USER "$PROJECT_DIR"
git clone "$REPO_URL" "$PROJECT_DIR" || log_error "Falha ao clonar repositório"
cd "$PROJECT_DIR"
log_success "Repositório clonado"

# 8. Instalar dependências do projeto
log_info "Instalando dependências do projeto..."
npm install --loglevel=error || log_error "Falha ao instalar dependências"

# Instalar driver PostgreSQL
npm install pg --save || log_warning "Falha ao instalar pg driver"

log_success "Dependências instaladas"

# 9. Aplicar migrações do banco de dados
log_info "Aplicando migrações do banco de dados..."

# Criar arquivo SQL consolidado com todas as migrações
MIGRATIONS_SQL="$PROJECT_DIR/migrations_combined.sql"
cat > "$MIGRATIONS_SQL" << 'SQLEOF'
-- GovChat Database Schema
-- Consolidated migrations for PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

SQLEOF

# Concatenar todas as migrações
for migration in supabase/migrations/*.sql; do
    if [ -f "$migration" ]; then
        echo "-- Migration: $(basename $migration)" >> "$MIGRATIONS_SQL"
        cat "$migration" >> "$MIGRATIONS_SQL"
        echo "" >> "$MIGRATIONS_SQL"
    fi
done

# Aplicar migrações
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -f "$MIGRATIONS_SQL" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    log_success "Migrações aplicadas com sucesso"
    rm -f "$MIGRATIONS_SQL"
else
    log_warning "Algumas migrações falharam (pode ser normal se já foram aplicadas)"
fi

# 10. Configurar variáveis de ambiente
log_info "Configurando variáveis de ambiente..."

DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

cat > "$PROJECT_DIR/.env" << ENVEOF
# Database Configuration
DATABASE_URL="$DATABASE_URL"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="$DB_NAME"
DB_USER="$DB_USER"
DB_PASSWORD="$DB_PASSWORD"

# Application Settings
NODE_ENV="production"
VITE_APP_URL="${DOMAIN:+https://$DOMAIN}"

# JWT Secret (change this in production)
JWT_SECRET="$(openssl rand -base64 32)"

# Optional: AI Configuration
# LOVABLE_API_KEY="lovable_sk_..."
# GOOGLE_AI_API_KEY="AIza..."

# WhatsApp Configuration (optional)
# WHATSAPP_API_URL="https://graph.facebook.com/v18.0"
# WHATSAPP_ACCESS_TOKEN=""
# WHATSAPP_PHONE_NUMBER_ID=""
ENVEOF

log_success "Arquivo .env criado"
log_warning "⚠️  IMPORTANTE: Guarde estas credenciais em local seguro!"

# Salvar credenciais em arquivo separado
CREDS_FILE="$PROJECT_DIR/database_credentials.txt"
cat > "$CREDS_FILE" << CREDSEOF
GovChat - Credenciais do Banco de Dados
========================================

Banco de Dados: $DB_NAME
Usuário: $DB_USER
Senha: $DB_PASSWORD
Host: localhost
Port: 5432

String de Conexão:
$DATABASE_URL

IMPORTANTE: Guarde este arquivo em local seguro e delete após anotar as credenciais!

Data: $(date)
CREDSEOF

sudo chmod 600 "$CREDS_FILE"
log_success "Credenciais salvas em: $CREDS_FILE"

# 11. Build do projeto
log_info "Gerando build de produção (pode demorar)..."
if npm run build; then
    BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1 || echo "?")
    log_success "Build gerado com sucesso ($BUILD_SIZE)"
else
    log_warning "Build falhou. Execute manualmente: cd $PROJECT_DIR && npm run build"
fi

# 12. Configurar Nginx
log_info "Configurando Nginx..."

NGINX_CONF="/etc/nginx/sites-available/govchat"

if [ -f "scripts/nginx-govchat.conf" ]; then
    sudo cp scripts/nginx-govchat.conf "$NGINX_CONF"
    
    if [ -n "$DOMAIN" ]; then
        sudo sed -i "s/seu-dominio.gov.br/$DOMAIN/g" "$NGINX_CONF"
        sudo sed -i "s/server_name _;/server_name $DOMAIN;/g" "$NGINX_CONF"
    fi
else
    sudo tee "$NGINX_CONF" > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN:-_};
    root $PROJECT_DIR/dist;
    index index.html;
    
    access_log /var/log/nginx/govchat_access.log;
    error_log /var/log/nginx/govchat_error.log;
    
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
}
EOF
fi

sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/govchat
sudo rm -f /etc/nginx/sites-enabled/default

if sudo nginx -t > /dev/null 2>&1; then
    sudo systemctl restart nginx
    sudo systemctl enable nginx > /dev/null 2>&1
    log_success "Nginx configurado"
else
    log_error "Erro na configuração do Nginx"
fi

# 13. Configurar SSL
if [ -n "$DOMAIN" ]; then
    log_info "Configurando SSL..."
    
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
    DOMAIN_IP=$(dig +short "$DOMAIN" @8.8.8.8 | tail -1)
    
    if [ -n "$DOMAIN_IP" ] && [ "$SERVER_IP" = "$DOMAIN_IP" ]; then
        log_success "Domínio aponta para este servidor"
        
        if sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect; then
            log_success "SSL configurado"
        else
            log_warning "Execute manualmente: sudo certbot --nginx -d $DOMAIN"
        fi
    else
        log_warning "Configure o DNS e execute: sudo certbot --nginx -d $DOMAIN"
    fi
fi

# 14. Scripts executáveis
if [ -d "scripts" ]; then
    chmod +x scripts/*.sh 2>/dev/null || true
fi

# 15. Comando global
sudo tee /usr/local/bin/govchat-update > /dev/null << 'UPDATECMD'
#!/bin/bash
cd /var/www/govchat && ./scripts/update.sh "$@"
UPDATECMD
sudo chmod +x /usr/local/bin/govchat-update

# Comando para backup do banco
sudo tee /usr/local/bin/govchat-backup-db > /dev/null << 'BACKUPCMD'
#!/bin/bash
BACKUP_DIR="/var/backups/govchat"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
source /var/www/govchat/.env
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U $DB_USER -d $DB_NAME | gzip > "$BACKUP_DIR/govchat_$TIMESTAMP.sql.gz"
echo "Backup salvo: $BACKUP_DIR/govchat_$TIMESTAMP.sql.gz"
# Manter apenas últimos 7 backups
cd "$BACKUP_DIR" && ls -t govchat_*.sql.gz | tail -n +8 | xargs rm -f 2>/dev/null
BACKUPCMD
sudo chmod +x /usr/local/bin/govchat-backup-db

log_success "Comandos globais criados"

# 16. Informações finais
echo ""
echo "=========================================="
echo -e "${GREEN}  ✅ INSTALAÇÃO CONCLUÍDA!${NC}"
echo "=========================================="
echo ""

if [ -n "$DOMAIN" ]; then
    ACCESS_URL="https://$DOMAIN"
else
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
    ACCESS_URL="http://$SERVER_IP"
fi

log_success "Sistema instalado em: $PROJECT_DIR"
log_success "Banco de dados: PostgreSQL Local"
log_success "Acesse: $ACCESS_URL"
echo ""

log_warning "⚠️  CREDENCIAIS DO BANCO DE DADOS:"
echo ""
echo "  Banco: $DB_NAME"
echo "  Usuário: $DB_USER"
echo "  Senha: $DB_PASSWORD"
echo "  Host: localhost:5432"
echo ""
echo "  Arquivo: $CREDS_FILE"
echo ""

log_info "🔧 Comandos úteis:"
echo "   - Atualizar: ${CYAN}govchat-update${NC}"
echo "   - Backup BD: ${CYAN}govchat-backup-db${NC}"
echo "   - Monitor: ${CYAN}cd $PROJECT_DIR && ./scripts/monitor.sh${NC}"
echo "   - Logs: ${CYAN}sudo tail -f /var/log/nginx/govchat_error.log${NC}"
echo "   - PostgreSQL: ${CYAN}sudo -u postgres psql $DB_NAME${NC}"
echo ""

log_success "Instalação finalizada! 🎉"
echo ""
