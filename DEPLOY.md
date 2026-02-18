# 🚀 Manual de Deploy — VPS Ubuntu 22.04

Guia completo para subir o sistema em produção usando uma VPS com Ubuntu 22.04.

---

## 📋 Pré-requisitos

- VPS com Ubuntu 22.04 LTS (mínimo 1GB RAM, 1 vCPU)
- Acesso root ou usuário com sudo
- Domínio apontando para o IP da VPS (opcional, mas recomendado)
- Repositório GitHub do projeto conectado

---

## 1. Preparar o Servidor

```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar dependências essenciais
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx ufw
```

### Configurar Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 2. Instalar Node.js (v20 LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node -v   # v20.x.x
npm -v    # 10.x.x
```

---

## 3. Clonar o Repositório

```bash
# Criar diretório do projeto
sudo mkdir -p /var/www/app
sudo chown $USER:$USER /var/www/app

# Clonar
cd /var/www/app
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git .
```

---

## 4. Configurar Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```bash
nano .env
```

Adicione as variáveis (substitua pelos valores reais do seu projeto Lovable Cloud):

```env
VITE_SUPABASE_URL="https://SEU_PROJECT_ID.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_anon_key_aqui"
VITE_SUPABASE_PROJECT_ID="seu_project_id"
```

> ⚠️ **Importante:** As variáveis `VITE_` são embutidas no build e ficam visíveis no client. Nunca coloque chaves secretas aqui. As chaves secretas (como `SUPABASE_SERVICE_ROLE_KEY`) ficam seguras no backend (Edge Functions) e nunca no frontend.

---

## 5. Build da Aplicação

```bash
# Instalar dependências
npm install

# Gerar build de produção
npm run build
```

O build será gerado na pasta `dist/`.

---

## 6. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/app
```

Cole a configuração abaixo (substitua `seudominio.com.br`):

```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    root /var/www/app/dist;
    index index.html;

    # Gzip para performance
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # Cache de assets estáticos
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback — ESSENCIAL para React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Bloquear acesso a arquivos sensíveis
    location ~ /\. {
        deny all;
    }
}
```

Ativar o site:

```bash
sudo ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 7. SSL com Let's Encrypt (HTTPS)

```bash
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

Siga as instruções. O Certbot configura renovação automática.

Testar renovação:

```bash
sudo certbot renew --dry-run
```

---

## 8. Atualizações Futuras (CI/CD Manual)

Crie um script para facilitar deploys futuros:

```bash
nano /var/www/app/deploy.sh
```

```bash
#!/bin/bash
set -e

echo "🔄 Atualizando código..."
cd /var/www/app
git pull origin main

echo "📦 Instalando dependências..."
npm install

echo "🏗️ Gerando build..."
npm run build

echo "✅ Deploy concluído!"
echo "O Nginx já serve os arquivos estáticos automaticamente."
```

```bash
chmod +x /var/www/app/deploy.sh
```

Para atualizar, basta rodar:

```bash
/var/www/app/deploy.sh
```

---

## 9. Monitoramento (Opcional)

### Verificar status do Nginx

```bash
sudo systemctl status nginx
```

### Ver logs de acesso/erro

```bash
# Acesso
sudo tail -f /var/log/nginx/access.log

# Erros
sudo tail -f /var/log/nginx/error.log
```

---

## 🏗️ Arquitetura em Produção

```
┌─────────────────────────────────────────────┐
│                 Usuário                      │
│              (Navegador)                     │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────┐
│          VPS Ubuntu 22.04                    │
│  ┌───────────────────────────────────────┐  │
│  │   Nginx (Reverse Proxy + SSL)         │  │
│  │   Serve arquivos estáticos (dist/)    │  │
│  └───────────────────────────────────────┘  │
└──────────────────┬──────────────────────────┘
                   │ API calls (HTTPS)
                   ▼
┌─────────────────────────────────────────────┐
│         Lovable Cloud (Backend)              │
│  ┌─────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ Auth    │ │ Database │ │Edge Functions│  │
│  │         │ │(Postgres)│ │  (Deno)      │  │
│  └─────────┘ └──────────┘ └─────────────┘  │
└─────────────────────────────────────────────┘
```

> O frontend é servido pela VPS. O backend (banco, auth, edge functions) continua rodando no Lovable Cloud — não precisa instalar nada extra.

---

## ❓ Troubleshooting

| Problema | Solução |
|----------|---------|
| Página em branco | Verifique se `try_files` está no Nginx config |
| 502 Bad Gateway | Nginx não encontra os arquivos. Verifique o `root` |
| Erro de CORS | Verifique se o domínio está autorizado no backend |
| CSS/JS não carrega | Verifique se o build foi gerado (`ls dist/`) |
| Login não funciona | Adicione seu domínio nas URLs permitidas do Auth |

### Configurar domínio no Auth

Para que o login funcione no seu domínio customizado, acesse as configurações do projeto Lovable Cloud e adicione seu domínio (`https://seudominio.com.br`) na lista de **Redirect URLs** permitidas.

---

## 📌 Resumo dos Comandos

```bash
# Setup inicial (uma vez)
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx ufw
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
git clone REPO /var/www/app
cd /var/www/app && npm install && npm run build
# Configurar nginx + SSL

# Deploy de atualizações
/var/www/app/deploy.sh
```
