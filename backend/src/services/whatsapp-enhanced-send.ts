/**
 * Versão melhorada do sendMessage com logs detalhados
 * e aguardo de confirmação de entrega
 */

export async function enhancedSendMessage(
  instance: any,
  jid: string,
  content: string
): Promise<any> {
  try {
    console.log('🔍 ===== ENVIO DETALHADO =====');
    console.log('📱 JID destino:', jid);
    console.log('💬 Conteúdo:', content);
    console.log('🔌 Socket ativo:', !!instance.socket);
    console.log('📊 Status instância:', instance.status);
    
    // Verificar se socket está conectado
    if (!instance.socket) {
      throw new Error('Socket não disponível');
    }

    // Informações da sessão
    const me = instance.socket.user;
    console.log('👤 Meu número:', me?.id || 'desconhecido');
    
    // Enviar mensagem
    console.log('📤 Enviando mensagem...');
    const timestamp = Date.now();
    
    const result = await instance.socket.sendMessage(jid, { 
      text: content 
    });
    
    const elapsed = Date.now() - timestamp;
    console.log(`✅ Mensagem enviada em ${elapsed}ms`);
    
    // Detalhes da resposta
    console.log('📋 Resposta do Baileys:');
    console.log('  - Status:', result.status);
    console.log('  - ID da mensagem:', result.key?.id);
    console.log('  - RemoteJid:', result.key?.remoteJid);
    console.log('  - FromMe:', result.key?.fromMe);
    console.log('  - Timestamp:', result.messageTimestamp);
    
    // Interpretação do status
    const statusMap: Record<number, string> = {
      0: 'ERRO',
      1: 'SERVIDOR (enviada ao servidor)',
      2: 'ENTREGUE (delivered ao destinatário)',
      3: 'LIDA (read pelo destinatário)',
    };
    
    console.log(`🎯 Status interpretado: ${statusMap[result.status] || 'DESCONHECIDO'}`);
    
    // ALERTA se status não é 2 ou 3
    if (result.status === 1) {
      console.log('⚠️  ATENÇÃO: Status 1 = Enviada ao SERVIDOR, não ao destinatário!');
      console.log('💡 Isso pode significar que a mensagem ainda não foi entregue.');
    }
    
    // Aguardar um pouco para ver se status muda
    console.log('⏳ Aguardando 2 segundos para confirmar entrega...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🏁 Envio concluído');
    console.log('================================');
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro no envio detalhado:', error);
    throw error;
  }
}
