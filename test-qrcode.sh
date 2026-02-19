#!/bin/bash

# Script de teste da rota de QR Code

echo "=========================================="
echo "Teste de QR Code WhatsApp - GovChat"
echo "=========================================="
echo ""

# Verificar se o backend está rodando
echo "1. Verificando status do backend..."
pm2 status govchat-backend

echo ""
echo "2. Verificando últimos logs do backend..."
pm2 logs govchat-backend --lines 30 --nostream | grep -i "qr\|error\|whatsapp" || echo "Nenhum log relevante encontrado"

echo ""
echo "3. Testando rota de WhatsApp config..."
curl -s -X GET "https://atendimento.nextplan.tec.br/api/whatsapp/config" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  | jq . 2>/dev/null || echo "Erro ao chamar API (verifique token)"

echo ""
echo "=========================================="
echo "Instruções para teste manual:"
echo "=========================================="
echo ""
echo "1. Abra o navegador em modo anônimo"
echo "2. Abra o Console (F12 → Console)"
echo "3. Acesse: https://atendimento.nextplan.tec.br"
echo "4. Faça login com: feliphe@nextplan.tec.br / Teikei9@"
echo "5. Vá em: Configurações → WhatsApp"
echo "6. Clique no ícone de QR Code (📱)"
echo "7. Observe o Console e a aba Network:"
echo ""
echo "   O QUE PROCURAR NO CONSOLE:"
echo "   - ✅ Requisição para: /api/whatsapp/config/:id/qrcode"
echo "   - ✅ Status: 200 OK"
echo "   - ✅ Response com: qr_code (data:image/png;base64...)"
echo "   - ❌ Se erro 500: problema no backend"
echo "   - ❌ Se erro 404: instância não encontrada"
echo "   - ❌ Se erro 401: problema de autenticação"
echo ""
echo "   COMANDOS ÚTEIS:"
echo "   pm2 logs govchat-backend          # Ver logs em tempo real"
echo "   pm2 restart govchat-backend       # Reiniciar backend"
echo "   pm2 stop govchat-backend          # Parar backend"
echo ""
