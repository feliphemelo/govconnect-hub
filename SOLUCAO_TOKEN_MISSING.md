# ✅ SOLUÇÃO - Token Missing (401 Unauthorized)

## 🎯 Problema Identificado

```
1. Token: ❌ MISSING
GET /api/whatsapp/config 401 (Unauthorized)
2. Instâncias: 0
❌ Sem QR Code: undefined
```

**Causa:** Token JWT não existe ou expirou (7 dias).

---

## ⚡ SOLUÇÃO IMEDIATA

### Opção 1: Fazer Login Novamente (Recomendado)

1. **Limpe o token antigo:**
   - Abra o Console (F12)
   - Cole e execute:
   ```javascript
   localStorage.clear();
   console.log('✅ Storage limpo!');
   ```

2. **Recarregue a página:**
   - Pressione **Ctrl+Shift+R** (ou Cmd+Shift+R no Mac)
   - Isso força reload sem cache

3. **Faça login novamente:**
   - Email: `feliphe@nextplan.tec.br`
   - Senha: `Teikei9@`

4. **Verifique o token:**
   - Após login, abra Console (F12)
   - Execute:
   ```javascript
   const token = localStorage.getItem('token');
   console.log('Token:', token ? '✅ OK' : '❌ MISSING');
   console.log('Preview:', token?.substring(0, 50));
   ```

5. **Teste novamente o QR Code:**
   - Vá em: Configurações → WhatsApp
   - Clique no ícone 📱 (QR Code)

---

### Opção 2: Fazer Login via Console (Se a tela de login não aparecer)

Cole no Console (F12):

```javascript
// 1. Limpar storage
localStorage.clear();

// 2. Fazer login
fetch('https://atendimento.nextplan.tec.br/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'feliphe@nextplan.tec.br',
    password: 'Teikei9@'
  })
})
.then(r => r.json())
.then(data => {
  if (data.token) {
    localStorage.setItem('token', data.token);
    console.log('✅ Login OK! Token salvo.');
    console.log('Recarregue a página (Ctrl+Shift+R)');
  } else {
    console.error('❌ Erro no login:', data);
  }
})
.catch(err => console.error('❌ Erro:', err));
```

Depois recarregue a página: **Ctrl+Shift+R**

---

## 🧪 VERIFICAÇÃO COMPLETA

Após fazer login, execute este teste completo no Console:

```javascript
console.clear();
console.log('=== TESTE COMPLETO DE QR CODE ===\n');

// 1. Verificar token
const token = localStorage.getItem('token');
console.log('1️⃣ Token:', token ? '✅ Existe' : '❌ Missing');

if (!token) {
  console.error('❌ Token não encontrado. Faça login primeiro!');
} else {
  console.log('   Preview:', token.substring(0, 50) + '...\n');

  // 2. Testar health check
  console.log('2️⃣ Testando health check...');
  fetch('https://atendimento.nextplan.tec.br/api/health')
    .then(r => r.json())
    .then(data => {
      console.log('   ✅ Backend:', data.status);
      console.log('   ✅ Database:', data.database);
      console.log('');
      
      // 3. Testar autenticação
      console.log('3️⃣ Testando autenticação...');
      return fetch('https://atendimento.nextplan.tec.br/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    })
    .then(r => {
      if (r.status === 401) {
        throw new Error('Token inválido ou expirado');
      }
      return r.json();
    })
    .then(userData => {
      console.log('   ✅ Usuário:', userData.user?.email);
      console.log('   ✅ Role:', userData.user?.role);
      console.log('   ✅ Company:', userData.user?.company_id);
      console.log('');
      
      // 4. Listar instâncias WhatsApp
      console.log('4️⃣ Listando instâncias WhatsApp...');
      return fetch('https://atendimento.nextplan.tec.br/api/whatsapp/config', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    })
    .then(r => r.json())
    .then(data => {
      const count = data.instances?.length || 0;
      console.log(`   ℹ️  Total de instâncias: ${count}`);
      
      if (count === 0) {
        console.log('   ⚠️  Nenhuma instância cadastrada');
        console.log('   ➡️  Clique em "Nova Instância" para criar uma');
        console.log('');
        return null;
      }
      
      console.log('');
      data.instances.forEach((inst, i) => {
        console.log(`   Instância ${i+1}:`);
        console.log(`     - ID: ${inst.id}`);
        console.log(`     - Nome: ${inst.instance_name}`);
        console.log(`     - Número: ${inst.phone_number}`);
        console.log(`     - Status: ${inst.status}`);
        console.log(`     - Ativo: ${inst.is_active ? 'Sim' : 'Não'}`);
        console.log('');
      });
      
      return data.instances[0];
    })
    .then(instance => {
      if (!instance) {
        console.log('⚠️  Crie uma instância WhatsApp antes de testar o QR Code');
        return;
      }
      
      // 5. Testar geração de QR Code
      console.log('5️⃣ Testando geração de QR Code...');
      console.log(`   Gerando QR para: ${instance.instance_name}`);
      
      return fetch(`https://atendimento.nextplan.tec.br/api/whatsapp/config/${instance.id}/qrcode`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(r => {
        console.log(`   Status: ${r.status}`);
        if (!r.ok) {
          return r.json().then(err => {
            throw new Error(JSON.stringify(err));
          });
        }
        return r.json();
      })
      .then(qrData => {
        console.log('   ✅ QR Code gerado com sucesso!');
        console.log(`   - Status: ${qrData.status}`);
        console.log(`   - Expira em: ${qrData.expires_at}`);
        console.log(`   - QR Code length: ${qrData.qr_code?.length || 0} chars`);
        console.log(`   - Starts with: ${qrData.qr_code?.substring(0, 30)}...`);
        console.log('');
        
        // Testar se a imagem é válida
        const img = new Image();
        img.onload = () => {
          console.log('   ✅ Imagem QR Code válida!');
          console.log(`   - Dimensões: ${img.width}x${img.height}px`);
          console.log('');
          console.log('═══════════════════════════════════════');
          console.log('✅ TODOS OS TESTES PASSARAM!');
          console.log('═══════════════════════════════════════');
          console.log('');
          console.log('🎯 Próximo passo:');
          console.log('   1. Vá em: Configurações → WhatsApp');
          console.log('   2. Clique no ícone 📱 (QR Code)');
          console.log('   3. O modal deve abrir com o QR Code');
        };
        img.onerror = () => {
          console.error('   ❌ Imagem QR Code inválida!');
        };
        img.src = qrData.qr_code;
      });
    })
    .catch(err => {
      console.error('\n❌ ERRO:', err.message);
      console.log('');
      console.log('📝 Possíveis soluções:');
      console.log('   1. Token expirado → Faça logout e login novamente');
      console.log('   2. Backend offline → Verifique: pm2 status govchat-backend');
      console.log('   3. Tabela não existe → Execute: ./run-migration.sh');
      console.log('   4. Backend não compilado → Execute: npm run build no backend');
    });
}
```

---

## 📊 Resultado Esperado

```
=== TESTE COMPLETO DE QR CODE ===

