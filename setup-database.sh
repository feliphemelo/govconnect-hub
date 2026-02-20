#!/bin/bash
echo "🗄️ CONFIGURAÇÃO DO BANCO DE DADOS"
echo "================================="
echo ""

echo "📍 1. Verificando bancos existentes"
echo "-----------------------------------"
sudo -u postgres psql -l

echo ""
echo "📍 2. Criando banco govchat (se não existir)"
echo "--------------------------------------------"
sudo -u postgres psql -c "CREATE DATABASE govchat;" 2>&1 | grep -v "already exists" || echo "✅ Banco já existe ou foi criado"

echo ""
echo "📍 3. Verificando arquivo .env do backend"
echo "-----------------------------------------"
if [ -f /var/www/govchat/backend/.env ]; then
    echo "✅ Arquivo .env existe"
    echo "📋 DATABASE_URL atual:"
    grep DATABASE_URL /var/www/govchat/backend/.env || echo "⚠️ DATABASE_URL não configurada"
else
    echo "❌ Arquivo .env NÃO existe!"
fi

echo ""
echo "📍 4. Verificando tabelas no banco govchat"
echo "------------------------------------------"
sudo -u postgres psql govchat -c "\dt" 2>&1

echo ""
echo "📍 5. Procurando arquivos de migration"
echo "--------------------------------------"
find /var/www/govchat -name "*.sql" -o -name "*migration*" | head -10

echo ""
echo "📍 6. Verificando se há schema.sql ou init.sql"
echo "----------------------------------------------"
if [ -f /var/www/govchat/backend/schema.sql ]; then
    echo "✅ Encontrado: backend/schema.sql"
elif [ -f /var/www/govchat/schema.sql ]; then
    echo "✅ Encontrado: schema.sql"
elif [ -f /var/www/govchat/backend/database/schema.sql ]; then
    echo "✅ Encontrado: backend/database/schema.sql"
else
    echo "⚠️ Nenhum arquivo schema.sql encontrado"
fi

echo ""
echo "📍 7. Listando estrutura do diretório backend"
echo "---------------------------------------------"
ls -la /var/www/govchat/backend/ | head -20

