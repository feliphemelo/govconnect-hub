# 🚀 CORREÇÃO DO ENVIO DE MENSAGENS WHATSAPP

## 📋 PROBLEMA IDENTIFICADO

O backend estava:
1. ❌ Salvando mensagens na tabela `messages` (antiga) em vez de `whatsapp_messages`
2. ❌ Não chamando o método `whatsappService.sendMessage()` para enviar via Baileys
3. ❌ Faltando o método `sendMessage()` genérico no WhatsAppService

## ✅ CORREÇÕES APLICADAS

### 1. **whatsapp.service.ts**
- ✅ Adicionado método `sendMessage()` genérico
- ✅ Suporte para text, image, video, audio, document
- ✅ Formatação correta do JID (chat_id com @ correto)
- ✅ Logs detalhados para debugging

### 2. **server.ts** (endpoint POST /api/conversations/:id/messages)
- ✅ Busca chat na tabela `whatsapp_chats`
- ✅ Chama `whatsappService.sendMessage()` para enviar via Baileys
- ✅ Salva mensagem na tabela `whatsapp_messages`
- ✅ Atualiza `whatsapp_chats` com última mensagem
- ✅ Logs detalhados em cada etapa

## 🔧 COMANDOS PARA EXECUTAR NA VPS

```bash
# Navegar para o diretório
cd /var/www/govchat/backend

# Fazer backup
cp src/services/whatsapp.service.ts src/services/whatsapp.service.ts.backup_before_fix
cp src/server.ts src/server.ts.backup_before_fix

# Copiar arquivos atualizados do repositório
# (você precisará fazer git pull ou copiar manualmente os arquivos)

# OU usar o script automático:
# (cole o conteúdo do script deploy-whatsapp-send-fix.sh)

# Compilar
npm run build

# Reiniciar
pm2 restart govchat-backend

# Ver logs
pm2 logs govchat-backend --lines 50
```

## 🧪 TESTE RÁPIDO

```bash
# Teste via curl (sem auth)
curl -X POST "http://localhost:3001/api/conversations/39d89021-95e0-4d01-a47d-7261431e1791/messages" \
  -H "Content-Type: application/json" \
  -d '{"content": "Teste!", "message_type": "text"}'
```

**Logs esperados:**
```
📨 POST /api/conversations/... - Enviando mensagem WhatsApp
   Content: "Teste!"
   Type: text
🔍 Buscando chat com ID: ...
✅ Chat encontrado: chat_id=..., instance_id=...
📤 Chamando whatsappService.sendMessage...
📤 Enviando mensagem via WhatsApp para ...: "Teste!" (tipo: text)
✅ Mensagem text enviada com sucesso para ...!
✅ Mensagem WhatsApp enviada com sucesso!
💾 Salvando mensagem no banco...
✅ Mensagem salva no banco com sucesso!
```

## 📱 TESTE NO NAVEGADOR

1. Acesse o frontend: https://atendimento.nextplan.tec.br
2. Vá para "Chat"
3. Selecione uma conversa
4. Digite uma mensagem e envie
5. ✅ A mensagem deve chegar no WhatsApp!

## 🐛 TROUBLESHOOTING

### Se não enviar:
```bash
# Ver logs detalhados
pm2 logs govchat-backend --lines 100

# Verificar instância conectada
echo "SELECT id, status FROM whatsapp_instances;" | PGPASSWORD='...' psql -h localhost -U govchat_user -d govchat_nextplan
```

### Se erro "Instância não conectada":
1. Verificar se o WhatsApp está escaneado (QR Code)
2. Reconectar a instância via interface
3. Aguardar status "connected"

## 📊 PRÓXIMAS MELHORIAS

Após confirmar que o envio funciona, implementaremos:

1. 🔄 **WebSocket real-time** - mensagens aparecem automaticamente
2. 📸 **Suporte a mídia** - imagens, vídeos, áudios, documentos
3. 😊 **Emoji picker** - interface para emojis
4. 📎 **Upload de arquivos** - anexar mídia nas mensagens

---

**Versão:** 2.6.1
**Data:** 2026-02-19
**Status:** Pronto para deploy
