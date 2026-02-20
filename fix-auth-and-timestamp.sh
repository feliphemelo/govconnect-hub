#!/bin/bash

echo "🔧 CORREÇÃO COMPLETA DE AUTENTICAÇÃO E TIMESTAMP"
echo "================================================"
echo ""

cd /var/www/govchat/backend/src || exit 1

echo "1️⃣ Criando middleware/auth.ts (se não existir)..."
mkdir -p middleware

cat > middleware/auth.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { JWTPayload } from '../types';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Attach user info to request
    (req as any).user = payload;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};
EOF

echo "✅ middleware/auth.ts criado!"
echo ""

echo "2️⃣ Corrigindo timestamp em websocket.ts (linha 198)..."
sed -i '198s/const timestamp = Date.now();/const timestamp = new Date();/' websocket.ts
echo "✅ Timestamp corrigido para usar new Date()"
echo ""

echo "3️⃣ Verificando correção..."
sed -n '195,202p' websocket.ts
echo ""

echo "4️⃣ Corrigindo import no server.ts..."
# Remove imports incorretos
sed -i "/import.*authMiddleware.*from.*\.\/utils\/auth/d" server.ts

# Adiciona import correto
LINE=$(grep -n "import.*pool.*from.*config\/database" server.ts | cut -d: -f1 | head -1)
if [ ! -z "$LINE" ]; then
    sed -i "${LINE}a import { authMiddleware } from './middleware/auth';" server.ts
    echo "✅ Import adicionado na linha $((LINE+1))"
else
    # Fallback: adiciona após outros imports
    sed -i "1a import { authMiddleware } from './middleware/auth';" server.ts
    echo "✅ Import adicionado no início do arquivo"
fi
echo ""

echo "5️⃣ Verificando imports..."
grep -n "import.*authMiddleware" server.ts
echo ""

echo "6️⃣ Garantindo que apenas endpoints corretos têm authMiddleware..."
echo "   Endpoints encontrados:"
grep -n "app.post('/api/conversations/:id/messages'" server.ts
echo ""

echo "7️⃣ Compilando backend..."
cd /var/www/govchat/backend || exit 1
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ ERRO NA COMPILAÇÃO!"
    exit 1
fi

echo ""
echo "✅ COMPILAÇÃO BEM-SUCEDIDA!"
echo ""

echo "8️⃣ Reiniciando PM2..."
pm2 restart govchat-backend
sleep 5
pm2 status govchat-backend
echo ""

echo "9️⃣ Verificando logs (últimas 30 linhas)..."
pm2 logs govchat-backend --lines 30 --nostream
echo ""

echo "═══════════════════════════════════════════════════════"
echo "✅ CORREÇÃO CONCLUÍDA!"
echo ""
echo "🧪 TESTES:"
echo "1. Acesse: https://atendimento.nextplan.tec.br"
echo "2. Tente fazer LOGIN"
echo "3. Se login funcionar, envie mensagem"
echo "4. Dê F5 e veja se mensagem persiste"
echo ""
echo "📋 Se ainda houver problema:"
echo "   pm2 logs govchat-backend --err --lines 50"
echo "═══════════════════════════════════════════════════════"
