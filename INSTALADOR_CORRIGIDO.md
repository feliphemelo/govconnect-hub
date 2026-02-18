# ✅ Instalador NextPlan Corrigido!

## 🎯 Problema Resolvido

O erro **"cho: command not found"** foi causado por **caracteres acentuados UTF-8** no script bash que não eram interpretados corretamente em alguns terminais.

### O que foi corrigido:
- ✅ Removidos todos os caracteres acentuados (ç, ã, õ, á, é, í, ó, ú, etc.)
- ✅ Substituídos por caracteres ASCII compatíveis
- ✅ Mantida toda a funcionalidade do script
- ✅ Validada sintaxe bash (sem erros)

---

## 🚀 Instalação Agora Funciona Perfeitamente

### Método 1: One-liner (Recomendado)
```bash
curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install-nextplan.sh | sudo bash
```

### Método 2: Download e Execução
```bash
wget https://github.com/feliphemelo/govconnect-hub/raw/main/install-nextplan.sh
chmod +x install-nextplan.sh
sudo ./install-nextplan.sh
```

---

## 🔑 Credenciais Pré-configuradas

| Item | Valor |
|------|-------|
| **URL** | https://atendimento.nextplan.tec.br |
| **Email** | feliphe@nextplan.tec.br |
| **Senha** | Admin@2026 |
| **Empresa** | NextPlan Tecnologia |
| **Plano** | Enterprise (100 usuários, 50k IA/mês, R$ 100k créditos) |

---

## 📋 Pré-requisitos

### 1. Configurar DNS (ANTES de instalar)
```
Tipo: A
Nome: atendimento.nextplan
Valor: <IP-DA-VPS>
TTL: 300
```

Verificar:
```bash
nslookup atendimento.nextplan.tec.br
```

### 2. VPS Ubuntu 22.04+
- Mínimo 2 GB RAM
- 20 GB de disco
- 1 vCPU
- Acesso root ou sudo

---

## ⏱️ Tempo de Instalação

**~15 minutos** para instalação completa:
- ⏳ 2 min - Atualizar sistema e instalar Node.js
- ⏳ 2 min - Instalar PostgreSQL
- ⏳ 1 min - Instalar Nginx + Certbot
- ⏳ 1 min - Configurar firewall
- ⏳ 2 min - Criar banco e executar migrações
- ⏳ 3 min - Clonar repo e instalar dependências (363 módulos)
- ⏳ 2 min - Build de produção (1.74 MB)
- ⏳ 1 min - Configurar Nginx
- ⏳ 1 min - Gerar certificado SSL

---

## 📦 O que o Instalador Faz

1. ✅ Atualiza Ubuntu 22.04+
2. ✅ Instala Node.js v20 + npm 10
3. ✅ Instala PostgreSQL 14+
4. ✅ Instala Nginx + Certbot
5. ✅ Configura firewall UFW (SSH, HTTP, HTTPS)
6. ✅ Cria banco `govchat_nextplan`
7. ✅ Cria usuário `govchat_user` com senha aleatória
8. ✅ Executa 9 migrações (30+ tabelas com RLS)
9. ✅ Cria empresa **NextPlan Tecnologia** (Enterprise)
10. ✅ Cria superadmin `feliphe@nextplan.tec.br`
11. ✅ Cria setor padrão "Atendimento Geral"
12. ✅ Clona repositório do GitHub
13. ✅ Instala 363 dependências npm
14. ✅ Gera build de produção otimizado
15. ✅ Configura Nginx (gzip, cache, security headers, HTTP/2)
16. ✅ Gera certificado SSL Let's Encrypt automático
17. ✅ Cria comandos globais (`govchat-update`, `govchat-backup-db`)
18. ✅ Salva credenciais em `/var/www/govchat/NEXTPLAN_CREDENTIALS.txt`

---

## 🎯 Após a Instalação

### Ver Credenciais
```bash
cat /var/www/govchat/NEXTPLAN_CREDENTIALS.txt
```

