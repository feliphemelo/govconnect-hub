# 🔧 Solução: Mensagens Desaparecem após F5 e Erro 404

**Data**: 2026-02-19  
**Versão**: 2.6.2  
**Status**: 🔴 CORREÇÃO CRÍTICA

---

## 🐛 Problema Identificado

### Sintomas
1. ✅ Mensagens são enviadas via WhatsApp com sucesso pelo **WebSocket**
2. ✅ Mensagens são salvas no banco de dados
3. ❌ Após dar **F5** (refresh), as mensagens desaparecem do chat
4. ❌ Console do navegador mostra erro:
   ```
   POST https://atendimento.nextplan.tec.br/api/conversations/:id/messages 404 (Not Found)
   ❌ Error sending message: Error: Request failed
   ```

### Causa Raiz
O endpoint **POST `/api/conversations/:id/messages`** estava definido **SEM `authMiddleware`**:

```typescript
// ❌ ERRADO - sem authMiddleware
app.post('/api/conversations/:id/messages', async (req: Request, res: Response) => {
  const payload = (req as any).user as JWTPayload; // ← user é undefined!
  // ...
});
```

**Consequências**:
1. `req.user` é `undefined` porque não passou pelo `authMiddleware`
2. Ao tentar acessar `payload.companyId`, ocorre erro:
   ```
   Cannot read properties of undefined (reading 'companyId')
   ```
3. O endpoint retorna erro 500 (que o Nginx/proxy converte em 404)
4. O frontend não consegue buscar mensagens antigas ao dar refresh

---

## ✅ Solução

### 1. Adicionar `authMiddleware` ao Endpoint

```typescript
// ✅ CORRETO - com authMiddleware
app.post('/api/conversations/:id/messages', authMiddleware, async (req: Request, res: Response) => {
  const payload = (req as any).user as JWTPayload; // ← Agora funciona!
  // ...
});
```

### 2. Verificar Import do Middleware

Certifique-se que `authMiddleware` está importado no início do `server.ts`:

```typescript
import { authMiddleware } from './middleware/auth';
```

---

## 🚀 Aplicando a Correção na VPS

### Método Automático (Recomendado)

Execute o script de correção:

```bash
cd /var/www/govchat
./fix-post-endpoint-final.sh
```

O script vai:
1. ✅ Fazer backup do `server.ts`
2. ✅ Adicionar `authMiddleware` ao endpoint POST
3. ✅ Verificar/adicionar import do middleware
4. ✅ Recompilar o backend
5. ✅ Reiniciar o PM2
6. ✅ Mostrar logs para validação

### Método Manual

Se preferir fazer manualmente:

```bash
cd /var/www/govchat/backend/src

# 1. Backup
cp server.ts server.ts.backup_$(date +%Y%m%d_%H%M%S)

# 2. Editar server.ts
nano server.ts

# Encontre a linha:
# app.post('/api/conversations/:id/messages', async (req: Request, res: Response) => {

# Altere para:
# app.post('/api/conversations/:id/messages', authMiddleware, async (req: Request, res: Response) => {

# 3. Salvar e sair (Ctrl+O, Enter, Ctrl+X)

# 4. Recompilar
cd /var/www/govchat/backend
npm run build

# 5. Reiniciar PM2
pm2 restart govchat-backend

# 6. Verificar logs
pm2 logs govchat-backend --lines 30
```

---

## 🧪 Validação da Correção

### Passo 1: Verificar se Endpoint Está Registrado

```bash
cd /var/www/govchat/backend
grep -n "authMiddleware" dist/server.js | grep conversations
```

**Saída esperada**: deve mostrar que `authMiddleware` está presente

### Passo 2: Testar pelo Frontend

1. Acesse: https://atendimento.nextplan.tec.br
2. Faça login normalmente
3. Abra uma conversa no **Chat**
4. Envie uma mensagem de teste: `🎉 Teste após correção!`
5. Aguarde a mensagem aparecer
6. **Dê F5** (refresh) na página
7. ✅ **A mensagem deve continuar aparecendo**

### Passo 3: Verificar Logs

```bash
pm2 logs govchat-backend --lines 50 --nostream
```

