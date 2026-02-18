# 🛠️ Scripts de Deploy - GovChat

Este diretório contém scripts para automação de deploy, atualização e monitoramento do sistema GovChat em produção.

---

## 📁 Arquivos Disponíveis

### Scripts Shell

| Script | Descrição | Uso |
|--------|-----------|-----|
| **vps-setup.sh** | Setup inicial completo da VPS | `./vps-setup.sh [dominio]` |
| **update.sh** | Atualização do sistema em produção | `./update.sh [branch]` |
| **monitor.sh** | Monitoramento de saúde do sistema | `./monitor.sh` |

### Configurações

| Arquivo | Descrição |
|---------|-----------|
| **nginx-govchat.conf** | Configuração otimizada do Nginx |
| **../.env.production.template** | Template de variáveis de ambiente |

---

## 🚀 vps-setup.sh

Script de setup inicial para VPS Ubuntu 22.04.

### O que faz?

1. ✅ Atualiza o sistema operacional
2. ✅ Instala Node.js v20, Nginx, Certbot, UFW
3. ✅ Configura firewall básico
4. ✅ Cria estrutura de diretórios
5. ✅ Clona o repositório (se REPO_URL definida)
6. ✅ Instala dependências do projeto
7. ✅ Gera build de produção
8. ✅ Configura Nginx automaticamente
9. ✅ Configura SSL com Let's Encrypt (se domínio fornecido)
10. ✅ Cria script de atualização

### Como usar

```bash
# Setup básico (sem domínio)
./scripts/vps-setup.sh

# Setup com domínio (configura SSL)
./scripts/vps-setup.sh seu-dominio.gov.br

# Com repositório específico
REPO_URL="https://github.com/usuario/repo.git" ./scripts/vps-setup.sh seu-dominio.gov.br
```

### Variáveis de Ambiente

- `REPO_URL`: URL do repositório Git (opcional)
- `DOMAIN`: Domínio do site (primeiro argumento)

### Requisitos

- Ubuntu 22.04 LTS
- Acesso root ou sudo
- Conexão com internet
- (Opcional) Domínio apontando para o IP

### Tempo de Execução

- Sem repositório: ~2-3 minutos
- Com repositório e build: ~5-10 minutos
- Com SSL: +1-2 minutos

---

## 🔄 update.sh

Script para atualizar o sistema em produção.

### O que faz?

1. ✅ Cria backup do build atual
2. ✅ Salva mudanças locais (git stash)
3. ✅ Faz pull das atualizações do Git
4. ✅ Instala dependências (se package.json mudou)
5. ✅ Gera novo build
6. ✅ Recarrega Nginx (sem downtime)
7. ✅ Verifica saúde do sistema
8. ✅ Restaura backup em caso de falha

### Como usar

```bash
# Atualizar da branch padrão (main)
./scripts/update.sh

# Atualizar de branch específica
./scripts/update.sh develop

# Atualizar e ver logs detalhados
./scripts/update.sh main 2>&1 | tee deploy.log
```

### Recursos

- **Backup automático**: Mantém últimos 5 backups
- **Rollback automático**: Restaura se build falhar
- **Zero downtime**: Usa reload do Nginx
- **Verificação de saúde**: Checa sistema após atualização

### Diretório de Backups

```
/var/www/govchat/backups/
├── dist-20240115_143022.tar.gz
├── dist-20240115_152033.tar.gz
└── ...
```

### Restaurar Backup Manual

```bash
cd /var/www/govchat
rm -rf dist
tar -xzf backups/dist-20240115_143022.tar.gz
sudo systemctl reload nginx
```

---

## 📊 monitor.sh

Script de monitoramento de saúde do sistema.

### O que verifica?

1. ✅ Status do Nginx (rodando/parado)
2. ✅ Conectividade HTTP (site acessível)
3. ✅ Uso de disco (% usado e disponível)
4. ✅ Uso de memória RAM
5. ✅ Carga do sistema (load average)
6. ✅ Últimos erros do Nginx
7. ✅ Arquivos do build (presente/ausente)
8. ✅ Última atualização Git
9. ✅ Certificado SSL (validade)

### Como usar

```bash
# Execução única
./scripts/monitor.sh

# Salvar em arquivo
./scripts/monitor.sh > status.log

# Monitoramento contínuo (a cada 5 min)
watch -n 300 ./scripts/monitor.sh
```

### Automatizar com Cron

