#!/bin/bash

echo "🔧 CORREÇÃO FINAL - Login + Timestamp"
echo "====================================="
echo ""

cd /var/www/govchat/backend/src || exit 1

echo "1️⃣ Corrigindo timestamp em websocket.ts..."
echo "   Linha 198: const timestamp = ..."

# Verificar valor atual
echo "   Valor atual:"
sed -n '198p' websocket.ts

# Corrigir para usar new Date()
sed -i "198s/.*/    const timestamp = new Date();/" websocket.ts

echo "   Novo valor:"
sed -n '198p' websocket.ts
echo ""

echo "2️⃣ Verificando se endpoint de login existe..."
if grep -q "app.post.*\/api\/auth\/login" server.ts; then
    echo "✅ Endpoint de login já existe"
    grep -n "app.post.*\/api\/auth\/login" server.ts
else
    echo "❌ Endpoint de login NÃO existe!"
    echo "   Procurando endpoint de auth..."
    grep -n "login\|auth" server.ts | head -10
fi
echo ""

echo "3️⃣ Verificando estrutura do timestamp no INSERT..."
echo "   Linha 200-210 do websocket.ts:"
sed -n '200,210p' websocket.ts
echo ""

echo "4️⃣ Recompilando backend..."
cd /var/www/govchat/backend || exit 1
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ ERRO NA COMPILAÇÃO!"
    exit 1
fi

echo ""
echo "✅ COMPILAÇÃO OK!"
echo ""

echo "5️⃣ Reiniciando PM2..."
pm2 restart govchat-backend
sleep 3
echo ""

echo "6️⃣ Testando login diretamente..."
echo "   POST /api/auth/login..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nextplan.tec.br","password":"admin123"}' 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE")

echo "   Status: $HTTP_CODE"
echo "   Response: $BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Login funciona!"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Endpoint não encontrado (404)"
    echo "   Verificando rotas disponíveis..."
    grep -n "app.post\|app.get" src/server.ts | grep -i "auth\|login" | head -10
elif [ "$HTTP_CODE" = "401" ]; then
    echo "⚠️  Credenciais inválidas (esperado se usuário não existir)"
else
    echo "⚠️  Resposta inesperada"
fi
echo ""

echo "7️⃣ Verificando logs recentes..."
pm2 logs govchat-backend --lines 20 --nostream
echo ""

echo "═══════════════════════════════════════════════════════"
echo "✅ CORREÇÃO APLICADA!"
echo ""
echo "🧪 TESTE AGORA:"
echo "1. Acesse: https://atendimento.nextplan.tec.br"
echo "2. Tente fazer login"
echo "3. Envie mensagem"
echo "4. Dê F5 e verifique se persiste"
echo ""
echo "Se login ainda falhar (502):"
echo "   pm2 logs govchat-backend --err --lines 50"
echo "═══════════════════════════════════════════════════════"
