# 🚀 INSTRUÇÕES DE DEPLOY - VPS

**Data**: 2026-02-19  
**Versão**: 2.6.2  
**Status**: 🟢 PRONTO PARA PRODUÇÃO

---

## ⚡ DEPLOY RÁPIDO (Recomendado)

Copie e cole este comando único na VPS:

```bash
cd /var/www/govchat && \
git fetch origin main && \
git reset --hard origin/main && \
chmod +x quick-deploy.sh fix-post-endpoint-final.sh && \
./quick-deploy.sh
```

**Tempo estimado**: 2-3 minutos

---

## 📋 DEPLOY MANUAL (Passo a Passo)

Se preferir fazer manualmente ou se o script automático falhar:

### Passo 1: Atualizar Código

```bash
cd /var/www/govchat
git fetch origin main
git reset --hard origin/main
```

**Verificar**:
```bash
git log --oneline -3
```

**Deve mostrar**:
```
a7297ed feat: adiciona script de deploy rápido para VPS
0af64b5 docs: adiciona resumo final da correção crítica
1dc1be8 fix(backend): adiciona authMiddleware ao endpoint POST mensagens
```

### Passo 2: Backup do Código Atual

```bash
cd /var/www/govchat/backend/src
cp server.ts server.ts.backup_$(date +%Y%m%d_%H%M%S)
ls -lh server.ts*
```

### Passo 3: Adicionar authMiddleware

**Opção A - Usando sed (automatizado)**:
```bash
# Encontrar a linha do endpoint POST
LINE=$(grep -n "app.post('/api/conversations/:id/messages', async" server.ts | cut -d: -f1)

# Adicionar authMiddleware
if [ ! -z "$LINE" ]; then
    sed -i "${LINE}s|app.post('/api/conversations/:id/messages', async|app.post('/api/conversations/:id/messages', authMiddleware, async|" server.ts
    echo "✅ authMiddleware adicionado na linha $LINE"
else
    echo "⚠️ Endpoint já tem authMiddleware ou não encontrado"
fi

# Verificar
grep -n "app.post('/api/conversations/:id/messages'" server.ts
```

**Opção B - Editando manualmente**:
```bash
nano server.ts
```

Encontre esta linha:
```typescript
app.post('/api/conversations/:id/messages', async (req: Request, res: Response) => {
```

Altere para:
```typescript
app.post('/api/conversations/:id/messages', authMiddleware, async (req: Request, res: Response) => {
```

Salve: `Ctrl+O`, Enter, `Ctrl+X`

### Passo 4: Verificar Import

```bash
grep -n "import.*authMiddleware" server.ts
```

**Se não encontrar**, adicione:
```bash
# Adicionar após outros imports
sed -i "/import.*pool.*from.*config\/database/a import { authMiddleware } from './middleware/auth';" server.ts
```

### Passo 5: Recompilar

```bash
cd /var/www/govchat/backend
npm run build
```

**Verificar compilação**:
```bash
echo $?
# Deve retornar: 0 (sucesso)
```

**Verificar se endpoint foi compilado**:
```bash
grep -c "authMiddleware" dist/server.js
# Deve retornar um número > 0
```

### Passo 6: Reiniciar Backend

```bash
pm2 restart govchat-backend
sleep 3
pm2 status govchat-backend
```

**Status esperado**:
- Status: `online`
- Restart: aumentou em 1
- CPU: 0-5%
- Memory: ~15-30 MB

### Passo 7: Verificar Logs

```bash
pm2 logs govchat-backend --lines 30 --nostream
```

**Logs esperados**:
```
🔵 Starting WhatsApp service...
✅ WhatsApp service initialized
🌐 Server running on port 3001
📡 WebSocket server running on /ws
✅ Database connected
```

---

## 🧪 VALIDAÇÃO

### Teste 1: Enviar Mensagem

1. Acesse: https://atendimento.nextplan.tec.br
2. Faça login com suas credenciais
3. Abra qualquer conversa no Chat
4. Digite e envie:
   ```
   🎉 Teste após correção - v2.6.2
   ```

**Resultado esperado**:
- ✅ Mensagem aparece no chat
- ✅ Mensagem é enviada via WhatsApp
- ✅ Status "entregue" aparece

### Teste 2: Refresh da Página (CRÍTICO)

1. Com a mensagem de teste ainda visível
2. Pressione **F5** ou **Ctrl+R**
3. Aguarde a página recarregar

**Resultado esperado**:
- ✅ **Mensagem continua aparecendo no chat**
- ✅ Histórico completo carregado
- ✅ Sem erro 404 no console (F12)

### Teste 3: Verificar Console do Navegador

1. Pressione **F12** (DevTools)
2. Vá para aba **Console**
3. Envie outra mensagem

**Resultado esperado**:
- ✅ Sem mensagem de erro vermelho
- ✅ Sem "404 Not Found"
- ✅ Sem "Request failed"

### Teste 4: Verificar Logs do Backend

```bash
pm2 flush govchat-backend
pm2 logs govchat-backend --lines 0
```

**Envie uma mensagem** e observe os logs.

