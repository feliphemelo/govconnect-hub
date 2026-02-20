#!/bin/bash

echo "🔍 DIAGNÓSTICO COMPLETO - Backend não responde (502)"
echo "===================================================="
echo ""

cd /var/www/govchat || exit 1

echo "1️⃣ Status do PM2..."
pm2 status
echo ""

echo "2️⃣ Verificando se backend está ouvindo na porta 3001..."
netstat -tlnp | grep 3001 || ss -tlnp | grep 3001
echo ""

echo "3️⃣ Verificando processo Node.js..."
ps aux | grep node | grep -v grep
echo ""

echo "4️⃣ Últimos 50 logs do PM2 (stdout)..."
pm2 logs govchat-backend --lines 50 --nostream | tail -50
echo ""

echo "5️⃣ Últimos 30 erros do PM2..."
pm2 logs govchat-backend --err --lines 30 --nostream
echo ""

echo "6️⃣ Testando conexão local na porta 3001..."
curl -v http://localhost:3001/api/health 2>&1 || echo "❌ Backend não responde"
echo ""

echo "7️⃣ Verificando configuração do Nginx..."
nginx -t 2>&1
echo ""

echo "8️⃣ Verificando proxy reverso no Nginx..."
grep -A 10 "location /api" /etc/nginx/sites-enabled/* 2>/dev/null | head -20
echo ""

echo "9️⃣ Verificando se há erros de compilação TypeScript..."
cd backend
if [ -d "dist" ]; then
    echo "✅ Diretório dist/ existe"
    ls -lh dist/ | head -10
else
    echo "❌ Diretório dist/ NÃO EXISTE!"
fi
echo ""

echo "🔟 Tentando recompilar..."
npm run build 2>&1 | tail -30
echo ""

echo "═══════════════════════════════════════════════════════"
echo "📋 ANÁLISE:"
echo ""
if pm2 status | grep -q "online"; then
    echo "✅ PM2 está rodando"
else
    echo "❌ PM2 NÃO está rodando"
fi
echo ""
echo "🔧 AÇÕES SUGERIDAS:"
echo "1. Se houver erro de compilação TypeScript:"
echo "   cd /var/www/govchat/backend && npm run build"
echo ""
echo "2. Se backend não estiver rodando:"
echo "   pm2 restart govchat-backend"
echo ""
echo "3. Se erros persistirem:"
echo "   pm2 delete govchat-backend"
echo "   cd /var/www/govchat/backend"
echo "   pm2 start dist/server.js --name govchat-backend"
echo ""
echo "═══════════════════════════════════════════════════════"
