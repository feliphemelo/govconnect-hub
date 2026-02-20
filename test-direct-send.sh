#!/bin/bash
echo "🧪 TESTE DIRETO DE ENVIO WHATSAPP"
echo "=================================="
echo ""

echo "📍 1. Verificando instância conectada"
echo "-------------------------------------"
echo "Executando na VPS..."
echo ""
echo "Via SSH execute:"
echo ""
echo "sudo -u postgres psql govchat_nextplan -c \"SELECT id, status, is_connected FROM whatsapp_instances LIMIT 1;\""
echo ""
read -p "Cole o ID da instância aqui: " INSTANCE_ID

echo ""
echo "📍 2. Teste de envio direto via API"
echo "-----------------------------------"
echo "Vamos testar envio direto com curl..."
echo ""
echo "Número destino: 5548988578510@s.whatsapp.net"
echo "Mensagem: Teste direto via API 🚀"
echo ""

# Pegar token do último login
echo "Obtendo token..."
read -p "Cole seu token JWT aqui (do localStorage): " TOKEN

echo ""
echo "📍 3. Enviando via API"
echo "---------------------"
curl -X POST https://atendimento.nextplan.tec.br/api/conversations/39d89021-95e0-4d01-a47d-7261431e1791/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"Teste direto API 🚀"}' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo ""
echo "📍 4. Verificando logs imediatamente"
echo "------------------------------------"
echo "Execute na VPS:"
echo "pm2 logs govchat-backend --lines 30"

