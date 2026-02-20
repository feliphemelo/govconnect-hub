#!/bin/bash

echo "🔧 CORREÇÃO FINAL DO ENDPOINT POST /api/conversations/:id/messages"
echo "=================================================================="
echo ""

cd /var/www/govchat/backend/src || exit 1

echo "1️⃣ Fazendo backup do server.ts atual..."
cp server.ts server.ts.backup_before_final_fix
echo "✅ Backup salvo: server.ts.backup_before_final_fix"
echo ""

echo "2️⃣ Verificando se endpoint POST tem authMiddleware..."
grep -n "app.post('/api/conversations/:id/messages'" server.ts
echo ""

echo "3️⃣ Corrigindo o endpoint para incluir authMiddleware..."
# Encontra a linha do endpoint POST sem auth e adiciona authMiddleware
LINE=$(grep -n "app.post('/api/conversations/:id/messages', async" server.ts | cut -d: -f1)

if [ ! -z "$LINE" ]; then
    echo "📍 Endpoint encontrado na linha $LINE SEM authMiddleware"
    echo "🔧 Adicionando authMiddleware..."
    
    # Substitui a linha para incluir authMiddleware
    sed -i "${LINE}s|app.post('/api/conversations/:id/messages', async|app.post('/api/conversations/:id/messages', authMiddleware, async|" server.ts
    
    echo "✅ authMiddleware adicionado!"
else
    echo "⚠️  Endpoint já tem authMiddleware ou não foi encontrado"
fi
echo ""

echo "4️⃣ Verificando se authMiddleware está importado..."
if ! grep -q "import.*authMiddleware" server.ts; then
    echo "⚠️  authMiddleware não está importado!"
    echo "🔧 Adicionando import..."
    
    # Adiciona import após outros imports
    sed -i "/import.*pool.*from.*config\/database/a import { authMiddleware } from './middleware/auth';" server.ts
    echo "✅ Import adicionado!"
else
    echo "✅ authMiddleware já está importado"
fi
echo ""

echo "5️⃣ Mostrando endpoint corrigido..."
grep -A 5 "app.post('/api/conversations/:id/messages'" server.ts | head -10
echo ""

echo "6️⃣ Compilando backend..."
cd /var/www/govchat/backend || exit 1
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro na compilação!"
    exit 1
fi
echo "✅ Compilação bem-sucedida!"
echo ""

echo "7️⃣ Reiniciando PM2..."
pm2 restart govchat-backend
sleep 3
pm2 status govchat-backend
echo ""

echo "8️⃣ Testando com autenticação..."
echo "⚠️  ATENÇÃO: Este teste vai falhar se não tiver token JWT válido"
echo "   Para testar pelo frontend, acesse: https://atendimento.nextplan.tec.br"
echo ""

echo "🧪 Testando endpoint com curl (vai retornar 401 sem token)..."
curl -X POST "http://localhost:3001/api/conversations/39d89021-95e0-4d01-a47d-7261431e1791/messages" \
  -H "Content-Type: application/json" \
  -d '{"content": "🎉 Teste com auth!", "message_type": "text"}' 2>&1 | python3 -m json.tool
echo ""

echo "9️⃣ Mostrando logs recentes..."
pm2 logs govchat-backend --lines 30 --nostream
echo ""

echo "✅ CORREÇÃO CONCLUÍDA!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Abra o frontend: https://atendimento.nextplan.tec.br"
echo "2. Faça login normalmente"
echo "3. Abra uma conversa no Chat"
echo "4. Envie uma mensagem"
echo "5. Dê F5 na página"
echo "6. Verifique se a mensagem continua aparecendo"
echo ""
echo "🔍 Se ainda houver erro, execute:"
echo "   pm2 logs govchat-backend --lines 50"
echo ""
