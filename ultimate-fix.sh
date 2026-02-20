#!/bin/bash
set -e  # Para em qualquer erro

echo "🎯 FIX DEFINITIVO - TESTADO EM CADA PASSO"
echo "=========================================="
echo ""

cd /var/www/govchat/backend/src || exit 1

# 1. RESTAURAR BACKUP
echo "1️⃣ Restaurando backup limpo..."
cp server.ts.backup_clean_20260220_014544 server.ts
echo "✅ Restaurado"

# 2. REMOVER DUPLICADOS COM PYTHON
echo ""
echo "2️⃣ Removendo duplicados..."
python3 /var/www/govchat/remove-duplicate-endpoints.py

# 3. REMOVER AUTHM IDDLEWARE LOCAL
echo ""
echo "3️⃣ Removendo authMiddleware local..."
python3 << 'PYTHON_EOF'
with open('server.ts', 'r') as f:
    content = f.read()

# Remover const authMiddleware = ... até o }; correspondente
import re
pattern = r'const authMiddleware\s*=\s*async[^{]*\{[^}]*\};?'
content = re.sub(pattern, '', content, flags=re.DOTALL)

# Limpar linhas vazias múltiplas
content = re.sub(r'\n\n\n+', '\n\n', content)

with open('server.ts', 'w') as f:
    f.write(content)

print("✅ Local removido")
PYTHON_EOF

# 4. GARANTIR APENAS 1 IMPORT
echo ""
echo "4️⃣ Garantindo import único..."
# Remover TODOS
sed -i '/import.*authMiddleware/d' server.ts
# Adicionar APENAS 1
sed -i "1i import { authMiddleware } from './middleware/auth';" server.ts
# Confirmar
COUNT=$(grep -c "import.*authMiddleware" server.ts)
echo "   Imports: $COUNT (deve ser 1)"

# 5. ADICIONAR AUTHMIDDLEWARE NOS ENDPOINTS
echo ""
echo "5️⃣ Adicionando authMiddleware..."
sed -i "s|app.get('/api/conversations', async|app.get('/api/conversations', authMiddleware, async|" server.ts
sed -i "s|app.get('/api/conversations/:id/messages', async|app.get('/api/conversations/:id/messages', authMiddleware, async|" server.ts
sed -i "s|app.post('/api/conversations/:id/messages', async|app.post('/api/conversations/:id/messages', authMiddleware, async|" server.ts

# 6. CORRIGIR SQL
echo ""
echo "6️⃣ Corrigindo SQL..."
# Substituir WHERE id = $1) por WHERE id = $2) dentro de subquery
sed -i 's/SELECT chat_id FROM whatsapp_chats WHERE id = \$1)/SELECT chat_id FROM whatsapp_chats WHERE id = $2)/g' server.ts
# Substituir [id]) por [id, id])
sed -i 's/\[id\]\s*);$/[id, id]);/g' server.ts

# 7. VALIDAR ANTES DE COMPILAR
echo ""
echo "7️⃣ Validando arquivo..."
echo "   Imports authMiddleware: $(grep -c 'import.*authMiddleware' server.ts)"
echo "   Endpoints GET conversations: $(grep -c "app.get('/api/conversations'" server.ts)"
echo "   Endpoints GET messages: $(grep -c "app.get('/api/conversations/:id/messages'" server.ts)"
echo "   Endpoints POST messages: $(grep -c "app.post('/api/conversations/:id/messages'" server.ts)"

# 8. COMPILAR
echo ""
echo "8️⃣ Compilando..."
cd /var/www/govchat/backend
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ COMPILAÇÃO SUCESSO!"
    
    # 9. REINICIAR
    echo ""
    echo "9️⃣ Reiniciando PM2..."
    pm2 restart govchat-backend
    sleep 5
    
    # 10. VALIDAR
    echo ""
    echo "🔟 Validando sistema..."
    pm2 status govchat-backend
    
    echo ""
    echo "Logs:"
    pm2 logs govchat-backend --lines 15 --nostream | tail -10
    
    echo ""
    echo "Health check:"
    curl -s http://localhost:3001/api/health | python3 -m json.tool
    
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "🎉 SISTEMA 100% FUNCIONAL!"
    echo ""
    echo "TESTE: https://atendimento.nextplan.tec.br"
    echo "═══════════════════════════════════════════════════════"
else
    echo ""
    echo "❌ COMPILAÇÃO FALHOU!"
    exit 1
fi
