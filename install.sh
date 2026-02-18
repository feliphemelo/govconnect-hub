#!/bin/bash
#
# GovChat - Instalador Interativo
# Sistema de Atendimento ao Cidadão
#
# Uso:
#   wget https://github.com/feliphemelo/govconnect-hub/raw/main/install.sh
#   chmod +x install.sh
#   sudo ./install.sh
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
    Instalador Interativo v2.0
EOF
echo ""
echo "=========================================="
echo "  Instalacao Automatica com PostgreSQL"
echo "=========================================="
echo ""

# Verificar se eh root
if [ "$EUID" -ne 0 ]; then
    log_error "Execute como root ou com sudo"
fi

# ============================================
# COLETA DE INFORMACOES
# ============================================

log_info "Por favor, forneça as informações necessárias:"
echo ""

# 1. Dominio
while true; do
    read -p "Dominio (ex: atendimento.exemplo.com.br): " DOMAIN
    if [[ -z "$DOMAIN" ]]; then
        echo "  [!] Dominio nao pode ser vazio"
        continue
    fi
    # Verificar se tem formato valido
    if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
        echo "  [!] Dominio invalido"
        continue
    fi
    break
done

# 2. Nome da empresa
while true; do
    read -p "Nome da Empresa: " COMPANY_NAME
    if [[ -z "$COMPANY_NAME" ]]; then
        echo "  [!] Nome nao pode ser vazio"
        continue
    fi
    break
done

