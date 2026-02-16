import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Bot, FileText } from "lucide-react";

const stats = [
  { label: "Contatos", value: "1.234", icon: Users, color: "text-primary" },
  { label: "Atendimentos Hoje", value: "56", icon: MessageSquare, color: "text-success" },
  { label: "Via Chatbot", value: "128", icon: Bot, color: "text-info" },
  { label: "Protocolos", value: "3.456", icon: FileText, color: "text-warning" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do atendimento</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Fila de Espera por Setor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Nenhum atendimento na fila no momento.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
