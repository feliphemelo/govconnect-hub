#!/bin/bash
#
# GovChat - Instalador Rápido para VPS
# 
# Uso:
#   curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install.sh | bash
#
# Ou com domínio:
#   curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install.sh | bash -s seu-dominio.gov.br
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
EOF
echo -e "${NC}"
echo "=========================================="
echo "  🚀 Instalador Automático - VPS"
echo "=========================================="
echo ""

# Verificar se é root ou tem sudo
if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
    log_error "Este script precisa de privilégios sudo. Execute: sudo bash install.sh"
fi

# Informações
log_info "Repositório: ${REPO_URL}"
log_info "Destino: ${PROJECT_DIR}"
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
else
    log_warning "Não foi possível detectar o sistema operacional"
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
    || log_error "Falha ao instalar dependências"
log_success "Dependências instaladas"

# 4. Instalar Node.js v20
log_info "Instalando Node.js v20 LTS..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | sed 's/v//') -lt 18 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y nodejs || log_error "Falha ao instalar Node.js"
fi
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
log_success "Node.js $NODE_VERSION e NPM $NPM_VERSION instalados"

# 5. Configurar firewall
log_info "Configurando firewall..."
sudo ufw --force enable > /dev/null 2>&1
sudo ufw allow OpenSSH > /dev/null 2>&1
sudo ufw allow 'Nginx Full' > /dev/null 2>&1
log_success "Firewall configurado (SSH, HTTP, HTTPS)"

# 6. Criar diretório e clonar repositório
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

# 7. Instalar dependências do projeto
log_info "Instalando dependências do projeto (pode demorar)..."
npm install --loglevel=error || log_error "Falha ao instalar dependências"
log_success "Dependências instaladas"

# 8. Configurar variáveis de ambiente
log_info "Configurando variáveis de ambiente..."
if [ ! -f ".env" ]; then
    if [ -f ".env.production.template" ]; then
        cp .env.production.template .env
        log_success "Arquivo .env criado"
    else
        cat > .env << 'ENVEOF'
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_chave_publica"
VITE_SUPABASE_PROJECT_ID="seu_project_id"
VITE_APP_URL="https://seu-dominio.gov.br"
ENVEOF
        log_success "Arquivo .env criado"
    fi
    log_warning "⚠️  ATENÇÃO: Configure o arquivo .env com suas credenciais!"
    echo "    Execute: nano $PROJECT_DIR/.env"
else
    log_info "Arquivo .env já existe"
fi

# 9. Build do projeto
log_info "Gerando build de produção (pode demorar)..."
if npm run build; then
    BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1 || echo "?")
    log_success "Build gerado com sucesso ($BUILD_SIZE)"
else
    log_warning "Build falhou. Você precisará executar manualmente:"
    log_warning "  cd $PROJECT_DIR && npm run build"
fi

# 10. Configurar Nginx
log_info "Configurando Nginx..."

NGINX_CONF="/etc/nginx/sites-available/govchat"

if [ -f "scripts/nginx-govchat.conf" ]; then
    sudo cp scripts/nginx-govchat.conf "$NGINX_CONF"
    
    # Substituir domínio se fornecido
    if [ -n "$DOMAIN" ]; then
        sudo sed -i "s/seu-dominio.gov.br/$DOMAIN/g" "$NGINX_CONF"
        sudo sed -i "s/server_name _;/server_name $DOMAIN;/g" "$NGINX_CONF"
    fi
else
    # Criar configuração básica se arquivo não existir
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

# Ativar site
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/govchat
sudo rm -f /etc/nginx/sites-enabled/default

# Testar e reiniciar
if sudo nginx -t > /dev/null 2>&1; then
    sudo systemctl restart nginx
    sudo systemctl enable nginx > /dev/null 2>&1
    log_success "Nginx configurado e rodando"
else
    log_error "Erro na configuração do Nginx. Execute: sudo nginx -t"
fi

# 11. Configurar SSL (se domínio fornecido)
if [ -n "$DOMAIN" ]; then
    log_info "Configurando SSL com Let's Encrypt..."
    
    # Verificar se domínio aponta para este servidor
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
    DOMAIN_IP=$(dig +short "$DOMAIN" @8.8.8.8 | tail -1)
    
    if [ -n "$DOMAIN_IP" ] && [ "$SERVER_IP" = "$DOMAIN_IP" ]; then
        log_success "Domínio aponta para este servidor ($SERVER_IP)"
        
        # Obter certificado
        if sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect; then
            log_success "SSL configurado com sucesso"
        else
            log_warning "Não foi possível configurar SSL automaticamente"
            log_info "Execute manualmente: sudo certbot --nginx -d $DOMAIN"
        fi
    else
        log_warning "Domínio não aponta para este servidor"
        log_info "  IP do servidor: $SERVER_IP"
        log_info "  IP do domínio: ${DOMAIN_IP:-não resolvido}"
        log_info "  Configure o DNS e execute: sudo certbot --nginx -d $DOMAIN"
    fi
else
    log_info "SSL não configurado (nenhum domínio fornecido)"
fi

# 12. Tornar scripts executáveis
if [ -d "scripts" ]; then
    chmod +x scripts/*.sh 2>/dev/null || true
    log_success "Scripts tornados executáveis"
fi

# 13. Criar script de atualização no PATH
log_info "Criando comando global 'govchat-update'..."
sudo tee /usr/local/bin/govchat-update > /dev/null << 'UPDATECMD'
#!/bin/bash
cd /var/www/govchat && ./scripts/update.sh "$@"
UPDATECMD
sudo chmod +x /usr/local/bin/govchat-update
log_success "Comando 'govchat-update' criado"

# 14. Informações finais
echo ""
echo "=========================================="
echo -e "${GREEN}  ✅ INSTALAÇÃO CONCLUÍDA!${NC}"
echo "=========================================="
echo ""

# Determinar URL de acesso
if [ -n "$DOMAIN" ]; then
    ACCESS_URL="https://$DOMAIN"
else
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
    ACCESS_URL="http://$SERVER_IP"
fi

log_success "Sistema instalado em: $PROJECT_DIR"
log_success "Acesse: $ACCESS_URL"
echo ""

log_warning "⚠️  PRÓXIMOS PASSOS OBRIGATÓRIOS:"
echo ""
echo "1. Configure as variáveis de ambiente:"
echo -e "   ${CYAN}nano $PROJECT_DIR/.env${NC}"
echo ""
echo "2. Adicione suas credenciais do Supabase:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_PUBLISHABLE_KEY"
echo "   - VITE_SUPABASE_PROJECT_ID"
echo ""
echo "3. Se o build falhou, execute:"
echo -e "   ${CYAN}cd $PROJECT_DIR && npm run build${NC}"
echo ""
echo "4. Configure o domínio no Supabase Auth:"
echo "   - Acesse: https://app.supabase.com"
echo "   - Adicione $ACCESS_URL nas Redirect URLs"
echo ""

log_info "📚 Documentação:"
echo "   - Guia Rápido: $PROJECT_DIR/QUICKSTART_VPS.md"
echo "   - Guia Completo: $PROJECT_DIR/docs/DEPLOY_VPS.md"
echo ""

log_info "🔧 Comandos úteis:"
echo "   - Atualizar sistema: ${CYAN}govchat-update${NC}"
echo "   - Monitorar status: ${CYAN}cd $PROJECT_DIR && ./scripts/monitor.sh${NC}"
echo "   - Ver logs: ${CYAN}sudo tail -f /var/log/nginx/govchat_error.log${NC}"
echo ""

log_success "Instalação finalizada! 🎉"
echo ""
