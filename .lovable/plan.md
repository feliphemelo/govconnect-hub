

# SaaS Multi-tenant — Gateway WhatsApp Governamental (White-label)

Plataforma completa de atendimento multicanal para administração pública, inspirada no Whaticket, com multi-tenancy, IA integrada e APIs oficiais simuladas.

---

## Fase 1 — Fundação: Autenticação, Multi-tenancy e Layout Base

### Banco de Dados Multi-tenant (Supabase)
- Tabelas core: `companies` (tenants), `profiles`, `user_roles`, `sectors`, `holidays`, `business_hours`
- RLS (Row Level Security) isolando dados por tenant em todas as tabelas
- Roles: Admin, Gerente de Setor, Atendente, Disparador, Referenciado

### Autenticação Segura
- Tela de login com Captcha (hCaptcha/reCaptcha)
- Suporte a 2FA/OTP via aplicativo autenticador (Google Authenticator)
- Recuperação de senha via e-mail
- Log de acessos com IP, data e hora

### Layout e Navegação
- Sidebar responsiva com navegação por módulos
- Modo Dark/Light toggle
- Design Mobile First com Tailwind CSS e Lucide Icons
- Header com informações do tenant, usuário logado e notificações

---

## Fase 2 — Dashboard e Gestão Administrativa

### Dashboard em Tempo Real
- Contadores: contatos registrados, atendimentos via chatbot, atendimentos ao vivo, protocolos gerados
- Fila de espera por setor com tempo de espera
- Status dos atendentes (online/offline/ocupado)
- Gráficos de atendimentos (mensal, por tipo)

### Painel Administrativo
- CRUD de setores com horários de expediente diferenciados
- Cadastro de feriados (base nacional pré-carregada + customizáveis)
- Gestão de usuários/atendentes com permissões granulares
- Configuração de expediente por departamento
- Aceite de termos LGPD no primeiro atendimento

---

## Fase 3 — Chat e Atendimento ao Vivo

### Interface de Chat (Estilo Mensageria)
- Chat em tempo real (Supabase Realtime) entre operador e cidadão
- Suporte a anexos: imagens, PDF, vídeo, áudio, documentos
- Transcrição de áudio para texto (integração com ElevenLabs STT)
- Mensagens pré-definidas/respostas rápidas por setor
- Geração automática de protocolo de atendimento

### Gestão de Filas
- Fila de espera por setor com controle de tempo
- Transferência de atendimento entre operadores com histórico completo
- Alerta sonoro para atendimentos em espera
- Atendimento ativo (operador inicia conversa) e receptivo
- Finalização com mensagem personalizada

### Contatos
- Cadastro automático de cidadãos
- Bloqueio/desbloqueio de contatos
- Histórico completo de conversas por contato

---

## Fase 4 — Chatbot e Automação

### Construtor de Chatbot
- Editor visual de menus com subitens (lista ou botões)
- Mensagem de boas-vindas personalizável (texto, imagem, áudio, vídeo)
- Mensagens de retorno, despedida e erro configuráveis
- Avisos de utilidade pública com data de expiração
- Chaves alfanuméricas por item de menu (mín. 3 por item)
- Encaminhamento: outro menu, setor humano, formulário, mensagem direta, pesquisa

### Formulários
- Criação de formulários com perguntas abertas, fechadas e afirmativas
- Captura de localização (latitude/longitude)
- Formulários anônimos (sem expor número do cidadão)
- Encaminhamento por e-mail ou número externo

### Integração WhatsApp (Simulada)
- Camada de serviço simulando API SERPRO Business e NotificameHub
- Endpoints mock para envio/recebimento de mensagens
- Preparado para substituição por APIs reais

---

## Fase 5 — Módulo de IA

### Assistente Virtual com IA
- Integração via Lovable AI (Gemini/GPT) para respostas automáticas
- Modos: Passivo (acionado por comando) e Ativo (automático, sem menu)
- Personalidade configurável: Normal, Formal ou Descontraída
- Nome e comando de acionamento personalizáveis

### Base de Conhecimento
- Treinamento via: texto manual, website, documentos PDF e vídeo
- Classificação por assuntos
- Limite configurável de interações mensais por tenant (ex: 2.500)

---

## Fase 6 — Grupos, Disparos e Enquetes

### Grupos Temáticos
- Criação ilimitada de grupos abertos/fechados
- URL personalizada de convite
- Disparo de mensagens com texto, imagem, links, áudio, arquivos
- Formatação: negrito, itálico e emojis
- Agendamento de envios
- Comunidades e canais para múltiplos grupos

### Enquetes e Pesquisas
- Criação ilimitada com data de início/término
- Perguntas afirmativas (sim/não) e fechadas (lista de opções)
- Relatório de resultados com gráficos (pizza/barras)

### Envio Avulso de Notificações
- SMS via short code (5 dígitos), até 160 caracteres
- Limite mensal configurável por tenant
- Relatório de envios com filtros

---

## Fase 7 — Assinatura Eletrônica

- Envio de documentos PDF para assinatura via WhatsApp
- Fluxo de concordância/discordância pelo cidadão
- Geração de QR Code de autenticidade no documento assinado
- Download do documento original e assinado
- Registro completo do processo de assinatura

---

## Fase 8 — Relatórios e Analytics

### Relatórios Gerenciais
- Atendimentos realizados (tempo, operador, setor, protocolo)
- Avaliação NPS (notas 1-10) por setor e operador
- Média de notas geral, últimos 90 dias, por setor
- Atendimentos perdidos (cidadãos sem atendimento)
- Panorama de atendentes (login, status, fila, realizados)
- Contatos bloqueados
- Logs de acesso (usuário, data, hora, IP)
- Gráficos mensais: novos contatos, chatbot, humano (cidadão/servidor)
- Tentativas de chamada áudio/vídeo
- Potencial de uso da plataforma

---

## Fase 9 — Sistema de Créditos e Webhooks

### Carteira de Créditos
- Saldo por tenant com desconto por mensagem template enviada
- Painel de consumo e histórico de transações
- Alertas de saldo baixo

### Webhooks
- Interface para configurar webhooks de entrada e saída (POST/GET)
- Compatibilidade com n8n e Typebot
- Logs de execução de webhooks
- Integração com CRM externo via webservices

---

## Stack Técnica
- **Frontend:** React + TypeScript + Tailwind CSS + Lucide Icons
- **Backend:** Supabase (Auth, Database, Edge Functions, Realtime, Storage)
- **IA:** Lovable AI Gateway (Gemini/GPT)
- **Transcrição:** ElevenLabs STT
- **Multi-tenancy:** RLS por company_id em todas as tabelas
- **Tema:** Dark/Light mode, Mobile First, HTTPS

