#!/bin/bash

# Script para criar tabela whatsapp_instances no PostgreSQL

echo "=========================================="
echo "Criando tabela whatsapp_instances"
echo "=========================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "create_whatsapp_table.sql" ]; then
    echo -e "${RED}❌ Arquivo create_whatsapp_table.sql não encontrado${NC}"
    echo "Execute este script no diretório /var/www/govchat"
    exit 1
fi

echo -e "${YELLOW}1. Verificando se a tabela já existe...${NC}"
TABLE_EXISTS=$(sudo -u postgres psql -d govchat_nextplan -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='whatsapp_instances');")

if [ "$TABLE_EXISTS" = "t" ]; then
    echo -e "${GREEN}✅ Tabela whatsapp_instances já existe${NC}"
    
    # Contar registros
    COUNT=$(sudo -u postgres psql -d govchat_nextplan -tAc "SELECT COUNT(*) FROM whatsapp_instances;")
    echo -e "${GREEN}   Registros existentes: $COUNT${NC}"
else
    echo -e "${YELLOW}   Tabela não existe, criando...${NC}"
    
    # Criar tabela
    sudo -u postgres psql -d govchat_nextplan -f create_whatsapp_table.sql
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Tabela whatsapp_instances criada com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro ao criar tabela${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}2. Verificando estrutura da tabela...${NC}"
sudo -u postgres psql -d govchat_nextplan -c "\d whatsapp_instances"

echo ""
echo -e "${YELLOW}3. Reiniciando backend...${NC}"
pm2 restart govchat-backend

echo ""
echo -e "${YELLOW}4. Aguardando 2 segundos...${NC}"
sleep 2

echo ""
echo -e "${YELLOW}5. Verificando logs do backend...${NC}"
pm2 logs govchat-backend --lines 10 --nostream | tail -10

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Migração concluída!${NC}"
echo "=========================================="
echo ""
echo "📝 Próximos passos:"
echo "  1. Limpe o cache do navegador (Ctrl+Shift+R)"
echo "  2. Faça login novamente"
echo "  3. Vá em: Configurações → WhatsApp"
echo "  4. Clique em: Nova Instância"
echo "  5. Teste o QR Code"
echo ""
