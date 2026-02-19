# 🔍 DEBUG: QR Code não aparece ao clicar

## ⚠️ Problema
Ao clicar no botão de QR Code, nada acontece ou há erro.

---

## 🔎 Diagnóstico Passo a Passo

### 1️⃣ Verificar se o código foi atualizado no VPS

**Execute no VPS:**
```bash
cd /var/www/govchat

# Verificar última atualização
git log --oneline -5

# Deve conter:
# d61835b docs: adiciona resumo executivo da correção de QR Code
# 25766d8 docs: adiciona guias de deploy para correção do QR Code
# 1370421 fix: corrige geração de QR Code WhatsApp com biblioteca local
```

**Se NÃO estiver atualizado:**
```bash
git pull origin main
```

---

### 2️⃣ Verificar se as dependências foram instaladas

**Execute no VPS:**
```bash
cd /var/www/govchat/backend

# Verificar se qrcode está instalado
npm list qrcode

# Deve mostrar:
# qrcode@1.5.x
```

**Se NÃO estiver instalado:**
```bash
npm install qrcode @types/qrcode
```

---

### 3️⃣ Verificar se o backend foi compilado

**Execute no VPS:**
```bash
cd /var/www/govchat/backend

# Verificar data de compilação
ls -lh dist/server.js

# A data deve ser RECENTE (após o git pull)
```

**Se a data for ANTIGA:**
```bash
npm run build
```

---

### 4️⃣ Verificar se o backend foi reiniciado

**Execute no VPS:**
```bash
pm2 status govchat-backend

# Verificar:
# - status: online
# - uptime: se for muito longo, não foi reiniciado
```

**Para reiniciar:**
```bash
pm2 restart govchat-backend
```

---

### 5️⃣ Verificar logs do backend

**Execute no VPS:**
```bash
pm2 logs govchat-backend --lines 50

# Procure por:
# ✅ "GovChat Backend running on port 3001"
# ✅ Sem erros de QRCode ou import
# ❌ Se houver "Cannot find module 'qrcode'" → volte ao passo 2
# ❌ Se houver erros de TypeScript → volte ao passo 3
```

---

### 6️⃣ Testar a rota diretamente

**No navegador:**

1. Abra o Console (F12 → Console)
2. Cole e execute:

```javascript
// 1. Pegar o token
const token = localStorage.getItem('token');
console.log('Token:', token ? 'OK' : 'MISSING');

// 2. Listar instâncias
fetch('https://atendimento.nextplan.tec.br/api/whatsapp/config', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('Instâncias:', data);
  if (data.instances && data.instances.length > 0) {
    const firstId = data.instances[0].id;
    console.log('Testando QR Code para ID:', firstId);
    
    // 3. Testar QR Code
    return fetch(`https://atendimento.nextplan.tec.br/api/whatsapp/config/${firstId}/qrcode`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }
})
.then(r => r.json())
.then(data => {
  console.log('QR Code Response:', data);
  if (data.qr_code) {
    console.log('✅ QR Code gerado com sucesso!');
    console.log('QR Code começa com:', data.qr_code.substring(0, 50));
  } else {
    console.error('❌ QR Code não retornado:', data);
  }
})
.catch(err => console.error('❌ Erro:', err));
```

---

### 7️⃣ Analisar resposta

#### ✅ **Resposta Esperada (SUCESSO):**
```json
{
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "status": "connecting",
  "expires_at": "2026-02-19T12:34:56.789Z",
  "message": "Escaneie o QR Code com seu WhatsApp"
}
```

#### ❌ **Erro 500 - Internal Server Error**
**Possíveis causas:**
1. Dependência `qrcode` não instalada
2. Backend não foi recompilado
3. Erro na query do banco (tabela não existe)

**Solução:**
```bash
cd /var/www/govchat/backend
npm install qrcode @types/qrcode
npm run build
pm2 restart govchat-backend
```

#### ❌ **Erro 404 - Not Found**
**Causa:** Instância não encontrada no banco

**Solução:**
```bash
# Verificar se a tabela existe
sudo -u postgres psql -d govchat_nextplan -c "\dt whatsapp_instances"

