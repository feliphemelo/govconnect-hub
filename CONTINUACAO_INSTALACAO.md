# 🔧 CONTINUAÇÃO DA INSTALAÇÃO

## ✅ O que já está funcionando na VPS:

```
✅ Node.js 20 instalado
✅ PostgreSQL configurado (banco: govchat_nextplan)
✅ Backend instalado e compilado SEM ERROS
✅ Backend rodando no PM2 (porta 3001)
✅ Migrations executadas com sucesso
```

---

## 🚀 OPÇÃO 1: Continuar manualmente (≈2 minutos)

Execute na VPS os comandos abaixo:

### 1️⃣ Configurar e buildar frontend:

```bash
cd /var/www/govchat

# Criar .env do frontend
cat > .env << 'ENDOFENV'
VITE_API_URL=https://atendimento.nextplan.tec.br/api
VITE_DOMAIN=atendimento.nextplan.tec.br
ENDOFENV

# Instalar dependências e buildar
npm install
npm run build
```

### 2️⃣ Configurar Nginx:

```bash
cat > /etc/nginx/sites-available/govchat << 'ENDOFNGINX'
server {
    listen 80;
    server_name atendimento.nextplan.tec.br;

    # Frontend estático
    location / {
        root /var/www/govchat/dist;
        try_files $uri $uri/ /index.html;
        index index.html;

        # Cache para assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Proxy para API backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket para chat em tempo real
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
}
ENDOFNGINX

# Ativar site e recarregar Nginx
ln -sf /etc/nginx/sites-available/govchat /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 3️⃣ Obter certificado SSL:

```bash
certbot --nginx -d atendimento.nextplan.tec.br --non-interactive --agree-tos --email feliphe@nextplan.tec.br --redirect
```

### 4️⃣ Criar usuário admin no banco:

```bash
cd /var/www/govchat/backend

# Script para criar admin
cat > create_admin.js << 'ENDOFJS'
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function createAdmin() {
  try {
    // Criar empresa
    const companyResult = await pool.query(
      `INSERT INTO companies (name, slug, is_active) 
       VALUES ($1, $2, true) 
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['NextPlan', 'nextplan']
    );
    const companyId = companyResult.rows[0].id;
    console.log('✅ Empresa criada:', companyId);

    // Hash da senha
    const passwordHash = await bcrypt.hash('Teikei9@', 10);

    // Criar usuário
    const userResult = await pool.query(
      `INSERT INTO auth_users (email, password_hash) 
       VALUES ($1, $2) 
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['feliphe@nextplan.tec.br', passwordHash]
    );
    const userId = userResult.rows[0].id;
    console.log('✅ Usuário criado:', userId);

    // Criar perfil
    await pool.query(
      `INSERT INTO profiles (user_id, company_id, full_name, is_active) 
       VALUES ($1, $2, $3, true)
       ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name`,
      [userId, companyId, 'feliphe']
    );
    console.log('✅ Perfil criado');

    // Atribuir role admin
    await pool.query(
      `INSERT INTO user_roles (user_id, company_id, role) 
       VALUES ($1, $2, 'admin')
       ON CONFLICT (user_id, role, company_id) DO NOTHING`,
      [userId, companyId]
    );
    console.log('✅ Role admin atribuída');

    console.log('\n🎉 Administrador criado com sucesso!');
    console.log('📧 Email: feliphe@nextplan.tec.br');
    console.log('🔑 Senha: Teikei9@');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

createAdmin();
ENDOFJS

# Executar script
node create_admin.js

# Limpar script
rm create_admin.js
```

### 5️⃣ Criar comandos globais:

```bash
# Comando para ver logs
cat > /usr/local/bin/govchat-logs << 'ENDOFCMD'
#!/bin/bash
pm2 logs govchat-backend --lines 100
ENDOFCMD
chmod +x /usr/local/bin/govchat-logs

# Comando para backup
cat > /usr/local/bin/govchat-backup-db << 'ENDOFCMD'
#!/bin/bash
BACKUP_DIR="/var/backups/govchat"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PGPASSWORD=govchat_user pg_dump -h localhost -U govchat_user govchat_nextplan > "$BACKUP_DIR/backup_$TIMESTAMP.sql"
echo "Backup salvo em: $BACKUP_DIR/backup_$TIMESTAMP.sql"
ENDOFCMD
chmod +x /usr/local/bin/govchat-backup-db

# Comando para atualizar
cat > /usr/local/bin/govchat-update << 'ENDOFCMD'
#!/bin/bash
cd /var/www/govchat
git pull origin main
cd backend
npm install
npm run build
pm2 restart govchat-backend
cd ..
npm install
npm run build
systemctl reload nginx
echo "GovChat atualizado com sucesso!"
ENDOFCMD
chmod +x /usr/local/bin/govchat-update

echo "✅ Comandos criados: govchat-logs, govchat-backup-db, govchat-update"
```

---

## 🚀 OPÇÃO 2: Reinstalar com versão corrigida (≈15 minutos)

Se preferir reinstalar do zero:

```bash
rm -f install-with-backend.sh
wget https://github.com/feliphemelo/govconnect-hub/raw/main/install-with-backend.sh
chmod +x install-with-backend.sh
sudo ./install-with-backend.sh
```

**Commit corrigido:** `f870cb3`  
**Correção:** PM2 startup agora executa corretamente

---

## ✅ Verificação final:

Após completar a Opção 1 ou 2, teste:

```bash
# 1. Status PM2
pm2 status

# 2. Testar API
curl https://atendimento.nextplan.tec.br/api/health

# 3. Ver logs
govchat-logs

# 4. Acessar no navegador
# URL: https://atendimento.nextplan.tec.br
# Email: feliphe@nextplan.tec.br
# Senha: Teikei9@
```

---

## 📝 Credenciais:

```
🌐 URL: https://atendimento.nextplan.tec.br
📧 Email: feliphe@nextplan.tec.br
🔑 Senha: Teikei9@
👤 Nome: feliphe
🏢 Empresa: NextPlan
```

---

## 🎯 Status atual:

```
✅ Backend: FUNCIONANDO (PM2 online)
⏳ Frontend: AGUARDANDO BUILD
⏳ Nginx: AGUARDANDO CONFIGURAÇÃO
⏳ SSL: AGUARDANDO CERTBOT
⏳ Admin: AGUARDANDO CRIAÇÃO
```

**Recomendação:** Use a **Opção 1** (manual) - mais rápido e você já está quase lá! 🚀
