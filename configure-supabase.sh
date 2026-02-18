#!/bin/bash

#
# GovChat - Script de Configuração do Supabase
#
# Este script ajuda a configurar o Supabase no GovChat
#

set -e

# Cores para output (desabilitadas para compatibilidade)
RED=""
GREEN=""
YELLOW=""
BLUE=""
NC=""

echo "========================================="
echo "  GovChat - Configuracao Supabase"
echo "========================================="
echo ""

echo "[INFO] Este script vai configurar o Supabase no seu GovChat"
echo "[INFO] Voce precisara das credenciais do seu projeto Supabase"
echo ""

# Verificar se está rodando como root
if [[ $EUID -ne 0 ]]; then
   echo "[ERRO] Este script precisa ser executado como root (use sudo)"
   exit 1
fi

# Verificar se o projeto existe
if [ ! -d "/var/www/govchat" ]; then
    echo "[ERRO] Diretorio /var/www/govchat nao encontrado"
    echo "[INFO] Execute o instalador primeiro"
    exit 1
fi

echo ""
echo "========================================="
echo "  PASSO 1: Criar projeto no Supabase"
echo "========================================="
echo ""
echo "1. Acesse: https://supabase.com/dashboard"
echo "2. Crie uma conta (se ainda nao tiver)"
echo "3. Clique em 'New Project'"
echo "4. Preencha:"
echo "   - Name: govchat-nextplan"
echo "   - Database Password: [escolha uma senha forte]"
echo "   - Region: South America (Sao Paulo)"
echo "   - Plan: Free"
echo "5. Clique em 'Create new project'"
echo "6. Aguarde ~2 minutos"
echo ""
read -p "Pressione ENTER quando o projeto estiver criado..."

echo ""
echo "========================================="
echo "  PASSO 2: Copiar credenciais"
echo "========================================="
echo ""
echo "No painel do Supabase:"
echo "1. Va em Settings (engrenagem) -> API"
echo "2. Copie as informacoes abaixo"
echo ""

# Solicitar Project URL
while true; do
    read -p "Project URL (https://xxxxx.supabase.co): " SUPABASE_URL
    if [[ $SUPABASE_URL =~ ^https://.*\.supabase\.co$ ]]; then
        break
    else
        echo "[ERRO] URL invalida. Formato: https://xxxxx.supabase.co"
    fi
done

# Solicitar Anon Key
while true; do
    read -p "Anon public key (eyJhbGc...): " SUPABASE_ANON_KEY
    if [[ $SUPABASE_ANON_KEY =~ ^eyJ ]]; then
        break
    else
        echo "[ERRO] Key invalida. Deve comecar com 'eyJ'"
    fi
done

# Solicitar Project ID
read -p "Project ID (Reference ID): " SUPABASE_PROJECT_ID

echo ""
echo "[INFO] Criando arquivo .env..."

# Criar arquivo .env
cat > /var/www/govchat/.env << EOF
# Supabase Configuration
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_ANON_KEY
VITE_SUPABASE_PROJECT_ID=$SUPABASE_PROJECT_ID

# Opcional - Configure depois
VITE_GEMINI_API_KEY=AIzaSyDummyKey
VITE_NOTIFICAMEHUB_TOKEN=dummy-token
EOF

echo "[OK] Arquivo .env criado"

echo ""
echo "[INFO] Rebuilding frontend com novas configuracoes..."
cd /var/www/govchat
npm run build

echo ""
echo "[INFO] Reiniciando Nginx..."
sudo systemctl restart nginx

echo ""
echo "========================================="
echo "  PASSO 3: Configurar banco de dados"
echo "========================================="
echo ""
echo "Agora voce precisa executar as migrations no Supabase:"
echo ""
echo "1. No painel do Supabase, va em 'SQL Editor'"
echo "2. Execute os arquivos SQL em ordem:"
echo ""

# Listar migrations
if [ -d "/var/www/govchat/supabase/migrations" ]; then
    echo "[INFO] Migrations encontradas:"
    ls -1 /var/www/govchat/supabase/migrations/*.sql 2>/dev/null | while read file; do
        echo "   - $(basename $file)"
    done
    echo ""
    echo "Para ver o conteudo, execute:"
    echo "   cat /var/www/govchat/supabase/migrations/*.sql"
else
    echo "[AVISO] Pasta de migrations nao encontrada"
    echo "[INFO] As migrations podem estar em outro local ou precisam ser criadas"
fi

echo ""
echo "========================================="
echo "  PASSO 4: Configurar autenticacao"
echo "========================================="
echo ""
echo "1. No Supabase, va em Authentication -> URL Configuration"
echo "2. Em 'Site URL', adicione:"
echo "   https://atendimento.nextplan.tec.br"
echo ""
echo "3. Em 'Redirect URLs', adicione:"
echo "   https://atendimento.nextplan.tec.br/**"
echo "   https://atendimento.nextplan.tec.br/auth/callback"
echo ""
read -p "Pressione ENTER quando concluir..."

echo ""
echo "========================================="
echo "  CONFIGURACAO CONCLUIDA!"
echo "========================================="
echo ""
echo "[OK] Supabase configurado com sucesso!"
echo ""
echo "[INFO] Acesse o sistema em:"
echo "   https://atendimento.nextplan.tec.br"
echo ""
echo "[INFO] Proximos passos:"
echo "   1. Execute as migrations no SQL Editor do Supabase"
echo "   2. Crie o primeiro usuario admin no Supabase"
echo "   3. Faca login no sistema"
echo ""
echo "[INFO] Comandos uteis:"
echo "   - Ver .env: cat /var/www/govchat/.env"
echo "   - Rebuild: cd /var/www/govchat && npm run build"
echo "   - Logs: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "========================================="
