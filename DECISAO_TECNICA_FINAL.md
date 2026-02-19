# 🔴 DECISÃO TÉCNICA FINAL - Sistema WhatsApp

## Data: 2026-02-19

## ❌ Problema Identificado

Após 3 horas de debug, identificamos:

### Commit `1bdf246` (FUNCIONA ✅)
- ✅ WhatsApp conecta
- ✅ QR Code funciona
- ✅ Mensagens são recebidas
- ❌ Sessões em arquivo (perdidas ao reiniciar)

### Commits `a8342c2` → `6544608` (NÃO FUNCIONA ❌)
- ❌ Erro: `"The "data" argument must be of type string... Received an instance of Object"`
- ❌ Conexão fecha imediatamente após QR Code
- ✅ Persistência em banco implementada
- ❌ Bug não identificado após 3 horas de debug

## 🎯 Decisão: ROLLBACK para commit funcional

```bash
git reset --hard 1bdf246
```

## 📊 Justificativa

| Critério | `1bdf246` | `a8342c2+` |
|----------|-----------|------------|
| **Conecta WhatsApp** | ✅ SIM | ❌ NÃO |
| **Recebe mensagens** | ✅ SIM | ❌ NÃO |
| **Persistência** | ❌ NÃO | ⚠️ IMPLEMENTADA MAS BUGADA |
| **Estabilidade** | ✅ ALTA | ❌ BAIXA |
| **Tempo de debug** | - | ⏱️ 3+ horas |

## 🚀 Próximos passos (FUTURO)

1. Criar branch `feat/database-auth-state` a partir de `a8342c2`
2. Investigar em ambiente de DEV (não produção)
3. Identificar exatamente onde o objeto não está sendo stringificado
4. Testar exaustivamente antes de merge

## 📝 Comandos para o VPS

```bash
cd /var/www/govchat

# Parar backend
pm2 stop govchat-backend

# Limpar banco (credenciais bugadas)
PGPASSWORD='jjROqoI9CRXKYqxsYc0CGkXFS' psql -h localhost -U govchat_user -d govchat_nextplan << 'SQL'
DELETE FROM baileys_keys;
UPDATE whatsapp_instances SET status = 'disconnected', retries = 0, qr_code = NULL;
SELECT 'Banco limpo!' as status;
SQL

# Fazer rollback
git reset --hard 1bdf246

# Rebuild
cd backend
npm install
npm run build

# Restart
cd ..
pm2 restart govchat-backend

# Ver logs
pm2 logs govchat-backend
```

## ✅ Resultado esperado

- ✅ WhatsApp conecta imediatamente após escanear QR Code
- ✅ Mensagens recebidas e processadas
- ⚠️ Sessão perdida ao reiniciar backend (ACEITO temporariamente)

## 🔍 Análise do bug

O erro ocorre quando o Baileys tenta **ler** as credenciais salvas no banco:

```
✅ Credenciais salvas para instância: eec7773e...
❌ Conexão fechada: "The "data" argument must be of type string..."
```

**Hipótese:** O problema não está em `authState.ts`, mas sim em algum evento do Baileys que tenta **processar** as credenciais carregadas e recebe um objeto JavaScript não serializado.

**Local provável:** `wbotMessageListener.ts` ou algum handler de eventos do Baileys.

**Solução futura:** Adicionar serialização/desserialização em TODOS os pontos onde dados são passados para o Baileys, não apenas em `authState.ts`.

---

**Versão:** 2.4.4
**Autor:** GovChat Team
**Status:** ✅ DECISÃO FINAL APROVADA
