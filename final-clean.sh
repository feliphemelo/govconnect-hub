#!/bin/bash
echo "🔧 LIMPEZA FINAL COMPLETA"
echo "========================"
echo ""

cd /var/www/govchat/backend/src || exit 1

echo "1️⃣ Restaurando backup limpo..."
cp server.ts.backup_clean_20260220_014544 server.ts
echo "✅ Restaurado"
echo ""

echo "2️⃣ Removendo authMiddleware local COMPLETAMENTE..."
python3 << 'PY'
with open('server.ts', 'r') as f:
    lines = f.readlines()

result = []
skip_until = -1

for i, line in enumerate(lines):
    # Se devemos pular esta linha
    if i <= skip_until:
        continue
    
    # Detectar início: const authMiddleware = async
    if 'const authMiddleware' in line and '=' in line:
        # Contar quantas linhas pular
        brace_count = 0
        started = False
        for j in range(i, min(i+100, len(lines))):
            for char in lines[j]:
                if char == '{': 
                    brace_count += 1
                    started = True
                elif char == '}': 
                    brace_count -= 1
            
            if started and brace_count == 0:
                skip_until = j
                print(f"Removendo linhas {i+1} até {j+1}")
                break
        continue
    
    result.append(line)

with open('server.ts', 'w') as f:
    f.writelines(result)

print("✅ Local removido")
PY
echo ""

echo "3️⃣ Limpando linhas soltas ( }; )..."
sed -i '/^};$/d' server.ts
sed -i '/^\s*};$/d' server.ts
echo "✅ Limpo"
echo ""

echo "4️⃣ Removendo endpoints duplicados..."
python3 /var/www/govchat/remove-duplicate-endpoints.py
echo ""

echo "5️⃣ Adicionando import correto..."
sed -i '1i import { authMiddleware } from '"'"'./middleware/auth'"'"';' server.ts
echo "✅ Import adicionado"
echo ""

echo "6️⃣ Adicionando authMiddleware nos endpoints..."
sed -i "s|app.get('/api/conversations', async|app.get('/api/conversations', authMiddleware, async|" server.ts
sed -i "s|app.get('/api/conversations/:id/messages', async|app.get('/api/conversations/:id/messages', authMiddleware, async|" server.ts
sed -i "s|app.post('/api/conversations/:id/messages', async|app.post('/api/conversations/:id/messages', authMiddleware, async|" server.ts
echo "✅ authMiddleware adicionado"
echo ""

echo "7️⃣ Corrigindo SQL..."
sed -i 's/WHERE id = \$1)/WHERE id = $2)/g' server.ts
sed -i 's/\[id\]$/[id, id]/g' server.ts
echo "✅ SQL corrigido"
echo ""

echo "8️⃣ Compilando..."
cd /var/www/govchat/backend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ SUCESSO!"
    pm2 restart govchat-backend
    sleep 4
    pm2 logs govchat-backend --lines 10 --nostream
    echo ""
    echo "🎉 PRONTO: https://atendimento.nextplan.tec.br"
else
    echo "❌ FALHOU"
    exit 1
fi
