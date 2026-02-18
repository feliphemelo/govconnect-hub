#!/bin/bash
#
# Script de Verificação Pré-Deploy - GovChat
#
# Verifica se o projeto está pronto para deploy
#

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { 
    echo -e "${YELLOW}[⚠]${NC} $1"
    ((WARNINGS++))
}
log_error() { 
    echo -e "${RED}[✗]${NC} $1"
    ((ERRORS++))
}

echo "=========================================="
echo "  🔍 GovChat - Verificação Pré-Deploy"
echo "=========================================="
echo ""

# 1. Verificar Node.js
log_info "Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | sed 's/v//')
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)
    
    if [ "$MAJOR_VERSION" -ge 18 ]; then
        log_success "Node.js $NODE_VERSION instalado"
    else
        log_error "Node.js $NODE_VERSION é muito antigo. Requer v18+"
    fi
else
    log_error "Node.js não instalado"
fi

# 2. Verificar NPM
log_info "Verificando NPM..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    log_success "NPM $NPM_VERSION instalado"
else
    log_error "NPM não instalado"
fi

# 3. Verificar package.json
log_info "Verificando package.json..."
if [ -f "package.json" ]; then
    log_success "package.json encontrado"
    
    # Verificar scripts necessários
    if grep -q '"build"' package.json; then
        log_success "Script 'build' configurado"
    else
        log_error "Script 'build' não encontrado em package.json"
    fi
else
    log_error "package.json não encontrado"
fi

# 4. Verificar .env
log_info "Verificando variáveis de ambiente..."
if [ -f ".env" ]; then
    log_success "Arquivo .env encontrado"
    
    # Verificar variáveis obrigatórias
    if grep -q "VITE_SUPABASE_URL" .env && [ -n "$(grep VITE_SUPABASE_URL .env | cut -d= -f2 | tr -d '\"')" ]; then
        log_success "VITE_SUPABASE_URL configurada"
    else
        log_error "VITE_SUPABASE_URL não configurada"
    fi
    
    if grep -q "VITE_SUPABASE_PUBLISHABLE_KEY" .env && [ -n "$(grep VITE_SUPABASE_PUBLISHABLE_KEY .env | cut -d= -f2 | tr -d '\"')" ]; then
        log_success "VITE_SUPABASE_PUBLISHABLE_KEY configurada"
    else
        log_error "VITE_SUPABASE_PUBLISHABLE_KEY não configurada"
    fi
    
    if grep -q "VITE_SUPABASE_PROJECT_ID" .env && [ -n "$(grep VITE_SUPABASE_PROJECT_ID .env | cut -d= -f2 | tr -d '\"')" ]; then
        log_success "VITE_SUPABASE_PROJECT_ID configurada"
    else
        log_warning "VITE_SUPABASE_PROJECT_ID não configurada"
    fi
else
    log_error "Arquivo .env não encontrado"
    log_info "Execute: cp .env.production.template .env"
fi

# 5. Verificar node_modules
log_info "Verificando dependências..."
if [ -d "node_modules" ]; then
    log_success "node_modules existe"
    
    MODULE_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
    log_info "  $MODULE_COUNT módulos instalados"
else
    log_warning "node_modules não encontrado. Execute: npm install"
fi

# 6. Testar build
log_info "Testando build..."
if npm run build &> /tmp/build-test.log; then
    log_success "Build executado com sucesso"
    
    # Verificar tamanho do build
    if [ -d "dist" ]; then
        BUILD_SIZE=$(du -sh dist | cut -f1)
        log_info "  Tamanho do build: $BUILD_SIZE"
        
        # Verificar se index.html existe
        if [ -f "dist/index.html" ]; then
            log_success "  index.html gerado"
        else
            log_error "  index.html não encontrado em dist/"
        fi
        
        # Verificar assets
        if [ -d "dist/assets" ]; then
            ASSET_COUNT=$(find dist/assets -type f | wc -l)
            log_success "  $ASSET_COUNT assets gerados"
        else
            log_warning "  Diretório assets não encontrado"
        fi
    fi
else
    log_error "Build falhou"
    log_info "  Ver detalhes: cat /tmp/build-test.log"
fi

