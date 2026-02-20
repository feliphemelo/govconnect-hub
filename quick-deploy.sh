#!/bin/bash
# ============================================================================
# 🚀 QUICK DEPLOY - Correção do Endpoint POST
# ============================================================================
# Versão: 2.6.2
# Data: 2026-02-19
# Commit: 0af64b5
# ============================================================================

set -e  # Para em caso de erro

echo "🚀 INICIANDO DEPLOY RÁPIDO..."
echo "=============================="
echo ""

# 1. Navegar para o diretório
echo "📂 Navegando para /var/www/govchat..."
cd /var/www/govchat || { echo "❌ Diretório não encontrado!"; exit 1; }
echo "✅ Diretório OK"
echo ""

# 2. Atualizar código
echo "📥 Atualizando código do GitHub..."
git fetch origin main
git reset --hard origin/main
echo "✅ Código atualizado"
echo ""

# 3. Verificar commit
echo "🔍 Verificando versão..."
CURRENT_COMMIT=$(git rev-parse --short HEAD)
echo "   Commit atual: $CURRENT_COMMIT"
git log --oneline -3
echo ""

# 4. Executar correção
echo "🔧 Executando script de correção..."
if [ -f "./fix-post-endpoint-final.sh" ]; then
    chmod +x ./fix-post-endpoint-final.sh
    ./fix-post-endpoint-final.sh
else
    echo "❌ Script fix-post-endpoint-final.sh não encontrado!"
    echo "   Execute manualmente:"
    echo "   cd /var/www/govchat/backend/src"
    echo "   # Adicione authMiddleware ao endpoint POST"
    echo "   cd /var/www/govchat/backend"
    echo "   npm run build"
    echo "   pm2 restart govchat-backend"
    exit 1
fi

echo ""
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo ""
echo "🧪 PRÓXIMOS PASSOS:"
echo "1. Acesse: https://atendimento.nextplan.tec.br"
echo "2. Faça login"
echo "3. Envie uma mensagem no chat"
echo "4. Dê F5 na página"
echo "5. Verifique se a mensagem ainda aparece"
echo ""
echo "📋 Verificar logs:"
echo "   pm2 logs govchat-backend --lines 50 --nostream"
echo ""
echo "🎉 Sistema pronto para uso!"
