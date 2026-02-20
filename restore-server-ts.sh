#!/bin/bash

echo "🚨 RESTAURANDO server.ts DO BACKUP"
echo "==================================="
echo ""

cd /var/www/govchat/backend/src || exit 1

echo "1️⃣ Verificando tamanho do server.ts..."
ls -lh server.ts
echo ""

if [ ! -s server.ts ]; then
    echo "❌ server.ts está VAZIO!"
    echo ""
    
    echo "2️⃣ Procurando backup mais recente..."
    ls -lht server.ts.backup* | head -5
    echo ""
    
    echo "3️⃣ Escolhendo melhor backup..."
    # Pegar o maior arquivo de backup (mais completo)
    BEST_BACKUP=$(ls -lS server.ts.backup* | grep -v "_old\|_send" | head -1 | awk '{print $9}')
    echo "   Usando: $BEST_BACKUP"
    echo "   Tamanho: $(ls -lh $BEST_BACKUP | awk '{print $5}')"
    echo ""
    
    echo "4️⃣ Fazendo backup do arquivo vazio..."
    cp server.ts server.ts.empty_backup
    echo "✅ Backup salvo: server.ts.empty_backup"
    echo ""
    
    echo "5️⃣ Restaurando do backup..."
    cp "$BEST_BACKUP" server.ts
    echo "✅ server.ts restaurado!"
    echo ""
    
    echo "6️⃣ Verificando conteúdo restaurado..."
    wc -l server.ts
    head -20 server.ts
    echo ""
else
    echo "✅ server.ts não está vazio"
fi

echo "7️⃣ Verificando se tem endpoint de login..."
if grep -q "auth.*login\|login.*auth" server.ts; then
    echo "✅ Endpoint de login encontrado:"
    grep -n "auth.*login\|login.*auth" server.ts | head -5
else
    echo "❌ Endpoint de login NÃO encontrado!"
    echo "   Precisaremos adicionar..."
fi
echo ""

echo "8️⃣ Recompilando..."
cd /var/www/govchat/backend || exit 1
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ COMPILAÇÃO OK!"
    echo ""
    
    echo "9️⃣ Reiniciando PM2..."
    pm2 restart govchat-backend
    sleep 3
    
    echo ""
    echo "🔟 Testando backend..."
    curl -s http://localhost:3001/api/health || echo "Tentando /api/status..." && curl -s http://localhost:3001/api/status
    echo ""
    
    echo "✅ Backend restaurado!"
    echo ""
    echo "Testando login..."
    curl -X POST http://localhost:3001/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"test@test.com","password":"test"}' \
      -w "\nHTTP: %{http_code}\n" 2>&1
else
    echo ""
    echo "❌ ERRO NA COMPILAÇÃO!"
    echo "   Verifique os erros acima"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "STATUS: server.ts restaurado do backup"
echo "═══════════════════════════════════════════════════════"
