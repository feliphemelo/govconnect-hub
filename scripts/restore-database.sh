#!/bin/bash
#
# Script de Restauração do Banco de Dados PostgreSQL - GovChat
#
# Uso: ./restore-database.sh <arquivo_backup.sql.gz>
#

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# Configurações
PROJECT_DIR="/var/www/govchat"
BACKUP_FILE="$1"

echo "=========================================="
echo "  🔄 GovChat - Restauração do Banco"
echo "=========================================="
echo ""

# Verificar se arquivo foi fornecido
if [ -z "$BACKUP_FILE" ]; then
    log_error "Uso: $0 <arquivo_backup.sql.gz>"
fi

# Verificar se arquivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Arquivo não encontrado: $BACKUP_FILE"
fi

# Carregar variáveis de ambiente
if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
else
    log_error "Arquivo .env não encontrado em $PROJECT_DIR"
fi

# Verificar variáveis
if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    log_error "Variáveis de banco não configuradas no .env"
fi

log_warning "⚠️  ATENÇÃO: Esta operação irá SOBRESCREVER o banco atual!"
echo ""
log_info "Banco: $DB_NAME"
log_info "Arquivo: $BACKUP_FILE"
echo ""
read -p "Deseja continuar? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restauração cancelada."
    exit 0
fi

# Fazer backup do banco atual antes de restaurar
log_info "Criando backup de segurança do banco atual..."
SAFETY_BACKUP="/tmp/govchat_safety_$(date +%Y%m%d_%H%M%S).sql.gz"
PGPASSWORD=$DB_PASSWORD pg_dump -h ${DB_HOST:-localhost} -U $DB_USER -d $DB_NAME | gzip > "$SAFETY_BACKUP"
log_success "Backup de segurança criado: $SAFETY_BACKUP"

# Restaurar banco
log_info "Iniciando restauração..."

# Desconectar usuários ativos
sudo -u postgres psql -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME' AND pid <> pg_backend_pid();" > /dev/null 2>&1 || true

# Dropar e recriar banco
log_info "Recriando banco de dados..."
sudo -u postgres psql -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
sudo -u postgres psql -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || log_error "Falha ao criar banco"

# Restaurar backup
log_info "Restaurando dados..."
if gunzip -c "$BACKUP_FILE" | PGPASSWORD=$DB_PASSWORD psql -h ${DB_HOST:-localhost} -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
    log_success "Banco restaurado com sucesso!"
else
    log_error "Falha ao restaurar banco. Backup de segurança em: $SAFETY_BACKUP"
fi

# Verificar tabelas
log_info "Verificando tabelas..."
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h ${DB_HOST:-localhost} -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
    log_success "$TABLE_COUNT tabelas restauradas"
else
    log_warning "Nenhuma tabela encontrada no banco restaurado"
fi

# Remover backup de segurança se tudo ocorreu bem
read -p "Deseja remover o backup de segurança? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f "$SAFETY_BACKUP"
    log_success "Backup de segurança removido"
else
    log_info "Backup de segurança mantido em: $SAFETY_BACKUP"
fi

echo ""
log_success "Restauração concluída! 🔄"
echo ""
