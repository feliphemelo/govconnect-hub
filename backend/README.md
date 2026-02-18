# GovChat Backend API

Backend Node.js + Express + PostgreSQL para o sistema GovChat.

## 🚀 Arquitetura

```
Frontend (React/Vite) → Backend (Express/Node.js) → PostgreSQL
```

**Substituindo Supabase por backend próprio:**
- ✅ Autenticação JWT
- ✅ APIs REST para todas as entidades
- ✅ Integração com PostgreSQL local
- ✅ Row Level Security (RLS) no banco
- ✅ WebSocket para tempo real (futuro)

## 📁 Estrutura

```
backend/
├── src/
│   ├── config/         # Configurações (DB, etc)
│   ├── controllers/    # Lógica de negócio
│   ├── middleware/     # Auth, validação, etc
│   ├── routes/         # Rotas da API
│   ├── services/       # Serviços
│   ├── types/          # TypeScript types
│   ├── utils/          # Utilidades (auth, etc)
│   └── server.ts       # Servidor principal
├── migrations/         # Migrations SQL
├── package.json
└── tsconfig.json
```

## 🔧 Instalação

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
nano .env
```

Configurar:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET` (gerar com: `openssl rand -base64 32`)
- `CORS_ORIGIN` (URL do frontend)

### 3. Executar migrations

```bash
# Executar migration do schema auth
psql -h localhost -U govchat_user -d govchat_nextplan -f migrations/001_auth_schema.sql

# Executar migrations do Supabase (já existentes)
for file in ../supabase/migrations/*.sql; do
  psql -h localhost -U govchat_user -d govchat_nextplan -f "$file"
done
```

### 4. Iniciar servidor

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm run build
npm start
```

## 📡 API Endpoints

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registrar novo usuário |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Usuário atual (requer auth) |

### Companies

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/companies` | Listar companies (própria) |
| GET | `/api/companies/:id` | Detalhes da company |

### Profiles

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/profiles` | Listar profiles da empresa |
| PATCH | `/api/profiles/:id` | Atualizar profile |

### Contacts

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/contacts` | Listar contatos (paginado) |
| POST | `/api/contacts` | Criar contato |
| GET | `/api/contacts/:id` | Detalhes do contato |
| PATCH | `/api/contacts/:id` | Atualizar contato |

### Sectors

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/sectors` | Listar setores |
| POST | `/api/sectors` | Criar setor (admin) |

### Health

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Health check |

## 🔐 Autenticação

Todas as rotas (exceto `/api/auth/register`, `/api/auth/login` e `/api/health`) requerem autenticação via JWT.

**Header:**
```
Authorization: Bearer <token>
```

**Exemplo de uso:**

```javascript
// Login
const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'senha123' })
});
const { token } = await loginResponse.json();

// Usar token em requisições
const profilesResponse = await fetch('http://localhost:3001/api/profiles', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🔄 Integração com Frontend

O frontend precisa ser atualizado para usar o backend ao invés do Supabase:

### Antes (Supabase):
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.auth.signIn({ email, password });
```

### Depois (Backend):
```typescript
const response = await fetch(`${API_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { user, token } = await response.json();
localStorage.setItem('token', token);
```

## 🚀 Deploy em Produção

### 1. Build

```bash
npm run build
```

### 2. Usar PM2 (recomendado)

```bash
npm install -g pm2
pm2 start dist/server.js --name govchat-backend
pm2 save
pm2 startup
```

### 3. Nginx como proxy reverso

```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## 📊 Monitoramento

```bash
# Ver logs
pm2 logs govchat-backend

# Status
pm2 status

# Restart
pm2 restart govchat-backend
```

## 🔒 Segurança

- ✅ Helmet para headers de segurança
- ✅ CORS configurado
- ✅ Rate limiting (futuro)
- ✅ Senhas com bcrypt
- ✅ JWT para autenticação
- ✅ Input validation com Zod (futuro)
- ✅ RLS no PostgreSQL

## 📝 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NODE_ENV` | Ambiente (development/production) | development |
| `PORT` | Porta do servidor | 3001 |
| `DB_HOST` | Host do PostgreSQL | localhost |
| `DB_PORT` | Porta do PostgreSQL | 5432 |
| `DB_NAME` | Nome do banco | govchat |
| `DB_USER` | Usuário do banco | postgres |
| `DB_PASSWORD` | Senha do banco | - |
| `JWT_SECRET` | Secret para JWT | - |
| `JWT_EXPIRES_IN` | Tempo de expiração do JWT | 7d |
| `CORS_ORIGIN` | Origem permitida para CORS | * |

## 🐛 Troubleshooting

### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar credenciais no .env
cat .env | grep DB_
```

### Erro "JWT_SECRET not defined"

```bash
# Gerar secret
openssl rand -base64 32

# Adicionar no .env
echo "JWT_SECRET=<secret-gerado>" >> .env
```

### CORS error

Verificar se `CORS_ORIGIN` no `.env` está configurado com a URL do frontend:

```bash
CORS_ORIGIN=https://atendimento.nextplan.tec.br
```

## 📚 Próximos Passos

- [ ] Adicionar mais endpoints (tickets, messages, etc)
- [ ] WebSocket para chat em tempo real
- [ ] Rate limiting
- [ ] Testes automatizados
- [ ] Documentação OpenAPI/Swagger
- [ ] Logs estruturados
- [ ] Monitoramento (Prometheus/Grafana)

## 📞 Suporte

Para problemas ou dúvidas, abra uma issue no GitHub:
https://github.com/feliphemelo/govconnect-hub/issues
