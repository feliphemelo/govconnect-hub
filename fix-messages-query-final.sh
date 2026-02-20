#!/bin/bash
echo "🔧 CORRIGINDO QUERY DE MENSAGENS - FINAL"
echo "========================================"
echo ""

cd /var/www/govchat/backend/src

echo "📍 1. Backup de segurança"
echo "------------------------"
cp server.ts server.ts.backup_query_fix_$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado"

echo ""
echo "📍 2. Encontrando o endpoint GET messages"
echo "-----------------------------------------"
grep -n "GET.*conversations.*:id.*messages" server.ts

echo ""
echo "📍 3. Mostrando query atual (com erro)"
echo "--------------------------------------"
sed -n '1340,1370p' server.ts

echo ""
echo "📍 4. Corrigindo a query SQL"
echo "----------------------------"

# Corrigir query com sed - remover WHERE duplicado
python3 << 'PYTHON_EOF'
import re

with open('server.ts', 'r') as f:
    content = f.read()

# Procurar e corrigir a query
old_query = r'''const result = await pool\.query\(
      `SELECT 
        wm\.\*,
        wc\.phone,
        wc\.contact_name
       FROM whatsapp_messages wm
       JOIN whatsapp_chats wc ON wm\.chat_id = wc\.id
       WHERE wc\.id = \$1
       ORDER BY wm\.timestamp ASC`,
      \[id\]
    \);'''

new_query = '''const result = await pool.query(
      `SELECT 
        wm.*,
        wc.contact_number as phone,
        wc.contact_name
       FROM whatsapp_messages wm
       JOIN whatsapp_chats wc ON wm.chat_id = wc.id
       WHERE wc.id = $1
       ORDER BY wm.timestamp ASC`,
      [id]
    );'''

# Substituir
content = re.sub(old_query, new_query, content, flags=re.DOTALL)

# Também corrigir se tiver só o problema do parâmetro
content = re.sub(
    r'WHERE wc\.id = \$1\s+WHERE wc\.id = \$1',
    'WHERE wc.id = $1',
    content
)

with open('server.ts', 'w') as f:
    f.write(content)

print("✅ Query corrigida")
PYTHON_EOF

echo ""
echo "📍 5. Verificando correção"
echo "-------------------------"
sed -n '1340,1370p' server.ts

echo ""
echo "📍 6. Recompilando backend"
echo "-------------------------"
cd /var/www/govchat/backend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Compilação OK"
    
    echo ""
    echo "📍 7. Reiniciando PM2"
    echo "--------------------"
    pm2 restart govchat-backend
    
    echo ""
    echo "📍 8. Verificando status"
    echo "-----------------------"
    sleep 3
    pm2 status govchat-backend
    
    echo ""
    echo "📍 9. Limpando logs e testando"
    echo "------------------------------"
    pm2 flush govchat-backend
    sleep 2
    
    # Teste com token real (pegue do console do navegador)
    echo "🧪 Faça um teste manual agora:"
    echo "   1. Acesse: https://atendimento.nextplan.tec.br"
    echo "   2. Faça login"
    echo "   3. Clique em uma conversa"
    echo "   4. Verifique se as mensagens carregam"
    
    echo ""
    echo "📝 Monitorando logs (pressione Ctrl+C para sair):"
    pm2 logs govchat-backend --lines 20 --nostream
    
else
    echo "❌ Erro na compilação!"
    echo "🔄 Restaurando backup..."
    cp server.ts.backup_query_fix_* server.ts
    echo "✅ Backup restaurado"
fi

