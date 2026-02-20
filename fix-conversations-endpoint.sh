#!/bin/bash

echo "🔧 CORRIGINDO ENDPOINT DE CONVERSAS"
echo "===================================="
echo ""

cd /var/www/govchat/backend/src || exit 1

echo "1️⃣ Fazendo backup do server.ts..."
cp server.ts server.ts.backup_before_conversations_fix
echo "✅ Backup: server.ts.backup_before_conversations_fix"
echo ""

echo "2️⃣ Contando quantos endpoints GET /api/conversations existem..."
COUNT=$(grep -c "app.get('/api/conversations'" server.ts)
echo "   Encontrados: $COUNT endpoints"
echo ""

if [ "$COUNT" -gt 1 ]; then
    echo "3️⃣ Identificando linha do endpoint ANTIGO (sem authMiddleware)..."
    grep -n "app.get('/api/conversations'" server.ts
    echo ""
    
    echo "4️⃣ Removendo endpoint ANTIGO (linha 806)..."
    # Encontrar linha inicial
    START_LINE=$(grep -n "app.get('/api/conversations'" server.ts | head -1 | cut -d: -f1)
    echo "   Endpoint antigo começa na linha: $START_LINE"
    
    # Encontrar linha final (próximo }); após essa linha)
    # Precisamos contar chaves abertas e fechadas
    awk -v start="$START_LINE" '
    NR >= start {
        gsub(/[^{]/, "", open=$0); open_count += length(open)
        gsub(/[^}]/, "", close=$0); close_count += length(close)
        
        if (open_count > 0 && open_count == close_count) {
            print NR
            exit
        }
    }
    ' server.ts > /tmp/end_line.txt
    
    END_LINE=$(cat /tmp/end_line.txt)
    echo "   Endpoint antigo termina na linha: $END_LINE"
    
    if [ ! -z "$END_LINE" ]; then
        # Remover linhas do endpoint antigo
        sed -i "${START_LINE},${END_LINE}d" server.ts
        echo "✅ Endpoint antigo removido!"
    else
        echo "⚠️  Não conseguiu determinar fim do endpoint automaticamente"
        echo "   Removendo manualmente as primeiras 100 linhas após $START_LINE..."
        sed -i "${START_LINE},$((START_LINE+100))d" server.ts
    fi
    echo ""
fi

echo "5️⃣ Verificando endpoint restante..."
LINE=$(grep -n "app.get('/api/conversations'" server.ts | head -1 | cut -d: -f1)
if [ ! -z "$LINE" ]; then
    echo "   Encontrado na linha: $LINE"
    sed -n "${LINE},$((LINE+15))p" server.ts
    echo ""
    
    # Verificar se tem authMiddleware
    if sed -n "${LINE}p" server.ts | grep -q "authMiddleware"; then
        echo "✅ Endpoint TEM authMiddleware"
    else
        echo "❌ Endpoint NÃO TEM authMiddleware"
        echo "   Adicionando authMiddleware..."
        sed -i "${LINE}s/app.get('\/api\/conversations'/app.get('\/api\/conversations', authMiddleware/" server.ts
        echo "✅ authMiddleware adicionado!"
    fi
else
    echo "⚠️  Nenhum endpoint encontrado!"
fi
echo ""

echo "6️⃣ Verificando import de authMiddleware..."
if grep -q "import.*authMiddleware" server.ts; then
    echo "✅ Import existe:"
    grep -n "import.*authMiddleware" server.ts
else
    echo "❌ Import NÃO existe!"
    echo "   Adicionando import..."
    sed -i "1i import { authMiddleware } from './middleware/auth';" server.ts
    echo "✅ Import adicionado!"
fi
echo ""

echo "7️⃣ Recompilando backend..."
cd /var/www/govchat/backend || exit 1
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ ERRO NA COMPILAÇÃO!"
    echo "   Restaurando backup..."
    cp src/server.ts.backup_before_conversations_fix src/server.ts
    exit 1
fi

echo ""
echo "✅ COMPILAÇÃO OK!"
echo ""

echo "8️⃣ Reiniciando PM2..."
pm2 restart govchat-backend
sleep 3
pm2 status govchat-backend
echo ""

echo "9️⃣ Verificando logs..."
pm2 logs govchat-backend --lines 20 --nostream | tail -15
echo ""

echo "═══════════════════════════════════════════════════════"
echo "✅ CORREÇÃO CONCLUÍDA!"
echo ""
echo "🧪 TESTE AGORA:"
echo "1. Acesse: https://atendimento.nextplan.tec.br"
echo "2. Faça login (deve funcionar)"
echo "3. ✅ CONVERSAS DEVEM APARECER!"
echo "4. Envie mensagem"
echo "5. Dê F5 e veja se persiste"
echo ""
echo "Se conversas ainda não aparecerem:"
echo "   pm2 logs govchat-backend --lines 50"
echo "═══════════════════════════════════════════════════════"
