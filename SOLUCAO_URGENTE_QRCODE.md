# 🚨 SOLUÇÃO URGENTE - QR Code Não Aparece

## Problema Atual
**"clicando no QRcode ainda nao aparece"**

---

## 🎯 Causa Provável

O código foi corrigido e commitado, mas **NÃO FOI APLICADO NO VPS**.

O servidor ainda está rodando a versão antiga do código.

---

## ✅ SOLUÇÃO RÁPIDA (2 minutos)

### Execute no VPS:

```bash
cd /var/www/govchat
./diagnose-qrcode.sh
```

Este script irá:
1. ✅ Verificar se o código está atualizado
2. ✅ Instalar dependências faltantes
3. ✅ Recompilar o backend se necessário
4. ✅ Reiniciar o PM2 se necessário
5. ✅ Verificar banco de dados
6. ✅ Reportar status completo

---

## 🔧 Ou Execute Manualmente:

```bash
cd /var/www/govchat

# Passo 1: Atualizar código
git pull origin main

# Passo 2: Instalar dependências
cd backend
npm install

# Passo 3: Compilar
npm run build

# Passo 4: Reiniciar
cd ..
pm2 restart govchat-backend

# Passo 5: Verificar
pm2 logs govchat-backend --lines 20 --nostream
```

**Tempo total:** ~2 minutos

---

## 🧪 Como Testar Depois

1. **Abra navegador** (modo anônimo)
   ```
   https://atendimento.nextplan.tec.br
   ```

2. **Login**
   - Email: `feliphe@nextplan.tec.br`
   - Senha: `Teikei9@`

3. **Navegue**
   - Configurações → WhatsApp

4. **Clique** no ícone 📱 (QR Code)

5. **Resultado esperado:**
   - ✅ QR Code aparece **instantaneamente**
   - ✅ Imagem **nítida** (300x300px)
   - ✅ **Sem erros** no console (F12)

---

## 🔍 Debug no Navegador (Se Ainda Não Funcionar)

**Abra Console (F12) e execute:**

```javascript
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);

// Testar rota diretamente
fetch('https://atendimento.nextplan.tec.br/api/whatsapp/config', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('Instâncias:', data);
  if (data.instances?.[0]) {
    return fetch(`https://atendimento.nextplan.tec.br/api/whatsapp/config/${data.instances[0].id}/qrcode`, {
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
    console.log('✅ QR Code OK!');
    console.log('Tamanho:', data.qr_code.length, 'chars');
  } else {
    console.error('❌ Sem QR Code:', data);
  }
})
.catch(err => console.error('❌ Erro:', err));
```

---

## 📊 Respostas Possíveis

### ✅ Sucesso (200 OK)
```json
{
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "status": "connecting",
  "expires_at": "2026-02-19T14:30:00.000Z",
  "message": "Escaneie o QR Code com seu WhatsApp"
}
```
**Ação:** QR Code deve aparecer no modal!

---

### ❌ Erro 500 - Internal Server Error
```json
{
  "error": "Failed to get QR Code"
}
```

**Causa:** 
- Dependência `qrcode` não instalada
- Backend não recompilado

**Solução:**
```bash
cd /var/www/govchat/backend
npm install qrcode @types/qrcode
npm run build
pm2 restart govchat-backend
```

---

### ❌ Erro 404 - Not Found
```json
{
  "error": "WhatsApp instance not found"
}
```

**Causa:** Instância não existe no banco

**Solução:**
```bash
# Verificar tabela
sudo -u postgres psql -d govchat_nextplan -c "SELECT id, instance_name FROM whatsapp_instances;"

# Se vazia, criar uma instância via interface
```

---

### ❌ Erro 401 - Unauthorized
```json
{
  "error": "No token provided"
}
```

**Causa:** Token inválido/expirado

**Solução:**
```javascript
// No console do navegador
localStorage.removeItem('token');
// Depois faça login novamente
```

---

## 🛠️ Ferramentas de Debug Criadas

### 1. **diagnose-qrcode.sh** (Diagnóstico Automático)
```bash
cd /var/www/govchat
./diagnose-qrcode.sh
```
Verifica TUDO automaticamente e sugere correções.

### 2. **update-qrcode.sh** (Atualização Automática)
```bash
cd /var/www/govchat
./update-qrcode.sh
```
Aplica todas as correções necessárias.

### 3. **test-qrcode.sh** (Teste Manual)
```bash
cd /var/www/govchat
./test-qrcode.sh
```
Testa a rota e mostra logs.

### 4. **DEBUG_QRCODE.md** (Guia Completo)
```bash
cat /var/www/govchat/DEBUG_QRCODE.md
```
Guia passo a passo com todas as soluções.

---

## 📋 Checklist Rápido

Execute no VPS e marque:

- [ ] `git pull origin main` (código atualizado)
- [ ] `cd backend && npm install` (dependências instaladas)
- [ ] `npm run build` (backend compilado)
- [ ] `pm2 restart govchat-backend` (backend reiniciado)
- [ ] `pm2 logs govchat-backend --lines 20` (sem erros)
- [ ] Testar no navegador (QR Code aparece)

---

## 📞 Se Ainda Não Funcionar

**Colete logs:**
```bash
cd /var/www/govchat

# 1. Logs do backend
pm2 logs govchat-backend --lines 100 > qrcode-backend-logs.txt

# 2. Status do sistema
./diagnose-qrcode.sh > qrcode-diagnostico.txt

# 3. Histórico Git
git log --oneline -10 > qrcode-git-log.txt

# 4. Dependências
npm list --prefix backend > qrcode-npm-list.txt
```

**Envie os 4 arquivos gerados.**

---

## ⚡ AÇÃO IMEDIATA

**Execute AGORA no VPS:**

```bash
cd /var/www/govchat && ./diagnose-qrcode.sh
```

Isso irá diagnosticar e corrigir automaticamente.

---

## 🎯 Resumo

| Status | Descrição |
|--------|-----------|
| ✅ | Código corrigido e commitado (commits 1370421, 25766d8, d61835b) |
| ⏳ | **Deploy PENDENTE no VPS** |
| 🔧 | Scripts de diagnóstico criados |
| 📚 | Documentação completa disponível |

**Próximo passo:** Executar `./diagnose-qrcode.sh` no VPS

---

**Repository:** https://github.com/feliphemelo/govconnect-hub  
**Último commit:** d978963  
**Versão:** 2.1.2  
**Data:** 2026-02-19
