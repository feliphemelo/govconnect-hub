# 🔍 Troubleshooting - Site Não Abre

## ✅ Instalação Funcionou!

Se você viu as mensagens de sucesso, o instalador está funcionando. Agora vamos resolver o acesso ao site.

---

## 📋 Checklist Pós-Instalação

### 1️⃣ **Aguardar Instalação Completa**

⏱️ Aguarde até ver a mensagem final:
```
========================================
  INSTALACAO CONCLUIDA COM SUCESSO!
========================================
```

---

### 2️⃣ **Verificar DNS**

O DNS PRECISA estar configurado ANTES de gerar o SSL:

```bash
# Verificar DNS
nslookup atendimento.nextplan.tec.br

# Deve retornar o IP da VPS
```

**Se o DNS não estiver configurado:**
- Configure agora no seu provedor de domínio
- Aguarde propagação (~5 minutos)
- Execute novamente a parte do SSL:
  ```bash
  sudo certbot --nginx -d atendimento.nextplan.tec.br
  ```

---

### 3️⃣ **Verificar Serviços**

```bash
# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql

# Se algum não estiver rodando:
sudo systemctl start nginx
sudo systemctl start postgresql
```

---

### 4️⃣ **Verificar Build**

```bash
# Verificar se o build foi gerado
ls -lh /var/www/govchat/dist/

# Deve mostrar:
# - index.html
# - assets/ (com arquivos .js e .css)
```

**Se não houver dist/:**
```bash
cd /var/www/govchat
npm run build
```

---

### 5️⃣ **Verificar Nginx**

```bash
# Ver configuração
cat /etc/nginx/sites-enabled/govchat

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

### 6️⃣ **Verificar Logs**

```bash
# Logs do Nginx
sudo tail -100 /var/log/nginx/govchat_error.log
sudo tail -100 /var/log/nginx/govchat_access.log

# Logs do sistema
sudo journalctl -u nginx -n 50
```

---

### 7️⃣ **Testar Acesso Local**

```bash
# Teste local (deve retornar HTML)
curl -I http://localhost

# Se funcionar localmente mas não externamente:
# - Problema é DNS ou Firewall
```

---

## 🔧 Soluções Comuns

### ❌ **Problema: DNS não propagou**

**Sintoma:** `nslookup` não retorna o IP da VPS

**Solução:**
1. Configurar DNS no provedor:
   ```
   Tipo: A
   Nome: atendimento.nextplan
   Valor: <IP-DA-VPS>
   TTL: 300
   ```
2. Aguardar 5-10 minutos
3. Testar novamente: `nslookup atendimento.nextplan.tec.br`

---

### ❌ **Problema: SSL não foi gerado**

**Sintoma:** Site acessível via HTTP mas não HTTPS

**Solução:**
```bash
# Gerar SSL manualmente
sudo certbot --nginx -d atendimento.nextplan.tec.br

# Verificar certificado
sudo certbot certificates
```

---

### ❌ **Problema: Nginx não iniciou**

**Sintoma:** `systemctl status nginx` mostra "failed"

**Solução:**
```bash
# Ver erro detalhado
sudo journalctl -u nginx -n 50

# Testar configuração
sudo nginx -t

# Corrigir se houver erro de sintaxe
# Reiniciar
sudo systemctl restart nginx
```

---

### ❌ **Problema: Build não foi gerado**

**Sintoma:** Pasta `/var/www/govchat/dist/` vazia ou inexistente

**Solução:**
```bash
cd /var/www/govchat
npm run build

# Verificar
ls -lh dist/
```

---

### ❌ **Problema: Firewall bloqueando**

**Sintoma:** Site não acessível externamente mas funciona localmente

**Solução:**
```bash
# Verificar firewall
sudo ufw status

# Permitir HTTP e HTTPS
sudo ufw allow 'Nginx Full'

# Recarregar
sudo ufw reload
```

---

## 🎯 Acesso Após Resolução

Após resolver o problema:

1. **URL**: https://atendimento.nextplan.tec.br
2. **Email**: feliphe@nextplan.tec.br
3. **Senha**: Admin@2026

⚠️ **Alterar senha no primeiro acesso!**

---

## 📞 Comandos Úteis

```bash
# Ver credenciais do banco
cat /var/www/govchat/NEXTPLAN_CREDENTIALS.txt

# Atualizar sistema
govchat-update

# Backup do banco
govchat-backup-db

# Monitorar sistema
cd /var/www/govchat && ./scripts/monitor.sh

# Reiniciar tudo
sudo systemctl restart nginx postgresql
```

---

## 🆘 Última Solução

Se nada funcionar, reinstale:

```bash
# Remover instalação anterior
sudo rm -rf /var/www/govchat
sudo -u postgres psql -c "DROP DATABASE IF EXISTS govchat_nextplan;"
sudo -u postgres psql -c "DROP USER IF EXISTS govchat_user;"

# Reinstalar
wget https://github.com/feliphemelo/govconnect-hub/raw/main/install-nextplan.sh
chmod +x install-nextplan.sh
sudo ./install-nextplan.sh
```

---

## ✅ Checklist Final

- [ ] DNS configurado e propagado
- [ ] Instalação completa (mensagem final apareceu)
- [ ] Nginx rodando (`systemctl status nginx`)
- [ ] PostgreSQL rodando (`systemctl status postgresql`)
- [ ] Build gerado (`ls /var/www/govchat/dist/`)
- [ ] SSL gerado (`certbot certificates`)
- [ ] Firewall permite HTTP/HTTPS (`ufw status`)
- [ ] Site acessível: https://atendimento.nextplan.tec.br

---

**Boa sorte!** 🚀
