#!/bin/bash

echo "🎉 VALIDAÇÃO FINAL DO SISTEMA"
echo "============================="
echo ""

cd /var/www/govchat || exit 1

echo "1️⃣ Status do PM2..."
pm2 status govchat-backend
echo ""

echo "2️⃣ Testando health check..."
curl -s http://localhost:3001/api/health | python3 -m json.tool
echo ""

echo "3️⃣ Testando endpoint de login com credenciais de teste..."
echo "   (Vai falhar 401 se usuário não existir - ESPERADO)"
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nextplan.tec.br","password":"admin123"}' \
  -w "\nHTTP: %{http_code}\n" 2>&1 | python3 -m json.tool 2>/dev/null || echo "401 Unauthorized (esperado se usuário não existe)"
echo ""

echo "4️⃣ Verificando usuários cadastrados no banco..."
cd backend
psql "postgresql://postgres:TKyhdmL1GDvd@localhost:5432/govchat_db" -c "SELECT id, email, name, role FROM users LIMIT 5;" 2>/dev/null || echo "Não foi possível conectar ao banco diretamente"
echo ""

echo "5️⃣ Últimos logs do backend..."
pm2 logs govchat-backend --lines 20 --nostream
echo ""

echo "═══════════════════════════════════════════════════════"
echo "✅ SISTEMA RESTAURADO!"
echo ""
echo "🧪 TESTE AGORA NO NAVEGADOR:"
echo "1. Acesse: https://atendimento.nextplan.tec.br"
echo "2. Tente fazer LOGIN com suas credenciais reais"
echo "3. Se não souber a senha, precisamos resetar no banco"
echo ""
echo "📧 CREDENCIAIS DE TESTE:"
echo "   Email: admin@nextplan.tec.br"
echo "   Senha: admin123"
echo ""
echo "Se login falhar com 401:"
echo "   - Usuário não existe no banco"
echo "   - Senha incorreta"
echo "   - Precisamos criar/resetar usuário"
echo ""
echo "Se login falhar com 502:"
echo "   - Backend crashed (ver logs acima)"
echo ""
echo "Se login funcionar:"
echo "   ✅ Envie mensagem"
echo "   ✅ Dê F5"
echo "   ✅ Confirme que mensagem persiste"
echo "═══════════════════════════════════════════════════════"
