# 🔧 SOLUÇÃO: Erro "Load failed" no GovChat

## 🎯 PROBLEMA IDENTIFICADO

O sistema GovChat é **100% Supabase** (não tem backend Node.js próprio).

O erro "Load failed" acontece porque:
- ✅ Frontend está rodando (https://atendimento.nextplan.tec.br)
- ❌ Supabase não está configurado
- ❌ PostgreSQL local não pode ser usado diretamente pelo frontend

---

## ✅ SOLUÇÃO RECOMENDADA: Configurar Supabase (5 minutos)

### Passo 1: Criar conta no Supabase

1. Acesse: https://supabase.com/dashboard
2. Crie uma conta gratuita (com GitHub ou email)

### Passo 2: Criar novo projeto

1. Clique em **"New Project"**
2. Preencha:
   - **Name**: `govchat-nextplan`
   - **Database Password**: [escolha uma senha forte - ANOTE]
   - **Region**: `South America (São Paulo)`
   - **Pricing Plan**: `Free` (até 500MB, suficiente para testes)
3. Clique em **"Create new project"**
4. Aguarde ~2 minutos (criação do projeto)

### Passo 3: Copiar credenciais

Após o projeto ser criado:

1. Vá em **Settings** (⚙️) → **API**
2. Copie estas informações:
   - **Project URL**: `https://xxxxxx.supabase.co`
   - **Project API keys** → **anon public**: `eyJhbGc...`
   - **Reference ID**: `xxxxxx`

### Passo 4: Configurar no servidor

Execute na VPS (substitua pelos seus valores):

```bash
cat > /var/www/govchat/.env << 'EOF'
VITE_SUPABASE_URL=https://xxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...sua-anon-key-aqui...
VITE_SUPABASE_PROJECT_ID=xxxxxx

# Opcional (configurar depois)
VITE_GEMINI_API_KEY=AIzaSyDummyKey
VITE_NOTIFICAMEHUB_TOKEN=dummy-token
EOF

# Rebuild do frontend com as novas variáveis
cd /var/www/govchat
npm run build

# Reiniciar Nginx
sudo systemctl restart nginx

echo "✅ Configuração concluída! Teste o site novamente."
```

### Passo 5: Configurar banco de dados no Supabase

1. No painel do Supabase, vá em **SQL Editor**
2. Execute as migrations que estão em `/var/www/govchat/supabase/migrations/`

**OU** execute este comando na VPS para ver as migrations:

```bash
ls -la /var/www/govchat/supabase/migrations/
cat /var/www/govchat/supabase/migrations/*.sql
```

3. Copie e execute cada arquivo SQL no SQL Editor do Supabase

### Passo 6: Configurar autenticação

1. No Supabase, vá em **Authentication** → **URL Configuration**
2. Em **Site URL**, adicione: `https://atendimento.nextplan.tec.br`
3. Em **Redirect URLs**, adicione:
   ```
   https://atendimento.nextplan.tec.br/**
   https://atendimento.nextplan.tec.br/auth/callback
   ```

### Passo 7: Criar primeiro usuário admin

No Supabase SQL Editor, execute:

```sql
-- Criar usuário admin
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role
) VALUES (
  gen_random_uuid(),
  'feliphe@nextplan.tec.br',
  crypt('Teikei9@', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Pegar o ID do usuário
SELECT id FROM auth.users WHERE email = 'feliphe@nextplan.tec.br';

-- Criar empresa NextPlan (substitua USER_ID pelo ID acima)
INSERT INTO companies (
  id,
  name,
  slug,
  owner_id,
  plan,
  created_at
) VALUES (
  gen_random_uuid(),
  'NextPlan',
  'nextplan',
  'USER_ID_AQUI',
  'enterprise',
  now()
) ON CONFLICT (slug) DO NOTHING;
```

---

## 🎯 TESTE FINAL

1. Acesse: https://atendimento.nextplan.tec.br
2. Faça login com:
   - **Email**: feliphe@nextplan.tec.br
   - **Senha**: Teikei9@

Se funcionar: **✅ Sistema 100% operacional!**

---

## 🔧 SOLUÇÃO ALTERNATIVA: Migrar PostgreSQL Local para Supabase

Se você já tem dados no PostgreSQL local que criou:

```bash
# 1. Fazer dump do banco local
pg_dump -h localhost -U govchat_user -d govchat_nextplan > /tmp/govchat_dump.sql

# 2. Importar no Supabase via SQL Editor
# (copie o conteúdo de /tmp/govchat_dump.sql e execute no Supabase)
```

---

## ❓ DÚVIDAS COMUNS

**Q: O Supabase é gratuito?**
A: Sim! O plano free oferece:
- 500MB de banco de dados
- 50MB de storage
- 5GB de bandwidth
- 2 GB de file storage
- Suficiente para começar e testar

**Q: Posso migrar para PostgreSQL local depois?**
A: Sim, mas precisaria criar um backend Node.js (Express/Fastify) com APIs REST ou GraphQL.

**Q: O Supabase é seguro?**
A: Sim! É usado por milhares de empresas. Oferece:
- Row Level Security (RLS)
- SSL/TLS automático
- Backups automáticos
- Alta disponibilidade

---

## 📊 PRÓXIMOS PASSOS

Após configurar o Supabase:

1. ✅ Login funcionando
2. ✅ Criar setores/departamentos
3. ✅ Adicionar usuários
4. ✅ Configurar WhatsApp (Notificamehub)
5. ✅ Configurar IA (Gemini)
6. ✅ Configurar personalidades do chatbot

---

## 🆘 PROBLEMAS?

Se encontrar algum erro, execute:

```bash
# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Ver console do navegador (F12)
# Procure por erros relacionados a Supabase

# Verificar se .env está correto
cat /var/www/govchat/.env
```

E me envie a saída para diagnóstico!
