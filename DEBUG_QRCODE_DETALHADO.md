# 🔍 DEBUG DETALHADO - QR Code Não Abre

## 🎯 Problema Atual
**"QRcode ainda nao abre"**

O modal do QR Code não está abrindo ao clicar no botão.

---

## 🧪 TESTE NO NAVEGADOR (PASSO A PASSO)

### 1️⃣ Abra o Console do Navegador

1. Acesse: https://atendimento.nextplan.tec.br
2. Pressione **F12** (ou Ctrl+Shift+I)
3. Vá na aba **Console**
4. Deixe o console aberto

---

### 2️⃣ Verifique se o Token Existe

Cole e execute no console:

```javascript
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'NONE');
```

**Resultado esperado:**
```
Token exists: true
Token preview: eyJhbGciOiJIUzI1NiIsInR5...
```

**Se retornar `false`:**
- Faça logout e login novamente

---

### 3️⃣ Teste a Rota de Listar Instâncias

Cole e execute:

```javascript
const token = localStorage.getItem('token');

fetch('https://atendimento.nextplan.tec.br/api/whatsapp/config', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Instâncias:', data);
  if (data.instances && data.instances.length > 0) {
    console.log('✅ Total de instâncias:', data.instances.length);
    data.instances.forEach((inst, i) => {
      console.log(`Instância ${i+1}:`, {
        id: inst.id,
        nome: inst.instance_name,
        status: inst.status
      });
    });
    
    // Salvar primeira instância para teste
    window._testInstanceId = data.instances[0].id;
    console.log('ID para teste salvo:', window._testInstanceId);
  } else {
    console.log('❌ Nenhuma instância encontrada');
  }
})
.catch(err => console.error('❌ Erro:', err));
```

**Resultado esperado:**
```
Status: 200
Instâncias: {instances: Array(1)}
✅ Total de instâncias: 1
Instância 1: {id: "xxx", nome: "WhatsApp Principal", status: "disconnected"}
ID para teste salvo: xxx
```

**Se retornar erro 500:**
- A tabela `whatsapp_instances` não existe
- Execute no VPS: `./run-migration.sh`

---

### 4️⃣ Teste a Rota de QR Code

Cole e execute (usa o ID salvo no passo anterior):

```javascript
const token = localStorage.getItem('token');
const instanceId = window._testInstanceId;

if (!instanceId) {
  console.error('❌ Execute o passo 3 primeiro!');
} else {
  console.log('Testando QR Code para instância:', instanceId);
  
  fetch(`https://atendimento.nextplan.tec.br/api/whatsapp/config/${instanceId}/qrcode`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('Status:', response.status);
    if (!response.ok) {
      return response.json().then(err => {
        throw new Error(JSON.stringify(err));
      });
    }
    return response.json();
  })
  .then(data => {
    console.log('✅ QR Code Response:', data);
    console.log('QR Code length:', data.qr_code ? data.qr_code.length : 0);
    console.log('QR Code starts with:', data.qr_code ? data.qr_code.substring(0, 50) : 'NONE');
    
    // Testar se a imagem é válida
    if (data.qr_code) {
      const img = new Image();
      img.onload = () => console.log('✅ QR Code image válida!');
      img.onerror = () => console.error('❌ QR Code image inválida!');
      img.src = data.qr_code;
    }
  })
  .catch(err => {
    console.error('❌ Erro ao gerar QR Code:', err);
  });
}
```

**Resultado esperado:**
```
Testando QR Code para instância: xxx
Status: 200
✅ QR Code Response: {qr_code: "data:image/png;base64,...", status: "connecting", ...}
QR Code length: 5432
QR Code starts with: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA
✅ QR Code image válida!
```

**Se retornar erro 500:**
```json
{"error": "Failed to get QR Code"}
```
- O backend não compilou com a biblioteca `qrcode`
- Execute no VPS: `cd /var/www/govchat/backend && npm install qrcode @types/qrcode && npm run build && pm2 restart govchat-backend`

---

### 5️⃣ Verificar Erros na Aba Network

1. Mantenha o **F12** aberto
2. Vá na aba **Network**
3. Clique no botão de QR Code no WhatsApp
4. Observe as requisições

**O que procurar:**

✅ **Se aparecer requisição:**
- URL: `/api/whatsapp/config/{id}/qrcode`
- Status: **200 OK** → Backend funcionando
- Status: **500** → Erro no backend
- Status: **404** → Instância não encontrada
- Status: **401** → Token inválido

❌ **Se NÃO aparecer requisição:**
- Problema no frontend (JavaScript não executou)
- Verifique se há erros no Console

---

### 6️⃣ Teste Direto do Clique

Cole no console e execute:

```javascript
// Simular clique no botão de QR Code
const qrButton = document.querySelector('[title="Conectar via QR Code"]');
if (qrButton) {
  console.log('✅ Botão encontrado, simulando clique...');
  qrButton.click();
} else {
  console.log('❌ Botão não encontrado na página');
  console.log('Botões disponíveis:', document.querySelectorAll('button').length);
}
```

**Observe se:**
- Modal abre
- Spinner de "Gerando QR Code..." aparece
- QR Code aparece depois
- Erros no console

---

## 📋 POSSÍVEIS CAUSAS E SOLUÇÕES

### Causa 1: Backend não atualizado no VPS
**Sintoma:** Erro 500 ao chamar `/api/whatsapp/config/{id}/qrcode`

**Solução:**
```bash
cd /var/www/govchat
./update-qrcode.sh
```

---

### Causa 2: Tabela whatsapp_instances não existe
**Sintoma:** Erro 500 com mensagem `relation "whatsapp_instances" does not exist`

**Solução:**
```bash
cd /var/www/govchat
./run-migration.sh
```

---

### Causa 3: Frontend não atualizado
**Sintoma:** QR Code retorna, mas modal não abre

**Solução:**
```bash
cd /var/www/govchat
git pull origin main
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx
```

---

### Causa 4: Token expirado
**Sintoma:** Erro 401 Unauthorized

**Solução:**
```javascript
// No console
localStorage.removeItem('token');
// Depois faça login novamente
```

---

### Causa 5: Nenhuma instância cadastrada
**Sintoma:** Lista de instâncias vazia

**Solução:**
1. Clique em "Nova Instância"
2. Preencha nome e número
3. Salve
4. Tente o QR Code novamente

---

## 🔧 SOLUÇÃO COMPLETA (VPS)

Execute todos os passos no VPS:

```bash
# 1. Ir para o diretório
cd /var/www/govchat

