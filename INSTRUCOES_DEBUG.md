# 🔍 DEBUG: Mensagem não chega no WhatsApp

## 📋 PROBLEMA

A mensagem é salva no banco de dados mas não chega no WhatsApp.

## 🔍 POSSÍVEIS CAUSAS

1. ❌ Código na VPS está desatualizado (git pull não foi feito)
2. ❌ Backend não foi recompilado após git pull
3. ❌ PM2 não foi reiniciado após build
4. ❌ Método `sendMessage()` não está sendo chamado
5. ❌ Instância WhatsApp não está realmente conectada

---

## 🚀 SOLUÇÃO RÁPIDA (Execute na VPS)

### Passo 1: Verificar se o código está atualizado

```bash
cd /var/www/govchat

# Ver último commit
git log --oneline -3

# Deve mostrar:
# 6841007 docs: adiciona resumo completo das alterações de envio WhatsApp
# eeb3855 Merge remote-tracking branch 'origin/main'
# 8bb0bed fix(frontend): adiciona métodos HTTP genéricos ao apiClient
```

**Se não mostrar esses commits:** Execute `git pull origin main`

### Passo 2: Verificar se o método sendMessage existe no código FONTE

```bash
cd /var/www/govchat/backend/src

# Verificar método no whatsapp.service.ts
grep -A 3 "async sendMessage" services/whatsapp.service.ts
```

**Deve retornar:**
```typescript
async sendMessage(instanceId: string, to: string, content: string, type: 'text' | 'image' | 'video' | 'audio' | 'document' = 'text', mediaUrl?: string): Promise<any> {
    try {
      console.log(`📤 Enviando mensagem via WhatsApp para ${to}: "${content}" (tipo: ${type})`);
```

**Se não retornar nada:** O código não está atualizado! Execute:

```bash
cd /var/www/govchat
git reset --hard origin/main
git pull origin main
```

### Passo 3: Verificar se a chamada existe no server.ts

```bash
cd /var/www/govchat/backend/src

# Verificar chamada no server.ts
grep -B 2 -A 2 "whatsappService.sendMessage" server.ts
```

**Deve retornar:**
```typescript
console.log(`📤 Chamando whatsappService.sendMessage...`);
const waResult = await whatsappService.sendMessage(
  chat.instance_id,
  chat.chat_id,
  content,
```

**Se não retornar nada:** Código não atualizado!

### Passo 4: Compilar e reiniciar

```bash
cd /var/www/govchat/backend

# Limpar dist antiga
rm -rf dist/

# Recompilar
npm run build

# Verificar se compilou o método sendMessage
grep -n "sendMessage" dist/services/whatsapp.service.js | head -5

# Reiniciar PM2
pm2 restart govchat-backend
pm2 logs govchat-backend --lines 20
```

### Passo 5: Testar novamente

```bash
# Limpar logs
pm2 flush govchat-backend
sleep 1

# Enviar mensagem
curl -X POST "http://localhost:3001/api/conversations/39d89021-95e0-4d01-a47d-7261431e1791/messages" \
  -H "Content-Type: application/json" \
  -d '{"content": "Teste após correção!", "message_type": "text"}'

# Aguardar 2 segundos
sleep 2

# Ver logs
pm2 logs govchat-backend --lines 40 --nostream
```

---

## 📊 LOGS ESPERADOS

Quando funcionar, você deve ver:

```
📨 POST /api/conversations/39d89021-95e0-4d01-a47d-7261431e1791/messages - Enviando mensagem WhatsApp
   Content: "Teste após correção!"
   Type: text
   Media URL: N/A
🔍 Buscando chat com ID: 39d89021-95e0-4d01-a47d-7261431e1791
✅ Chat encontrado: chat_id=32727717949659@lid, instance_id=eec7773e-168a-45e9-9ba5-dfcb5efb2409
📤 Chamando whatsappService.sendMessage...
📤 Enviando mensagem via WhatsApp para 32727717949659@lid: "Teste após correção!" (tipo: text)
✅ Mensagem text enviada com sucesso para 32727717949659@lid!
✅ Mensagem WhatsApp enviada com sucesso!
💾 Salvando mensagem no banco...
✅ Mensagem salva no banco com sucesso!
```

**Se não aparecer esses logs:** O código não está atualizado na VPS!

---

## 🔧 SCRIPT COMPLETO DE CORREÇÃO

Copie e execute tudo de uma vez na VPS:

```bash
cd /var/www/govchat && \

echo "🔧 Atualizando código..." && \
git fetch origin main && \
git reset --hard origin/main && \

echo "" && \
echo "📦 Instalando dependências..." && \
cd backend && \
npm install && \

echo "" && \
echo "🗑️ Limpando dist antiga..." && \
rm -rf dist/ && \

echo "" && \
echo "🔨 Compilando..." && \
npm run build && \

echo "" && \
echo "✅ Verificando método sendMessage compilado..." && \
grep -n "sendMessage" dist/services/whatsapp.service.js | head -3 && \

echo "" && \
echo "🔄 Reiniciando PM2..." && \
pm2 restart govchat-backend && \
sleep 3 && \

echo "" && \
echo "✅ Status do PM2:" && \
pm2 status govchat-backend && \

echo "" && \
echo "📋 Logs recentes:" && \
pm2 logs govchat-backend --lines 20 --nostream && \

echo "" && \
echo "" && \
echo "🧪 AGORA TESTE ENVIANDO UMA MENSAGEM!" && \
echo "Acesse: https://atendimento.nextplan.tec.br"
```

---

## ❓ SE AINDA NÃO FUNCIONAR

Execute o script de debug completo:

```bash
cd /var/www/govchat && \

pm2 flush govchat-backend && \
sleep 1 && \

curl -X POST "http://localhost:3001/api/conversations/39d89021-95e0-4d01-a47d-7261431e1791/messages" \
  -H "Content-Type: application/json" \
  -d '{"content": "Debug final", "message_type": "text"}' && \

sleep 2 && \

echo "" && \
echo "=== LOGS COMPLETOS ===" && \
pm2 logs govchat-backend --lines 60 --nostream && \

echo "" && \
echo "=== INSTÂNCIA WHATSAPP ===" && \
echo "SELECT id, status FROM whatsapp_instances;" | \
  PGPASSWORD='jjROqoI9CRXKYqxsYc0CGkXFS' \
  psql -h localhost -U govchat_user -d govchat_nextplan
```

**Me envie a saída completa!**

---

## 📝 CHECKLIST

- [ ] Git pull executado
- [ ] Código fonte tem `async sendMessage()` em `whatsapp.service.ts`
- [ ] Código fonte tem `whatsappService.sendMessage()` em `server.ts`
- [ ] `npm run build` executado sem erros
- [ ] `dist/services/whatsapp.service.js` tem `sendMessage`
- [ ] `dist/server.js` tem `whatsappService.sendMessage`
- [ ] PM2 reiniciado
- [ ] Instância WhatsApp com status `connected`
- [ ] Logs mostram `📤 Enviando mensagem via WhatsApp...`

Se TODOS estiverem marcados e ainda não funcionar, há outro problema que precisamos investigar.

---

**Versão:** 2.6.1  
**Data:** 2026-02-19  
**Status:** Em debug
