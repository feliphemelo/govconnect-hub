#!/bin/bash
#
# Script de Setup Inicial da VPS Ubuntu 22.04
# GovChat - Sistema de Atendimento
#
# Uso: bash vps-setup.sh [dominio]
# Exemplo: bash vps-setup.sh govchat.exemplo.gov.br
#

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se é root ou tem sudo
if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
    log_error "Este script precisa ser executado como root ou com sudo"
    exit 1
fi

DOMAIN=${1:-""}
PROJECT_DIR="/var/www/govchat"
REPO_URL=${REPO_URL:-""}

echo "=========================================="
echo "  🚀 GovChat - Setup VPS Ubuntu 22.04"
echo "=========================================="
echo ""

if [ -z "$DOMAIN" ]; then
    log_warning "Nenhum domínio fornecido. O SSL não será configurado automaticamente."
    read -p "Deseja continuar sem domínio? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    log_info "Domínio configurado: $DOMAIN"
fi

# 1. Atualizar sistema
log_info "Atualizando sistema..."
sudo apt update -qq
sudo apt upgrade -y -qq
log_success "Sistema atualizado"

# 2. Instalar dependências
log_info "Instalando dependências essenciais..."
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx ufw -qq
log_success "Dependências instaladas"

# 3. Configurar Firewall
log_info "Configurando firewall..."
sudo ufw --force enable
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
log_success "Firewall configurado"

# 4. Instalar Node.js v20
log_info "Instalando Node.js v20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs -qq
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
log_success "Node.js $NODE_VERSION e NPM $NPM_VERSION instalados"

# 5. Criar diretório do projeto
log_info "Criando diretório do projeto..."
sudo mkdir -p "$PROJECT_DIR"
sudo chown $USER:$USER "$PROJECT_DIR"
log_success "Diretório criado: $PROJECT_DIR"

# 6. Clonar repositório (se URL fornecida)
if [ -n "$REPO_URL" ]; then
    log_info "Clonando repositório..."
    if [ -d "$PROJECT_DIR/.git" ]; then
        log_warning "Repositório já existe. Fazendo pull..."
        cd "$PROJECT_DIR"
        git pull
    else
        git clone "$REPO_URL" "$PROJECT_DIR"
    fi
    log_success "Repositório clonado"
else
    log_warning "REPO_URL não definida. Você precisará clonar manualmente:"
    log_warning "  git clone <seu-repo> $PROJECT_DIR"
fi

# 7. Configurar variáveis de ambiente
log_info "Configurando variáveis de ambiente..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
    cat > "$PROJECT_DIR/.env.template" << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_chave_publica_aqui"
VITE_SUPABASE_PROJECT_ID="seu_project_id"

# Optional: Para usar IA no chatbot
# LOVABLE_API_KEY="sua_chave_api_lovable"
EOF
    log_warning "Arquivo .env.template criado em $PROJECT_DIR"
    log_warning "IMPORTANTE: Copie para .env e configure as variáveis!"
    log_warning "  cd $PROJECT_DIR && cp .env.template .env && nano .env"
fi

# 8. Instalar dependências do projeto
if [ -f "$PROJECT_DIR/package.json" ]; then
    log_info "Instalando dependências do projeto..."
    cd "$PROJECT_DIR"
    npm install --production=false
    log_success "Dependências instaladas"
    
    # 9. Build do projeto
    log_info "Gerando build de produção..."
    npm run build
    log_success "Build gerado em $PROJECT_DIR/dist"
else
    log_warning "package.json não encontrado. Pule para o próximo passo."
fi

# 10. Configurar Nginx
log_info "Configurando Nginx..."

NGINX_CONF="/etc/nginx/sites-available/govchat"
sudo tee "$NGINX_CONF" > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN:-_};

    root $PROJECT_DIR/dist;
    index index.html;

    # Logs
    access_log /var/log/nginx/govchat_access.log;
    error_log /var/log/nginx/govchat_error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # Cache de assets estáticos
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # SPA fallback - ESSENCIAL para React Router
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Bloquear acesso a arquivos sensíveis
    location ~ /\. {
        deny all;
        return 404;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Ativar site
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/govchat
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
if sudo nginx -t; then
    log_success "Configuração do Nginx válida"
    sudo systemctl restart nginx
    log_success "Nginx reiniciado"
else
    log_error "Erro na configuração do Nginx"
    exit 1
fi

# 11. Configurar SSL (se domínio fornecido)
if [ -n "$DOMAIN" ]; then
    log_info "Configurando SSL com Let's Encrypt..."
    if command -v certbot &> /dev/null; then
        sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email || {
            log_warning "Não foi possível configurar SSL automaticamente."
            log_warning "Execute manualmente: sudo certbot --nginx -d $DOMAIN"
        }
    else
        log_warning "Certbot não instalado. SSL não configurado."
    fi
else
    log_warning "SSL não configurado (nenhum domínio fornecido)"
fi

# 12. Criar script de atualização
log_info "Criando script de atualização..."
sudo tee "$PROJECT_DIR/update.sh" > /dev/null << 'UPDATEEOF'
#!/bin/bash
set -e

echo "🔄 Atualizando GovChat..."

cd /var/www/govchat

echo "📥 Fazendo pull do repositório..."
git pull origin main

echo "📦 Instalando dependências..."
npm install --production=false

echo "🏗️ Gerando build..."
npm run build

echo "✅ Deploy concluído!"
echo "Sistema atualizado em: $(date)"
UPDATEEOF

sudo chmod +x "$PROJECT_DIR/update.sh"
log_success "Script de atualização criado: $PROJECT_DIR/update.sh"

# 13. Informações finais
echo ""
echo "=========================================="
log_success "Setup concluído com sucesso!"
echo "=========================================="
echo ""
log_info "📁 Diretório do projeto: $PROJECT_DIR"
log_info "🌐 Nginx configurado e rodando"

if [ -n "$DOMAIN" ]; then
    log_info "🔗 Acesse: http://$DOMAIN (ou https:// se SSL configurado)"
else
    SERVER_IP=$(curl -s ifconfig.me || echo "seu-ip")
    log_info "🔗 Acesse: http://$SERVER_IP"
fi

echo ""
log_warning "⚠️  PRÓXIMOS PASSOS OBRIGATÓRIOS:"
echo ""
echo "1. Configure as variáveis de ambiente:"
echo "   cd $PROJECT_DIR && nano .env"
echo ""
echo "2. Execute o build se ainda não fez:"
echo "   cd $PROJECT_DIR && npm run build"
echo ""
echo "3. Para atualizar o sistema no futuro:"
echo "   $PROJECT_DIR/update.sh"
echo ""
echo "4. Configure o domínio no Supabase Auth:"
echo "   - Adicione https://$DOMAIN nas 'Redirect URLs'"
echo ""
echo "5. Monitore os logs:"
echo "   sudo tail -f /var/log/nginx/govchat_access.log"
echo "   sudo tail -f /var/log/nginx/govchat_error.log"
echo ""
log_success "Bom deploy! 🚀"
