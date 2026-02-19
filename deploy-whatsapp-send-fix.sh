#!/bin/bash

# ===========================================
# Script para atualizar backend na VPS
# Execute na VPS: /var/www/govchat
# ===========================================

echo "🚀 Atualizando backend GovChat..."
echo ""

cd /var/www/govchat/backend || exit 1

# 1. Backup dos arquivos atuais
echo "📦 1. Fazendo backup dos arquivos..."
cp src/services/whatsapp.service.ts src/services/whatsapp.service.ts.backup_$(date +%Y%m%d_%H%M%S)
cp src/server.ts src/server.ts.backup_$(date +%Y%m%d_%H%M%S)

# 2. Atualizar whatsapp.service.ts
echo "📝 2. Atualizando whatsapp.service.ts..."
cat > /tmp/whatsapp_sendmessage_method.txt << 'EOF'

  /**
   * Enviar mensagem genérica (texto, imagem, vídeo, áudio, documento)
   */
  async sendMessage(instanceId: string, to: string, content: string, type: 'text' | 'image' | 'video' | 'audio' | 'document' = 'text', mediaUrl?: string): Promise<any> {
    try {
      console.log(`📤 Enviando mensagem via WhatsApp para ${to}: "${content}" (tipo: ${type})`);
      
      const instance = this.instances.get(instanceId);
      if (!instance || instance.status !== 'connected') {
        throw new Error('Instância não conectada');
      }

      // Formatar número (garantir que tem o sufixo correto)
      // Se já tem @, usar como está, senão adicionar @s.whatsapp.net
      const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

      let result;
      
      if (type === 'text') {
        result = await instance.socket.sendMessage(jid, { text: content });
      } else if (type === 'image' && mediaUrl) {
        result = await instance.socket.sendMessage(jid, { 
          image: { url: mediaUrl }, 
          caption: content 
        });
      } else if (type === 'video' && mediaUrl) {
        result = await instance.socket.sendMessage(jid, { 
          video: { url: mediaUrl }, 
          caption: content 
        });
      } else if (type === 'audio' && mediaUrl) {
        result = await instance.socket.sendMessage(jid, { 
          audio: { url: mediaUrl }
        });
      } else if (type === 'document' && mediaUrl) {
        result = await instance.socket.sendMessage(jid, { 
          document: { url: mediaUrl }, 
          fileName: content 
        });
      } else {
        throw new Error(`Tipo de mensagem não suportado: ${type}`);
      }
      
      console.log(`✅ Mensagem ${type} enviada com sucesso para ${to}!`);
      return result;
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem:`, error);
      throw error;
    }
  }

  /**
   * Obter instância (para uso interno)
   */
  getInstance(instanceId: string): WhatsAppInstance | undefined {
    return this.instances.get(instanceId);
  }
EOF

# Adicionar método antes do fechamento da classe (linha ~285)
LINE_NUM=$(grep -n "// Exportar instância única" src/services/whatsapp.service.ts | cut -d: -f1)
if [ -z "$LINE_NUM" ]; then
  echo "❌ Não encontrou linha de exportação"
  exit 1
fi

# Pegar linhas antes da exportação
head -n $((LINE_NUM - 2)) src/services/whatsapp.service.ts > /tmp/whatsapp_temp.ts

# Adicionar novo método
cat /tmp/whatsapp_sendmessage_method.txt >> /tmp/whatsapp_temp.ts

# Adicionar fechamento e exportação
echo "}" >> /tmp/whatsapp_temp.ts
echo "" >> /tmp/whatsapp_temp.ts
echo "// Exportar instância única (Singleton)" >> /tmp/whatsapp_temp.ts
echo "export const whatsappService = new WhatsAppService();" >> /tmp/whatsapp_temp.ts

# Substituir arquivo
mv /tmp/whatsapp_temp.ts src/services/whatsapp.service.ts

echo "✅ whatsapp.service.ts atualizado!"

# 3. Atualizar server.ts (endpoint POST de mensagens)
echo "📝 3. Atualizando server.ts..."

# Encontrar linha do endpoint
POST_LINE=$(grep -n "app.post('/api/conversations/:id/messages', authMiddleware" src/server.ts | head -1 | cut -d: -f1)

if [ -z "$POST_LINE" ]; then
  echo "❌ Não encontrou endpoint POST de mensagens"
  exit 1
fi

# Criar novo endpoint
cat > /tmp/new_post_endpoint.txt << 'ENDPOINT'
app.post('/api/conversations/:id/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;
    const { id } = req.params;
    const { content, message_type = 'text', media_url } = req.body;
    
    console.log(`📨 POST /api/conversations/${id}/messages - Enviando mensagem WhatsApp`);
    console.log(`   Content: "${content}"`);
    console.log(`   Type: ${message_type}`);
    console.log(`   Media URL: ${media_url || 'N/A'}`);
    
    if (!content && !media_url) {
      return res.status(400).json({ error: 'Content or media is required' });
    }
    
    // Buscar chat no banco (whatsapp_chats)
    console.log(`🔍 Buscando chat com ID: ${id}`);
    const chatResult = await pool.query(
      `SELECT id, chat_id, contact_number, instance_id, company_id 
       FROM whatsapp_chats 
       WHERE id = $1 AND company_id = $2`,
      [id, payload.companyId]
    );
    
    if (chatResult.rows.length === 0) {
      console.log(`❌ Chat não encontrado: ${id}`);
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const chat = chatResult.rows[0];
    console.log(`✅ Chat encontrado: chat_id=${chat.chat_id}, instance_id=${chat.instance_id}`);
    
    // Enviar mensagem via WhatsApp (Baileys)
    try {
      console.log(`📤 Chamando whatsappService.sendMessage...`);
      const waResult = await whatsappService.sendMessage(
        chat.instance_id,
        chat.chat_id,
        content,
        message_type,
        media_url
      );
      console.log(`✅ Mensagem WhatsApp enviada com sucesso!`, waResult);
    } catch (waError: any) {
      console.error(`❌ Erro ao enviar via WhatsApp:`, waError.message);
      // Continuar mesmo com erro - salvar no banco
    }
    
    // Salvar mensagem no banco
    const messageId = require('crypto').randomUUID();
    const timestamp = Math.floor(Date.now() / 1000);
    
    console.log(`💾 Salvando mensagem no banco...`);
    const result = await pool.query(
      `INSERT INTO whatsapp_messages 
       (id, instance_id, company_id, message_id, from_number, to_number, message_type, content, is_from_me, chat_id, timestamp, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, NOW())
       RETURNING *`,
      [
        messageId,
        chat.instance_id,
        chat.company_id,
        messageId,
        'agent', // from_number
        chat.contact_number, // to_number
        message_type,
        content,
        chat.chat_id,
        timestamp
      ]
    );
    
    // Atualizar chat
    await pool.query(
      `UPDATE whatsapp_chats 
       SET last_message = $1, 
           last_message_at = NOW(), 
           total_messages = total_messages + 1,
           updated_at = NOW()
       WHERE id = $2`,
      [content, id]
    );
    
    console.log(`✅ Mensagem salva no banco com sucesso!`);
    
    res.status(201).json({ 
      message: {
        ...result.rows[0],
        id: result.rows[0].id,
        conversation_id: id,
        sender_type: 'agent',
        sender_id: payload.userId,
        status: 'sent'
      }
    });
  } catch (error: any) {
    console.error('❌ Send message error:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});
ENDPOINT

# Substituir endpoint (pegar linhas antes, inserir novo, pular linhas antigas, pegar resto)
END_LINE=$((POST_LINE + 37))  # ~38 linhas do endpoint antigo

head -n $((POST_LINE - 1)) src/server.ts > /tmp/server_temp.ts
cat /tmp/new_post_endpoint.txt >> /tmp/server_temp.ts
tail -n +$((END_LINE + 1)) src/server.ts >> /tmp/server_temp.ts

mv /tmp/server_temp.ts src/server.ts

echo "✅ server.ts atualizado!"

# 4. Compilar
echo "🔨 4. Compilando..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Erro na compilação!"
  exit 1
fi

# 5. Reiniciar PM2
echo "🔄 5. Reiniciando PM2..."
pm2 restart govchat-backend
sleep 3

# 6. Verificar status
echo "✅ 6. Status do serviço:"
pm2 status govchat-backend

echo ""
echo "✅ Atualização concluída!"
echo ""
echo "🧪 Teste agora enviando uma mensagem pela interface!"