# 2. Atualizar código
git pull origin main

# 3. Verificar e criar tabela se não existe
sudo -u postgres psql -d govchat_nextplan -c "\dt whatsapp_instances" || \
sudo -u postgres psql -d govchat_nextplan -f create_whatsapp_table.sql

# 4. Atualizar backend
cd backend
npm install
npm run build
cd ..

# 5. Reiniciar backend
pm2 restart govchat-backend

# 6. Verificar logs
pm2 logs govchat-backend --lines 30 --nostream

# 7. Limpar cache do frontend
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx

# 8. Testar
curl -I http://localhost:3001/api/health
```

---

## 📞 COLETAR INFORMAÇÕES DE DEBUG

Se ainda não funcionar, execute e envie os resultados:

### No Navegador (Console):

```javascript
// 1. Informações do ambiente
console.log('=== DEBUG INFO ===');
console.log('URL:', window.location.href);
console.log('Token exists:', !!localStorage.getItem('token'));
console.log('User Agent:', navigator.userAgent);

// 2. Testar API
const token = localStorage.getItem('token');
Promise.all([
  fetch('https://atendimento.nextplan.tec.br/api/health').then(r => r.json()),
  fetch('https://atendimento.nextplan.tec.br/api/whatsapp/config', {
    headers: {'Authorization': `Bearer ${token}`}
  }).then(r => r.json())
]).then(results => {
  console.log('Health:', results[0]);
  console.log('WhatsApp Config:', results[1]);
}).catch(err => console.error('Erro:', err));
```

### No VPS:

```bash
cd /var/www/govchat

echo "=== GIT STATUS ===" > debug-qrcode.txt
git log --oneline -5 >> debug-qrcode.txt

echo -e "\n=== BACKEND STATUS ===" >> debug-qrcode.txt
pm2 status >> debug-qrcode.txt

echo -e "\n=== BACKEND LOGS ===" >> debug-qrcode.txt
pm2 logs govchat-backend --lines 50 --nostream >> debug-qrcode.txt

echo -e "\n=== DATABASE TABLE ===" >> debug-qrcode.txt
sudo -u postgres psql -d govchat_nextplan -c "\d whatsapp_instances" >> debug-qrcode.txt 2>&1

echo -e "\n=== NPM PACKAGES ===" >> debug-qrcode.txt
npm list qrcode --prefix backend >> debug-qrcode.txt 2>&1

cat debug-qrcode.txt
```

Envie o conteúdo de `debug-qrcode.txt` e screenshot do console do navegador.

---

**Status:** 🔍 EM DEBUG  
**Próximo Passo:** Execute os testes no navegador (passos 1-6)  
**Versão:** 2.1.3  
**Data:** 2026-02-19
