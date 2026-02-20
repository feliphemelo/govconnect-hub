#!/bin/bash
echo "📱 ADICIONANDO ENVIO PARA WHATSAPP"
echo "=================================="
echo ""

cd /var/www/govchat/backend/src

echo "📍 1. Backup de segurança"
echo "------------------------"
cp server.ts server.ts.backup_whatsapp_$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado"

echo ""
echo "📍 2. Verificando se whatsappService está importado"
echo "---------------------------------------------------"
grep -n "import.*whatsappService" server.ts || echo "⚠️ Import não encontrado"

echo ""
echo "📍 3. Verificando método sendMessage no serviço"
echo "-----------------------------------------------"
grep -n "async sendMessage" services/whatsapp.service.ts | head -5

echo ""
echo "📍 4. Código atual do POST (linhas 1355-1395)"
echo "---------------------------------------------"
sed -n '1355,1395p' server.ts

echo ""
echo "📍 5. Adicionando chamada ao WhatsApp após salvar mensagem"
echo "----------------------------------------------------------"

python3 << 'PYTHON_EOF'
import re

with open('server.ts', 'r') as f:
    content = f.read()

# Procurar o trecho onde salvamos a mensagem e adicionar envio WhatsApp
old_code = r'''    // Salvar mensagem
    const messageResult = await pool\.query\(
      `INSERT INTO whatsapp_messages
        \(instance_id, company_id, message_id, from_number, to_number, message_type, content, is_from_me, chat_id, timestamp\)
       VALUES \(\$1, \$2, \$3, 'system', \$4, 'text', \$5, true, \$6, NOW\(\)\)
       RETURNING \*`,
      \[chat\.instance_id, chat\.company_id, `msg_\$\{Date\.now\(\)\}`, chat\.contact_number, content, chat\.chat_id\]
    \);

    // Atualizar chat
    await pool\.query\(
      'UPDATE whatsapp_chats SET last_message = \$1, last_message_at = NOW\(\), total_messages = total_messages \+ 1 WHERE id = \$2',
      \[content, id\]
    \);

    console\.log\('✅ Mensagem salva'\);'''

new_code = '''    // Salvar mensagem
    const messageResult = await pool.query(
      `INSERT INTO whatsapp_messages
        (instance_id, company_id, message_id, from_number, to_number, message_type, content, is_from_me, chat_id, timestamp)
       VALUES ($1, $2, $3, 'system', $4, 'text', $5, true, $6, NOW())
       RETURNING *`,
      [chat.instance_id, chat.company_id, `msg_${Date.now()}`, chat.contact_number, content, chat.chat_id]
    );

    // Atualizar chat
    await pool.query(
      'UPDATE whatsapp_chats SET last_message = $1, last_message_at = NOW(), total_messages = total_messages + 1 WHERE id = $2',
      [content, id]
    );

    console.log('✅ Mensagem salva no banco');

    // Enviar via WhatsApp
    try {
      console.log(`📲 Enviando para WhatsApp: ${chat.contact_number}`);
      const waResult = await whatsappService.sendMessage(
        chat.instance_id,
        chat.contact_number,
        content
      );
      console.log('✅ Mensagem enviada via WhatsApp:', waResult);
    } catch (waError) {
      console.error('❌ Erro ao enviar via WhatsApp:', waError);
      // Não falha a requisição se WhatsApp falhar
    }'''

content = re.sub(old_code, new_code, content, flags=re.DOTALL)

with open('server.ts', 'w') as f:
    f.write(content)

print("✅ Código atualizado")
PYTHON_EOF

echo ""
echo "📍 6. Verificando alteração"
echo "--------------------------"
sed -n '1375,1410p' server.ts

echo ""
echo "📍 7. Recompilando"
echo "-----------------"
cd /var/www/govchat/backend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Compilação OK"
    
    echo ""
    echo "📍 8. Reiniciando"
    echo "----------------"
    pm2 restart govchat-backend
    sleep 3
    pm2 status govchat-backend
    
    echo ""
    echo "📍 9. Limpando logs"
    echo "------------------"
    pm2 flush govchat-backend
    
    echo ""
    echo "✅ CORREÇÃO CONCLUÍDA!"
    echo ""
    echo "🧪 TESTE AGORA:"
    echo "   1. Acesse: https://atendimento.nextplan.tec.br"
    echo "   2. Abra a conversa"
    echo "   3. Digite e envie: 'Teste de envio WhatsApp 📱'"
    echo "   4. Verifique:"
    echo "      ✅ Aparece na interface"
    echo "      ✅ Chega no WhatsApp do destinatário"
    echo ""
    echo "📝 Monitore os logs:"
    echo "   pm2 logs govchat-backend --lines 30"
    echo ""
    echo "   Você deve ver:"
    echo "   - ✅ Mensagem salva no banco"
    echo "   - 📲 Enviando para WhatsApp: +55..."
    echo "   - ✅ Mensagem enviada via WhatsApp"
    
else
    echo "❌ Erro na compilação!"
    cp server.ts.backup_whatsapp_* server.ts
    echo "✅ Backup restaurado"
fi

