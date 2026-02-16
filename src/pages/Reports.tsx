import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BarChart3, Star, Users, Shield, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DashboardFilters, defaultFilters, type FilterValues } from "@/components/DashboardFilters";

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [npsData, setNpsData] = useState<{ avg: number; count: number; bySector: { name: string; avg: number; count: number }[] }>({ avg: 0, count: 0, bySector: [] });
  const [agentStats, setAgentStats] = useState<{ name: string; total: number; active: number; status: string }[]>([]);
  const [accessLogs, setAccessLogs] = useState<{ action: string; ip_address: string | null; created_at: string }[]>([]);
  const [convStats, setConvStats] = useState({ total: 0, active: 0, pending: 0, closed: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [total, active, pending, closed] = await Promise.all([
        supabase.from("conversations").select("id", { count: "exact", head: true }),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("status", "closed"),
      ]);
      setConvStats({ total: total.count ?? 0, active: active.count ?? 0, pending: pending.count ?? 0, closed: closed.count ?? 0 });

      const { data: npsConvos } = await supabase.from("conversations").select("nps_score, sector_id").not("nps_score", "is", null);
      if (npsConvos && npsConvos.length > 0) {
        const scores = npsConvos.map((c) => c.nps_score!);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const { data: sectors } = await supabase.from("sectors").select("id, name");
        const bySector: { name: string; avg: number; count: number }[] = [];
        if (sectors) {
          for (const s of sectors) {
            const ss = npsConvos.filter((c) => c.sector_id === s.id).map((c) => c.nps_score!);
            if (ss.length > 0) bySector.push({ name: s.name, avg: ss.reduce((a, b) => a + b, 0) / ss.length, count: ss.length });
          }
        }
        setNpsData({ avg, count: npsConvos.length, bySector });
      }

      const { data: profiles } = await supabase.from("profiles").select("full_name, status, user_id, is_active");
      if (profiles) {
        const stats = [];
        for (const p of profiles) {
          const { count: totalC } = await supabase.from("conversations").select("id", { count: "exact", head: true }).eq("assigned_to", p.user_id);
          const { count: activeC } = await supabase.from("conversations").select("id", { count: "exact", head: true }).eq("assigned_to", p.user_id).eq("status", "active");
          stats.push({ name: p.full_name, total: totalC ?? 0, active: activeC ?? 0, status: p.status ?? "offline" });
        }
        setAgentStats(stats);
      }

      const { data: logs } = await supabase.from("access_logs").select("action, ip_address, created_at").order("created_at", { ascending: false }).limit(50);
      setAccessLogs(logs ?? []);
    };
    load();
  }, [user]);

  const exportCSV = (data: Record<string, any>[], filename: string) => {
    if (data.length === 0) { toast({ title: "Sem dados para exportar" }); return; }
    const headers = Object.keys(data[0]);
    const csv = [headers.join(","), ...data.map(row => headers.map(h => `"${row[h] ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    toast({ title: "CSV exportado" });
  };

  const exportPDF = (title: string) => {
    // Opens print dialog as simple PDF export
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(`<html><head><title>${title}</title><style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}</style></head><body>`);
    printWin.document.write(`<h1>${title}</h1><p>Exportado em: ${new Date().toLocaleString("pt-BR")}</p>`);
    const el = document.querySelector("[data-report-content]");
    if (el) printWin.document.write(el.innerHTML);
    printWin.document.write("</body></html>");
    printWin.document.close();
    printWin.print();
  };

  const statusColor: Record<string, string> = { online: "bg-success", offline: "bg-muted-foreground", busy: "bg-warning" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <DashboardFilters filters={filters} onChange={setFilters} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV(
            agentStats.map(a => ({ Nome: a.name, Status: a.status, Ativos: a.active, Total: a.total })),
            "relatorio-atendentes"
          )}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportPDF("Relatório Geral")}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </div>
      <div data-report-content>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="overview" className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" /> Geral</TabsTrigger>
            <TabsTrigger value="nps" className="gap-1.5 text-xs"><Star className="h-3.5 w-3.5" /> NPS</TabsTrigger>
            <TabsTrigger value="agents" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" /> Atendentes</TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5 text-xs"><Shield className="h-3.5 w-3.5" /> Acessos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { label: "Total de Protocolos", value: convStats.total, color: "text-primary" },
                { label: "Ativos", value: convStats.active, color: "text-success" },
                { label: "Aguardando", value: convStats.pending, color: "text-warning" },
                { label: "Finalizados", value: convStats.closed, color: "text-info" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle></CardHeader>
                  <CardContent><div className={`text-3xl font-bold ${s.color}`}>{s.value.toLocaleString("pt-BR")}</div></CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="nps">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Média Geral NPS</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">{npsData.avg ? npsData.avg.toFixed(1) : "—"}</div>
                  <p className="text-xs text-muted-foreground mt-1">{npsData.count} avaliações</p>
                </CardContent>
              </Card>
            </div>
            {npsData.bySector.length > 0 && (
              <Card className="mt-4">
                <CardHeader><CardTitle className="text-base">NPS por Setor</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Setor</TableHead><TableHead>Média</TableHead><TableHead>Avaliações</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {npsData.bySector.map((s) => (
                        <TableRow key={s.name}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell><Badge variant={s.avg >= 7 ? "default" : s.avg >= 5 ? "secondary" : "destructive"}>{s.avg.toFixed(1)}</Badge></TableCell>
                          <TableCell>{s.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="agents">
            <Card>
              <CardHeader><CardTitle className="text-base">Panorama dos Atendentes</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Status</TableHead><TableHead>Ativos</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {agentStats.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem dados.</TableCell></TableRow>
                    ) : agentStats.map((a) => (
                      <TableRow key={a.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${statusColor[a.status] ?? statusColor.offline}`} />
                            <span className="font-medium">{a.name}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{a.status}</Badge></TableCell>
                        <TableCell>{a.active}</TableCell>
                        <TableCell>{a.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Logs de Acesso</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV(
                  accessLogs.map(l => ({ Ação: l.action, IP: l.ip_address || "—", Data: new Date(l.created_at).toLocaleString("pt-BR") })),
                  "logs-acesso"
                )}>
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Ação</TableHead><TableHead>IP</TableHead><TableHead>Data/Hora</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {accessLogs.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sem logs.</TableCell></TableRow>
                    ) : accessLogs.map((l, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{l.action}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{l.ip_address || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{new Date(l.created_at).toLocaleString("pt-BR")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
