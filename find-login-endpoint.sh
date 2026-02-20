#!/bin/bash

echo "🔍 PROCURANDO ENDPOINT DE LOGIN"
echo "================================"
echo ""

cd /var/www/govchat/backend/src || exit 1

echo "1️⃣ Procurando todas as rotas de autenticação..."
grep -rn "login\|auth" . --include="*.ts" | grep -v node_modules | grep "app\.\|router\." | head -20
echo ""

echo "2️⃣ Procurando arquivos de rotas..."
find . -name "*route*" -o -name "*auth*" | grep -v node_modules
echo ""

echo "3️⃣ Verificando estrutura de pastas..."
ls -la
echo ""

echo "4️⃣ Procurando por POST de auth/login no server.ts..."
grep -n "post.*auth\|login" server.ts | head -10
echo ""

echo "5️⃣ Mostrando primeiras 50 linhas do server.ts..."
head -50 server.ts
echo ""

echo "6️⃣ Procurando imports e inicializações..."
grep -n "import\|const app\|app.use\|app.post\|app.get" server.ts | head -30
echo ""

echo "═══════════════════════════════════════════════════════"
echo "ENVIE TODO O OUTPUT!"
echo "═══════════════════════════════════════════════════════"
