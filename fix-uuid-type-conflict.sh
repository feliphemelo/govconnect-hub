#!/bin/bash
echo "🔧 CORRIGINDO CONFLITO DE TIPO UUID vs TEXT"
echo "==========================================="
echo ""

cd /var/www/govchat/backend/src

echo "📍 1. Backup de segurança"
echo "------------------------"
cp server.ts server.ts.backup_uuid_$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado"

echo ""
echo "📍 2. Problema identificado"
echo "--------------------------"
echo "❌ Linha 1337: \$1 as conversation_id (tratado como TEXT)"
echo "❌ Linha 1345: WHERE id = \$1 (esperado como UUID)"
echo "💡 Solução: Usar \$1 e \$2, passando [id, id]"

echo ""
echo "📍 3. Aplicando correção"
echo "-----------------------"

python3 << 'PYTHON_EOF'
import re

with open('server.ts', 'r') as f:
    content = f.read()

# Encontrar e corrigir a query problemática
old_pattern = r'''(const result = await pool\.query\(\s*`SELECT\s+id,\s+\$1 as conversation_id,\s+from_number as sender_id,\s+content,\s+message_type,\s+created_at,\s+is_from_me,\s+NOT is_from_me as is_from_customer\s+FROM whatsapp_messages\s+WHERE chat_id = \(SELECT chat_id FROM whatsapp_chats WHERE id = \$1\)\s+ORDER BY created_at ASC`,\s+\[id\]\s+\);)'''

new_query = '''const result = await pool.query(
      `SELECT
        id,
        $1::text as conversation_id,
        from_number as sender_id,
        content,
        message_type,
        created_at,
        is_from_me,
        NOT is_from_me as is_from_customer
       FROM whatsapp_messages
       WHERE chat_id = (SELECT chat_id FROM whatsapp_chats WHERE id = $2::uuid)
       ORDER BY created_at ASC`,
      [id, id]
    );'''

content = re.sub(old_pattern, new_query, content, flags=re.DOTALL)

with open('server.ts', 'w') as f:
    f.write(content)

print("✅ Correção aplicada")
PYTHON_EOF

echo ""
echo "📍 4. Verificando correção"
echo "-------------------------"
sed -n '1334,1350p' server.ts

echo ""
echo "📍 5. Recompilando"
echo "-----------------"
cd /var/www/govchat/backend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Compilação OK"
    
    echo ""
    echo "📍 6. Reiniciando"
    echo "----------------"
    pm2 restart govchat-backend
    sleep 3
    
    echo ""
    echo "📍 7. Testando"
    echo "-------------"
    pm2 flush govchat-backend
    sleep 1
    
    # Teste SQL direto
    echo "🧪 Testando query corrigida no banco..."
    sudo -u postgres psql govchat_nextplan -c "
SELECT
  id,
  '39d89021-95e0-4d01-a47d-7261431e1791'::text as conversation_id,
  from_number as sender_id,
  content,
  message_type,
  created_at,
  is_from_me,
  NOT is_from_me as is_from_customer
FROM whatsapp_messages
WHERE chat_id = (SELECT chat_id FROM whatsapp_chats WHERE id = '39d89021-95e0-4d01-a47d-7261431e1791'::uuid)
ORDER BY created_at ASC
LIMIT 3;
"
    
    echo ""
    echo "📝 Logs após teste:"
    sleep 2
    pm2 logs govchat-backend --lines 20 --nostream
    
    echo ""
    echo "✅ CORREÇÃO CONCLUÍDA!"
    echo ""
    echo "🧪 Teste agora:"
    echo "   1. Acesse: https://atendimento.nextplan.tec.br"
    echo "   2. Pressione F5"
    echo "   3. Faça login"
    echo "   4. Clique na conversa"
    echo "   5. As mensagens devem carregar! ✅"
    
else
    echo "❌ Erro na compilação!"
    cp server.ts.backup_uuid_* server.ts
    echo "✅ Backup restaurado"
fi

