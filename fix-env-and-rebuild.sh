#!/bin/bash
echo "🔧 Corrigindo .env e forçando rebuild completo..."

cd /var/www/govchat || exit 1

echo ""
echo "1️⃣  Removendo .env antigo..."
rm -f .env .env.local .env.production .env.development

echo ""
echo "2️⃣  Criando .env correto..."
cat > .env << 'ENDOFENV'
VITE_API_URL=https://atendimento.nextplan.tec.br/api
VITE_DOMAIN=atendimento.nextplan.tec.br
VITE_SUPABASE_URL=https://dummy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bW15IiwiaWF0IjowLCJleHAiOjk5OTk5OTk5OTl9.dummy
VITE_SUPABASE_PROJECT_ID=dummy
ENDOFENV

echo ""
echo "3️⃣  Verificando .env criado..."
cat .env
echo ""

echo ""
echo "4️⃣  Atualizando código do GitHub..."
git fetch origin
git reset --hard origin/main

echo ""
echo "5️⃣  Removendo TUDO (node_modules, dist, caches)..."
rm -rf node_modules/ dist/ .vite .cache node_modules/.cache .next

echo ""
echo "6️⃣  Reinstalando dependências..."
npm install

echo ""
echo "7️⃣  Verificando se .env ainda existe..."
if [ ! -f .env ]; then
  echo "⚠️  .env foi removido, recriando..."
  cat > .env << 'ENDOFENV2'
VITE_API_URL=https://atendimento.nextplan.tec.br/api
VITE_DOMAIN=atendimento.nextplan.tec.br
VITE_SUPABASE_URL=https://dummy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bW15IiwiaWF0IjowLCJleHAiOjk5OTk5OTk5OTl9.dummy
VITE_SUPABASE_PROJECT_ID=dummy
ENDOFENV2
fi
cat .env
echo ""

echo ""
echo "8️⃣  Buildando frontend (lendo .env)..."
NODE_ENV=production npm run build

echo ""
echo "9️⃣  Verificando se API_URL foi embutida no build..."
if grep -q "atendimento.nextplan.tec.br/api" dist/assets/*.js; then
  echo "✅ API_URL correto encontrado no build!"
else
  echo "❌ ERRO: API_URL não foi embutida no build!"
  echo "Conteúdo do .env:"
  cat .env
  exit 1
fi

echo ""
echo "🔟  Verificando se Supabase dummy foi embutido..."
if grep -q "dummy.supabase.co" dist/assets/*.js; then
  echo "✅ Supabase dummy encontrado no build!"
else
  echo "⚠️  Supabase dummy não encontrado (OK se não usar)"
fi

echo ""
echo "1️⃣1️⃣  Atualizando backend..."
cd backend
npm install
npm run build
pm2 restart govchat-backend

echo ""
echo "1️⃣2️⃣  Recarregando Nginx..."
systemctl reload nginx

echo ""
echo "======================================"
echo "✅  Correção completa!"
echo "======================================"
echo ""
echo "🌐  URL: https://atendimento.nextplan.tec.br"
echo "📧  Email: feliphe@nextplan.tec.br"
echo "🔑  Senha: Teikei9@"
echo ""
echo "⚠️  NO NAVEGADOR:"
echo "   1. CTRL+SHIFT+DEL (limpar cache)"
echo "   2. Fechar TODAS as abas"
echo "   3. Modo anônimo (CTRL+SHIFT+N)"
echo "   4. F12 → Console (verificar logs)"
echo ""
echo "✅  Deve chamar: https://atendimento.nextplan.tec.br/api"
echo "❌  NÃO deve chamar: pitpeesvawvvhacmivoh.supabase.co"
echo ""
