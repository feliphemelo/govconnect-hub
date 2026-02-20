#!/bin/bash

echo "🚨 RESTAURAÇÃO E CORREÇÃO EMERGENCIAL"
echo "====================================="
echo ""

cd /var/www/govchat/backend/src || exit 1

echo "1️⃣ Restaurando do último backup funcional..."
if [ -f "server.ts.backup_clean_20260220_014544" ]; then
    cp server.ts.backup_clean_20260220_014544 server.ts
    echo "✅ Restaurado: backup_clean_20260220_014544"
elif [ -f "server.ts.backup_clean" ]; then
    cp server.ts.backup_clean server.ts
    echo "✅ Restaurado: backup_clean"
else
    LATEST=$(ls -t server.ts.backup_* 2>/dev/null | grep -v "final" | head -1)
    cp "$LATEST" server.ts
    echo "✅ Restaurado: $LATEST"
fi
echo ""

echo "2️⃣ Removendo endpoints duplicados (Python)..."
python3 << 'PYTHON'
import re

with open('server.ts', 'r') as f:
    lines = f.readlines()

# Função para encontrar fim
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
        if started and brace == 0 and '});' in lines[i]:
            return i
    return start + 50

# Encontrar duplicados
patterns = [
    "app.get('/api/conversations/:id/messages'",
    "app.post('/api/conversations/:id/messages'",
]

for pattern in patterns:
    occurrences = [i for i, line in enumerate(lines) if pattern in line and line.strip().startswith('app.')]
    
    if len(occurrences) > 1:
        print(f"{pattern}: {len(occurrences)} encontrados, removendo {len(occurrences)-1}")
        to_remove = set()
        for ep in occurrences[:-1]:
            end = find_end(ep)
            to_remove.update(range(ep, end + 1))
        
        lines = [line for i, line in enumerate(lines) if i not in to_remove]

with open('server.ts', 'w') as f:
    f.writelines(lines)

print("✅ Endpoints duplicados removidos")
PYTHON
echo ""

echo "3️⃣ Removendo authMiddleware LOCAL (se existir)..."
# Procurar declaração local e remover TODO o bloco
python3 << 'PYTHON2'
with open('server.ts', 'r') as f:
    content = f.read()
    lines = content.split('\n')

# Procurar: const authMiddleware = async
in_auth_middleware = False
brace_count = 0
result_lines = []

for i, line in enumerate(lines):
    # Detectar início da declaração local
    if 'const authMiddleware' in line and 'async' in line and '=' in line:
        in_auth_middleware = True
        brace_count = 0
        print(f"Removendo declaração local na linha {i+1}")
        continue
    
    # Se estamos dentro, contar chaves
    if in_auth_middleware:
        for char in line:
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
        
        # Se fechou tudo, terminou
        if brace_count == 0 and '}' in line:
            in_auth_middleware = False
            continue
        else:
            continue
    
    result_lines.append(line)

with open('server.ts', 'w') as f:
    f.write('\n'.join(result_lines))

print("✅ Declaração local removida")
PYTHON2
echo ""

echo "4️⃣ Garantindo import único e correto..."
# Remover todos imports de authMiddleware
sed -i '/^import.*authMiddleware/d' server.ts

# Adicionar apenas um
sed -i "1i import { authMiddleware } from './middleware/auth';" server.ts
echo "✅ Import único adicionado"
echo ""

echo "5️⃣ Adicionando authMiddleware nos endpoints..."
for endpoint in "app.get('/api/conversations')" "app.get('/api/conversations/:id/messages'" "app.post('/api/conversations/:id/messages'"; do
    LINE=$(grep -n "$endpoint" server.ts | cut -d: -f1)
    if [ ! -z "$LINE" ]; then
        if ! sed -n "${LINE}p" server.ts | grep -q "authMiddleware"; then
            sed -i "${LINE}s|$endpoint|$endpoint, authMiddleware|" server.ts
            echo "   ✅ authMiddleware adicionado: $endpoint"
        fi
    fi
done
echo ""

echo "6️⃣ Corrigindo query SQL..."
sed -i 's/WHERE chat_id = (SELECT chat_id FROM whatsapp_chats WHERE id = $1)/WHERE chat_id = (SELECT chat_id FROM whatsapp_chats WHERE id = $2)/g' server.ts
sed -i 's/ORDER BY created_at ASC`, *\[id\]/ORDER BY created_at ASC`, [id, id]/g' server.ts
echo "✅ Query SQL corrigida"
echo ""

echo "7️⃣ Recompilando..."
cd /var/www/govchat/backend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ COMPILAÇÃO OK!"
    pm2 restart govchat-backend
    sleep 4
    pm2 logs govchat-backend --lines 10 --nostream
    echo ""
    echo "🎉 SISTEMA RESTAURADO E FUNCIONAL!"
else
    echo "❌ FALHOU!"
    exit 1
fi