1️⃣ Token: ✅ Existe
   Preview: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQ...

2️⃣ Testando health check...
   ✅ Backend: healthy
   ✅ Database: connected

3️⃣ Testando autenticação...
   ✅ Usuário: feliphe@nextplan.tec.br
   ✅ Role: admin
   ✅ Company: xxx-xxx-xxx

4️⃣ Listando instâncias WhatsApp...
   ℹ️  Total de instâncias: 1

   Instância 1:
     - ID: abc-123-def
     - Nome: WhatsApp Principal
     - Número: 5511999999999
     - Status: disconnected
     - Ativo: Sim

5️⃣ Testando geração de QR Code...
   Gerando QR para: WhatsApp Principal
   Status: 200
   ✅ QR Code gerado com sucesso!
   - Status: connecting
   - Expira em: 2026-02-19T15:30:00.000Z
   - QR Code length: 5432 chars
   - Starts with: data:image/png;base64,iVBOR...
   
   ✅ Imagem QR Code válida!
   - Dimensões: 300x300px

═══════════════════════════════════════
✅ TODOS OS TESTES PASSARAM!
═══════════════════════════════════════

🎯 Próximo passo:
   1. Vá em: Configurações → WhatsApp
   2. Clique no ícone 📱 (QR Code)
   3. O modal deve abrir com o QR Code
```

---

## 🔍 Possíveis Erros e Soluções

### ❌ Erro: Token inválido ou expirado
```
❌ ERRO: Token inválido ou expirado
```
**Solução:** Execute a Opção 1 ou 2 acima (limpar e fazer login)

---

### ❌ Erro: 500 Internal Server Error
```
❌ ERRO: {"error": "Failed to get QR Code"}
```
**Solução no VPS:**
```bash
cd /var/www/govchat/backend
npm install qrcode @types/qrcode
npm run build
pm2 restart govchat-backend
```

---

### ❌ Erro: Backend offline
```
❌ ERRO: Failed to fetch
```
**Solução no VPS:**
```bash
pm2 restart govchat-backend
pm2 logs govchat-backend
```

---

### ⚠️ Aviso: Nenhuma instância cadastrada
```
⚠️ Nenhuma instância cadastrada
➡️ Clique em "Nova Instância" para criar uma
```
**Solução:**
1. Vá em: Configurações → WhatsApp
2. Clique em: "Nova Instância"
3. Preencha:
   - Nome: WhatsApp Principal
   - Número: 5511999999999
4. Clique em: "Criar"
5. Teste o QR Code novamente

---

## 📋 Checklist Final

- [ ] Executou `localStorage.clear()` no console
- [ ] Recarregou a página (Ctrl+Shift+R)
- [ ] Fez login com: feliphe@nextplan.tec.br / Teikei9@
- [ ] Token existe no localStorage
- [ ] Executou o teste completo no console
- [ ] Todos os testes passaram (✅)
- [ ] Instância WhatsApp cadastrada
- [ ] Clicou no ícone de QR Code
- [ ] Modal abriu com QR Code visível

---

## 🎯 Resumo

**Problema:** Token JWT expirado (401 Unauthorized)  
**Solução:** Limpar localStorage + Fazer login novamente  
**Tempo:** 1 minuto  
**Teste:** Script completo no console do navegador  

---

**🔴 AÇÃO IMEDIATA:**

1. **Console (F12):** `localStorage.clear();`
2. **Recarregar:** Ctrl+Shift+R
3. **Login:** feliphe@nextplan.tec.br / Teikei9@
4. **Console:** Execute o teste completo acima
5. **Interface:** Configurações → WhatsApp → Clique 📱

---

**Versão:** 2.1.3  
**Data:** 2026-02-19  
**Status:** ✅ SOLUÇÃO IDENTIFICADA - TOKEN MISSING
