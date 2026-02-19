# 🔧 Corrigir Erro 500 - WhatsApp Settings

## ❌ Problema
- Erro 500 ao acessar Settings → WhatsApp
- Mensagem: `Failed to load resource: the server responded with a status of 500`
- Causa: Tabela `whatsapp_instances` não existe no banco de dados

---

## ✅ Solução (Na VPS)

### Opção 1: Usar script automático (Recomendado)

```bash
cd /var/www/govchat
git pull origin main
./run-migration.sh
```

**Tempo**: ~10 segundos  
**Resultado**: Tabela criada + Backend reiniciado

---

### Opção 2: Executar SQL manualmente

```bash
cd /var/www/govchat
git pull origin main
sudo -u postgres psql -d govchat_nextplan -f create_whatsapp_table.sql
pm2 restart govchat-backend
```

---

## 🧪 Verificar Correção

1. **No navegador** (modo anônimo):
   - Login: https://atendimento.nextplan.tec.br
   - Menu → Settings → WhatsApp
   - **Deve carregar sem erro 500** ✅

2. **Verificar tabela no banco**:
```bash
sudo -u postgres psql -d govchat_nextplan -c "\dt whatsapp_instances"
```

**Resultado esperado**:
```
             List of relations
 Schema |        Name         | Type  |     Owner     
--------+---------------------+-------+---------------
 public | whatsapp_instances  | table | govchat_user
```

---

## 📋 O que a migração cria

### Tabela: `whatsapp_instances`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Chave primária |
| company_id | UUID | Empresa dona da instância |
| instance_name | VARCHAR | Nome da instância |
| phone_number | VARCHAR | Número WhatsApp |
| api_key | TEXT | Chave API (opcional) |
| webhook_url | TEXT | URL do webhook (opcional) |
| status | VARCHAR | Status: connected/disconnected/connecting |
| is_active | BOOLEAN | Ativo/Inativo |
| qr_code | TEXT | QR Code para conexão |
| session_data | JSONB | Dados da sessão WhatsApp |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

### Constraints
- **Primary Key**: id
- **Foreign Key**: company_id → companies(id)
- **Unique**: (company_id, phone_number) - Evita duplicação

### Indexes
- `idx_whatsapp_instances_company_id` - Busca por empresa
- `idx_whatsapp_instances_status` - Busca por status

---

## 🔄 Depois da Migração

### Testar CRUD Completo

1. **Criar instância**:
   - Nome: "WhatsApp Principal"
   - Número: 5511999999999

2. **Editar instância**:
   - Alterar nome ou adicionar API Key

3. **Ativar/Desativar**:
   - Toggle do switch

4. **Deletar instância**:
   - Confirmar exclusão

---

## 🚨 Troubleshooting

### Erro: "relation already exists"
```bash
# Ignorar - tabela já existe, tudo OK!
```

### Erro: "permission denied"
```bash
# Executar com sudo
sudo -u postgres psql -d govchat_nextplan -f create_whatsapp_table.sql
```

### Backend ainda dá erro 500
```bash
# Verificar logs
pm2 logs govchat-backend --lines 20

# Reiniciar backend
pm2 restart govchat-backend
```

### Erro: "database does not exist"
```bash
# Verificar nome do banco
sudo -u postgres psql -l | grep govchat

# Se necessário, ajustar nome do banco no script
```

---

## ✅ Resultado Final

Após executar a migração:
- ✅ Settings → WhatsApp **funciona**
- ✅ Pode criar/editar/deletar instâncias
- ✅ Tabela no banco criada
- ✅ Backend sem erros
- ✅ Nenhum erro 500 no console

---

## 📝 Commits Relacionados

| Commit | Descrição |
|--------|-----------|
| `7111ff1` | Implementa WhatsApp settings (frontend + backend) |
| `793d9f8` | Adiciona migração SQL da tabela |

**Repositório**: https://github.com/feliphemelo/govconnect-hub  
**Arquivo SQL**: https://github.com/feliphemelo/govconnect-hub/blob/main/create_whatsapp_table.sql

---

**Atualizado**: 2026-02-19  
**Versão**: 2.1.1
