#!/bin/bash

echo "🔧 =========================================="
echo "🔧 INTEGRAR ENVIO DETALHADO"
echo "🔧 =========================================="
echo ""

cd /var/www/govchat/backend

echo "📋 PASSO 1: Backup do server.ts atual"
cp src/server.ts src/server.ts.backup-$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado"
echo ""

echo "📋 PASSO 2: Adicionar import do enhancedSendMessage"
# Procurar linha do import do whatsappService
grep -n "import.*whatsappService" src/server.ts | head -1
echo ""

# Adicionar import logo após o import do whatsappService
sed -i "/import.*whatsappService/a import { enhancedSendMessage } from './services/whatsapp-enhanced-send';" src/server.ts

echo "📋 PASSO 3: Substituir sendMessage por enhancedSendMessage"
echo ""
echo "Procurando chamadas ao sendMessage:"
grep -n "whatsappService.sendMessage" src/server.ts

# Substituir no POST endpoint (linha ~1385)
sed -i 's/await whatsappService\.sendMessage(/await enhancedSendMessage(/g' src/server.ts

echo ""
echo "✅ Substituição concluída"
echo ""

echo "📋 PASSO 4: Verificar se ficou correto"
echo "Linhas com enhancedSendMessage:"
grep -n -A 5 "enhancedSendMessage" src/server.ts
echo ""

echo "📋 PASSO 5: Recompilar o backend"
cd /var/www/govchat/backend
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Compilação bem-sucedida!"
else
  echo "❌ Erro na compilação!"
  echo "⚠️  Restaurando backup..."
  cp src/server.ts.backup-* src/server.ts
  exit 1
fi
echo ""

echo "📋 PASSO 6: Reiniciar o backend"
pm2 restart govchat-backend
pm2 status
echo ""

echo "📋 PASSO 7: Limpar e preparar logs"
pm2 flush
echo ""

echo "🎯 =========================================="
echo "🎯 TESTE AGORA:"
echo "🎯 =========================================="
echo ""
echo "1. Acesse: https://atendimento.nextplan.tec.br"
echo "2. Faça login"
echo "3. Abra a conversa"
echo "4. Envie a mensagem: 'Teste com logs detalhados 🔍'"
echo ""
echo "5. Execute na VPS:"
echo "   pm2 logs govchat-backend --lines 100 --nostream | grep -A 50 'ENVIO DETALHADO'"
echo ""
echo "Isso vai mostrar:"
echo "  - JID destino"
echo "  - Conteúdo da mensagem"
echo "  - Status do socket"
echo "  - Número conectado"
echo "  - Tempo de envio"
echo "  - Status da mensagem (1=servidor, 2=entregue, 3=lida)"
echo "  - Alerta se não foi entregue"
echo ""
echo "✅ Script finalizado!"