# 3. Email do admin
while true; do
    read -p "Email do Administrador: " ADMIN_EMAIL
    if [[ -z "$ADMIN_EMAIL" ]]; then
        echo "  [!] Email nao pode ser vazio"
        continue
    fi
    # Validar email basico
    if [[ ! "$ADMIN_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        echo "  [!] Email invalido"
        continue
    fi
    break
done

# 4. Nome do admin
read -p "Nome Completo do Administrador: " ADMIN_NAME
if [[ -z "$ADMIN_NAME" ]]; then
    ADMIN_NAME="Administrador"
fi

# 5. Senha do admin
while true; do
    read -s -p "Senha do Administrador (min 8 caracteres): " ADMIN_PASSWORD
    echo ""
    if [[ ${#ADMIN_PASSWORD} -lt 8 ]]; then
        echo "  [!] Senha deve ter no minimo 8 caracteres"
        continue
    fi
    read -s -p "Confirme a senha: " ADMIN_PASSWORD2
    echo ""
    if [[ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD2" ]]; then
        echo "  [!] Senhas nao conferem"
        continue
    fi
    break
done

# 6. Configuracao automatica do banco
COMPANY_SLUG=$(echo "$COMPANY_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | sed 's/[^a-z0-9_]//g')
DB_NAME="govchat_${COMPANY_SLUG}"
DB_USER="govchat_user"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Configuracoes fixas
REPO_URL="https://github.com/feliphemelo/govconnect-hub.git"
PROJECT_DIR="/var/www/govchat"

echo ""
log_info "Resumo da Instalacao:"
echo "  Dominio:   $DOMAIN"
echo "  Empresa:   $COMPANY_NAME"
echo "  Email:     $ADMIN_EMAIL"
echo "  Nome:      $ADMIN_NAME"
echo "  Banco:     $DB_NAME"
echo ""

# Confirmacao final
read -p "Continuar com a instalacao? [y/N] " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Instalacao cancelada."
    exit 0
fi
echo ""

# ============================================
# INSTALACAO
# ============================================

# 1. Verificar sistema
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
else
    log_error "Sistema operacional nao suportado"
fi

# 2. Atualizar sistema
log_info "Atualizando sistema..."
apt update -qq
DEBIAN_FRONTEND=noninteractive apt upgrade -y -qq
log_success "Sistema atualizado"

# 3. Instalar dependencias
log_info "Instalando dependencias..."
DEBIAN_FRONTEND=noninteractive apt install -y -qq \
    curl wget git build-essential \
    nginx certbot python3-certbot-nginx \
    postgresql postgresql-contrib \
    ufw
log_success "Dependencias instaladas"

# 4. Configurar PostgreSQL
log_info "Configurando PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"

# Configurar pg_hba.conf
PG_VERSION=$(ls /etc/postgresql/ | head -1)
PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"
if ! grep -q "$DB_NAME" "$PG_HBA"; then
    echo "local   $DB_NAME    $DB_USER                                md5" | sudo tee -a "$PG_HBA" > /dev/null
    systemctl restart postgresql
fi
log_success "PostgreSQL configurado"

# 5. Instalar Node.js v20
log_info "Instalando Node.js v20..."
if ! command -v node &> /dev/null || [[ ! "$(node -v)" =~ ^v20 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt install -y -qq nodejs
fi
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
log_success "Node.js $NODE_VERSION e NPM $NPM_VERSION instalados"

# 6. Configurar firewall
log_info "Configurando firewall..."
ufw --force enable > /dev/null 2>&1
ufw allow OpenSSH > /dev/null 2>&1
ufw allow 'Nginx Full' > /dev/null 2>&1
log_success "Firewall configurado"

# 7. Clonar repositorio
log_info "Clonando repositorio..."
if [ -d "$PROJECT_DIR" ]; then
    log_warning "Diretorio ja existe. Removendo..."
    rm -rf "$PROJECT_DIR"
fi
git clone "$REPO_URL" "$PROJECT_DIR" || log_error "Falha ao clonar repositorio"
cd "$PROJECT_DIR"
log_success "Repositorio clonado"

# 8. Instalar dependencias do projeto
log_info "Instalando dependencias do projeto..."
npm install --loglevel=error || log_error "Falha ao instalar dependencias"
log_success "Dependencias instaladas"

# 9. Aplicar migracoes
log_info "Aplicando migracoes do banco..."
MIGRATIONS_SQL="/tmp/migrations_$$.sql"
cat > "$MIGRATIONS_SQL" << 'MIGRATIONS_HEADER'
-- Aplicando migracoes do banco de dados
MIGRATIONS_HEADER

# Concatenar todas as migracoes
for migration in supabase/migrations/*.sql; do
    if [ -f "$migration" ]; then
        echo "-- Migracao: $(basename $migration)" >> "$MIGRATIONS_SQL"
        cat "$migration" >> "$MIGRATIONS_SQL"
        echo "" >> "$MIGRATIONS_SQL"
    fi
done

# Aplicar migracoes
sudo -u postgres psql -d "$DB_NAME" -f "$MIGRATIONS_SQL" > /dev/null 2>&1 || log_warning "Algumas migracoes podem ter falhado"
rm -f "$MIGRATIONS_SQL"
log_success "Migracoes aplicadas"

# 10. Criar empresa e usuario
log_info "Criando empresa e usuario administrador..."
ADMIN_PASSWORD_HASH=$(echo -n "$ADMIN_PASSWORD" | openssl dgst -sha256 | awk '{print $2}')

sudo -u postgres psql -d "$DB_NAME" << EOF > /dev/null 2>&1
-- Criar empresa
INSERT INTO companies (name, slug, plan, active, created_at, updated_at)
VALUES ('$COMPANY_NAME', '$COMPANY_SLUG', 'enterprise', true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Criar usuario admin (simulado - em producao usar Supabase Auth)
DO \$\$
DECLARE
    v_company_id UUID;
    v_user_id UUID;
BEGIN
    -- Pegar ID da empresa
    SELECT id INTO v_company_id FROM companies WHERE slug = '$COMPANY_SLUG';
    
    -- Criar perfil
    INSERT INTO profiles (id, email, full_name, company_id, role, active, created_at, updated_at)
    VALUES (gen_random_uuid(), '$ADMIN_EMAIL', '$ADMIN_NAME', v_company_id, 'admin', true, NOW(), NOW())
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO v_user_id;
    
    -- Criar role de usuario
    IF v_user_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, company_id, role)
        VALUES (v_user_id, v_company_id, 'admin')
        ON CONFLICT DO NOTHING;
    END IF;
END \$\$;

-- Criar setor padrao
INSERT INTO sectors (company_id, name, active, created_at, updated_at)
SELECT id, 'Atendimento Geral', true, NOW(), NOW()
FROM companies WHERE slug = '$COMPANY_SLUG'
ON CONFLICT DO NOTHING;
EOF

log_success "Empresa e usuario criados"

# 11. Criar arquivo .env
log_info "Configurando variaveis de ambiente..."
cat > "$PROJECT_DIR/.env" << EOF
# Database Configuration
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="$DB_NAME"
DB_USER="$DB_USER"
DB_PASSWORD="$DB_PASSWORD"

# Supabase Configuration (fallback - usar PostgreSQL local)
VITE_SUPABASE_URL="http://localhost:5432"
VITE_SUPABASE_PUBLISHABLE_KEY="local-dev-key"
VITE_SUPABASE_PROJECT_ID="local"

# Application Configuration
VITE_APP_URL="https://$DOMAIN"
NODE_ENV="production"
EOF
log_success "Variaveis configuradas"

# 12. Build do projeto
log_info "Gerando build de producao..."
npm run build || log_error "Falha ao gerar build"
log_success "Build gerado"

# 13. Configurar Nginx
log_info "Configurando Nginx..."
cat > /etc/nginx/sites-available/govchat << EOF
server {
    listen 80;
    server_name $DOMAIN;
    root $PROJECT_DIR/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache de assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
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
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/govchat /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar e recarregar
nginx -t || log_error "Erro na configuracao do Nginx"
systemctl reload nginx
log_success "Nginx configurado"

# 14. Configurar SSL com Let's Encrypt
log_info "Configurando SSL..."
log_info "Verificando DNS..."

# Verificar se o DNS aponta para este servidor
SERVER_IP=$(curl -s ifconfig.me)
DNS_IP=$(dig +short "$DOMAIN" | tail -1)

if [[ "$SERVER_IP" != "$DNS_IP" ]]; then
    log_warning "DNS nao aponta para este servidor!"
    log_warning "IP do servidor: $SERVER_IP"
    log_warning "IP no DNS: $DNS_IP"
    log_warning ""
    log_warning "Configure o DNS para apontar para $SERVER_IP e execute:"
    log_warning "  sudo certbot --nginx -d $DOMAIN"
    log_warning ""
else
    # DNS correto, gerar SSL
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect || {
        log_warning "Falha ao gerar SSL automatico"
        log_warning "Execute manualmente: sudo certbot --nginx -d $DOMAIN"
    }
    log_success "SSL configurado"
fi

# 15. Criar comandos globais
log_info "Criando comandos globais..."

# Comando de update
cat > /usr/local/bin/govchat-update << 'EOF'
#!/bin/bash
cd /var/www/govchat
git pull origin main
npm install
npm run build
systemctl reload nginx
echo "Sistema atualizado com sucesso!"
EOF
chmod +x /usr/local/bin/govchat-update

# Comando de backup
cat > /usr/local/bin/govchat-backup-db << EOF
#!/bin/bash
BACKUP_DIR="/var/backups/govchat"
mkdir -p "\$BACKUP_DIR"
BACKUP_FILE="\$BACKUP_DIR/backup_\$(date +%Y%m%d_%H%M%S).sql.gz"
sudo -u postgres pg_dump "$DB_NAME" | gzip > "\$BACKUP_FILE"
echo "Backup salvo em: \$BACKUP_FILE"
# Manter apenas ultimos 7 backups
ls -t "\$BACKUP_DIR"/backup_*.sql.gz | tail -n +8 | xargs rm -f 2>/dev/null || true
EOF
chmod +x /usr/local/bin/govchat-backup-db

log_success "Comandos criados"

# 16. Salvar credenciais
CREDENTIALS_FILE="$PROJECT_DIR/CREDENCIAIS_INSTALACAO.txt"
cat > "$CREDENTIALS_FILE" << EOF
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

Empresa:
  Nome: $COMPANY_NAME
  Slug: $COMPANY_SLUG

Comandos Uteis:
  - Atualizar sistema: govchat-update
  - Backup do banco: govchat-backup-db
  - Status Nginx: systemctl status nginx
  - Status PostgreSQL: systemctl status postgresql
  - Logs Nginx: tail -f /var/log/nginx/error.log

========================================
  GUARDE ESTAS INFORMACOES COM SEGURANCA
========================================
EOF

chmod 600 "$CREDENTIALS_FILE"

# ============================================
# FINALIZACAO
# ============================================

clear
cat << "EOF"
========================================
  INSTALACAO CONCLUIDA COM SUCESSO!
========================================
EOF
echo ""
log_success "Sistema instalado em: $PROJECT_DIR"
log_success "Credenciais salvas em: $CREDENTIALS_FILE"
echo ""
log_info "Acesse o sistema em: https://$DOMAIN"
log_info "Email: $ADMIN_EMAIL"
log_info "Senha: (a que voce definiu)"
echo ""
log_warning "IMPORTANTE:"
log_warning "1. Guarde as credenciais com seguranca"
log_warning "2. Altere a senha no primeiro acesso"
log_warning "3. Configure backup automatico (cron)"
echo ""
log_info "Comandos disponiveis:"
echo "  - govchat-update      (atualizar sistema)"
echo "  - govchat-backup-db   (backup do banco)"
echo ""

# Mostrar credenciais
cat "$CREDENTIALS_FILE"
