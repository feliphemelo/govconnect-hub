import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { pool } from '../config/database';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

interface WhatsAppInstance {
  id: string;
  socket: any;
  qrCode: string | null;
  status: 'connecting' | 'connected' | 'disconnected';
}

class WhatsAppService {
  private instances: Map<string, WhatsAppInstance> = new Map();
  private authDir = path.join(__dirname, '..', '..', 'whatsapp_sessions');

  constructor() {
    // Criar diretório de sessões se não existir
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  /**
   * Iniciar uma instância WhatsApp
   */
  async startInstance(instanceId: string, companyId: string): Promise<string | null> {
    try {
      console.log(`🔄 Iniciando instância WhatsApp: ${instanceId}`);

      // Verificar se já está conectada
      if (this.instances.has(instanceId)) {
        const existing = this.instances.get(instanceId);
        if (existing?.status === 'connected') {
          console.log(`✅ Instância ${instanceId} já conectada`);
          return null;
        }
      }

      // Diretório de autenticação para esta instância
      const authPath = path.join(this.authDir, instanceId);
      if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
      }

      // Carregar estado de autenticação
      const { state, saveCreds } = await useMultiFileAuthState(authPath);

      // Obter versão mais recente do Baileys
      const { version } = await fetchLatestBaileysVersion();

      // Criar socket WhatsApp
      const socket = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }), // Desabilitar logs verbosos
        browser: ['GovChat', 'Chrome', '110.0.0'],
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
             SET status = 'connected', qr_code = NULL, updated_at = NOW()
             WHERE id = $1`,
            [instanceId]
          );

          const instance = this.instances.get(instanceId);
          if (instance) {
            instance.status = 'connected';
            instance.qrCode = null;
          }
        }

        // Conexão fechada
        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          
          console.log(`❌ Conexão fechada para: ${instanceId}`, {
            shouldReconnect,
            reason: lastDisconnect?.error,
          });

          if (shouldReconnect) {
            console.log(`🔄 Reconectando instância: ${instanceId}`);
            setTimeout(() => this.startInstance(instanceId, companyId), 3000);
          } else {
            // Usuário fez logout
            await pool.query(
              `UPDATE whatsapp_instances 
               SET status = 'disconnected', qr_code = NULL, session_data = NULL, updated_at = NOW()
               WHERE id = $1`,
              [instanceId]
            );

            // Remover sessão
            this.instances.delete(instanceId);
            this.deleteAuthFolder(authPath);
          }
        }
      });

      // Event: Credenciais atualizadas
      socket.ev.on('creds.update', saveCreds);

      // Event: Mensagens recebidas
      socket.ev.on('messages.upsert', async (m) => {
        const messages = m.messages;
        for (const msg of messages) {
          if (!msg.key.fromMe && msg.message) {
            console.log(`📨 Nova mensagem recebida na instância ${instanceId}:`, {
              from: msg.key.remoteJid,
              message: msg.message,
            });

            console.log(`📨 Nova mensagem recebida na instância ${instanceId}:`, {
              from: msg.key.remoteJid,
              message: msg.message,
            });

            // Salvar mensagem no banco de dados
            try {
              const chatId = msg.key.remoteJid!;
              const isFromMe = msg.key.fromMe || false;
              const messageContent = msg.message?.conversation || 
                                    msg.message?.extendedTextMessage?.text || 
                                    msg.message?.imageMessage?.caption || 
                                    '[Mídia]';
              
              // Buscar company_id da instância
              const instanceResult = await pool.query(
                'SELECT company_id FROM whatsapp_instances WHERE id = $1',
                [instanceId]
              );
              
              if (instanceResult.rows.length > 0) {
                const companyId = instanceResult.rows[0].company_id;
                
                // Salvar mensagem
                await pool.query(
                  `INSERT INTO whatsapp_messages 
                   (instance_id, company_id, message_id, from_number, to_number, 
                    message_type, content, is_from_me, timestamp, chat_id)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                   ON CONFLICT (instance_id, message_id) DO NOTHING`,
                  [
                    instanceId,
                    companyId,
                    msg.key.id!,
                    isFromMe ? 'me' : chatId,
                    isFromMe ? chatId : 'me',
                    'text',
                    messageContent,
                    isFromMe,
                    new Date(msg.messageTimestamp as number * 1000),
                    chatId
                  ]
                );
                
                // Atualizar chat
                await pool.query(
                  `INSERT INTO whatsapp_chats 
                   (instance_id, company_id, chat_id, contact_number, last_message, last_message_at, unread_count)
                   VALUES ($1, $2, $3, $4, $5, NOW(), 1)
                   ON CONFLICT (instance_id, chat_id) 
                   DO UPDATE SET 
                     last_message = EXCLUDED.last_message,
                     last_message_at = NOW(),
                     unread_count = whatsapp_chats.unread_count + CASE WHEN $6 THEN 0 ELSE 1 END,
                     total_messages = whatsapp_chats.total_messages + 1`,
                  [instanceId, companyId, chatId, chatId.replace('@s.whatsapp.net', ''), messageContent, isFromMe]
                );
                
                console.log(`✅ Mensagem salva no banco: ${msg.key.id}`);
              }
            } catch (saveError) {
              console.error('❌ Erro ao salvar mensagem:', saveError);
            }
          }
        }
      });

      // Armazenar instância
      this.instances.set(instanceId, {
        id: instanceId,
        socket,
        qrCode: qrCodeData,
        status: 'connecting',
      });

      return qrCodeData;
    } catch (error) {
      console.error(`❌ Erro ao iniciar instância ${instanceId}:`, error);
      throw error;
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

      this.instances.delete(instanceId);

      // Atualizar banco
      await pool.query(
        `UPDATE whatsapp_instances 
         SET status = 'disconnected', qr_code = NULL, updated_at = NOW()
         WHERE id = $1`,
        [instanceId]
      );

      // Remover pasta de autenticação
      const authPath = path.join(this.authDir, instanceId);
      this.deleteAuthFolder(authPath);
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
      if (!instance || instance.status !== 'connected') {
        throw new Error('Instância não conectada');
      }

      // Formatar número (adicionar @s.whatsapp.net se necessário)
      const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

      const result = await instance.socket.sendMessage(jid, { text });
      console.log(`✅ Mensagem enviada para ${to} via instância ${instanceId}`);
      
      return result;
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem:`, error);
      throw error;
    }
  }

  /**
   * Obter status da instância
   */
  getInstanceStatus(instanceId: string): string {
    const instance = this.instances.get(instanceId);
    return instance?.status || 'disconnected';
  }

  /**
   * Deletar pasta de autenticação
   */
  private deleteAuthFolder(folderPath: string): void {
    try {
      if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
        console.log(`🗑️  Pasta de autenticação removida: ${folderPath}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao remover pasta de autenticação:`, error);
    }
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
        await this.startInstance(row.id, row.company_id);
      }

      console.log(`✅ ${result.rows.length} instância(s) reconectada(s)`);
    } catch (error) {
      console.error('❌ Erro ao reconectar instâncias:', error);
    }
  }
}

// Exportar instância única (Singleton)
export const whatsappService = new WhatsAppService();
