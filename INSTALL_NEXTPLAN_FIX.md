# 🔧 Solução para Instalação NextPlan

## ⚠️ Problema: 404 no GitHub Raw

O GitHub pode levar alguns minutos para atualizar o cache do raw.githubusercontent.com após um push.

---

## ✅ Soluções Alternativas

### **Opção 1: Download Direto + Execução (RECOMENDADO)**

```bash
# Baixar o instalador
wget https://github.com/feliphemelo/govconnect-hub/raw/main/install-nextplan.sh

# Tornar executável
chmod +x install-nextplan.sh

# Executar
sudo ./install-nextplan.sh
```

---

### **Opção 2: Clonar Repositório + Executar**

```bash
# Clonar o repositório
git clone https://github.com/feliphemelo/govconnect-hub.git

# Entrar no diretório
cd govconnect-hub

# Executar o instalador
sudo bash install-nextplan.sh
```

---

### **Opção 3: One-Liner com GitHub API**

```bash
curl -sSL $(curl -s https://api.github.com/repos/feliphemelo/govconnect-hub/contents/install-nextplan.sh | grep download_url | cut -d '"' -f 4) | sudo bash
```

---

### **Opção 4: Aguardar Cache do GitHub (5-10 minutos)**

```bash
# Aguardar e tentar novamente
curl -sSL https://raw.githubusercontent.com/feliphemelo/govconnect-hub/main/install-nextplan.sh | sudo bash
```

---

## 📋 Configurações Pré-Definidas

- **Domínio**: https://atendimento.nextplan.tec.br
- **Empresa**: NextPlan Tecnologia (Enterprise)
- **Superadmin**: feliphe@nextplan.tec.br / Admin@2026
- **Banco**: PostgreSQL local (govchat_nextplan)
- **SSL**: Let's Encrypt (automático)

---

## 🚀 Pós-Instalação

Após a instalação, as credenciais estarão em:
```bash
cat /var/www/govchat/NEXTPLAN_CREDENTIALS.txt
```

Acessar: https://atendimento.nextplan.tec.br

---

## 🔍 Verificar Status do Arquivo no GitHub

```bash
# Ver se o arquivo existe
curl -I https://github.com/feliphemelo/govconnect-hub/raw/main/install-nextplan.sh

# Baixar e visualizar
curl -sSL https://github.com/feliphemelo/govconnect-hub/raw/main/install-nextplan.sh | head -50
```

---

## 📞 Suporte

Se o problema persistir, use a **Opção 1** (download direto via wget) que sempre funciona.
