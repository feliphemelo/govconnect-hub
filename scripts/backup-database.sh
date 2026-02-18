#!/bin/bash
#
# Script de Backup do Banco de Dados PostgreSQL - GovChat
#
# Uso: ./backup-database.sh [destino]
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
BACKUP_DIR="${1:-/var/backups/govchat}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_READABLE=$(date "+%Y-%m-%d %H:%M:%S")

echo "=========================================="
echo "  💾 GovChat - Backup do Banco de Dados"
echo "=========================================="
echo ""

# Carregar variáveis de ambiente
if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
else
    log_error "Arquivo .env não encontrado em $PROJECT_DIR"
fi

# Verificar variáveis necessárias
if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    log_error "Variáveis de banco não configuradas no .env"
fi

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

log_info "Configurações:"
echo "  Banco: $DB_NAME"
echo "  Usuário: $DB_USER"
echo "  Destino: $BACKUP_DIR"
echo ""

# Nome do arquivo de backup
BACKUP_FILE="$BACKUP_DIR/govchat_${TIMESTAMP}.sql.gz"
BACKUP_FILE_PLAIN="$BACKUP_DIR/govchat_${TIMESTAMP}.sql"

# Fazer backup
log_info "Iniciando backup..."

if PGPASSWORD=$DB_PASSWORD pg_dump -h ${DB_HOST:-localhost} -U $DB_USER -d $DB_NAME > "$BACKUP_FILE_PLAIN" 2>/dev/null; then
    # Comprimir backup
    gzip "$BACKUP_FILE_PLAIN"
    
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_success "Backup criado com sucesso!"
    echo "  Arquivo: $BACKUP_FILE"
    echo "  Tamanho: $BACKUP_SIZE"
    echo "  Data: $DATE_READABLE"
else
    log_error "Falha ao criar backup"
fi

# Criar arquivo de metadados
META_FILE="$BACKUP_DIR/govchat_${TIMESTAMP}.meta"
cat > "$META_FILE" << EOF
Backup GovChat
=============
Data: $DATE_READABLE
Banco: $DB_NAME
Arquivo: $(basename $BACKUP_FILE)
Tamanho: $BACKUP_SIZE

Para restaurar:
gunzip -c $BACKUP_FILE | PGPASSWORD=\$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME
EOF

log_success "Metadados salvos em: $META_FILE"

# Limpar backups antigos (manter últimos 7)
log_info "Limpando backups antigos..."
cd "$BACKUP_DIR"
BACKUP_COUNT=$(ls -1 govchat_*.sql.gz 2>/dev/null | wc -l)

if [ "$BACKUP_COUNT" -gt 7 ]; then
    DELETED=$(ls -t govchat_*.sql.gz | tail -n +8)
    ls -t govchat_*.sql.gz | tail -n +8 | xargs rm -f
    ls -t govchat_*.meta | tail -n +8 | xargs rm -f 2>/dev/null
    log_success "Backups antigos removidos"
else
    log_info "Mantendo $BACKUP_COUNT backup(s)"
fi

# Listar backups disponíveis
echo ""
log_info "Backups disponíveis:"
ls -lht "$BACKUP_DIR"/govchat_*.sql.gz 2>/dev/null | head -7 | awk '{print "  "$9" - "$5}' || echo "  Nenhum backup encontrado"

echo ""
log_success "Backup concluído! 💾"
echo ""
