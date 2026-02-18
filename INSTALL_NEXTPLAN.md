# 🚀 GovChat NextPlan - Instalação Personalizada

## ⚡ Instalação Rápida

```bash
curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install-nextplan.sh | sudo bash
```

**Tempo de instalação:** ~15 minutos

---

## 📋 Configurações Pré-definidas

### Domínio
- **URL:** `https://atendimento.nextplan.tec.br`

### Empresa
- **Nome:** NextPlan Tecnologia
- **Slug:** nextplan
- **Plano:** Enterprise
- **Usuários:** Até 100
- **IA:** 50.000 interações/mês
- **Créditos:** R$ 100.000,00

### Superadmin
- **Email:** `feliphe@nextplan.tec.br`
- **Senha:** `Admin@2026`
- **Nome:** Felipe NextPlan

### Banco de Dados
- **Nome:** `govchat_nextplan`
- **Usuário:** `govchat_user`
- **Senha:** Gerada automaticamente
- **Host:** `localhost:5432`

---

## 🎯 O que o Script Faz

1. ✅ Instala e configura PostgreSQL 14+
2. ✅ Cria banco de dados `govchat_nextplan`
3. ✅ Aplica todas as migrações (30+ tabelas)
4. ✅ Cria empresa "NextPlan Tecnologia"
5. ✅ Cria superadmin automaticamente
6. ✅ Cria setor "Atendimento Geral"
7. ✅ Configura Nginx para domínio NextPlan
8. ✅ Configura SSL com Let's Encrypt
9. ✅ Gera build de produção
10. ✅ Cria comandos globais (update, backup)

---

## 🔐 Credenciais de Acesso

Após a instalação, acesse:

**URL:** https://atendimento.nextplan.tec.br

**Login:**
- Email: `feliphe@nextplan.tec.br`
- Senha: `Admin@2026`

⚠️ **IMPORTANTE:** Troque a senha após o primeiro acesso!

---

## 📁 Arquivos Importantes

### Credenciais
Todas as credenciais são salvas em:
```
/var/www/govchat/NEXTPLAN_CREDENTIALS.txt
```

### Configuração
```
/var/www/govchat/.env
```

### Logs
```
/var/log/nginx/nextplan_access.log
/var/log/nginx/nextplan_error.log
```

---

## 🔧 Comandos Úteis

### Gerenciamento do Sistema
```bash
# Atualizar sistema
govchat-update

# Backup do banco
govchat-backup-db

# Monitorar sistema
cd /var/www/govchat && ./scripts/monitor.sh

# Ver logs
sudo tail -f /var/log/nginx/nextplan_error.log
```

### PostgreSQL
```bash
# Acessar banco
sudo -u postgres psql govchat_nextplan

# Status
sudo systemctl status postgresql

# Reiniciar
sudo systemctl restart postgresql
```

### Nginx
```bash
# Status
sudo systemctl status nginx

# Recarregar
sudo systemctl reload nginx

# Testar configuração
sudo nginx -t
```

### SSL
```bash
# Renovar certificado
sudo certbot renew

# Reconfigurar SSL
sudo certbot --nginx -d atendimento.nextplan.tec.br
```

---

## 💾 Backup Automático

### Configurar Cron

```bash
# Editar crontab
crontab -e

# Backup diário às 2h da manhã
0 2 * * * /usr/local/bin/govchat-backup-db >> /var/log/govchat-backup.log 2>&1
```

### Backups Salvos Em
```
/var/backups/govchat/
```

### Restaurar Backup
```bash
cd /var/www/govchat
./scripts/restore-database.sh /var/backups/govchat/govchat_YYYYMMDD_HHMMSS.sql.gz
```

---

## 🔒 Segurança

### Trocar Senhas

#### Senha do Superadmin
1. Acesse: https://atendimento.nextplan.tec.br
2. Faça login
3. Vá em Perfil > Configurações
4. Altere a senha

#### Senha do Banco
```bash
# Conectar ao PostgreSQL
sudo -u postgres psql

# Alterar senha
ALTER USER govchat_user WITH PASSWORD 'nova_senha_segura';

# Atualizar .env
nano /var/www/govchat/.env
# Alterar DB_PASSWORD
```

### Firewall
```bash
# Verificar regras
sudo ufw status

# Permitir apenas portas necessárias
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 📊 Primeiros Passos

1. **Acesse o sistema**
   ```
   https://atendimento.nextplan.tec.br
   ```

2. **Faça login**
   - Email: feliphe@nextplan.tec.br
   - Senha: Admin@2026

3. **Troque a senha**
   - Perfil > Configurações > Alterar Senha

4. **Configure usuários**
   - Configurações > Usuários > Adicionar

5. **Configure setores**
   - Configurações > Setores > Gerenciar

6. **Configure WhatsApp**
   - Configurações > WhatsApp > Adicionar Conexão

7. **Configure IA**
   - Configurações > IA > Configurar Provider

---

## 🚨 Troubleshooting

### Site não carrega

```bash
# Verificar Nginx
sudo systemctl status nginx
sudo nginx -t

# Ver logs
sudo tail -f /var/log/nginx/nextplan_error.log

# Reiniciar
sudo systemctl restart nginx
```

### Login não funciona

```bash
# Verificar banco
sudo -u postgres psql govchat_nextplan -c "SELECT email FROM auth.users;"

# Verificar tabelas
sudo -u postgres psql govchat_nextplan -c "\dt"
```

### SSL não funciona

```bash
# Verificar certificado
sudo certbot certificates

# Reconfigurar
sudo certbot --nginx -d atendimento.nextplan.tec.br
```

### Banco de dados

```bash
# Status
sudo systemctl status postgresql

# Ver conexões
sudo -u postgres psql govchat_nextplan -c "SELECT * FROM pg_stat_activity WHERE datname='govchat_nextplan';"

# Otimizar
sudo -u postgres psql govchat_nextplan -c "VACUUM ANALYZE;"
```

---

## 📞 Suporte

### Documentação
- [Guia PostgreSQL](docs/DEPLOY_POSTGRESQL.md)
- [Guia Completo VPS](docs/DEPLOY_VPS.md)
- [Scripts](scripts/README.md)

### Contato
- Email: feliphe@nextplan.tec.br
- Issues: [GitHub](https://github.com/feliphemelo/govconnect-hub/issues)

---

## 🎉 Instalação Completa!

O sistema está pronto para uso em produção!

**Acesse agora:** https://atendimento.nextplan.tec.br

---

**NextPlan Tecnologia - Soluções de Atendimento ao Cidadão** 🚀
