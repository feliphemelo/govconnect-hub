# 🎯 Instruções de Finalização - GovChat

## 📋 Status Atual

✅ **Backend funcionando**
- Node.js 20.20.0 instalado
- PM2 gerenciando processo
- PostgreSQL conectado
- Todas as rotas corrigidas (`auth_users` em vez de `auth.users`)
- JWT funcionando corretamente

❌ **Problemas identificados**:
1. **Tela preta no /dashboard** - Frontend desatualizado
2. **Pede login ao recarregar** - Cliente Supabase antigo

## 🔧 Solução: Atualizar o Frontend na VPS

Execute este **ÚNICO COMANDO** no servidor:

```bash
govchat-update
```

Este comando irá:
1. ✅ Fazer `git pull` do código atualizado
2. ✅ Reinstalar dependências do backend
3. ✅ Rebuildar backend (TypeScript → JavaScript)
4. ✅ Reiniciar PM2
5. ✅ Reinstalar dependências do frontend
6. ✅ **Rebuildar frontend com novo `govChatClient`**
7. ✅ Recarregar Nginx

⏱️ **Tempo estimado**: ~3-4 minutos

---

## 🔍 Verificação Após Atualização

### 1. Verificar PM2
```bash
pm2 status
pm2 logs govchat-backend --lines 20
```

**Resultado esperado**:
- Status: `online`
- Restarts: `0`
- Sem erros nos logs

### 2. Testar API
```bash
curl https://atendimento.nextplan.tec.br/api/health
```

**Resultado esperado**:
```json
{"status":"ok","database":"connected","timestamp":"..."}
```

### 3. Testar Login via API
```bash
curl -X POST https://atendimento.nextplan.tec.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"feliphe@nextplan.tec.br","password":"&xr&HPn6"}'
```

**Resultado esperado**:
```json
{
  "user": {
    "id": "...",
    "email": "feliphe@nextplan.tec.br",
    "full_name": "Feliphe",
    "company_id": "...",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI..."
}
```

### 4. Testar no Navegador
1. Abra em **modo anônimo** (CTRL+SHIFT+N): https://atendimento.nextplan.tec.br
2. Faça login com:
   - Email: `feliphe@nextplan.tec.br`
   - Senha: `&xr&HPn6`
3. **Abra F12 → Console** e procure por logs com 🔵 🟢 🔴
4. Deve redirecionar para `/dashboard` com conteúdo visível
5. Recarregue a página (F5) - **NÃO deve pedir login novamente**

---

## 🐛 Se Ainda Houver Problemas

### Problema: "Tela preta no /dashboard"

**Verificar no Console (F12)**:
```
Procure por:
- 🔵 GovChatClient initialized with token: YES
- 🔵 onAuthStateChange registered
- 🔵 getSession called
- 🟢 getSession user data: {...}
```

Se não aparecer, execute:
```bash
cd /var/www/govchat
rm -rf dist/ node_modules/.vite
npm run build
systemctl reload nginx
```

### Problema: "Pede login ao recarregar"

**Verificar localStorage**:
1. F12 → Application → Local Storage → https://atendimento.nextplan.tec.br
2. Procure pela chave `govchat_token`
3. Se não existir, o token não está sendo salvo

**Debug**:
Abra o console e execute:
```javascript
console.log('Token:', localStorage.getItem('govchat_token'));
```

Se retornar `null`, limpe o cache:
```
CTRL+SHIFT+DEL → Limpar cache e cookies
```

### Problema: "Erro 401 nas requisições"

**Verificar backend**:
```bash
pm2 logs govchat-backend --lines 50 | grep -E "error|Error|401"
```

Se aparecer `auth.users does not exist`, execute:
```bash
cd /var/www/govchat
git pull origin main
cd backend
npm run build
pm2 restart govchat-backend
```

---

## 📊 Commits Aplicados

| Commit | Descrição |
|--------|-----------|
| `8c9c01a` | Garante PostgreSQL iniciado antes de configurar |
| `b48142c` | Adiciona rotas conversations, messages, notification_preferences |
| `fd253f3` | Corrige última referência `auth.users` → `auth_users` |
| `452a469` | Implementa `govChatClient` completo com `getSession` e `onAuthStateChange` |

**Repositório**: https://github.com/feliphemelo/govconnect-hub  
**Último commit**: https://github.com/feliphemelo/govconnect-hub/commit/452a469

---

## ✅ Sistema 100% Funcional

Após executar `govchat-update`, o sistema estará totalmente operacional:

- ✅ Backend Node.js rodando na porta 3001
- ✅ Frontend React buildado e servido por Nginx
- ✅ SSL/HTTPS configurado (Let's Encrypt)
- ✅ PostgreSQL local conectado
- ✅ JWT authentication funcionando
- ✅ Sessão persistente (não pede login ao recarregar)
- ✅ Dashboard visível e funcional

---

## 🆘 Suporte

Se após `govchat-update` ainda houver problemas, forneça:

1. **Saída do comando**:
```bash
govchat-logs
```

2. **Console do navegador** (F12):
- Print da aba Console
- Print da aba Network (filtrar por "login" ou "auth")

3. **Informações da sessão**:
```javascript
// Cole no console do navegador:
console.log('Token:', localStorage.getItem('govchat_token'));
console.log('API URL:', import.meta.env?.VITE_API_URL);
```

---

**Última atualização**: 2026-02-19  
**Versão do instalador**: commit `452a469`
