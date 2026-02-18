#!/bin/bash
#
# Script de Atualização/Deploy - GovChat
#
# Este script faz pull das atualizações, instala dependências,
# gera build e reinicia serviços se necessário.
#
# Uso: ./update.sh [branch]
# Exemplo: ./update.sh main
#

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
PROJECT_DIR="/var/www/govchat"
BRANCH=${1:-main}
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Funções de log
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Banner
echo "=========================================="
echo "  🔄 GovChat - Script de Atualização"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    log_error "package.json não encontrado em $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# 1. Backup do build atual
log_info "Criando backup do build atual..."
mkdir -p "$BACKUP_DIR"
if [ -d "dist" ]; then
    tar -czf "$BACKUP_DIR/dist-$TIMESTAMP.tar.gz" dist/ 2>/dev/null || true
    log_success "Backup criado: dist-$TIMESTAMP.tar.gz"
    
    # Manter apenas os 5 backups mais recentes
    cd "$BACKUP_DIR"
    ls -t dist-*.tar.gz | tail -n +6 | xargs rm -f 2>/dev/null || true
    cd "$PROJECT_DIR"
else
    log_warning "Diretório dist não encontrado. Pulando backup."
fi

# 2. Stash de mudanças locais (se houver)
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    log_warning "Mudanças locais detectadas. Fazendo stash..."
    git stash save "Auto-stash antes de update - $TIMESTAMP"
fi

# 3. Pull das atualizações
log_info "Atualizando código do repositório (branch: $BRANCH)..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
log_success "Código atualizado"

# 4. Verificar se houve mudanças no package.json
PACKAGE_CHANGED=false
if git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
    PACKAGE_CHANGED=true
    log_warning "package.json foi modificado. Atualizando dependências..."
fi

# 5. Instalar/atualizar dependências
if [ "$PACKAGE_CHANGED" = true ] || [ ! -d "node_modules" ]; then
    log_info "Instalando dependências..."
    npm ci --production=false
    log_success "Dependências instaladas"
else
    log_info "Sem mudanças no package.json. Pulando instalação de dependências."
fi

# 6. Executar build
log_info "Gerando build de produção..."
BUILD_START=$(date +%s)

if npm run build; then
    BUILD_END=$(date +%s)
    BUILD_TIME=$((BUILD_END - BUILD_START))
    log_success "Build concluído em ${BUILD_TIME}s"
else
    log_error "Falha no build!"
    
    # Restaurar backup se existir
    if [ -f "$BACKUP_DIR/dist-$TIMESTAMP.tar.gz" ]; then
        log_warning "Restaurando backup anterior..."
        rm -rf dist
        tar -xzf "$BACKUP_DIR/dist-$TIMESTAMP.tar.gz"
        log_success "Backup restaurado"
    fi
    
    exit 1
fi

# 7. Verificar se Nginx está rodando
if systemctl is-active --quiet nginx; then
    log_info "Recarregando Nginx..."
    sudo systemctl reload nginx
    log_success "Nginx recarregado"
else
    log_warning "Nginx não está rodando"
fi

# 8. Limpar caches antigos (opcional)
log_info "Limpando arquivos temporários..."
npm cache clean --force 2>/dev/null || true
rm -rf .cache 2>/dev/null || true

# 9. Verificar saúde do sistema
log_info "Verificando sistema..."

# Verificar espaço em disco
DISK_USAGE=$(df -h "$PROJECT_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    log_warning "Espaço em disco baixo: ${DISK_USAGE}% usado"
fi

# Verificar se o site está acessível
if command -v curl &> /dev/null; then
    if curl -fs http://localhost > /dev/null; then
        log_success "Site acessível em localhost"
    else
        log_warning "Site pode não estar acessível"
    fi
fi

# 10. Informações finais
echo ""
echo "=========================================="
log_success "Atualização concluída com sucesso!"
echo "=========================================="
echo ""
log_info "📊 Informações:"
echo "  - Branch: $BRANCH"
echo "  - Commit: $(git rev-parse --short HEAD)"
echo "  - Data: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  - Build: $PROJECT_DIR/dist"
echo ""
log_info "📁 Backups disponíveis:"
ls -lh "$BACKUP_DIR" | tail -n 5 || echo "  Nenhum backup encontrado"
echo ""
log_info "📝 Para ver logs do Nginx:"
echo "  sudo tail -f /var/log/nginx/govchat_access.log"
echo "  sudo tail -f /var/log/nginx/govchat_error.log"
echo ""
log_success "Sistema atualizado! 🚀"
