import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, WASocket } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { pool } from '../config/database';
import QRCode from 'qrcode';
import { useAuthState } from '../helpers/authState';
import { wbotMonitorInstance } from './whatsapp/wbotMonitor';

interface WhatsAppInstance {
  id: string;
  companyId: string;
  socket: WASocket;
  qrCode: string | null;
  status: 'connecting' | 'connected' | 'disconnected';
  retries: number;
  lastRetry: Date | null;
}

class WhatsAppService {
  private instances: Map<string, WhatsAppInstance> = new Map();

  /**
   * Iniciar uma instância WhatsApp com persistência no DB
   */
  async startInstance(instanceId: string, companyId: string): Promise<string | null> {
    try {
      console.log(`🔄 Iniciando instância WhatsApp: ${instanceId}`);

      // Verificar se já está conectada
      const existing = this.instances.get(instanceId);
      if (existing?.status === 'connected') {
        console.log(`✅ Instância ${instanceId} já conectada`);
        return null;
      }

      // Carregar estado de autenticação do banco de dados
      const { state, saveCreds } = await useAuthState(instanceId);

      // Obter versão mais recente do Baileys
      const { version } = await fetchLatestBaileysVersion();

      // Criar socket WhatsApp
      const socket = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['GovChat', 'Chrome', '110.0.0'],
        getMessage: async (key) => {
          // Buscar mensagem do banco se necessário
          return { conversation: '' };
        },
      });

      let qrCodeData: string | null = null;

      // Event: Connection Update
      socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // QR Code gerado
        if (qr) {
          console.log(`📱 QR Code gerado para instância: ${instanceId}`);
          
          // Converter QR para Data URL
          qrCodeData = await QRCode.toDataURL(qr, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });

          // Atualizar no banco de dados
          await pool.query(
            `UPDATE whatsapp_instances 
             SET qr_code = $1, status = 'connecting', updated_at = NOW()
             WHERE id = $2`,
            [qrCodeData, instanceId]
          );

