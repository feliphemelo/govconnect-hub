#!/bin/bash
set -e

echo "🔄 Iniciando deploy final do GovChat..."

cd /var/www/govchat

echo "📥 Atualizando código..."
git fetch origin
git reset --hard origin/main

echo "🧹 Limpando artefatos antigos..."
rm -rf dist/ node_modules/.vite .cache

echo "🔨 Buildando frontend..."
npm run build

echo "📦 Verificando build..."
BUILD_FILE=$(ls -1 dist/assets/index-*.js | head -1)
if [ -z "$BUILD_FILE" ]; then
  echo "❌ ERRO: Build falhou - nenhum arquivo JS gerado!"
  exit 1
fi

echo "✅ Build OK: $BUILD_FILE"
ls -lh "$BUILD_FILE"

echo "🔄 Atualizando backend..."
cd backend
git pull origin main
npm install --production
npm run build

echo "🔄 Reiniciando backend..."
pm2 restart govchat-backend
sleep 2

echo "🌐 Recarregando Nginx..."
systemctl reload nginx

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "🌐 URL: https://atendimento.nextplan.tec.br"
echo "📧 Email: feliphe@nextplan.tec.br"
echo "🔑 Senha: Teikei9@"
echo ""
echo "📊 Status do backend:"
pm2 status govchat-backend

echo ""
echo "📋 Últimos logs:"
pm2 logs govchat-backend --lines 5 --nostream
