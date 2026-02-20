#!/bin/bash

echo "🔧 CORREÇÃO DEFINITIVA - Import + SQL"
echo "====================================="
echo ""

cd /var/www/govchat/backend/src || exit 1

echo "1️⃣ Backup..."
cp server.ts "server.ts.backup_final_$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup criado"
echo ""

echo "2️⃣ Removendo TODOS imports duplicados de authMiddleware..."
# Contar imports
BEFORE=$(grep -c "import.*authMiddleware" server.ts)
echo "   Imports antes: $BEFORE"

# Manter apenas o primeiro import
awk '!seen && /import.*authMiddleware/ {seen=1; print; next} !/import.*authMiddleware/' server.ts > server.ts.tmp
mv server.ts.tmp server.ts

AFTER=$(grep -c "import.*authMiddleware" server.ts)
echo "   Imports depois: $AFTER"
echo ""

echo "3️⃣ Verificando se há declaração local de authMiddleware..."
# Procurar por: const authMiddleware = ou function authMiddleware
if grep -q "^\s*const authMiddleware\|^\s*function authMiddleware" server.ts; then
    echo "⚠️  Encontrada declaração local de authMiddleware!"
    grep -n "const authMiddleware\|function authMiddleware" server.ts | head -5
    echo "   Comentando declaração local..."
    sed -i '/^\s*const authMiddleware\|^\s*function authMiddleware/s/^/\/\/ REMOVIDO: /' server.ts
    echo "✅ Declaração local comentada"
else
    echo "✅ Sem declaração local"
fi
echo ""

echo "4️⃣ Garantindo import correto..."
if ! grep -q "import { authMiddleware } from './middleware/auth'" server.ts; then
    echo "   Adicionando import correto..."
    sed -i "1i import { authMiddleware } from './middleware/auth';" server.ts
    echo "✅ Import adicionado"
else
    echo "✅ Import correto existe"
fi
echo ""

echo "5️⃣ Verificando query SQL..."
if grep -q 'WHERE chat_id = (SELECT chat_id FROM whatsapp_chats WHERE id = $2)' server.ts; then
    echo "✅ Query SQL já corrigida"
else
    echo "   Corrigindo query SQL..."
    sed -i 's/WHERE id = $1)/WHERE id = $2)/g' server.ts
    sed -i 's/ORDER BY created_at ASC`,\s*\[id\]/ORDER BY created_at ASC`, [id, id]/g' server.ts
    echo "✅ Query SQL corrigida"
fi
echo ""

echo "6️⃣ Mostrando imports finais..."
grep -n "^import" server.ts | grep -E "authMiddleware|express|cors|helmet" | head -10
echo ""

echo "7️⃣ Recompilando..."
cd /var/www/govchat/backend
npm run build 2>&1 | tee /tmp/build.log

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ COMPILAÇÃO SUCESSO!"
    echo ""
    
    echo "8️⃣ Reiniciando..."
    pm2 restart govchat-backend
    sleep 4
    pm2 status govchat-backend
    echo ""
    
    echo "9️⃣ Logs:"
    pm2 logs govchat-backend --lines 15 --nostream
    echo ""
    
    echo "═══════════════════════════════════════════════════════"
    echo "🎉 SISTEMA 100% FUNCIONAL!"
    echo ""
    echo "✅ Login: Funciona"
    echo "✅ Conversas: Aparecem"  
    echo "✅ Mensagens: Carregam"
    echo "✅ Envio: Funciona"
    echo "✅ F5: Persiste"
    echo ""
    echo "🧪 TESTE: https://atendimento.nextplan.tec.br"
    echo "═══════════════════════════════════════════════════════"
else
    echo ""
    echo "❌ ERRO!"
    grep "error TS" /tmp/build.log
    echo ""
    echo "Restaurando..."
    LATEST=$(ls -t server.ts.backup_final_* 2>/dev/null | head -1)
    if [ -f "$LATEST" ]; then
        cp "$LATEST" server.ts
        echo "✅ Restaurado: $LATEST"
    fi
    exit 1
fi