# Se não existir, rodar migração
sudo -u postgres psql -d govchat_nextplan -f /var/www/govchat/create_whatsapp_table.sql
```

#### ❌ **Erro 401 - Unauthorized**
**Causa:** Token inválido ou expirado

**Solução:**
```javascript
// No console do navegador
localStorage.removeItem('token');
// Depois, faça login novamente
```

---

### 8️⃣ Verificar frontend

**No Console do Navegador (F12):**

Vá em: **Network** → Filtrar por **qrcode**

Clique no botão de QR Code e observe:

#### ✅ **Requisição aparece**
- **URL:** `https://atendimento.nextplan.tec.br/api/whatsapp/config/{id}/qrcode`
- **Method:** GET
- **Status:** 200 OK
- **Response:** JSON com `qr_code`

#### ❌ **Requisição NÃO aparece**
**Causa:** Problema no frontend (JavaScript não executou)

**Solução:** Verificar console por erros JavaScript

#### ❌ **Requisição retorna erro**
Ver seção 7️⃣ acima

---

## 🛠️ Solução Completa (Passo a Passo)

Execute estes comandos no VPS na ordem:

```bash
# 1. Ir para o diretório
cd /var/www/govchat

# 2. Parar o backend
pm2 stop govchat-backend

# 3. Atualizar código
git pull origin main

# 4. Instalar dependências
cd backend
npm install

# 5. Compilar TypeScript
npm run build

# 6. Verificar se dist/server.js foi atualizado
ls -lh dist/server.js

# 7. Voltar ao diretório raiz
cd ..

# 8. Reiniciar backend
pm2 restart govchat-backend

# 9. Verificar status
pm2 status

# 10. Ver logs
pm2 logs govchat-backend --lines 30 --nostream

# 11. Testar
# Agora abra o navegador e teste novamente
```

---

## 📋 Checklist de Verificação

Execute cada item e marque:

- [ ] Código atualizado no VPS (`git log` mostra commit `1370421`)
- [ ] Dependência `qrcode` instalada (`npm list qrcode` funciona)
- [ ] Backend compilado (`dist/server.js` data recente)
- [ ] Backend reiniciado (`pm2 status` mostra uptime baixo)
- [ ] Sem erros nos logs (`pm2 logs` sem erros)
- [ ] Tabela existe (`\dt whatsapp_instances` no psql)
- [ ] Frontend carrega sem erros (Console do navegador limpo)
- [ ] Rota responde 200 (teste no passo 6️⃣)
- [ ] QR Code aparece ao clicar no botão

---

## 🚨 Troubleshooting Avançado

### Problema: Backend não compila

**Erro:** `Cannot find module 'qrcode'`

**Solução:**
```bash
cd /var/www/govchat/backend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problema: QR Code retorna mas não exibe

**Causa:** Imagem em base64 muito grande ou formato incorreto

**Verificar:**
```javascript
// No console
const qrCode = "data:image/png;base64,iVBORw0K..."; // Cole o QR Code retornado
const img = new Image();
img.src = qrCode;
document.body.appendChild(img); // Deve mostrar a imagem
```

### Problema: Dialog não abre

**Causa:** Estado do React não está atualizando

**Verificar no código:**
- `setQrDialogOpen(true)` está sendo chamado?
- `qrDialogOpen` está definido no estado?

---

## 📞 Suporte

Se após todos os passos o problema persistir:

1. **Colete logs:**
```bash
pm2 logs govchat-backend --lines 100 > backend-logs.txt
```

2. **Capture screenshot do console do navegador** (F12 → Console + Network)

3. **Execute:**
```bash
cd /var/www/govchat
git log --oneline -5 > git-status.txt
npm list qrcode >> git-status.txt
ls -lh backend/dist/server.js >> git-status.txt
pm2 status >> git-status.txt
```

4. **Envie os arquivos:**
   - `backend-logs.txt`
   - `git-status.txt`
   - Screenshot do console

---

**Status:** 🔍 EM DEBUG  
**Versão:** 2.1.2  
**Data:** 2026-02-19
