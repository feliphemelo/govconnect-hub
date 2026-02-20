#!/bin/bash

echo "🔧 CORREÇÃO PRECISA - Endpoints Duplicados"
echo "=========================================="
echo ""

cd /var/www/govchat/backend/src || exit 1

echo "1️⃣ Restaurando do backup mais recente..."
if [ -f "server.ts.backup_before_conversations_fix" ]; then
    cp server.ts.backup_before_conversations_fix server.ts
    echo "✅ Restaurado: server.ts.backup_before_conversations_fix"
else
    cp server.ts.backup_clean server.ts
    echo "✅ Restaurado: server.ts.backup_clean"
fi
echo ""

echo "2️⃣ Criando arquivo Python para remover endpoints duplicados..."
cat > /tmp/fix_endpoints.py << 'PYTHON_SCRIPT'
#!/usr/bin/env python3
import re

# Ler arquivo
with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Encontrar todas as ocorrências de app.get('/api/conversations'
endpoints = []
for i, line in enumerate(lines):
    if "app.get('/api/conversations'" in line and line.strip().startswith('app.get'):
        endpoints.append(i)

print(f"Encontrados {len(endpoints)} endpoints em linhas: {[l+1 for l in endpoints]}")

if len(endpoints) <= 1:
    print("✅ Apenas 1 endpoint, nada a fazer")
    exit(0)

# Função para encontrar o fim de uma função
def find_function_end(start_line):
    brace_count = 0
    started = False
    
    for i in range(start_line, len(lines)):
        line = lines[i]
        
        # Contar chaves
        for char in line:
            if char == '{':
                brace_count += 1
                started = True
            elif char == '}':
                brace_count -= 1
        
        # Se encontramos o fechamento completo
        if started and brace_count == 0:
            # Procurar pelo }); na mesma linha ou próximas
            if '});' in line:
                return i
            elif i + 1 < len(lines) and '});' in lines[i + 1]:
                return i + 1
            else:
                return i
    
    return start_line + 50  # Fallback

# Marcar endpoints para remoção (todos menos o último)
endpoints_to_remove = endpoints[:-1]  # Remove todos exceto o último
print(f"Removendo endpoints das linhas: {[l+1 for l in endpoints_to_remove]}")

# Criar lista de linhas para remover
lines_to_remove = set()
for endpoint_line in endpoints_to_remove:
    end_line = find_function_end(endpoint_line)
    print(f"  Linha {endpoint_line+1} até {end_line+1}")
    for i in range(endpoint_line, end_line + 1):
        lines_to_remove.add(i)

# Criar novo conteúdo sem as linhas marcadas
new_lines = [line for i, line in enumerate(lines) if i not in lines_to_remove]

# Salvar
with open('server.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"✅ Removidas {len(lines_to_remove)} linhas")
print(f"✅ Endpoint restante na linha: {endpoints[-1] - len([l for l in lines_to_remove if l < endpoints[-1]]) + 1}")
PYTHON_SCRIPT

chmod +x /tmp/fix_endpoints.py
echo "✅ Script Python criado"
echo ""

echo "3️⃣ Executando remoção de endpoints duplicados..."
cd /var/www/govchat/backend/src
python3 /tmp/fix_endpoints.py
echo ""

echo "4️⃣ Verificando resultado..."
grep -n "app.get('/api/conversations'" server.ts
echo ""

echo "5️⃣ Adicionando authMiddleware ao endpoint restante..."
LINE=$(grep -n "app.get('/api/conversations'" server.ts | cut -d: -f1)
if [ ! -z "$LINE" ]; then
    if grep -A 0 "^${LINE}:" <(cat -n server.ts) | grep -q "authMiddleware"; then
        echo "✅ Já tem authMiddleware"
    else
        echo "Adicionando authMiddleware na linha $LINE..."
        sed -i "${LINE}s|app.get('/api/conversations'|app.get('/api/conversations', authMiddleware|" server.ts
        echo "✅ authMiddleware adicionado"
    fi
fi
echo ""

echo "6️⃣ Verificando import de authMiddleware..."
if grep -q "import.*authMiddleware.*from.*middleware/auth" server.ts; then
    echo "✅ Import correto existe"
elif grep -q "import.*authMiddleware" server.ts; then
    echo "⚠️  Import existe mas caminho pode estar errado"
    grep -n "import.*authMiddleware" server.ts
else
    echo "Adicionando import..."
    sed -i "1i import { authMiddleware } from './middleware/auth';" server.ts
    echo "✅ Import adicionado"
fi
echo ""

echo "7️⃣ Recompilando..."
cd /var/www/govchat/backend
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ COMPILAÇÃO OK!"
    echo ""
    
    echo "8️⃣ Reiniciando PM2..."
    pm2 restart govchat-backend
    sleep 3
    pm2 status govchat-backend
    echo ""
    
    echo "9️⃣ Logs recentes..."
    pm2 logs govchat-backend --lines 15 --nostream
    echo ""
    
    echo "✅ CORREÇÃO CONCLUÍDA!"
else
    echo ""
    echo "❌ ERRO NA COMPILAÇÃO!"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "🧪 TESTE: https://atendimento.nextplan.tec.br"
echo "   Login → Conversas devem aparecer!"
echo "═══════════════════════════════════════════════════════"
