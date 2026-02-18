# ⚡ Instalação NextPlan - Guia Rápido

## 🎯 Instalação em 3 Passos (5 minutos)

### 1️⃣ Conectar na VPS
```bash
ssh root@seu-ip-vps
```

### 2️⃣ Instalar o Sistema

**Opção A: Download Direto** (SEMPRE FUNCIONA) ✅
```bash
wget https://github.com/feliphemelo/govconnect-hub/raw/main/install-nextplan.sh
chmod +x install-nextplan.sh
sudo ./install-nextplan.sh
```

**Opção B: One-Liner** (pode ter delay de cache)
```bash
curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install-nextplan.sh | sudo bash
```

### 3️⃣ Aguardar Instalação (≈15 minutos)

O instalador vai:
- ✅ Atualizar Ubuntu
- ✅ Instalar Node.js v20
- ✅ Instalar PostgreSQL 14
- ✅ Instalar Nginx + SSL
- ✅ Criar banco de dados
- ✅ Criar empresa NextPlan
- ✅ Criar superadmin
- ✅ Configurar firewall
- ✅ Gerar certificado SSL

---

## 🔐 Credenciais Pré-Configuradas

| Item | Valor |
|------|-------|
| **URL** | https://atendimento.nextplan.tec.br |
| **Email** | feliphe@nextplan.tec.br |
| **Senha** | Admin@2026 |
| **Empresa** | NextPlan Tecnologia |
| **Plano** | Enterprise |

---

## 📋 Pós-Instalação

### Ver Credenciais do Banco
```bash
cat /var/www/govchat/NEXTPLAN_CREDENTIALS.txt
```

### Acessar o Sistema
1. Abrir: https://atendimento.nextplan.tec.br
2. Login: `feliphe@nextplan.tec.br`
3. Senha: `Admin@2026`
4. ⚠️ **ALTERAR SENHA** no primeiro acesso!

---

## 🔧 Comandos Úteis

### Atualizar Sistema
```bash
govchat-update
```

### Backup do Banco
```bash
govchat-backup-db
```

### Monitorar Sistema
```bash
cd /var/www/govchat
./scripts/monitor.sh
```

### Ver Logs
```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/govchat_error.log

# Logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Status dos Serviços
```bash
# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql

# Disco
df -h

# Memória
free -h
```

---

## 🌐 Requisitos de DNS

Antes de instalar, configure o DNS:

```
Tipo: A
Nome: atendimento.nextplan
Valor: SEU-IP-VPS
TTL: 300
```

**Verificar DNS:**
```bash
nslookup atendimento.nextplan.tec.br
# ou
dig atendimento.nextplan.tec.br
```

---

## ⚠️ Resolução de Problemas

### Erro 404 ao baixar
```bash
# Use o método de download direto (wget)
wget https://github.com/feliphemelo/govconnect-hub/raw/main/install-nextplan.sh
chmod +x install-nextplan.sh
sudo ./install-nextplan.sh
```

### SSL não gerado
```bash
# Verificar DNS
nslookup atendimento.nextplan.tec.br

# Gerar SSL manualmente
sudo certbot --nginx -d atendimento.nextplan.tec.br
```

### Erro de permissão
```bash
# Executar com sudo
sudo bash install-nextplan.sh
```

### PostgreSQL não inicia
```bash
# Ver logs
sudo journalctl -u postgresql -n 50

# Reiniciar
sudo systemctl restart postgresql
```

---

## 📞 Suporte

- 📚 [Documentação Completa](INSTALL_NEXTPLAN.md)
- 🔧 [Guia de Troubleshooting](INSTALL_NEXTPLAN_FIX.md)
- 🗂️ [Deploy PostgreSQL](docs/DEPLOY_POSTGRESQL.md)
- 🚀 [Deploy VPS](docs/DEPLOY_VPS.md)

---

## 🎉 Pronto!

Após a instalação, o sistema estará disponível em:

**🌐 https://atendimento.nextplan.tec.br**

**Bom atendimento!** 🏛️✨