          // Atualizar instância local
          const instance = this.instances.get(instanceId);
          if (instance) {
            instance.qrCode = qrCodeData;
            instance.status = 'connecting';
          }
        }

        // Conexão estabelecida
        if (connection === 'open') {
          console.log(`✅ WhatsApp conectado: ${instanceId}`);
          
          await pool.query(
            `UPDATE whatsapp_instances 
             SET status = 'connected', qr_code = NULL, retries = 0, updated_at = NOW()
             WHERE id = $1`,
            [instanceId]
          );

          const instance = this.instances.get(instanceId);
          if (instance) {
            instance.status = 'connected';
            instance.qrCode = null;
            instance.retries = 0;
            instance.lastRetry = null;
          }

          // Iniciar monitoramento
          wbotMonitorInstance.start(socket, instanceId);
        }

        // Conexão fechada
        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          
          console.log(`❌ Conexão fechada para: ${instanceId}`, {
            statusCode,
            shouldReconnect,
            reason: lastDisconnect?.error?.message || 'Desconhecido',
          });

          // Parar monitoramento
          wbotMonitorInstance.stop(instanceId);

          if (shouldReconnect) {
            // Incrementar contador de tentativas
            const instance = this.instances.get(instanceId);
            const currentRetries = instance?.retries || 0;
            
            await pool.query(
              `UPDATE whatsapp_instances 
               SET status = 'disconnected', retries = retries + 1, updated_at = NOW()
               WHERE id = $1`,
              [instanceId]
            );

            // Usar reconexão inteligente com backoff exponencial
            const delay = this.calculateReconnectDelay(currentRetries);
            console.log(`🔄 Tentativa de reconexão ${currentRetries + 1}/10 em ${delay}ms...`);
            
            if (currentRetries < 10) {
              setTimeout(() => this.startInstance(instanceId, companyId), delay);
              
              if (instance) {
                instance.retries = currentRetries + 1;
                instance.lastRetry = new Date();
              }
            } else {
              console.error(`❌ Limite de tentativas atingido para ${instanceId}`);
              await this.handleMaxRetriesReached(instanceId);
            }
          } else {
            console.log(`🚪 Usuário fez logout na instância: ${instanceId}`);
            
            // Usuário fez logout - limpar tudo
            await this.clearInstance(instanceId);
          }
        }
      });

      // Event: Credenciais atualizadas
      socket.ev.on('creds.update', saveCreds);

      // Event: Mensagens recebidas
      socket.ev.on('messages.upsert', async (m) => {
        const messages = m.messages;
        for (const msg of messages) {
          if (msg.message) {
            console.log(`📨 Mensagem na instância ${instanceId}:`, {
              from: msg.key.remoteJid,
              fromMe: msg.key.fromMe,
            });

            // Salvar mensagem no banco de dados
            await this.saveMessage(instanceId, companyId, msg);
          }
        }
      });

      // Armazenar instância
      this.instances.set(instanceId, {
        id: instanceId,
        companyId,
        socket,
        qrCode: qrCodeData,
        status: 'connecting',
        retries: 0,
        lastRetry: null,
      });

      return qrCodeData;
    } catch (error) {
      console.error(`❌ Erro ao iniciar instância ${instanceId}:`, error);
      
      // Incrementar contador de erros
      const instance = this.instances.get(instanceId);
      if (instance) {
        instance.retries = (instance.retries || 0) + 1;
        
        if (instance.retries < 10) {
          const delay = this.calculateReconnectDelay(instance.retries);
          console.log(`🔄 Tentando novamente em ${delay}ms...`);
          setTimeout(() => this.startInstance(instanceId, companyId), delay);
        }
      }
      
      throw error;
    }
  }

  /**
   * Calcular delay de reconexão com backoff exponencial
   */
  private calculateReconnectDelay(retries: number): number {
    // Backoff exponencial: 5s, 10s, 20s, 40s, 80s, max 5min
    const baseDelay = 5000; // 5 segundos
    const maxDelay = 300000; // 5 minutos
    const delay = Math.min(baseDelay * Math.pow(2, retries), maxDelay);
    return delay;
  }

  /**
   * Lidar com limite de tentativas atingido
   */
  private async handleMaxRetriesReached(instanceId: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE whatsapp_instances 
         SET status = 'disconnected', 
             qr_code = NULL,
             retries = 0,
             updated_at = NOW()
         WHERE id = $1`,
        [instanceId]
      );

      this.instances.delete(instanceId);
      
      // TODO: Enviar notificação ao admin
      console.error(`⚠️  Instância ${instanceId} desconectada após 10 tentativas`);
    } catch (error) {
      console.error('❌ Erro ao lidar com max retries:', error);
    }
  }

  /**
   * Limpar instância do sistema
   */
  private async clearInstance(instanceId: string): Promise<void> {
    try {
      // Limpar banco de dados
      await pool.query(
        `UPDATE whatsapp_instances 
         SET status = 'disconnected', 
             qr_code = NULL, 
             retries = 0,
             updated_at = NOW()
         WHERE id = $1`,
        [instanceId]
      );

      // Limpar auth state do banco
      await pool.query(
        `DELETE FROM baileys_keys WHERE whatsapp_id = $1`,
        [instanceId]
      );

      // Remover da memória
      this.instances.delete(instanceId);
      
      console.log(`🗑️  Instância ${instanceId} limpa completamente`);
    } catch (error) {
      console.error('❌ Erro ao limpar instância:', error);
    }
  }

  /**
   * Obter QR Code de uma instância
   */
  async getQRCode(instanceId: string): Promise<string | null> {
    const instance = this.instances.get(instanceId);
    return instance?.qrCode || null;
  }

  /**
   * Desconectar instância
   */
  async disconnectInstance(instanceId: string): Promise<void> {
    try {
      const instance = this.instances.get(instanceId);
      if (instance?.socket) {
        await instance.socket.logout();
        console.log(`🔌 Instância desconectada: ${instanceId}`);
      }

      await this.clearInstance(instanceId);
    } catch (error) {
      console.error(`❌ Erro ao desconectar instância ${instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Enviar mensagem de texto
   */
  async sendTextMessage(instanceId: string, to: string, text: string): Promise<any> {
    try {
      const instance = this.instances.get(instanceId);
      
      if (!instance) {
        throw new Error('Instância não encontrada. Verifique se ela está configurada.');
      }
      
      if (instance.status !== 'connected') {
        throw new Error(`Instância não conectada (status: ${instance.status}). Conecte o WhatsApp primeiro.`);
      }

      if (!instance.socket) {
        throw new Error('Socket não inicializado. Tente reconectar a instância.');
      }

      // Verificar se socket está realmente conectado
      if (!instance.socket.user) {
        throw new Error('WhatsApp não autenticado. Escaneie o QR Code novamente.');
      }

      // Formatar número (adicionar @s.whatsapp.net se necessário)
      const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

      console.log(`📤 Enviando mensagem para ${to} via instância ${instanceId}...`);
      
      const result = await instance.socket.sendMessage(jid, { text });
      
      console.log(`✅ Mensagem enviada com sucesso para ${to}`);
      
      // Salvar mensagem enviada
      if (result?.key?.id) {
        await this.saveMessage(instanceId, instance.companyId, {
          key: {
            remoteJid: jid,
            fromMe: true,
            id: result.key.id,
          },
          message: { conversation: text },
          messageTimestamp: Math.floor(Date.now() / 1000),
        });
      }
      
      return result;
    } catch (error: any) {
      console.error(`❌ Erro ao enviar mensagem para ${to}:`, error.message || error);
      
      // Mensagens de erro mais amigáveis
      if (error.message?.includes('Connection Closed') || error.message?.includes('closed')) {
        throw new Error('Conexão WhatsApp perdida. Reconecte escaneando o QR Code novamente.');
      }
      
      if (error.message?.includes('not-authorized') || error.message?.includes('unauthorized')) {
        throw new Error('WhatsApp não autorizado. Faça logout e conecte novamente.');
      }
      
      throw error;
    }
  }

  /**
   * Obter informações da conexão
   */
  getConnectionInfo(instanceId: string): any {
    const instance = this.instances.get(instanceId);
    if (!instance || !instance.socket) {
      return null;
    }

    return {
      status: instance.status,
      user: instance.socket.user || null,
      connected: instance.status === 'connected',
      retries: instance.retries,
      lastRetry: instance.lastRetry,
    };
  }

  /**
   * Obter status da instância
   */
  getInstanceStatus(instanceId: string): string {
    const instance = this.instances.get(instanceId);
    return instance?.status || 'disconnected';
  }

  /**
   * Reconectar todas as instâncias ativas ao iniciar servidor
   */
  async reconnectAllInstances(): Promise<void> {
    try {
      console.log('🔄 Reconectando instâncias ativas...');

      const result = await pool.query(
        `SELECT id, company_id FROM whatsapp_instances 
         WHERE status = 'connected' OR status = 'connecting'`
      );

      for (const row of result.rows) {
        console.log(`🔄 Reconectando instância: ${row.id}`);
        
        // Delay entre reconexões para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.startInstance(row.id, row.company_id);
      }

      console.log(`✅ ${result.rows.length} instância(s) reconectada(s)`);
    } catch (error) {
      console.error('❌ Erro ao reconectar instâncias:', error);
    }
  }

  /**
   * Salvar mensagem no banco de dados
   */
  private async saveMessage(instanceId: string, companyId: string, msg: any): Promise<void> {
    try {
      const chatId = msg.key.remoteJid;
      const isFromMe = msg.key.fromMe || false;
      const messageId = msg.key.id;
      
      // Extrair conteúdo da mensagem
      let content = '';
      let messageType = 'text';
      let mediaUrl = null;
      let mediaMimeType = null;

      if (msg.message.conversation) {
        content = msg.message.conversation;
        messageType = 'text';
      } else if (msg.message.extendedTextMessage) {
        content = msg.message.extendedTextMessage.text || '';
        messageType = 'text';
      } else if (msg.message.imageMessage) {
        messageType = 'image';
        content = msg.message.imageMessage.caption || '[Imagem]';
        mediaMimeType = msg.message.imageMessage.mimetype;
      } else if (msg.message.videoMessage) {
        messageType = 'video';
        content = msg.message.videoMessage.caption || '[Vídeo]';
        mediaMimeType = msg.message.videoMessage.mimetype;
      } else if (msg.message.audioMessage) {
        messageType = 'audio';
        content = '[Áudio]';
        mediaMimeType = msg.message.audioMessage.mimetype;
      } else if (msg.message.documentMessage) {
        messageType = 'document';
        content = msg.message.documentMessage.fileName || '[Documento]';
        mediaMimeType = msg.message.documentMessage.mimetype;
      } else if (msg.message.stickerMessage) {
        messageType = 'text';
        content = '[Sticker]';
      } else if (msg.message.reactionMessage) {
        messageType = 'text';
        content = `[Reação: ${msg.message.reactionMessage.text || '❤️'}]`;
      } else if (msg.message.pollCreationMessage) {
        messageType = 'text';
        content = '[Enquete]';
      } else if (msg.message.locationMessage) {
        messageType = 'text';
        content = '[Localização]';
      } else if (msg.message.contactMessage) {
        messageType = 'text';
        content = `[Contato: ${msg.message.contactMessage.displayName || 'Desconhecido'}]`;
      } else {
        console.log('⚠️  Tipo de mensagem não reconhecido:', Object.keys(msg.message));
        messageType = 'text';
        content = '[Mensagem não suportada]';
      }

      // Extrair números de telefone
      const fromNumber = isFromMe ? '' : chatId.replace('@s.whatsapp.net', '');
      const toNumber = isFromMe ? chatId.replace('@s.whatsapp.net', '') : '';

      // Timestamp
      const timestamp = msg.messageTimestamp 
        ? new Date(msg.messageTimestamp * 1000) 
        : new Date();

      // Inserir mensagem
      await pool.query(
        `INSERT INTO whatsapp_messages (
          instance_id, company_id, message_id, from_number, to_number,
          message_type, content, media_url, media_mime_type,
          is_from_me, timestamp, chat_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (instance_id, message_id) DO NOTHING`,
        [
          instanceId, companyId, messageId, fromNumber, toNumber,
          messageType, content, mediaUrl, mediaMimeType,
          isFromMe, timestamp, chatId
        ]
      );

      // Atualizar ou criar chat
      await this.upsertChat(instanceId, companyId, chatId, content, timestamp);

      console.log(`💾 Mensagem salva: ${messageId} (${messageType})`);
    } catch (error) {
      console.error('❌ Erro ao salvar mensagem:', error);
    }
  }

  /**
   * Criar ou atualizar chat
   */
  private async upsertChat(
    instanceId: string,
    companyId: string,
    chatId: string,
    lastMessage: string,
    lastMessageAt: Date
  ): Promise<void> {
    try {
      const contactNumber = chatId.replace('@s.whatsapp.net', '').replace('@g.us', '');
      
      await pool.query(
        `INSERT INTO whatsapp_chats (
          instance_id, company_id, chat_id, contact_number,
          last_message, last_message_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (instance_id, chat_id) 
        DO UPDATE SET
          last_message = EXCLUDED.last_message,
          last_message_at = EXCLUDED.last_message_at,
          unread_count = whatsapp_chats.unread_count + 1,
          updated_at = NOW()`,
        [instanceId, companyId, chatId, contactNumber, lastMessage, lastMessageAt]
      );
    } catch (error) {
      console.error('❌ Erro ao atualizar chat:', error);
    }
  }

  /**
   * Buscar mensagens de um chat
   */
  async getMessages(instanceId: string, chatId: string, limit = 50, offset = 0): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM whatsapp_messages
         WHERE instance_id = $1 AND chat_id = $2
         ORDER BY timestamp DESC
         LIMIT $3 OFFSET $4`,
        [instanceId, chatId, limit, offset]
      );
      
      return result.rows.reverse(); // Ordem cronológica
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens:', error);
      return [];
    }
  }

  /**
   * Buscar todos os chats
   */
  async getChats(instanceId: string, limit = 50): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM whatsapp_chats
         WHERE instance_id = $1
         ORDER BY last_message_at DESC NULLS LAST
         LIMIT $2`,
        [instanceId, limit]
      );
      
      return result.rows;
    } catch (error) {
      console.error('❌ Erro ao buscar chats:', error);
      return [];
    }
  }

  /**
   * Marcar mensagens como lidas
   */
  async markAsRead(instanceId: string, chatId: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE whatsapp_messages
         SET is_read = true, updated_at = NOW()
         WHERE instance_id = $1 AND chat_id = $2 AND is_read = false AND is_from_me = false`,
        [instanceId, chatId]
      );

      await pool.query(
        `UPDATE whatsapp_chats
         SET unread_count = 0, updated_at = NOW()
         WHERE instance_id = $1 AND chat_id = $2`,
        [instanceId, chatId]
      );
    } catch (error) {
      console.error('❌ Erro ao marcar como lido:', error);
    }
  }
}

// Exportar instância única (Singleton)
export const whatsappService = new WhatsAppService();
