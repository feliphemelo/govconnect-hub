#!/bin/bash
echo "📱 ADICIONANDO ENVIO WHATSAPP (V2 - Manual)"
echo "==========================================="
echo ""

cd /var/www/govchat/backend/src

echo "📍 1. Backup de segurança"
echo "------------------------"
cp server.ts server.ts.backup_wa2_$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado"

echo ""
echo "📍 2. Localizando linha 'console.log(✅ Mensagem salva)'"
echo "-------------------------------------------------------"
grep -n "Mensagem salva" server.ts

echo ""
echo "📍 3. Inserindo código WhatsApp após linha de log"
echo "-------------------------------------------------"

# Usar sed para inserir código após a linha "Mensagem salva"
sed -i "/console\.log('✅ Mensagem salva');/a\\
\\
    // Enviar via WhatsApp\\
    try {\\
      console.log(\`📲 Enviando para WhatsApp: \${chat.contact_number}\`);\\
      const waResult = await whatsappService.sendMessage(\\
        chat.instance_id,\\
        chat.contact_number,\\
        content\\
      );\\
      console.log('✅ Mensagem enviada via WhatsApp:', waResult);\\
    } catch (waError) {\\
      console.error('❌ Erro ao enviar via WhatsApp:', waError);\\
      // Não falha a requisição se WhatsApp falhar\\
    }" server.ts

echo "✅ Código inserido"

echo ""
echo "📍 4. Verificando resultado (linhas 1385-1415)"
echo "----------------------------------------------"
sed -n '1385,1415p' server.ts

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
    echo "📍 7. Limpando logs"
    echo "------------------"
    pm2 flush govchat-backend
    
    echo ""
    echo "✅ PRONTO PARA TESTE!"
    echo ""
    echo "🧪 ENVIE UMA MENSAGEM AGORA e execute:"
    echo "   pm2 logs govchat-backend --lines 50"
    echo ""
    echo "   Logs esperados:"
    echo "   📤 POST /api/conversations/..."
    echo "   ✅ Mensagem salva"
    echo "   📲 Enviando para WhatsApp: +55..."
    echo "   ✅ Mensagem enviada via WhatsApp"
    
else
    echo "❌ Erro na compilação!"
    echo "📄 Mostrando erros:"
    npm run build 2>&1 | tail -20
    echo ""
    echo "🔄 Restaurando backup..."
    cp server.ts.backup_wa2_* server.ts
    echo "✅ Backup restaurado"
fi

