#!/bin/bash

echo "🔍 DIAGNÓSTICO DE AUTENTICAÇÃO"
echo "=============================="
echo ""

cd /var/www/govchat || exit 1

echo "1️⃣ Verificando logs do PM2..."
pm2 logs govchat-backend --lines 50 --nostream | tail -30
echo ""

echo "2️⃣ Verificando endpoint de login..."
cd backend/src
grep -n "app.post.*login\|/api/auth/login" server.ts | head -5
echo ""

echo "3️⃣ Verificando se utils/auth.ts existe e está correto..."
if [ -f "utils/auth.ts" ]; then
    echo "✅ utils/auth.ts existe"
    echo "   Conteúdo:"
    head -30 utils/auth.ts
else
    echo "❌ utils/auth.ts NÃO EXISTE!"
    echo "   Procurando arquivos de auth..."
    find . -name "*auth*" -type f
fi
echo ""

echo "4️⃣ Verificando imports de authMiddleware no server.ts..."
grep -n "import.*authMiddleware" server.ts
echo ""

echo "5️⃣ Verificando rotas protegidas com authMiddleware..."
grep -n "authMiddleware" server.ts | head -10
echo ""

echo "6️⃣ Testando endpoint de login diretamente..."
echo "   Enviando POST para /api/auth/login..."
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -w "\n\nHTTP Status: %{http_code}\n" 2>&1
echo ""

echo "7️⃣ Verificando status do backend..."
pm2 status govchat-backend
echo ""

echo "8️⃣ Verificando últimos erros no log..."
pm2 logs govchat-backend --err --lines 20 --nostream
echo ""

echo "═══════════════════════════════════════════════════════"
echo "EXECUTE ESTE SCRIPT E ME ENVIE TODO O OUTPUT!"
echo "═══════════════════════════════════════════════════════"
