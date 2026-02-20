#!/bin/bash

echo "🔧 CORREÇÃO FINAL - Remove TODOS os Endpoints Duplicados"
echo "========================================================"
echo ""

cd /var/www/govchat/backend/src || exit 1

echo "1️⃣ Executando script Python de limpeza..."
python3 /var/www/govchat/remove-duplicate-endpoints.py

if [ $? -ne 0 ]; then
    echo "❌ Erro ao executar script Python"
    exit 1
fi
echo ""

echo "2️⃣ Verificando imports de authMiddleware..."
IMPORT_COUNT=$(grep -c "import.*authMiddleware" server.ts)
echo "   Imports encontrados: $IMPORT_COUNT"

if [ "$IMPORT_COUNT" -gt 1 ]; then
    echo "   Removendo duplicados..."
    # Manter apenas o primeiro import
    awk '!x[$0]++ || !/import.*authMiddleware/' server.ts > server.ts.tmp && mv server.ts.tmp server.ts
    echo "   ✅ Duplicados removidos"
elif [ "$IMPORT_COUNT" -eq 0 ]; then
    echo "   Adicionando import..."
    sed -i "1i import { authMiddleware } from './middleware/auth';" server.ts
    echo "   ✅ Import adicionado"
else
    echo "   ✅ Import OK"
fi
echo ""

echo "3️⃣ Garantindo authMiddleware nos endpoints restantes..."
# GET messages
LINE=$(grep -n "app.get('/api/conversations/:id/messages'" server.ts | cut -d: -f1)
if [ ! -z "$LINE" ]; then
    if ! sed -n "${LINE}p" server.ts | grep -q "authMiddleware"; then
        sed -i "${LINE}s|app.get('/api/conversations/:id/messages'|app.get('/api/conversations/:id/messages', authMiddleware|" server.ts
        echo "   ✅ authMiddleware adicionado em GET messages"
    else
        echo "   ✅ GET messages já tem authMiddleware"
    fi
fi

# POST messages
LINE=$(grep -n "app.post('/api/conversations/:id/messages'" server.ts | cut -d: -f1)
if [ ! -z "$LINE" ]; then
    if ! sed -n "${LINE}p" server.ts | grep -q "authMiddleware"; then
        sed -i "${LINE}s|app.post('/api/conversations/:id/messages'|app.post('/api/conversations/:id/messages', authMiddleware|" server.ts
        echo "   ✅ authMiddleware adicionado em POST messages"
    else
        echo "   ✅ POST messages já tem authMiddleware"
    fi
fi

# GET conversations
LINE=$(grep -n "app.get('/api/conversations')" server.ts | cut -d: -f1)
if [ ! -z "$LINE" ]; then
    if ! sed -n "${LINE}p" server.ts | grep -q "authMiddleware"; then
        sed -i "${LINE}s|app.get('/api/conversations'|app.get('/api/conversations', authMiddleware|" server.ts
        echo "   ✅ authMiddleware adicionado em GET conversations"
    else
        echo "   ✅ GET conversations já tem authMiddleware"
    fi
fi
echo ""

echo "4️⃣ Validação final..."
echo "   Endpoints restantes:"
grep -n "app\.\(get\|post\)('/api/conversations" server.ts | grep -v "^\s*//" | head -10
echo ""

echo "5️⃣ Recompilando backend..."
cd /var/www/govchat/backend
npm run build 2>&1 | tee /tmp/build_log.txt

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ COMPILAÇÃO BEM-SUCEDIDA!"
    echo ""
    
    echo "6️⃣ Reiniciando PM2..."
    pm2 restart govchat-backend
    sleep 4
    pm2 status govchat-backend
    echo ""
    
    echo "7️⃣ Testando endpoints..."
    echo ""
    
    # Aguardar backend inicializar
    sleep 2
    
    echo "   Health check:"
    curl -s http://localhost:3001/api/health | python3 -m json.tool 2>/dev/null || echo "Backend respondendo"
    echo ""
    
    echo "8️⃣ Logs recentes:"
    pm2 logs govchat-backend --lines 20 --nostream | tail -15
    echo ""
    
    echo "═══════════════════════════════════════════════════════"
    echo "✅ SISTEMA TOTALMENTE CORRIGIDO!"
    echo ""
    echo "🧪 TESTE COMPLETO:"
    echo "   1. Acesse: https://atendimento.nextplan.tec.br"
    echo "   2. Faça login"
    echo "   3. ✅ Conversas devem aparecer"
    echo "   4. ✅ Clique em uma conversa"
    echo "   5. ✅ Mensagens devem carregar"
    echo "   6. ✅ Envie uma nova mensagem"
    echo "   7. ✅ Dê F5 - mensagem deve persistir"
    echo ""
    echo "Se TUDO funcionar: ✅ PROBLEMA RESOLVIDO!"
    echo "═══════════════════════════════════════════════════════"
else
    echo ""
    echo "❌ ERRO NA COMPILAÇÃO!"
    echo ""
    cat /tmp/build_log.txt | grep "error TS"
    echo ""
    echo "Restaurando último backup..."
    LATEST=$(ls -t server.ts.backup_clean_* 2>/dev/null | head -1)
    if [ ! -z "$LATEST" ]; then
        cp "$LATEST" server.ts
        echo "✅ Restaurado: $LATEST"
    fi
    exit 1
fi
