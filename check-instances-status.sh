#!/bin/bash

echo "🔍 =========================================="
echo "🔍 VERIFICAR STATUS DAS INSTÂNCIAS WHATSAPP"
echo "🔍 =========================================="
echo ""

echo "📋 PASSO 1: Instâncias no banco de dados"
echo "=========================================="
sudo -u postgres psql -d govchat_nextplan -c "
  SELECT id, company_id, name, phone_number, status, created_at 
  FROM whatsapp_instances 
  ORDER BY created_at DESC LIMIT 5;
"
echo ""

echo "📋 PASSO 2: Verificar sessões Baileys no filesystem"
echo "=========================================="
echo "Diretório de sessões:"
ls -la /var/www/govchat/backend/whatsapp_sessions/ 2>/dev/null || echo "❌ Diretório não existe"
echo ""

echo "Subdire  de cada instância:"
find /var/www/govchat/backend/whatsapp_sessions/ -type d -maxdepth 1 2>/dev/null | tail -5
echo ""

echo "📋 PASSO 3: Verificar logs de reconexão"
echo "=========================================="
pm2 logs govchat-backend --lines 50 --nostream | grep -E "(Iniciando instância|Reconectando instância|já conectada|QR Code gerado|Conexão estabelecida)"
echo ""

echo "📋 PASSO 4: Status atual do PM2"
echo "=========================================="
pm2 status
echo ""

echo "📋 PASSO 5: Verificar se instância está sendo inicializada no startup"
echo "=========================================="
grep -n "startInstance" /var/www/govchat/backend/src/server.ts | head -10
echo ""

echo "🎯 =========================================="
echo "🎯 DIAGNÓSTICO"
echo "🎯 =========================================="
echo ""
echo "✅ Se a instância está no banco mas NÃO tem sessão no filesystem:"
echo "   → Precisa reconectar via QR Code"
echo ""
echo "✅ Se a instância tem sessão mas NÃO está em memória:"
echo "   → Precisa chamar startInstance() no startup do servidor"
echo ""
echo "✅ Se a instância está desconectada (status = disconnected):"
echo "   → Precisa re-autenticar"
echo ""
echo "📝 Próximos passos:"
echo "   1. Identificar o instance_id correto"
echo "   2. Garantir que startInstance() é chamado no startup"
echo "   3. Ou reconectar manualmente via QR Code"
echo ""
