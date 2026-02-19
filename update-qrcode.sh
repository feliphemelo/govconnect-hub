#!/bin/bash

# =========================================
# SCRIPT DE ATUALIZAÇÃO - QR CODE FIX
# GovChat 2.1.2
# =========================================

echo "========================================"
echo "GovChat - Correção QR Code WhatsApp"
echo "Versão 2.1.2"
echo "========================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

# Verificar se está no diretório correto
if [ ! -d "backend" ] || [ ! -d "src" ]; then
    error "Execute este script no diretório /var/www/govchat"
    exit 1
fi

log "Parando backend..."
pm2 stop govchat-backend 2>/dev/null || true

log "Baixando atualizações do GitHub..."
git pull origin main

if [ $? -ne 0 ]; then
    error "Falha ao baixar atualizações"
    exit 1
fi

log "Instalando dependências do backend..."
cd backend
npm install

if [ $? -ne 0 ]; then
    error "Falha ao instalar dependências"
    exit 1
fi

log "Compilando backend TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    error "Falha na compilação TypeScript"
    exit 1
fi

cd ..

log "Reiniciando backend..."
pm2 restart govchat-backend

if [ $? -ne 0 ]; then
    error "Falha ao reiniciar backend"
    exit 1
fi

log "Aguardando 3 segundos..."
sleep 3

log "Verificando status do backend..."
pm2 status govchat-backend

log "Verificando últimos logs..."
pm2 logs govchat-backend --lines 20 --nostream

echo ""
echo "========================================"
echo -e "${GREEN}✅ Atualização concluída com sucesso!${NC}"
echo "========================================"
echo ""
echo "📋 Testes a realizar:"
echo "  1. Acesse: https://atendimento.nextplan.tec.br"
echo "  2. Vá em: Configurações → WhatsApp"
echo "  3. Clique no ícone de QR Code"
echo "  4. Verifique se o QR Code aparece instantaneamente"
echo ""
echo "🔍 Verificações:"
echo "  ✅ QR Code carrega rapidamente"
echo "  ✅ Imagem nítida e clara"
echo "  ✅ Sem erros no console do navegador"
echo "  ✅ Status muda para 'Conectando...'"
echo ""
echo "📝 Logs em tempo real:"
echo "  pm2 logs govchat-backend"
echo ""
echo "🔧 Comandos úteis:"
echo "  pm2 restart govchat-backend  # Reiniciar"
echo "  pm2 status                   # Ver status"
echo "  pm2 logs govchat-backend     # Ver logs"
echo ""
echo "📚 Documentação:"
echo "  /var/www/govchat/CORRECAO_QRCODE.md"
echo ""
