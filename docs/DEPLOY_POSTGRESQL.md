# 🐘 Deploy com PostgreSQL Local - GovChat

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Instalação Rápida](#instalação-rápida)
3. [O que é Instalado](#o-que-é-instalado)
4. [Gerenciamento do Banco](#gerenciamento-do-banco)
5. [Backup e Restauração](#backup-e-restauração)
6. [Migração de Supabase para PostgreSQL Local](#migração)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Esta versão do instalador configura o GovChat com **PostgreSQL rodando localmente na VPS**, ao invés de usar o Supabase Cloud.

### Vantagens do PostgreSQL Local

✅ **Controle Total**: Você possui e controla completamente o banco de dados
✅ **Sem Custos Cloud**: Não paga por serviços de banco gerenciado
✅ **Performance**: Banco local na mesma VPS (menor latência)
✅ **Privacidade**: Dados ficam 100% na sua infraestrutura
✅ **Backups Locais**: Controle completo sobre backups

### Diferenças da Versão Supabase

| Recurso | Supabase Cloud | PostgreSQL Local |
|---------|----------------|------------------|
| Banco de Dados | ✅ Gerenciado | ✅ Auto-gerenciado |
| Autenticação | ✅ Supabase Auth | ⚠️ Implementação custom |
| Storage | ✅ Supabase Storage | ⚠️ Filesystem local |
| Edge Functions | ✅ Deno | ⚠️ API local (Node.js) |
| Backups | ✅ Automático | 🔧 Manual/Cron |
| Escalabilidade | ✅ Automática | 🔧 Manual |
| Custo | 💰 Pago | 💰 Apenas VPS |

---

## 🚀 Instalação Rápida

### Instalação com 1 Comando

```bash
curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install-local-db.sh | sudo bash
```

### Com Domínio (Recomendado)

```bash
curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install-local-db.sh | sudo bash -s seu-dominio.gov.br
```

**Tempo de instalação:** ~15 minutos

---

## 📦 O que é Instalado

O instalador configura automaticamente:

### 1. PostgreSQL 14+ (ou última versão disponível)
- Banco de dados: `govchat`
- Usuário: `govchat_user`
- Senha: Gerada automaticamente (25 caracteres)
- Porta: 5432 (localhost)

### 2. Estrutura do Banco
- 30+ tabelas criadas automaticamente
- Todas as migrações aplicadas
- Triggers e functions configurados
- Índices otimizados

### 3. Variáveis de Ambiente (`.env`)
```env
DATABASE_URL="postgresql://govchat_user:SENHA@localhost:5432/govchat"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="govchat"
DB_USER="govchat_user"
DB_PASSWORD="senha_gerada_automaticamente"
JWT_SECRET="chave_secreta_gerada"
```

### 4. Comandos Globais
- `govchat-update` - Atualizar sistema
- `govchat-backup-db` - Backup do banco

### 5. Sistema Completo
- Node.js v20
- Nginx configurado
- SSL (se domínio fornecido)
- Firewall (UFW)

---

## 🗄️ Gerenciamento do Banco

### Acessar PostgreSQL

```bash
# Como usuário postgres
sudo -u postgres psql govchat

# Como usuário da aplicação
PGPASSWORD=sua_senha psql -h localhost -U govchat_user -d govchat
```

### Listar Tabelas

```sql
\dt
```

### Ver Estrutura de uma Tabela

```sql
\d nome_da_tabela
```

### Executar Query

```sql
SELECT * FROM companies LIMIT 10;
```

### Verificar Tamanho do Banco

```sql
SELECT pg_size_pretty(pg_database_size('govchat'));
```

### Verificar Conexões Ativas

```sql
SELECT * FROM pg_stat_activity WHERE datname = 'govchat';
```

---

## 💾 Backup e Restauração

### Backup Manual

```bash
# Comando global (recomendado)
govchat-backup-db

# Ou manualmente
cd /var/www/govchat
./scripts/backup-database.sh
```

**Backups são salvos em:** `/var/backups/govchat/`

### Backup Automático (Cron)

```bash
# Editar crontab
crontab -e

# Backup diário às 2h da manhã
0 2 * * * /usr/local/bin/govchat-backup-db >> /var/log/govchat-backup.log 2>&1

# Backup a cada 6 horas
0 */6 * * * /usr/local/bin/govchat-backup-db >> /var/log/govchat-backup.log 2>&1
```

### Restaurar Backup

```bash
cd /var/www/govchat

# Listar backups disponíveis
ls -lh /var/backups/govchat/

# Restaurar backup específico
./scripts/restore-database.sh /var/backups/govchat/govchat_20240118_140000.sql.gz
```

**⚠️ ATENÇÃO:** A restauração sobrescreve o banco atual!

### Backup Remoto (Recomendado para Produção)

```bash
# Backup e enviar para servidor remoto via SCP
govchat-backup-db
scp /var/backups/govchat/govchat_$(date +%Y%m%d)*.sql.gz usuario@servidor-backup:/backups/

# Ou usar rsync
rsync -avz /var/backups/govchat/ usuario@servidor-backup:/backups/govchat/
```

---

## 🔄 Migração

### Migrar de Supabase para PostgreSQL Local

#### Passo 1: Exportar Dados do Supabase

```bash
# No seu computador local
npx supabase db dump -f supabase_backup.sql

# Ou via dashboard Supabase
# Database > Backups > Download
```

#### Passo 2: Transferir para VPS

```bash
scp supabase_backup.sql usuario@sua-vps:/tmp/
```

#### Passo 3: Importar no PostgreSQL Local

```bash
# Na VPS
cd /var/www/govchat
source .env

# Importar dados
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -f /tmp/supabase_backup.sql
```

#### Passo 4: Atualizar Aplicação

As variáveis de ambiente já estão configuradas para usar o PostgreSQL local.

---

## 🔧 Comandos Úteis

### PostgreSQL

```bash
# Status do serviço
sudo systemctl status postgresql

# Reiniciar
sudo systemctl restart postgresql

# Ver logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Verificar versão
psql --version
```

### Otimização

```bash
# Vacuum (limpeza e otimização)
sudo -u postgres psql -d govchat -c "VACUUM ANALYZE;"

# Reindexar banco
sudo -u postgres psql -d govchat -c "REINDEX DATABASE govchat;"
```

### Monitoramento

```bash
# Tamanho do banco
sudo -u postgres psql -d govchat -c "SELECT pg_size_pretty(pg_database_size('govchat'));"

# Tabelas maiores
sudo -u postgres psql -d govchat -c "
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;"
```

---

## 🚨 Troubleshooting

### Erro: "psql: FATAL: authentication failed"

```bash
# Verificar senha no .env
cat /var/www/govchat/.env | grep DB_PASSWORD

# Resetar senha do usuário
sudo -u postgres psql -c "ALTER USER govchat_user WITH PASSWORD 'nova_senha';"

# Atualizar .env com nova senha
nano /var/www/govchat/.env
```

### Erro: "could not connect to server"

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Iniciar se necessário
sudo systemctl start postgresql

# Ver logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Banco está lento

```bash
# Otimizar banco
sudo -u postgres psql -d govchat -c "VACUUM FULL ANALYZE;"

# Verificar queries lentas
sudo -u postgres psql -d govchat -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds';"
```

### Disco cheio

```bash
# Verificar tamanho do banco
sudo du -sh /var/lib/postgresql/

# Limpar logs antigos
sudo journalctl --vacuum-time=7d

# Limpar backups antigos
cd /var/backups/govchat
ls -t govchat_*.sql.gz | tail -n +8 | xargs rm -f
```

### Restaurar backup de segurança

Durante a restauração, um backup de segurança é criado em `/tmp/`.

```bash
# Listar backups de segurança
ls -lh /tmp/govchat_safety_*.sql.gz

# Restaurar se necessário
./scripts/restore-database.sh /tmp/govchat_safety_*.sql.gz
```

---

## 📊 Manutenção Recomendada

### Diária
- ✅ Backup automático (via cron)
- ✅ Verificar logs de erro

### Semanal
- ✅ Verificar tamanho do banco
- ✅ Limpar backups antigos
- ✅ Verificar queries lentas

### Mensal
- ✅ VACUUM ANALYZE completo
- ✅ Atualizar PostgreSQL (se disponível)
- ✅ Backup remoto/offsite
- ✅ Testar restauração de backup

---

## 🔐 Segurança

### Recomendações

1. **Trocar Senha do Banco**
   ```bash
   sudo -u postgres psql -c "ALTER USER govchat_user WITH PASSWORD 'senha_forte_aqui';"
   nano /var/www/govchat/.env  # Atualizar DB_PASSWORD
   ```

2. **Restringir Acesso Remoto**
   ```bash
   # Editar pg_hba.conf
   sudo nano /etc/postgresql/14/main/pg_hba.conf
   
   # Permitir apenas localhost
   # local   all   all   md5
   ```

3. **Firewall**
   ```bash
   # PostgreSQL deve aceitar apenas localhost
   sudo ufw deny 5432/tcp
   ```

4. **Backup Criptografado**
   ```bash
   # Backup com criptografia
   govchat-backup-db
   cd /var/backups/govchat
   gpg -c govchat_*.sql.gz  # Solicita senha
   ```

---

## 📞 Suporte

- **Guia Completo**: [docs/DEPLOY_VPS.md](DEPLOY_VPS.md)
- **Scripts**: [scripts/README.md](../scripts/README.md)
- **Issues**: [GitHub Issues](https://github.com/feliphemelo/govconnect-hub/issues)

---

## 🎉 Conclusão

Você agora tem um GovChat totalmente auto-hospedado com PostgreSQL local!

**Comandos essenciais:**

```bash
# Backup
govchat-backup-db

# Atualizar sistema
govchat-update

# Acessar banco
sudo -u postgres psql govchat

# Monitorar
cd /var/www/govchat && ./scripts/monitor.sh
```

**🐘 PostgreSQL Local - Controle Total! 💪**
