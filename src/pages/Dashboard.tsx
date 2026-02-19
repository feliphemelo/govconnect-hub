import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, Bot, FileText, Clock, CircleDot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  totalContacts: number;
  activeConversations: number;
  closedToday: number;
  totalProtocols: number;
}

interface AgentStatus {
  full_name: string;
  status: string;
  active_count: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ 
    totalContacts: 0, 
    activeConversations: 0, 
    closedToday: 0, 
    totalProtocols: 0 
  });
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const load = async () => {
      try {
        console.log('🔵 Dashboard: Loading data...');
        
        // Carregar dados básicos das APIs
        const [contactsRes, conversationsRes, profilesRes] = await Promise.all([
          fetch('https://atendimento.nextplan.tec.br/api/contacts', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('govchat_token')}`
            }
          }).then(r => r.json()),
          fetch('https://atendimento.nextplan.tec.br/api/conversations', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('govchat_token')}`
            }
          }).then(r => r.json()),
          fetch('https://atendimento.nextplan.tec.br/api/profiles', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('govchat_token')}`
            }
          }).then(r => r.json()),
        ]);

        console.log('🟢 Contacts:', contactsRes);
        console.log('🟢 Conversations:', conversationsRes);
        console.log('🟢 Profiles:', profilesRes);

        // Calcular estatísticas
        const contacts = contactsRes.contacts || [];
        const conversations = conversationsRes.conversations || [];
        const profiles = profilesRes.profiles || [];

        const activeConvs = conversations.filter((c: any) => c.status === 'active').length;
        const today = new Date().toISOString().split('T')[0];
        const closedToday = conversations.filter((c: any) => 
          c.status === 'closed' && c.closed_at?.startsWith(today)
        ).length;

        setStats({
          totalContacts: contacts.length,
          activeConversations: activeConvs,
          closedToday: closedToday,
          totalProtocols: conversations.length,
        });

        // Status dos agentes
        const agentData = profiles.map((p: any) => {
          const activeCount = conversations.filter((c: any) => 
            c.assigned_to === p.user_id && c.status === 'active'
          ).length;
          return {
            full_name: p.full_name,
            status: p.status || 'offline',
            active_count: activeCount,
          };
        });
        setAgents(agentData);

        console.log('🟢 Dashboard: Data loaded successfully');
        setLoading(false);
      } catch (err: any) {
        console.error('🔴 Dashboard error:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Tentar novamente
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    { label: "Contatos", value: stats.totalContacts, icon: Users, color: "text-blue-500" },
    { label: "Atendimentos Ativos", value: stats.activeConversations, icon: MessageSquare, color: "text-green-500" },
    { label: "Finalizados Hoje", value: stats.closedToday, icon: Bot, color: "text-purple-500" },
    { label: "Protocolos Gerados", value: stats.totalProtocols, icon: FileText, color: "text-orange-500" },
  ];

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema de atendimento</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <CircleDot className="w-3 h-3 text-green-500" />
          Sistema Online
        </Badge>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`w-5 h-5 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status dos Agentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Status dos Agentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum agente disponível
            </p>
          ) : (
            <div className="space-y-3">
              {agents.map((agent, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      agent.status === 'available' ? 'bg-green-500' :
                      agent.status === 'busy' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`} />
                    <span className="font-medium">{agent.full_name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={agent.status === 'available' ? 'default' : 'secondary'}>
                      {agent.status === 'available' ? 'Disponível' :
                       agent.status === 'busy' ? 'Ocupado' :
                       'Offline'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {agent.active_count} ativos
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mensagem de Boas-vindas */}
      <Card>
        <CardHeader>
          <CardTitle>🎉 Bem-vindo ao GovChat!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Sistema de atendimento ao cidadão funcionando perfeitamente. 
            Use o menu lateral para navegar entre contatos, conversas e configurações.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
