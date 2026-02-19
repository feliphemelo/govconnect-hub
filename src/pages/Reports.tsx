import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/apiClient";
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ReportData {
  totalContacts: number;
  totalConversations: number;
  activeConversations: number;
  closedConversations: number;
  averageResponseTime: number;
  userPerformance: Array<{
    name: string;
    conversations: number;
    averageTime: number;
  }>;
  conversationsByStatus: Array<{
    name: string;
    value: number;
  }>;
  conversationsByDay: Array<{
    date: string;
    conversations: number;
    messages: number;
  }>;
}

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  secondary: "#6366f1",
};

const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger];

export default function Reports() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData>({
    totalContacts: 0,
    totalConversations: 0,
    activeConversations: 0,
    closedConversations: 0,
    averageResponseTime: 0,
    userPerformance: [],
    conversationsByStatus: [],
    conversationsByDay: [],
  });

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Load contacts
      const contactsData = await apiClient.contacts.list();
      const totalContacts = contactsData.total || contactsData.contacts?.length || 0;

      // Load conversations
      const conversationsData = await apiClient.conversations.list();
      const conversations = conversationsData.conversations || [];

      const activeConversations = conversations.filter(
        (c: any) => c.status === "open" || c.status === "in_progress"
      ).length;
      const closedConversations = conversations.filter(
        (c: any) => c.status === "closed"
      ).length;

      // Calculate conversations by status
      const statusCounts: Record<string, number> = {};
      conversations.forEach((conv: any) => {
        statusCounts[conv.status] = (statusCounts[conv.status] || 0) + 1;
      });

      const conversationsByStatus = Object.entries(statusCounts).map(
        ([name, value]) => ({
          name: name === "open" ? "Abertas" : name === "in_progress" ? "Em Progresso" : "Fechadas",
          value,
        })
      );

      // Mock daily data (last 7 days)
      const conversationsByDay = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
          conversations: Math.floor(Math.random() * 20) + 5,
          messages: Math.floor(Math.random() * 100) + 20,
        };
      });

      // Mock user performance
      const profiles = await apiClient.profiles.list();
      const userPerformance = (profiles.profiles || []).slice(0, 5).map((profile: any) => ({
        name: profile.full_name || "Sem nome",
        conversations: Math.floor(Math.random() * 50) + 10,
        averageTime: Math.floor(Math.random() * 20) + 5,
      }));

      setData({
        totalContacts,
        totalConversations: conversations.length,
        activeConversations,
        closedConversations,
        averageResponseTime: 8.5, // Mock
        userPerformance,
        conversationsByStatus,
        conversationsByDay,
      });
    } catch (error) {
      console.error("❌ Error loading report data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [period]);

  const statCards = [
    {
      title: "Total de Contatos",
      value: data.totalContacts,
      icon: Users,
      color: COLORS.primary,
      trend: "+12%",
    },
    {
      title: "Conversas Ativas",
      value: data.activeConversations,
      icon: MessageSquare,
      color: COLORS.success,
      trend: "+8%",
    },
    {
      title: "Tempo Médio Resposta",
      value: `${data.averageResponseTime}min`,
      icon: Clock,
      color: COLORS.warning,
      trend: "-15%",
    },
    {
      title: "Taxa de Resolução",
      value: `${Math.round((data.closedConversations / (data.totalConversations || 1)) * 100)}%`,
      icon: CheckCircle2,
      color: COLORS.success,
      trend: "+5%",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">
            Análise de desempenho e estatísticas do sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando relatórios...
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold mt-2">{stat.value}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="w-4 h-4 text-success" />
                        <span className="text-sm text-success">{stat.trend}</span>
                      </div>
                    </div>
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${stat.color}20` }}
                    >
                      <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversations Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Conversas ao Longo do Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.conversationsByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="conversations"
                      stroke={COLORS.primary}
                      name="Conversas"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="messages"
                      stroke={COLORS.success}
                      name="Mensagens"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversations by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Conversas por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.conversationsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.conversationsByStatus.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* User Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance por Agente</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.userPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="conversations"
                    fill={COLORS.primary}
                    name="Conversas Atendidas"
                  />
                  <Bar
                    dataKey="averageTime"
                    fill={COLORS.secondary}
                    name="Tempo Médio (min)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Métricas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <div>
                      <p className="font-medium">Conversas Finalizadas</p>
                      <p className="text-sm text-muted-foreground">
                        Total de atendimentos concluídos
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-lg px-4 py-1">
                    {data.closedConversations}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Conversas em Andamento</p>
                      <p className="text-sm text-muted-foreground">
                        Atendimentos ativos no momento
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    {data.activeConversations}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-warning" />
                    <div>
                      <p className="font-medium">Tempo Médio de Resposta</p>
                      <p className="text-sm text-muted-foreground">
                        Tempo para primeira resposta
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-1">
                    {data.averageResponseTime} min
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
