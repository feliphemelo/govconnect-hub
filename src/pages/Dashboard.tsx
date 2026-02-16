import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, Bot, FileText, Clock, CircleDot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { DashboardFilters, defaultFilters, type FilterValues } from "@/components/DashboardFilters";
interface DashboardStats {
  totalContacts: number;
  activeConversations: number;
  closedToday: number;
  totalProtocols: number;
}

interface QueueItem {
  sector_name: string;
  pending_count: number;
}

interface AgentStatus {
  full_name: string;
  status: string;
  active_count: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ totalContacts: 0, activeConversations: 0, closedToday: 0, totalProtocols: 0 });
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; contacts: number; chatbot: number; human: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [contactsRes, activeRes, closedRes, protocolsRes, sectorsRes, profilesRes] = await Promise.all([
        supabase.from("contacts").select("id", { count: "exact", head: true }),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("status", "closed").gte("closed_at", new Date().toISOString().split("T")[0]),
        supabase.from("conversations").select("id", { count: "exact", head: true }),
        supabase.from("sectors").select("id, name").eq("is_active", true),
        supabase.from("profiles").select("full_name, status, user_id").eq("is_active", true),
      ]);

      setStats({
        totalContacts: contactsRes.count ?? 0,
        activeConversations: activeRes.count ?? 0,
        closedToday: closedRes.count ?? 0,
        totalProtocols: protocolsRes.count ?? 0,
      });

      if (sectorsRes.data) {
        const queueData: QueueItem[] = [];
        for (const sector of sectorsRes.data) {
          const { count } = await supabase.from("conversations").select("id", { count: "exact", head: true }).eq("sector_id", sector.id).in("status", ["pending", "waiting"]);
          queueData.push({ sector_name: sector.name, pending_count: count ?? 0 });
        }
        setQueue(queueData);
      }

      if (profilesRes.data) {
        const agentData: AgentStatus[] = [];
        for (const p of profilesRes.data) {
          const { count } = await supabase.from("conversations").select("id", { count: "exact", head: true }).eq("assigned_to", p.user_id).eq("status", "active");
          agentData.push({ full_name: p.full_name, status: p.status ?? "offline", active_count: count ?? 0 });
        }
        setAgents(agentData);
      }

      // Monthly chart data (last 6 months)
      const months: { month: string; contacts: number; chatbot: number; human: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
        const monthLabel = d.toLocaleDateString("pt-BR", { month: "short" });

        const [{ count: c }, { count: cb }, { count: h }] = await Promise.all([
          supabase.from("contacts").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
          supabase.from("conversations").select("id", { count: "exact", head: true }).eq("channel", "whatsapp").gte("created_at", start).lte("created_at", end).is("assigned_to", null),
          supabase.from("conversations").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end).not("assigned_to", "is", null),
        ]);
        months.push({ month: monthLabel, contacts: c ?? 0, chatbot: cb ?? 0, human: h ?? 0 });
      }
      setMonthlyData(months);

      setLoading(false);
    };
    load();
  }, [user]);

  const statCards = [
    { label: "Contatos", value: stats.totalContacts, icon: Users, color: "text-primary" },
    { label: "Atendimentos Ativos", value: stats.activeConversations, icon: MessageSquare, color: "text-success" },
    { label: "Finalizados Hoje", value: stats.closedToday, icon: Bot, color: "text-info" },
    { label: "Protocolos Gerados", value: stats.totalProtocols, icon: FileText, color: "text-warning" },
  ];

  const statusColor: Record<string, string> = { online: "bg-success", offline: "bg-muted-foreground", busy: "bg-warning" };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do atendimento</p>
          </div>
          <DashboardFilters filters={filters} onChange={setFilters} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? "..." : stat.value.toLocaleString("pt-BR")}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Atendimentos Mensais</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <Tooltip />
              <Legend />
              <Bar dataKey="contacts" name="Novos Contatos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="chatbot" name="Chatbot" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="human" name="Humano" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-warning" /> Fila de Espera por Setor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground text-sm">Carregando...</p> : queue.length === 0 ? <p className="text-muted-foreground text-sm">Nenhum setor cadastrado.</p> : (
              <div className="space-y-3">
                {queue.map((q) => (
                  <div key={q.sector_name} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{q.sector_name}</span>
                    <Badge variant={q.pending_count > 0 ? "destructive" : "secondary"}>{q.pending_count} na fila</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleDot className="h-4 w-4 text-success" /> Status dos Atendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground text-sm">Carregando...</p> : agents.length === 0 ? <p className="text-muted-foreground text-sm">Nenhum atendente cadastrado.</p> : (
              <div className="space-y-3">
                {agents.map((a) => (
                  <div key={a.full_name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${statusColor[a.status] ?? statusColor.offline}`} />
                      <span className="text-sm font-medium">{a.full_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{a.active_count} ativos</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