**Logs esperados**:
```
📨 POST /api/conversations/39d89021-95e0-4d01-a47d-7261431e1791/messages - Enviando mensagem WhatsApp
   Content: "🎉 Teste após correção - v2.6.2"
   Type: text
   Media URL: N/A
🔍 Buscando chat com ID: 39d89021-95e0-4d01-a47d-7261431e1791
✅ Chat encontrado: chat_id=32727717949659@lid, instance_id=eec7773e-168a-45e9-9ba5-dfcb5efb2409
📤 Chamando whatsappService.sendMessage...
✅ Mensagem WhatsApp enviada com sucesso!
💾 Salvando mensagem no banco...
✅ Mensagem salva no DB
```

**Dê F5** e observe novamente:
```
📋 GET /api/conversations/39d89021-95e0-4d01-a47d-7261431e1791/messages
✅ 33 mensagem(ns)
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Marque cada item após executar:

- [ ] Código atualizado do GitHub (commit a7297ed)
- [ ] Backup do server.ts criado
- [ ] authMiddleware adicionado ao endpoint POST
- [ ] Import do authMiddleware verificado/adicionado
- [ ] `npm run build` executado sem erros TypeScript
- [ ] PM2 reiniciado com status `online`
- [ ] Logs mostram "Server running on port 3001"
- [ ] Login no frontend funciona
- [ ] Mensagem enviada aparece no chat
- [ ] Mensagem é entregue no WhatsApp
- [ ] **Após F5, mensagem continua visível** ⭐
- [ ] Console do navegador sem erro 404
- [ ] Logs mostram `📨 POST /api/conversations` ao enviar
- [ ] Logs mostram `📋 GET /api/conversations` após F5

---

## 🔥 TROUBLESHOOTING

### Problema: Erro 404 ainda aparece

**Diagnóstico**:
```bash
cd /var/www/govchat/backend
grep -n "authMiddleware" dist/server.js | grep conversations
```

**Se não retornar nada**:
- O endpoint não foi compilado corretamente
- Execute `npm run build` novamente
- Verifique se há erros TypeScript

**Solução**:
```bash
cd /var/www/govchat/backend
rm -rf dist/
npm run build
pm2 restart govchat-backend
```

### Problema: "Cannot read properties of undefined"

**Causa**: authMiddleware não está sendo aplicado

**Diagnóstico**:
```bash
cd /var/www/govchat/backend/src
grep -A 1 "app.post('/api/conversations/:id/messages'" server.ts
```

**Deve mostrar**:
```typescript
app.post('/api/conversations/:id/messages', authMiddleware, async (req: Request, res: Response) => {
```

**Se não mostrar** `authMiddleware`, adicione manualmente:
```bash
nano server.ts
# Adicione authMiddleware como mostrado acima
# Salve e recompile
```

### Problema: Mensagens ainda desaparecem após F5

**Diagnóstico**:
```bash
# Verificar se GET está funcionando
curl -H "Authorization: Bearer SEU_TOKEN_JWT" \
  http://localhost:3001/api/conversations/ID_DA_CONVERSA/messages | python3 -m json.tool
```

**Se retornar mensagens**: problema é no frontend
**Se não retornar**: problema é no backend

**Solução backend**:
```bash
cd /var/www/govchat/backend/src
grep -n "GET /api/conversations/:id/messages" server.ts
# Verificar se endpoint GET existe
```

### Problema: PM2 não reinicia

**Diagnóstico**:
```bash
pm2 status
pm2 describe govchat-backend
```

**Solução**:
```bash
# Parar e iniciar novamente
pm2 stop govchat-backend
pm2 start govchat-backend

# Ou restart forçado
pm2 restart govchat-backend --update-env
```

---

## 📞 SUPORTE

Se após seguir todos os passos o problema persistir:

1. **Coletar logs completos**:
   ```bash
   pm2 logs govchat-backend --lines 200 --nostream > /tmp/logs.txt
   cat /tmp/logs.txt
   ```

2. **Verificar versão do código**:
   ```bash
   cd /var/www/govchat
   git log --oneline -5
   git status
   ```

3. **Verificar estrutura de arquivos**:
   ```bash
   ls -lh backend/src/server.ts
   ls -lh backend/src/middleware/auth.ts
   ls -lh backend/dist/server.js
   ```

4. **Enviar informações**:
   - Logs completos
   - Versão do commit
   - Status do PM2
   - Erro exato do console do navegador

---

## 🎯 RESULTADO FINAL

Após completar todos os passos:

✅ Sistema totalmente funcional  
✅ Mensagens enviadas via WhatsApp  
✅ Mensagens persistem após F5  
✅ Sem erros 404 no frontend  
✅ Logs completos e claros  
✅ Pronto para uso em produção  

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- `RESUMO_FINAL.md` - Resumo executivo completo
- `SOLUCAO_404_E_DESAPARECIMENTO.md` - Detalhes técnicos do problema
- `RESUMO_ALTERACOES.md` - Histórico de todas as alterações
- `EXECUTE_NA_VPS.md` - Instruções anteriores de deploy

---

**Versão do Deploy**: 2.6.2  
**Commit**: a7297ed  
**Data**: 2026-02-19  
**Status**: 🟢 APROVADO PARA PRODUÇÃO  

🚀 **Boa sorte com o deploy!**
