#!/bin/bash

# Script de Diagnóstico Automático - QR Code WhatsApp

echo "=========================================="
echo "🔍 DIAGNÓSTICO AUTOMÁTICO - QR CODE"
echo "GovChat 2.1.2"
echo "=========================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

check_ok() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar diretório
if [ ! -d "backend" ] || [ ! -d "src" ]; then
    check_fail "Execute este script no diretório /var/www/govchat"
    exit 1
fi

echo "1️⃣  Verificando código atualizado..."
LATEST_COMMIT=$(git log --oneline -1 | cut -d' ' -f1)
info "Último commit: $LATEST_COMMIT"

if git log --oneline -5 | grep -q "1370421\|corrige geração de QR Code"; then
    check_ok "Código do QR Code encontrado no histórico"
else
    check_warn "Commit de correção não encontrado - executando git pull..."
    git pull origin main
fi

echo ""
echo "2️⃣  Verificando dependências do backend..."
cd backend

if npm list qrcode >/dev/null 2>&1; then
    VERSION=$(npm list qrcode 2>/dev/null | grep qrcode@ | head -1 | sed 's/.*qrcode@//')
    check_ok "qrcode instalado: versão $VERSION"
else
    check_fail "qrcode NÃO instalado"
    info "Instalando qrcode..."
    npm install qrcode @types/qrcode
    if [ $? -eq 0 ]; then
        check_ok "qrcode instalado com sucesso"
    else
        check_fail "Falha ao instalar qrcode"
        exit 1
    fi
fi

echo ""
echo "3️⃣  Verificando compilação do backend..."
if [ -f "dist/server.js" ]; then
    FILE_DATE=$(date -r dist/server.js "+%Y-%m-%d %H:%M:%S")
    check_ok "Backend compilado: $FILE_DATE"
    
    # Verificar se está muito antigo (mais de 1 dia)
    FILE_AGE=$(($(date +%s) - $(date -r dist/server.js +%s)))
    if [ $FILE_AGE -gt 86400 ]; then
        check_warn "Compilação antiga (>24h) - recompilando..."
        npm run build
    fi
else
    check_fail "Backend não compilado"
    info "Compilando backend..."
    npm run build
fi

# Verificar se qrcode está no código compilado
if grep -q "qrcode" dist/server.js 2>/dev/null; then
    check_ok "Import do qrcode encontrado no código compilado"
else
    check_fail "QRCode não encontrado no código compilado - recompilando..."
    npm run build
fi

cd ..

echo ""
echo "4️⃣  Verificando status do PM2..."
if pm2 describe govchat-backend >/dev/null 2>&1; then
    STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="govchat-backend") | .pm2_env.status' 2>/dev/null)
    UPTIME=$(pm2 jlist | jq -r '.[] | select(.name=="govchat-backend") | .pm2_env.pm_uptime' 2>/dev/null)
    
    if [ "$STATUS" = "online" ]; then
        check_ok "Backend está online"
        
        # Calcular uptime
        if [ ! -z "$UPTIME" ]; then
            UPTIME_SEC=$(( ($(date +%s) - ($UPTIME / 1000)) ))
            UPTIME_MIN=$(( $UPTIME_SEC / 60 ))
            info "Uptime: ${UPTIME_MIN} minutos"
            
            if [ $UPTIME_MIN -gt 60 ]; then
                check_warn "Backend rodando há muito tempo - reiniciando..."
                pm2 restart govchat-backend
            fi
        fi
    else
        check_fail "Backend está $STATUS - iniciando..."
        pm2 restart govchat-backend
    fi
else
    check_fail "Backend não encontrado no PM2"
    info "Iniciando backend..."
    pm2 start backend/dist/server.js --name govchat-backend
fi

echo ""
echo "5️⃣  Verificando banco de dados..."
if sudo -u postgres psql -d govchat_nextplan -c "\dt whatsapp_instances" >/dev/null 2>&1; then
    check_ok "Tabela whatsapp_instances existe"
    
    # Contar instâncias
    COUNT=$(sudo -u postgres psql -d govchat_nextplan -t -c "SELECT COUNT(*) FROM whatsapp_instances" 2>/dev/null | tr -d ' ')
    info "Instâncias cadastradas: $COUNT"
else
    check_fail "Tabela whatsapp_instances NÃO existe"
    if [ -f "create_whatsapp_table.sql" ]; then
        info "Criando tabela..."
        sudo -u postgres psql -d govchat_nextplan -f create_whatsapp_table.sql
        check_ok "Tabela criada com sucesso"
    else
        check_fail "Arquivo create_whatsapp_table.sql não encontrado"
    fi
fi

echo ""
echo "6️⃣  Verificando logs recentes..."
pm2 logs govchat-backend --lines 20 --nostream | tail -10

echo ""
echo "7️⃣  Testando porta do backend..."
if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
    check_ok "Backend respondendo na porta 3001"
else
    check_fail "Backend não responde na porta 3001"
fi

echo ""
echo "=========================================="
echo "📊 RESUMO DO DIAGNÓSTICO"
echo "=========================================="
echo ""

# Resumo final
ERRORS=0

echo "Checklist:"
echo ""

if git log --oneline -5 | grep -q "corrige geração de QR Code"; then
    echo "  ✅ Código atualizado"
else
    echo "  ❌ Código desatualizado"
    ERRORS=$((ERRORS + 1))
fi

if npm list qrcode --prefix backend >/dev/null 2>&1; then
    echo "  ✅ Dependência qrcode instalada"
else
    echo "  ❌ Dependência qrcode faltando"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "backend/dist/server.js" ]; then
    echo "  ✅ Backend compilado"
else
    echo "  ❌ Backend não compilado"
    ERRORS=$((ERRORS + 1))
fi

if pm2 describe govchat-backend >/dev/null 2>&1; then
    echo "  ✅ Backend rodando no PM2"
else
    echo "  ❌ Backend não está no PM2"
    ERRORS=$((ERRORS + 1))
fi

if sudo -u postgres psql -d govchat_nextplan -c "\dt whatsapp_instances" >/dev/null 2>&1; then
    echo "  ✅ Tabela whatsapp_instances existe"
else
    echo "  ❌ Tabela whatsapp_instances faltando"
    ERRORS=$((ERRORS + 1))
fi

echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}=========================================="
    echo "✅ TODOS OS TESTES PASSARAM!"
    echo -e "==========================================${NC}"
    echo ""
    echo "🎯 Próximo passo:"
    echo "   1. Abra: https://atendimento.nextplan.tec.br"
    echo "   2. Vá em: Configurações → WhatsApp"
    echo "   3. Clique no ícone de QR Code (📱)"
    echo "   4. O QR Code deve aparecer instantaneamente"
    echo ""
    echo "📝 Se ainda não funcionar:"
    echo "   - Abra F12 (Console do navegador)"
    echo "   - Veja erros no Console e Network"
    echo "   - Execute: pm2 logs govchat-backend"
else
    echo -e "${RED}=========================================="
    echo "❌ ENCONTRADOS $ERRORS PROBLEMA(S)"
    echo -e "==========================================${NC}"
    echo ""
    echo "🔧 Execute a correção automática:"
    echo "   ./update-qrcode.sh"
    echo ""
    echo "📚 Ou consulte o guia de debug:"
    echo "   cat DEBUG_QRCODE.md"
fi

echo ""