```bash
# Editar crontab
crontab -e

# Adicionar linha (verifica a cada 5 minutos)
*/5 * * * * /var/www/govchat/scripts/monitor.sh >> /var/log/govchat-monitor.log 2>&1

# Adicionar linha (relatório diário às 8h)
0 8 * * * /var/www/govchat/scripts/monitor.sh | mail -s "GovChat Status" admin@exemplo.gov.br
```

### Saída Exemplo

```
==========================================
  📊 GovChat - Status do Sistema
  2024-01-15 14:30:22
==========================================

[INFO] Verificando Nginx...
[✓] Nginx está rodando
[INFO] Verificando conectividade HTTP...
[✓] Site respondendo em localhost
[INFO] Verificando uso de disco...
  Uso: 45% | Disponível: 8.2G
[✓] Espaço em disco OK (45%)
...
==========================================
  📋 RESUMO
==========================================

[✓] Sistema funcionando normalmente

  Nginx: OK
  HTTP: OK
  Disco: 45%
  Memória: 62%
```

### Log de Monitoramento

Os dados são salvos em: `/var/log/govchat-monitor.log`

Formato:
```
2024-01-15 14:30:22 | Nginx: OK | HTTP: OK | Disk: 45% | Mem: 62%
2024-01-15 14:35:22 | Nginx: OK | HTTP: OK | Disk: 45% | Mem: 63%
```

---

## 📝 nginx-govchat.conf

Configuração otimizada do Nginx para o GovChat.

### Características

- ✅ SPA fallback para React Router
- ✅ Compressão Gzip otimizada
- ✅ Cache de assets estáticos (1 ano)
- ✅ Security headers
- ✅ Bloqueio de arquivos sensíveis
- ✅ Logs separados
- ✅ Health check endpoint
- ✅ SSL/TLS otimizado

### Como usar

```bash
# Copiar para sites-available
sudo cp scripts/nginx-govchat.conf /etc/nginx/sites-available/govchat

# Editar com seu domínio
sudo nano /etc/nginx/sites-available/govchat

# Ativar site
sudo ln -s /etc/nginx/sites-available/govchat /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar
sudo nginx -t

# Aplicar
sudo systemctl reload nginx
```

### Após SSL

Descomente as seções SSL no arquivo:
- `listen 443 ssl http2`
- `ssl_certificate`
- Seção de redirect HTTP→HTTPS

---

## 🔐 .env.production.template

Template de variáveis de ambiente para produção.

### Como usar

```bash
# Copiar para .env
cp .env.production.template .env

# Editar com valores reais
nano .env

# Verificar (não deve mostrar a senha)
cat .env | grep -v "KEY"
```

### Variáveis Obrigatórias

```env
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."
VITE_SUPABASE_PROJECT_ID="seu-id"
```

### Variáveis Opcionais

```env
LOVABLE_API_KEY="lovable_sk_..."  # Para chatbot com IA
VITE_APP_URL="https://seu-dominio.gov.br"
```

---

## 🎯 Fluxo de Trabalho Típico

### 1. Setup Inicial (uma vez)

```bash
# Na VPS
./scripts/vps-setup.sh seu-dominio.gov.br
```

### 2. Desenvolvimento Local

```bash
# Na sua máquina
git checkout -b feature/nova-funcionalidade
# ... fazer mudanças ...
git commit -m "feat: adiciona nova funcionalidade"
git push origin feature/nova-funcionalidade
```

### 3. Após Merge na Main

```bash
# Na VPS
./scripts/update.sh
```

### 4. Monitoramento

```bash
# Manual
./scripts/monitor.sh

# Ou verificar logs
tail -f /var/log/nginx/govchat_error.log
```

---

## 🚨 Troubleshooting

### Permissão Negada

```bash
chmod +x scripts/*.sh
```

### Script não encontrado

```bash
# Verificar se está no diretório correto
pwd  # deve mostrar /var/www/govchat

# Ou usar caminho absoluto
/var/www/govchat/scripts/update.sh
```

### Nginx não reinicia

```bash
# Ver erro específico
sudo nginx -t

# Logs de erro
sudo tail -f /var/log/nginx/error.log
```

### Build falha

```bash
# Ver logs completos
npm run build 2>&1 | tee build.log

# Verificar espaço em disco
df -h

# Verificar memória
free -h
```

---

## 📞 Suporte

Para mais informações, consulte:
- [Guia Completo de Deploy](../docs/DEPLOY_VPS.md)
- [README Principal](../README.md)
- [Manual de Deploy Original](../DEPLOY.md)

---

**Automatize seu deploy! 🚀**
