#!/bin/bash
#
# Script de Monitoramento - GovChat
#
# Verifica saúde do sistema, logs, uso de recursos
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
LOG_FILE="/var/log/govchat-monitor.log"

# Funções de log
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

timestamp() { date "+%Y-%m-%d %H:%M:%S"; }

echo "=========================================="
echo "  📊 GovChat - Status do Sistema"
echo "  $(timestamp)"
echo "=========================================="
echo ""

# 1. Status do Nginx
log_info "Verificando Nginx..."
if systemctl is-active --quiet nginx; then
    log_success "Nginx está rodando"
    NGINX_STATUS="OK"
else
    log_error "Nginx NÃO está rodando!"
    NGINX_STATUS="DOWN"
fi

# 2. Verificar conectividade HTTP
log_info "Verificando conectividade HTTP..."
if curl -fs -o /dev/null http://localhost; then
    log_success "Site respondendo em localhost"
    HTTP_STATUS="OK"
else
    log_error "Site NÃO está acessível!"
    HTTP_STATUS="FAIL"
fi

# 3. Uso de disco
log_info "Verificando uso de disco..."
DISK_USAGE=$(df -h "$PROJECT_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_AVAILABLE=$(df -h "$PROJECT_DIR" | awk 'NR==2 {print $4}')

echo "  Uso: ${DISK_USAGE}% | Disponível: ${DISK_AVAILABLE}"

if [ "$DISK_USAGE" -gt 90 ]; then
    log_error "Disco quase cheio! (${DISK_USAGE}%)"
elif [ "$DISK_USAGE" -gt 80 ]; then
    log_warning "Espaço em disco baixo (${DISK_USAGE}%)"
else
    log_success "Espaço em disco OK (${DISK_USAGE}%)"
fi

# 4. Uso de memória
log_info "Verificando uso de memória..."
MEM_INFO=$(free -h | awk 'NR==2 {print "Usado: "$3" / Total: "$2" ("$3"/"$2")"}')
MEM_PERCENT=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')

echo "  $MEM_INFO"

if [ "$MEM_PERCENT" -gt 90 ]; then
    log_error "Memória quase esgotada! (${MEM_PERCENT}%)"
elif [ "$MEM_PERCENT" -gt 80 ]; then
    log_warning "Uso de memória alto (${MEM_PERCENT}%)"
else
    log_success "Memória OK (${MEM_PERCENT}%)"
fi

# 5. Carga do sistema (Load Average)
log_info "Verificando carga do sistema..."
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}')
echo "  Load Average:$LOAD_AVG"

# 6. Últimos erros do Nginx
log_info "Últimos erros do Nginx (5 linhas)..."
if [ -f "/var/log/nginx/govchat_error.log" ]; then
    ERROR_COUNT=$(wc -l < /var/log/nginx/govchat_error.log)
    echo "  Total de erros registrados: $ERROR_COUNT"
    
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo ""
        echo "  Últimas 5 linhas:"
        tail -n 5 /var/log/nginx/govchat_error.log | sed 's/^/    /'
    else
        log_success "Nenhum erro registrado"
    fi
else
    log_warning "Arquivo de log não encontrado"
fi

# 7. Status dos arquivos do projeto
log_info "Verificando arquivos do projeto..."
if [ -d "$PROJECT_DIR/dist" ]; then
    DIST_SIZE=$(du -sh "$PROJECT_DIR/dist" | cut -f1)
    FILE_COUNT=$(find "$PROJECT_DIR/dist" -type f | wc -l)
    log_success "Build presente: $DIST_SIZE ($FILE_COUNT arquivos)"
else
    log_error "Diretório dist não encontrado!"
fi

# 8. Última atualização Git
log_info "Última atualização..."
if [ -d "$PROJECT_DIR/.git" ]; then
    cd "$PROJECT_DIR"
    LAST_COMMIT=$(git log -1 --format="%h - %s (%cr)")
    BRANCH=$(git branch --show-current)
    echo "  Branch: $BRANCH"
    echo "  Commit: $LAST_COMMIT"
else
    log_warning "Não é um repositório Git"
fi

# 9. Certificado SSL (se existir)
log_info "Verificando certificado SSL..."
DOMAIN=$(grep "server_name" /etc/nginx/sites-available/govchat | grep -v "#" | awk '{print $2}' | tr -d ';' | head -1)

if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "_" ]; then
    CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    
    if [ -f "$CERT_PATH" ]; then
        CERT_EXPIRY=$(openssl x509 -enddate -noout -in "$CERT_PATH" | cut -d= -f2)
        CERT_DAYS=$(( ( $(date -d "$CERT_EXPIRY" +%s) - $(date +%s) ) / 86400 ))
        
        echo "  Domínio: $DOMAIN"
        echo "  Expira em: $CERT_DAYS dias ($CERT_EXPIRY)"
        
        if [ "$CERT_DAYS" -lt 7 ]; then
            log_error "Certificado SSL expira em breve!"
        elif [ "$CERT_DAYS" -lt 30 ]; then
            log_warning "Certificado SSL expira em menos de 30 dias"
        else
            log_success "Certificado SSL válido"
        fi
    else
        log_warning "Certificado SSL não encontrado"
    fi
else
    log_info "SSL não configurado (nenhum domínio)"
fi

# 10. Resumo final
echo ""
echo "=========================================="
echo "  📋 RESUMO"
echo "=========================================="
echo ""

STATUS="HEALTHY"
if [ "$NGINX_STATUS" != "OK" ] || [ "$HTTP_STATUS" != "OK" ]; then
    STATUS="CRITICAL"
fi

if [ "$STATUS" = "HEALTHY" ]; then
    log_success "Sistema funcionando normalmente"
else
    log_error "Sistema com problemas! Verifique os erros acima."
fi

echo ""
echo "  Nginx: $NGINX_STATUS"
echo "  HTTP: $HTTP_STATUS"
echo "  Disco: ${DISK_USAGE}%"
echo "  Memória: ${MEM_PERCENT}%"
echo ""

# Salvar log
{
    echo "$(timestamp) | Nginx: $NGINX_STATUS | HTTP: $HTTP_STATUS | Disk: ${DISK_USAGE}% | Mem: ${MEM_PERCENT}%"
} >> "$LOG_FILE" 2>/dev/null || true

log_info "Log salvo em: $LOG_FILE"
echo ""
