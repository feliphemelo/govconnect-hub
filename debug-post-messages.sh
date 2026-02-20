#!/bin/bash
echo "🔍 DEBUG: ENDPOINT POST MENSAGENS"
echo "================================="
echo ""

cd /var/www/govchat/backend/src

echo "📍 1. Encontrando endpoint POST messages"
echo "----------------------------------------"
grep -n "POST.*conversations.*:id.*messages" server.ts

echo ""
echo "📍 2. Mostrando código do POST (linhas 1355-1420)"
echo "-------------------------------------------------"
sed -n '1355,1420p' server.ts

echo ""
echo "📍 3. Limpando logs e enviando mensagem de teste"
echo "------------------------------------------------"
pm2 flush govchat-backend
sleep 1

echo "🧪 Tentando enviar mensagem via API..."
# Não vamos fazer o POST real aqui, só preparar para debug

echo ""
echo "📍 4. Aguardando você enviar mensagem pelo frontend..."
echo "------------------------------------------------------"
echo "⏳ Esperando 5 segundos..."
sleep 5

echo ""
echo "📍 5. Capturando logs após tentativa de envio"
echo "---------------------------------------------"
pm2 logs govchat-backend --err --lines 100 --nostream

echo ""
echo "📍 6. Logs completos"
echo "-------------------"
pm2 logs govchat-backend --lines 50 --nostream

