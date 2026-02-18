#!/bin/bash
#
# GovChat NextPlan - Instalador Direto (Sem dependência de raw.githubusercontent.com)
# 
# Uso:
#   bash <(wget -qO- https://github.com/feliphemelo/govconnect-hub/raw/main/install-nextplan-direct.sh)
#

set -e

echo "🔽 Baixando instalador NextPlan..."

# Criar diretório temporário
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Baixar via API do GitHub (sempre funciona)
echo "📡 Baixando do GitHub..."
wget -q https://github.com/feliphemelo/govconnect-hub/raw/main/install-nextplan.sh -O install-nextplan.sh

# Verificar download
if [ ! -f install-nextplan.sh ]; then
    echo "❌ Erro ao baixar o instalador!"
    echo "💡 Tente: git clone https://github.com/feliphemelo/govconnect-hub.git && cd govconnect-hub && sudo bash install-nextplan.sh"
    exit 1
fi

# Tornar executável
chmod +x install-nextplan.sh

echo "✅ Instalador baixado com sucesso!"
echo "🚀 Iniciando instalação..."
echo ""

# Executar instalador
sudo bash install-nextplan.sh

# Limpar
cd /
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Instalação concluída!"