# 7. Verificar Git
log_info "Verificando Git..."
if [ -d ".git" ]; then
    log_success "Repositório Git inicializado"
    
    BRANCH=$(git branch --show-current)
    log_info "  Branch atual: $BRANCH"
    
    # Verificar mudanças não comitadas
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        log_warning "Existem mudanças não comitadas"
        git status --short | sed 's/^/    /'
    else
        log_success "  Sem mudanças pendentes"
    fi
    
    # Verificar se está sincronizado com remote
    if git remote &> /dev/null; then
        REMOTE=$(git remote -v | head -1 | awk '{print $2}')
        log_info "  Remote: $REMOTE"
        
        if ! git fetch --dry-run &> /dev/null; then
            log_warning "Não foi possível verificar remote"
        fi
    fi
else
    log_warning "Não é um repositório Git"
fi

# 8. Verificar TypeScript/ESLint
log_info "Verificando qualidade de código..."

# TypeScript
if [ -f "tsconfig.json" ]; then
    log_success "TypeScript configurado"
    
    if command -v tsc &> /dev/null; then
        if npm run build &> /dev/null; then
            log_success "  Sem erros de TypeScript"
        else
            log_warning "  Possíveis erros de TypeScript"
        fi
    fi
else
    log_info "TypeScript não configurado"
fi

# ESLint
if [ -f "eslint.config.js" ] || [ -f ".eslintrc" ] || [ -f ".eslintrc.js" ]; then
    log_success "ESLint configurado"
    
    if command -v eslint &> /dev/null || npm run lint &> /dev/null 2>&1; then
        LINT_OUTPUT=$(npm run lint 2>&1 || true)
        ERROR_COUNT=$(echo "$LINT_OUTPUT" | grep -o "[0-9]* error" | head -1 | grep -o "[0-9]*" || echo "0")
        WARN_COUNT=$(echo "$LINT_OUTPUT" | grep -o "[0-9]* warning" | head -1 | grep -o "[0-9]*" || echo "0")
        
        if [ "$ERROR_COUNT" -gt 0 ]; then
            log_warning "  $ERROR_COUNT erros de linting"
        else
            log_success "  Sem erros de linting"
        fi
        
        if [ "$WARN_COUNT" -gt 0 ]; then
            log_info "  $WARN_COUNT warnings de linting"
        fi
    fi
fi

# 9. Verificar testes
log_info "Verificando testes..."
if [ -d "src/test" ] || [ -d "tests" ] || [ -d "__tests__" ]; then
    log_success "Diretório de testes encontrado"
    
    if grep -q '"test"' package.json; then
        log_success "Script 'test' configurado"
        
        if npm test &> /tmp/test-output.log 2>&1; then
            log_success "  Testes passaram"
        else
            log_warning "  Alguns testes falharam"
            log_info "  Ver detalhes: cat /tmp/test-output.log"
        fi
    else
        log_warning "Script 'test' não configurado"
    fi
else
    log_info "Nenhum teste encontrado"
fi

# 10. Verificar configuração do Nginx (se existir)
log_info "Verificando configuração do Nginx..."
if [ -f "scripts/nginx-govchat.conf" ]; then
    log_success "Arquivo nginx-govchat.conf encontrado"
else
    log_warning "Arquivo nginx-govchat.conf não encontrado"
fi

# 11. Verificar documentação
log_info "Verificando documentação..."
if [ -f "README.md" ]; then
    log_success "README.md encontrado"
else
    log_warning "README.md não encontrado"
fi

if [ -f "DEPLOY.md" ] || [ -f "docs/DEPLOY_VPS.md" ]; then
    log_success "Documentação de deploy encontrada"
else
    log_warning "Documentação de deploy não encontrada"
fi

# 12. Resumo final
echo ""
echo "=========================================="
echo "  📋 RESUMO DA VERIFICAÇÃO"
echo "=========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    log_success "Sistema pronto para deploy!"
    echo ""
    echo "Próximos passos:"
    echo "  1. Commit e push das mudanças"
    echo "  2. Execute o deploy: ./scripts/vps-setup.sh"
    echo "  3. Configure variáveis de ambiente na VPS"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    log_warning "Sistema com $WARNINGS avisos, mas pode fazer deploy"
    echo ""
    echo "Recomendado corrigir os avisos antes do deploy."
    exit 0
else
    log_error "Encontrados $ERRORS erros e $WARNINGS avisos"
    echo ""
    echo "❌ Corrija os erros antes de fazer deploy!"
    exit 1
fi