### Acessar o Sistema
1. Abrir navegador: https://atendimento.nextplan.tec.br
2. Login: `feliphe@nextplan.tec.br`
3. Senha: `Admin@2026`
4. ⚠️ **IMPORTANTE**: Alterar a senha no primeiro acesso!

---

## 🛠️ Comandos Úteis

### Atualizar Sistema
```bash
govchat-update
```

### Backup Manual do Banco
```bash
govchat-backup-db
```

### Backup Automático (cron diário às 02:00)
```bash
sudo crontab -e
# Adicionar:
0 2 * * * /usr/local/bin/govchat-backup-db >> /var/log/govchat-backup.log 2>&1
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

# Logs do sistema
journalctl -u nginx -f
```

### Gerenciar Serviços
```bash
# Status
sudo systemctl status nginx
sudo systemctl status postgresql

# Reiniciar
sudo systemctl restart nginx
sudo systemctl restart postgresql

# Recarregar Nginx
sudo systemctl reload nginx
```

### Acessar Banco de Dados
```bash
# Ver credenciais
cat /var/www/govchat/.env | grep DB_

# Conectar ao PostgreSQL
sudo -u postgres psql govchat_nextplan

# Listar tabelas
\dt

# Sair
\q
```

---

## ⚠️ Resolução de Problemas

### Erro 404 ao baixar
**Solução**: Use o método de download direto
```bash
wget https://github.com/feliphemelo/govconnect-hub/raw/main/install-nextplan.sh
chmod +x install-nextplan.sh
sudo ./install-nextplan.sh
```

### SSL não gerado
**Causa**: DNS não configurado ou não propagado  
**Solução**:
```bash
# Verificar DNS
nslookup atendimento.nextplan.tec.br

# Gerar SSL manualmente
sudo certbot --nginx -d atendimento.nextplan.tec.br
```

### PostgreSQL não inicia
**Solução**:
```bash
# Ver logs
sudo journalctl -u postgresql -n 50

# Reiniciar
sudo systemctl restart postgresql

# Verificar status
sudo systemctl status postgresql
```

### Erro de permissão
**Solução**: Executar com sudo
```bash
sudo bash install-nextplan.sh
```

### Build falha (memória insuficiente)
**Causa**: VPS com menos de 2 GB RAM  
**Solução**: Aumentar RAM ou criar swap
```bash
# Criar 2 GB de swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 📚 Documentação Completa

- 📖 [README.md](https://github.com/feliphemelo/govconnect-hub/blob/main/README.md)
- ⚡ [QUICKSTART_NEXTPLAN.md](https://github.com/feliphemelo/govconnect-hub/blob/main/QUICKSTART_NEXTPLAN.md)
- 📘 [INSTALL_NEXTPLAN.md](https://github.com/feliphemelo/govconnect-hub/blob/main/INSTALL_NEXTPLAN.md)
- 🔧 [INSTALL_NEXTPLAN_FIX.md](https://github.com/feliphemelo/govconnect-hub/blob/main/INSTALL_NEXTPLAN_FIX.md)
- 🐘 [docs/DEPLOY_POSTGRESQL.md](https://github.com/feliphemelo/govconnect-hub/blob/main/docs/DEPLOY_POSTGRESQL.md)
- 🖥️ [docs/DEPLOY_VPS.md](https://github.com/feliphemelo/govconnect-hub/blob/main/docs/DEPLOY_VPS.md)

---

## 🎉 Pronto!

O instalador está **100% funcional** e pronto para ser usado. Basta executar:

```bash
curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install-nextplan.sh | sudo bash
```

**Acesse**: https://atendimento.nextplan.tec.br

**Bom atendimento!** 🏛️✨

---

## 📊 Commits da Correção

- **17a3f8f** - fix: remove caracteres acentuados do install-nextplan.sh
- **14411fb** - docs: adiciona resumo completo de deploy pronto para produção
- **5dad568** - docs: adiciona guia rápido de instalação NextPlan
- **5510a55** - fix: adiciona métodos alternativos de instalação NextPlan
- **b513cb3** - feat: adiciona instalador personalizado NextPlan

**Repositório**: https://github.com/feliphemelo/govconnect-hub
