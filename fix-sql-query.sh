#!/bin/bash

echo "🔧 CORREÇÃO FINAL - Query SQL do GET messages"
echo "============================================="
echo ""

cd /var/www/govchat/backend/src || exit 1

echo "1️⃣ Backup de segurança..."
cp server.ts "server.ts.backup_$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup criado"
echo ""

echo "2️⃣ Corrigindo query SQL com parâmetro duplicado..."
# Encontrar a linha do endpoint
LINE=$(grep -n "app.get('/api/conversations/:id/messages'" server.ts | cut -d: -f1)
echo "   Endpoint na linha: $LINE"

# Mostrar query atual (com problema)
echo ""
echo "   Query ANTES (com erro):"
sed -n "$((LINE+5)),$((LINE+20))p" server.ts | grep -A 10 "SELECT"
echo ""

# Corrigir a query: trocar segundo $1 por $2 e adicionar segundo parâmetro
python3 << 'PYTHON_FIX'
with open('server.ts', 'r') as f:
    content = f.read()

# Procurar e substituir a query problemática
old_query = '''    const result = await pool.query(
      `SELECT
        id,
        $1 as conversation_id,
        from_number as sender_id,
        content,
        message_type,
        created_at,
        is_from_me,
        NOT is_from_me as is_from_customer
       FROM whatsapp_messages
       WHERE chat_id = (SELECT chat_id FROM whatsapp_chats WHERE id = $1)
       ORDER BY created_at ASC`,
      [id]
    );'''

new_query = '''    const result = await pool.query(
      `SELECT
        id,
        $1 as conversation_id,
        from_number as sender_id,
        content,
        message_type,
        created_at,
        is_from_me,
        NOT is_from_me as is_from_customer
       FROM whatsapp_messages
       WHERE chat_id = (SELECT chat_id FROM whatsapp_chats WHERE id = $2)
       ORDER BY created_at ASC`,
      [id, id]
    );'''

if old_query in content:
    content = content.replace(old_query, new_query)
    with open('server.ts', 'w') as f:
        f.write(content)
    print("✅ Query corrigida: segundo $1 → $2, parâmetros [id] → [id, id]")
else:
    print("⚠️  Query não encontrada exatamente como esperado")
    print("   Tentando correção alternativa...")
    
    # Correção mais genérica
    import re
    # Substituir WHERE chat_id = (SELECT chat_id FROM whatsapp_chats WHERE id = $1)
    # por WHERE chat_id = (SELECT chat_id FROM whatsapp_chats WHERE id = $2)
    # E [id] por [id, id] logo depois
    
    pattern = r'(WHERE chat_id = \(SELECT chat_id FROM whatsapp_chats WHERE id = \$)1\)'
    replacement = r'\g<1>2)'
    content = re.sub(pattern, replacement, content)
    
    # Substituir [id] após essa linha por [id, id]
    pattern2 = r'(ORDER BY created_at ASC`,\s+)\[id\]'
    replacement2 = r'\g<1>[id, id]'
    content = re.sub(pattern2, replacement2, content)
    
    with open('server.ts', 'w') as f:
        f.write(content)
    print("✅ Correção alternativa aplicada")
PYTHON_FIX
echo ""

echo "3️⃣ Verificando correção..."
LINE=$(grep -n "app.get('/api/conversations/:id/messages'" server.ts | cut -d: -f1)
echo "   Query DEPOIS (corrigida):"
sed -n "$((LINE+5)),$((LINE+20))p" server.ts | grep -A 10 "SELECT"
echo ""

echo "4️⃣ Recompilando..."
cd /var/www/govchat/backend
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ COMPILAÇÃO OK!"
    echo ""
    
    echo "5️⃣ Reiniciando PM2..."
    pm2 restart govchat-backend
    sleep 3
    pm2 status govchat-backend
    echo ""
    
    echo "6️⃣ Testando GET messages..."
    sleep 2
    
    echo "   Logs recentes:"
    pm2 logs govchat-backend --lines 15 --nostream
    echo ""
    
    echo "═══════════════════════════════════════════════════════"
    echo "✅ CORREÇÃO APLICADA!"
    echo ""
    echo "🧪 TESTE AGORA:"
    echo "   1. Acesse: https://atendimento.nextplan.tec.br"
    echo "   2. Faça login"
    echo "   3. Clique em uma conversa"
    echo "   4. ✅ Mensagens devem carregar!"
    echo "   5. Envie nova mensagem"
    echo "   6. Dê F5 - deve persistir"
    echo ""
    echo "Se carregar: 🎉 PROBLEMA RESOLVIDO COMPLETAMENTE!"
    echo "═══════════════════════════════════════════════════════"
else
    echo ""
    echo "❌ ERRO NA COMPILAÇÃO!"
    LATEST=$(ls -t server.ts.backup_* | head -1)
    cp "$LATEST" server.ts
    echo "✅ Restaurado: $LATEST"
    exit 1
fi