**Logs esperados** após enviar mensagem e dar F5:
```
📨 POST /api/conversations/39d89021-.../messages - Enviando mensagem WhatsApp
   Content: "🎉 Teste após correção!"
   Type: text
🔍 Buscando chat com ID: 39d89021-...
✅ Chat encontrado: chat_id=..., instance_id=...
📤 Chamando whatsappService.sendMessage...
✅ Mensagem WhatsApp enviada com sucesso!
💾 Salvando mensagem no banco...
✅ Mensagem salva no DB
📋 GET /api/conversations/39d89021-.../messages
✅ 32 mensagem(ns)
```

---

## 🔍 Troubleshooting

### Problema: Ainda retorna 404

**Possível causa**: Middleware de erro está antes das rotas

**Solução**:
```bash
cd /var/www/govchat/backend/src
grep -n "app.use.*err.*Error" server.ts
```

O middleware de erro deve estar **DEPOIS** de todas as rotas, antes de `const server = http.createServer`.

### Problema: Erro "Cannot read properties of undefined"

**Possível causa**: `authMiddleware` ainda não está sendo aplicado

**Solução**:
```bash
cd /var/www/govchat/backend/src
grep -n "app.post('/api/conversations/:id/messages'" server.ts
```

Deve mostrar:
```
app.post('/api/conversations/:id/messages', authMiddleware, async ...
```

### Problema: Mensagens duplicadas no chat

**Possível causa**: Frontend está enviando via WebSocket E HTTP simultaneamente

**Solução**: Verificar o código do componente Chat no frontend para garantir que está usando apenas WebSocket OU HTTP, não ambos.

---

## 📊 Fluxo Completo de Mensagens

### Envio de Mensagem

```
Frontend
  ↓ (WebSocket)
WebSocket Server (websocket.ts)
  ↓ (chama whatsappService.sendMessage)
WhatsApp Service (whatsapp.service.ts)
  ↓ (Baileys)
WhatsApp API
  ↓
💬 Mensagem entregue ao destinatário
```

**E simultaneamente**:
```
Frontend
  ↓ (HTTP POST com JWT)
Endpoint POST /api/conversations/:id/messages (com authMiddleware)
  ↓ (valida token, extrai companyId)
  ↓ (busca chat no DB)
  ↓ (chama whatsappService.sendMessage)
WhatsApp Service
  ↓ (salva no DB)
PostgreSQL whatsapp_messages
```

### Recuperação de Mensagens (após F5)

```
Frontend (após refresh)
  ↓ (HTTP GET com JWT)
Endpoint GET /api/conversations/:id/messages
  ↓ (query no DB)
PostgreSQL whatsapp_messages
  ↓
Frontend (renderiza mensagens)
```

---

## 📝 Checklist de Validação

- [ ] Script `fix-post-endpoint-final.sh` executado com sucesso
- [ ] `npm run build` compilou sem erros TypeScript
- [ ] PM2 reiniciado: `pm2 restart govchat-backend`
- [ ] Endpoint POST contém `authMiddleware` no código
- [ ] Mensagem enviada pelo frontend chega no WhatsApp
- [ ] Após dar F5, mensagens continuam aparecendo
- [ ] Logs mostram `📨 POST /api/conversations` quando envia mensagem
- [ ] Console do navegador (F12) não mostra erro 404

---

## 🎯 Resultado Esperado

✅ **Mensagens persistem após refresh**  
✅ **Endpoint POST funciona com autenticação**  
✅ **Sincronização completa: WebSocket + HTTP + DB**  
✅ **Sem erros 404 no console do navegador**  

---

## 📚 Arquivos Relacionados

- `/var/www/govchat/backend/src/server.ts` - Endpoint POST corrigido
- `/var/www/govchat/backend/src/websocket.ts` - WebSocket handler
- `/var/www/govchat/backend/src/services/whatsapp.service.ts` - Envio via Baileys
- `/var/www/govchat/backend/src/middleware/auth.ts` - Middleware de autenticação

---

## 🔗 Links Úteis

- **Frontend**: https://atendimento.nextplan.tec.br
- **Backend API**: https://atendimento.nextplan.tec.br/api
- **Repositório**: https://github.com/feliphemelo/govconnect-hub

---

**Autor**: Claude AI  
**Última atualização**: 2026-02-19 23:50 UTC  
**Versão do GovConnect**: 2.6.2
