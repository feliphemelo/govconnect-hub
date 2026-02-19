#!/bin/bash
# Script de atualização manual do GovChat

echo "======================================"
echo "  Atualizando GovChat"
echo "======================================"

cd /var/www/govchat || exit 1

echo ""
echo "1️⃣  Atualizando código do GitHub..."
git pull origin main

echo ""
echo "2️⃣  Atualizando backend..."
cd backend
npm install
npm run build

echo ""
echo "3️⃣  Reiniciando backend (PM2)..."
pm2 restart govchat-backend

echo ""
echo "4️⃣  Atualizando frontend..."
cd /var/www/govchat
rm -rf dist/ node_modules/.vite .cache
npm install
npm run build

echo ""
echo "5️⃣  Recarregando Nginx..."
systemctl reload nginx

echo ""
echo "======================================"
echo "✅  Sistema atualizado com sucesso!"
echo "======================================"
echo ""
echo "🌐  Acesse: https://atendimento.nextplan.tec.br"
echo "📧  Email: feliphe@nextplan.tec.br"
echo "🔑  Senha: &xr&HPn6"
echo ""
echo "📊  Para ver logs: pm2 logs govchat-backend --lines 20"
echo ""
