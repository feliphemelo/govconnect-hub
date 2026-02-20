#!/bin/bash

echo "🔧 CORREÇÃO DO CAMINHO DO authMiddleware"
echo "========================================="
echo ""

cd /var/www/govchat/backend/src || exit 1

echo "1️⃣ Verificando imports atuais de authMiddleware..."
grep -n "import.*authMiddleware" server.ts
echo ""

echo "2️⃣ Procurando onde authMiddleware está definido..."
find . -type f -name "*.ts" -exec grep -l "authMiddleware" {} \;
echo ""

echo "3️⃣ Verificando se existe utils/auth.ts..."
if [ -f "./utils/auth.ts" ]; then
    echo "✅ Encontrado: utils/auth.ts"
    echo "   Verificando se tem authMiddleware..."
    grep -n "authMiddleware" utils/auth.ts | head -5
else
    echo "❌ Não encontrado: utils/auth.ts"
fi
echo ""

echo "4️⃣ Corrigindo import no server.ts..."
# Remove import incorreto
sed -i "/import.*authMiddleware.*from.*\.\/middleware\/auth/d" server.ts

# Verifica se authMiddleware já está importado de outro lugar
if grep -q "import.*authMiddleware" server.ts; then
    echo "✅ authMiddleware já está importado corretamente"
    grep -n "import.*authMiddleware" server.ts
else
    # Adiciona import correto após outros imports
    LINE=$(grep -n "import.*pool.*from.*config\/database" server.ts | cut -d: -f1)
    if [ ! -z "$LINE" ]; then
        sed -i "${LINE}a import { authMiddleware } from './utils/auth';" server.ts
        echo "✅ Import adicionado: import { authMiddleware } from './utils/auth';"
    else
        echo "⚠️  Não foi possível adicionar import automaticamente"
        echo "   Adicione manualmente: import { authMiddleware } from './utils/auth';"
    fi
fi
echo ""

echo "5️⃣ Removendo endpoints POST duplicados (sem authMiddleware)..."
# Contar quantos endpoints POST existem
COUNT=$(grep -c "app.post('/api/conversations/:id/messages'" server.ts)
echo "   Encontrados $COUNT endpoints POST"

if [ "$COUNT" -gt 1 ]; then
    echo "   Removendo duplicados..."
    
    # Criar arquivo temporário com apenas o último endpoint
    awk '
    /app\.post\(.*\/api\/conversations\/:id\/messages/ {
        if (buffer) {
            # Skip previous occurrence
            buffer = ""
        }
        buffer = $0
        in_endpoint = 1
        brace_count = 0
        next
    }
    in_endpoint {
        buffer = buffer "\n" $0
        # Count braces
        gsub(/[^{]/, "", tmp1=$0)
        brace_count += length(tmp1)
        gsub(/[^}]/, "", tmp2=$0)
        brace_count -= length(tmp2)
        
        if (brace_count == 0 && /^\}\);?$/) {
            in_endpoint = 0
            # Store complete endpoint
            saved_endpoint = buffer
            buffer = ""
        }
        next
    }
    {
        print
    }
    END {
        if (saved_endpoint) {
            print saved_endpoint
        }
    }
    ' server.ts > server.ts.tmp
    
    mv server.ts.tmp server.ts
    echo "✅ Duplicados removidos!"
else
    echo "✅ Apenas 1 endpoint encontrado (OK)"
fi
echo ""

echo "6️⃣ Verificando resultado final..."
echo "   Endpoints POST restantes:"
grep -n "app.post('/api/conversations/:id/messages'" server.ts
echo ""

echo "7️⃣ Mostrando as primeiras linhas do endpoint..."
LINE=$(grep -n "app.post('/api/conversations/:id/messages'" server.ts | cut -d: -f1 | head -1)
if [ ! -z "$LINE" ]; then
    sed -n "${LINE},$((LINE+10))p" server.ts
fi
echo ""

echo "8️⃣ Recompilando..."
cd /var/www/govchat/backend || exit 1
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ COMPILAÇÃO BEM-SUCEDIDA!"
    echo ""
    echo "9️⃣ Reiniciando PM2..."
    pm2 restart govchat-backend
    sleep 3
    pm2 status govchat-backend
    echo ""
    echo "🧪 Testando logs..."
    pm2 logs govchat-backend --lines 20 --nostream
else
    echo ""
    echo "❌ ERRO NA COMPILAÇÃO!"
    echo "   Verifique os erros acima"
    exit 1
fi

echo ""
echo "✅ CORREÇÃO CONCLUÍDA!"
echo ""
echo "🧪 TESTE AGORA:"
echo "1. Acesse: https://atendimento.nextplan.tec.br"
echo "2. Faça login"
echo "3. Envie uma mensagem"
echo "4. Dê F5 (refresh)"
echo "5. Verifique se a mensagem continua aparecendo"
echo ""
