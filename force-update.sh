#!/bin/bash
echo "🔄 Forçando atualização completa do GovChat..."

cd /var/www/govchat || exit 1

echo ""
echo "1️⃣  Descartando mudanças locais..."
git reset --hard HEAD
git clean -fd

echo ""
echo "2️⃣  Atualizando código..."
git fetch origin
git reset --hard origin/main

echo ""
echo "3️⃣  Limpando caches..."
rm -rf dist/ node_modules/.vite .cache node_modules/.cache

echo ""
echo "4️⃣  Reinstalando dependências..."
npm install

echo ""
echo "5️⃣  Buildando frontend..."
npm run build

echo ""
echo "6️⃣  Verificando novo arquivo gerado..."
ls -lh dist/assets/index-*.js | tail -1

echo ""
echo "7️⃣  Atualizando backend..."
cd backend
npm install
npm run build

echo ""
echo "8️⃣  Reiniciando PM2..."
pm2 restart govchat-backend

echo ""
echo "9️⃣  Recarregando Nginx..."
systemctl reload nginx

echo ""
echo "======================================"
echo "✅  Atualização forçada concluída!"
echo "======================================"
echo ""
echo "🌐  URL: https://atendimento.nextplan.tec.br"
echo "📧  Email: feliphe@nextplan.tec.br"
echo "🔑  Senha: Teikei9@"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Limpe o cache do navegador (CTRL+SHIFT+DEL)"
echo "   2. Feche TODAS as abas do site"
echo "   3. Abra em modo anônimo (CTRL+SHIFT+N)"
echo ""
echo "📊  Novo arquivo JS:"
ls -lh /var/www/govchat/dist/assets/index-*.js | tail -1 | awk '{print $9}'
echo ""
