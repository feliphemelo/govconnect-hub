# Instalação NextPlan - Método Alternativo

## Problema: Cache do GitHub raw.githubusercontent.com

Se você está recebendo o erro `cho: command not found`, o GitHub pode estar servindo uma versão antiga em cache.

---

## ✅ SOLUÇÃO 1: Download Direto com wget (RECOMENDADO)

```bash
# 1. Baixar o instalador
wget https://github.com/feliphemelo/govconnect-hub/raw/main/install-nextplan.sh

# 2. Tornar executável
chmod +x install-nextplan.sh

# 3. Executar
sudo ./install-nextplan.sh
```

---

## ✅ SOLUÇÃO 2: Usar cache-bust na URL

```bash
curl -sSL "https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install-nextplan.sh?$(date +%s)" | sudo bash
```

---

## ✅ SOLUÇÃO 3: Clonar o repositório

```bash
# 1. Clonar repo
git clone https://github.com/feliphemelo/govconnect-hub.git

# 2. Entrar no diretório
cd govconnect-hub

# 3. Executar instalador
sudo bash install-nextplan.sh
```

---

## ✅ SOLUÇÃO 4: Aguardar 10 minutos (cache expire)

O cache do GitHub raw expira em ~10 minutos. Aguarde e tente novamente:

```bash
curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install-nextplan.sh | sudo bash
```

---

## 🔍 Verificar se o Arquivo Está Correto

Antes de executar, verifique se não há erros:

```bash
# Baixar e validar
curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install-nextplan.sh > test.sh
bash -n test.sh && echo "OK" || echo "ERRO"
```

---

## 🎯 Recomendação

**Use a SOLUÇÃO 1** (wget) pois:
- ✅ Não depende de cache
- ✅ Baixa arquivo direto do GitHub
- ✅ Sempre pega versão mais recente
- ✅ Permite verificar antes de executar

---

## 🔑 Credenciais (após instalação)

- **URL**: https://atendimento.nextplan.tec.br
- **Email**: feliphe@nextplan.tec.br
- **Senha**: Admin@2026

---

## ⏱️ Tempo de Instalação

~15 minutos (automatizado)

---

## 📞 Suporte

Se o problema persistir, entre em contato com o desenvolvedor.
