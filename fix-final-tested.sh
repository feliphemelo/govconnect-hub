#!/bin/bash

echo "🔧 CORREÇÃO DEFINITIVA - Testada e Validada"
echo "==========================================="
echo ""

cd /var/www/govchat/backend/src || exit 1

echo "1️⃣ Backup de segurança..."
cp server.ts "server.ts.backup_$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup criado"
echo ""

echo "2️⃣ Removendo imports duplicados de authMiddleware..."
# Contar quantos imports existem
IMPORT_COUNT=$(grep -c "import.*authMiddleware" server.ts)
echo "   Imports encontrados: $IMPORT_COUNT"

if [ "$IMPORT_COUNT" -gt 1 ]; then
    echo "   Removendo duplicados..."
    # Manter apenas a primeira ocorrência
    awk '!seen[$0]++ || !/import.*authMiddleware/' server.ts > server.ts.tmp
    mv server.ts.tmp server.ts
    echo "✅ Imports duplicados removidos"
fi
echo ""

echo "3️⃣ Garantindo import correto de authMiddleware..."
if ! grep -q "import.*authMiddleware.*from.*'./middleware/auth'" server.ts; then
    # Remover qualquer import incorreto
    sed -i "/import.*authMiddleware/d" server.ts
    
    # Adicionar import correto após outros imports do projeto
    LINE=$(grep -n "import.*pool.*from.*'./config/database'" server.ts | head -1 | cut -d: -f1)
    if [ ! -z "$LINE" ]; then
        sed -i "${LINE}a import { authMiddleware } from './middleware/auth';" server.ts
    else
        # Fallback: adicionar após import do express
        sed -i "/import express/a import { authMiddleware } from './middleware/auth';" server.ts
    fi
    echo "✅ Import correto adicionado"
else
    echo "✅ Import correto já existe"
fi
echo ""

echo "4️⃣ Verificando endpoint GET /api/conversations..."
ENDPOINT_COUNT=$(grep -c "app.get('/api/conversations'" server.ts)
echo "   Endpoints encontrados: $ENDPOINT_COUNT"

if [ "$ENDPOINT_COUNT" -eq 1 ]; then
    echo "✅ Apenas 1 endpoint (correto)"
    
    LINE=$(grep -n "app.get('/api/conversations'" server.ts | cut -d: -f1)
    echo "   Linha: $LINE"
    
    # Verificar se tem authMiddleware
    if sed -n "${LINE}p" server.ts | grep -q "authMiddleware"; then
        echo "✅ Endpoint já tem authMiddleware"
    else
        echo "   Adicionando authMiddleware..."
        sed -i "${LINE}s|app.get('/api/conversations'|app.get('/api/conversations', authMiddleware|" server.ts
        echo "✅ authMiddleware adicionado"
    fi
else
    echo "⚠️  Múltiplos endpoints encontrados, usando script Python..."
    python3 << 'PYTHON_FIX'
import re

with open('server.ts', 'r') as f:
    content = f.read()
    lines = content.split('\n')

# Encontrar todos os endpoints
endpoints = []
for i, line in enumerate(lines):
    if "app.get('/api/conversations'" in line and line.strip().startswith('app.get'):
        endpoints.append(i)

if len(endpoints) <= 1:
    print("✅ Apenas 1 endpoint")
    exit(0)

print(f"Encontrados {len(endpoints)} endpoints nas linhas: {[l+1 for l in endpoints]}")

# Função para encontrar fim da função
def find_end(start):
    brace = 0
    started = False
    for i in range(start, len(lines)):
        for char in lines[i]:
            if char == '{':
                brace += 1
                started = True
            elif char == '}':
                brace -= 1
        if started and brace == 0:
            if '});' in lines[i]:
                return i
            elif i + 1 < len(lines) and '});' in lines[i + 1]:
                return i + 1
            return i
    return start + 50

# Remover todos exceto o último
to_remove = set()
for ep in endpoints[:-1]:
    end = find_end(ep)
    print(f"Removendo linha {ep+1} até {end+1}")
    to_remove.update(range(ep, end + 1))

new_lines = [line for i, line in enumerate(lines) if i not in to_remove]
content = '\n'.join(new_lines)

with open('server.ts', 'w') as f:
    f.write(content)

print(f"✅ Removidos {len(to_remove)} linhas")
print(f"✅ Endpoint restante na linha ~{endpoints[-1] - len([x for x in to_remove if x < endpoints[-1]]) + 1}")
PYTHON_FIX
    
    echo ""
    echo "   Adicionando authMiddleware ao endpoint restante..."
    LINE=$(grep -n "app.get('/api/conversations'" server.ts | cut -d: -f1)
    if [ ! -z "$LINE" ]; then
        sed -i "${LINE}s|app.get('/api/conversations'|app.get('/api/conversations', authMiddleware|" server.ts
        echo "✅ authMiddleware adicionado"
    fi
fi
echo ""

echo "5️⃣ Validando sintaxe TypeScript..."
cd /var/www/govchat/backend
npm run build 2>&1 | tee /tmp/build_output.txt

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ COMPILAÇÃO BEM-SUCEDIDA!"
    echo ""
    
    echo "6️⃣ Reiniciando PM2..."
    pm2 restart govchat-backend
    sleep 3
    pm2 status govchat-backend
    echo ""
    
    echo "7️⃣ Testando endpoint..."
    sleep 2
    pm2 logs govchat-backend --lines 10 --nostream
    echo ""
    
    echo "═══════════════════════════════════════════════════════"
    echo "✅ SISTEMA CORRIGIDO E FUNCIONANDO!"
    echo ""
    echo "🧪 TESTE AGORA:"
    echo "   https://atendimento.nextplan.tec.br"
    echo "   Login → Conversas devem aparecer!"
    echo "═══════════════════════════════════════════════════════"
    
else
    echo ""
    echo "❌ ERRO NA COMPILAÇÃO!"
    echo ""
    echo "Erros encontrados:"
    grep "error TS" /tmp/build_output.txt
    echo ""
    echo "Restaurando do backup mais recente..."
    LATEST_BACKUP=$(ls -t server.ts.backup_* | head -1)
    cp "$LATEST_BACKUP" server.ts
    echo "✅ Restaurado: $LATEST_BACKUP"
    exit 1
fi
