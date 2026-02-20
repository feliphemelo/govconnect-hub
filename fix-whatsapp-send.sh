#!/bin/bash

echo "🚀 Implementando envio de mensagens via WhatsApp..."

cd /var/www/govchat/backend/src

echo "=== 1. Backup dos arquivos ===" 
cp services/whatsapp.service.ts services/whatsapp.service.ts.backup_send
cp server.ts server.ts.backup_send

echo "=== 2. Adicionando método sendMessage no WhatsAppService ===" 

# Primeiro, vamos ver quantas linhas tem o arquivo
TOTAL_LINES=$(wc -l < services/whatsapp.service.ts)
echo "Total de linhas: $TOTAL_LINES"

# Remover as últimas 2 linhas (fechamento da classe e export)
head -n -2 services/whatsapp.service.ts > /tmp/whatsapp_temp.ts

# Adicionar o novo método
cat >> /tmp/whatsapp_temp.ts << 'EOF'

  // Método para enviar mensagens
  async sendMessage(instanceId: string, to: string, content: string, type: 'text' | 'image' | 'video' | 'audio' | 'document' = 'text') {
    const instance = this.instances.get(instanceId);
    
    if (!instance || !instance.socket) {
      throw new Error('WhatsApp instance not found or not connected');
    }

    try {
      console.log(`📤 Enviando mensagem para ${to}: "${content}"`);
      
      let result;
      
      if (type === 'text') {
        // Enviar mensagem de texto
        result = await instance.socket.sendMessage(to, {
          text: content
        });
      }
      // TODO: Adicionar suporte para outros tipos de mídia
      
      console.log(`✅ Mensagem enviada com sucesso!`);
      return result;
      
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem:`, error);
      throw error;
    }
  }

  // Método para obter instância (para usar no endpoint)
  getInstance(instanceId: string) {
    return this.instances.get(instanceId);
  }
}

export const whatsappService = new WhatsAppService();
EOF

mv /tmp/whatsapp_temp.ts services/whatsapp.service.ts

echo "✅ Método sendMessage adicionado!"

echo ""
echo "=== 3. Atualizando endpoint POST ===" 

# Encontrar a linha com TODO e substituir
LINE_NUM=$(grep -n "TODO: Enviar mensagem via WhatsApp" server.ts | cut -d: -f1)
echo "TODO encontrado na linha: $LINE_NUM"

# Usar sed para substituir as linhas do TODO até "Salvar no banco"
sed -i "${LINE_NUM},/Por enquanto, apenas salvar no banco/c\\
    // Enviar mensagem via WhatsApp Baileys\\
    try {\\
      await whatsappService.sendMessage(\\
        chat.instance_id,\\
        chat.chat_id,\\
        content,\\
        message_type as any\\
      );\\
      console.log(\"✅ Mensagem enviada via WhatsApp\");\\
    } catch (whatsappError) {\\
      console.error(\"⚠️ Erro ao enviar via WhatsApp:\", whatsappError);\\
    }\\
    \\
    // Salvar no banco" server.ts

echo "✅ Endpoint POST atualizado!"

echo ""
echo "=== 4. Rebuild e restart ===" 
cd /var/www/govchat
npm run build
pm2 restart govchat-backend
sleep 3

echo ""
echo "=== 5. Verificando logs ===" 
pm2 logs govchat-backend --lines 10 --nostream | tail -5

echo ""
echo "🎉 Pronto! Agora envie uma mensagem pelo chat e ela deve chegar no WhatsApp!"

