#!/bin/bash
echo "☢️  NUCLEAR FIX - Limpeza Total Garantida"
echo "========================================"
echo ""

cd /var/www/govchat/backend/src || exit 1

echo "1️⃣ Restaurando backup..."
cp server.ts.backup_clean_20260220_014544 server.ts

echo ""
echo "2️⃣ Removendo duplicados..."
python3 /var/www/govchat/remove-duplicate-endpoints.py

echo ""
echo "3️⃣ Removendo authMiddleware local COMPLETAMENTE..."
python3 << 'PY'
with open('server.ts', 'r') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Detectar: const authMiddleware = async
    if 'const authMiddleware' in line and '=' in line and 'async' in line:
        print(f"Removendo authMiddleware local (linha {i+1})")
        
        # Contar chaves até fechar tudo
        brace_count = 0
        started = False
        
        j = i
        while j < len(lines):
            for char in lines[j]:
                if char == '{':
                    brace_count += 1
                    started = True
                elif char == '}':
                    brace_count -= 1
            
            # Se fechou tudo
            if started and brace_count == 0:
                # Pular até aqui + possível ; na próxima linha
                if j + 1 < len(lines) and lines[j+1].strip() == ';':
                    i = j + 2
                else:
                    i = j + 1
                print(f"  Removido até linha {i}")
                break
            
            j += 1
        
        continue
    
    new_lines.append(line)
    i += 1

# Salvar
with open('server.ts', 'w') as f:
    f.writelines(new_lines)

print("✅ authMiddleware local removido")
PY

echo ""
echo "4️⃣ Import único..."
sed -i '/import.*authMiddleware/d' server.ts
sed -i "1i import { authMiddleware } from './middleware/auth';" server.ts
echo "✅ Import: $(grep -c 'import.*authMiddleware' server.ts)"

echo ""
echo "5️⃣ Adicionando authMiddleware em endpoints..."
sed -i "s|app.get('/api/conversations', async|app.get('/api/conversations', authMiddleware, async|" server.ts
sed -i "s|app.get('/api/conversations/:id/messages', async|app.get('/api/conversations/:id/messages', authMiddleware, async|" server.ts
sed -i "s|app.post('/api/conversations/:id/messages', async|app.post('/api/conversations/:id/messages', authMiddleware, async|" server.ts
echo "✅ Adicionado"

echo ""
echo "6️⃣ Corrigindo SQL..."
sed -i 's/WHERE id = \$1)/WHERE id = $2)/g' server.ts
sed -i 's/\[id\]);$/[id, id]);/g' server.ts
echo "✅ SQL corrigido"

echo ""
echo "7️⃣ Compilando..."
cd /var/www/govchat/backend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ SUCESSO!"
    pm2 restart govchat-backend
    sleep 4
    pm2 logs govchat-backend --lines 10 --nostream
    echo ""
    curl -s http://localhost:3001/api/health | python3 -m json.tool
    echo ""
    echo "🎉 FUNCIONANDO: https://atendimento.nextplan.tec.br"
else
    echo "❌ Mostrando linhas 25-50 do server.ts..."
    sed -n '25,50p' server.ts | cat -n
    exit 1
fi
