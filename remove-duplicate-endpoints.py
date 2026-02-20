#!/usr/bin/env python3
"""
Script para remover endpoints duplicados do server.ts
Mantém apenas os últimos endpoints (mais recentes, que usam whatsapp_chats)
"""

import sys
import re
from datetime import datetime

def find_function_end(lines, start_line):
    """Encontra o fim de uma função contando chaves"""
    brace_count = 0
    started = False
    
    for i in range(start_line, len(lines)):
        line = lines[i]
        
        # Contar chaves
        for char in line:
            if char == '{':
                brace_count += 1
                started = True
            elif char == '}':
                brace_count -= 1
        
        # Se encontramos o fechamento completo
        if started and brace_count == 0:
            # Procurar pelo }); na mesma linha ou próximas
            if '});' in line:
                return i
            elif i + 1 < len(lines) and '});' in lines[i + 1]:
                return i + 1
            else:
                return i
    
    # Fallback
    return start_line + 100

def main():
    # Ler arquivo
    with open('server.ts', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print("🔍 Analisando server.ts...")
    print(f"   Total de linhas: {len(lines)}")
    print()
    
    # Encontrar todos os endpoints duplicados
    endpoints_to_find = [
        ("app.get('/api/conversations/:id/messages'", "GET messages"),
        ("app.post('/api/conversations/:id/messages'", "POST messages"),
    ]
    
    all_removals = set()
    
    for pattern, name in endpoints_to_find:
        # Encontrar todas as ocorrências
        occurrences = []
        for i, line in enumerate(lines):
            if pattern in line and line.strip().startswith('app.'):
                occurrences.append(i)
        
        if len(occurrences) == 0:
            print(f"⚠️  {name}: Nenhum endpoint encontrado")
            continue
        
        if len(occurrences) == 1:
            print(f"✅ {name}: Apenas 1 endpoint (linha {occurrences[0]+1})")
            continue
        
        print(f"🔧 {name}: {len(occurrences)} endpoints encontrados")
        print(f"   Linhas: {[l+1 for l in occurrences]}")
        
        # Remover todos exceto o último
        to_remove = occurrences[:-1]
        print(f"   Removendo: {[l+1 for l in to_remove]}")
        print(f"   Mantendo: linha {occurrences[-1]+1}")
        
        for start_line in to_remove:
            end_line = find_function_end(lines, start_line)
            print(f"      Linha {start_line+1} até {end_line+1} ({end_line-start_line+1} linhas)")
            
            for i in range(start_line, end_line + 1):
                all_removals.add(i)
        
        print()
    
    if not all_removals:
        print("✅ Nenhuma remoção necessária!")
        return 0
    
    print(f"📝 Total de linhas a remover: {len(all_removals)}")
    print()
    
    # Criar backup
    backup_name = f"server.ts.backup_clean_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    with open(backup_name, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print(f"💾 Backup criado: {backup_name}")
    print()
    
    # Criar novo conteúdo sem as linhas marcadas
    new_lines = [line for i, line in enumerate(lines) if i not in all_removals]
    
    print(f"📊 Estatísticas:")
    print(f"   Linhas originais: {len(lines)}")
    print(f"   Linhas removidas: {len(all_removals)}")
    print(f"   Linhas finais: {len(new_lines)}")
    print()
    
    # Salvar
    with open('server.ts', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print("✅ Arquivo atualizado com sucesso!")
    print()
    
    # Verificar endpoints restantes
    print("🔍 Verificando endpoints restantes...")
    for pattern, name in endpoints_to_find:
        count = sum(1 for line in new_lines if pattern in line and line.strip().startswith('app.'))
        status = "✅" if count == 1 else "⚠️"
        print(f"   {status} {name}: {count} endpoint(s)")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
