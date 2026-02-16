import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

export default function Credits() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user.id).maybeSingle();
      if (profile) {
        const { data: company } = await supabase.from("companies").select("credits_balance").eq("id", profile.company_id).maybeSingle();
        setBalance(company?.credits_balance ?? 0);
      }
      const { data } = await supabase.from("credit_transactions").select("*").order("created_at", { ascending: false }).limit(50);
      setTransactions((data as Transaction[]) ?? []);
    };
    load();
  }, [user]);

  const monthDebits = transactions.filter((t) => t.type === "debit" && new Date(t.created_at).getMonth() === new Date().getMonth()).reduce((a, t) => a + Math.abs(Number(t.amount)), 0);
  const monthCredits = transactions.filter((t) => t.type === "credit" && new Date(t.created_at).getMonth() === new Date().getMonth()).reduce((a, t) => a + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Créditos</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Saldo Atual</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2"><CreditCard className="h-6 w-6 text-primary" /><span className="text-3xl font-bold">{Number(balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
            {Number(balance) < 100 && <div className="flex items-center gap-1 mt-2 text-warning text-xs"><AlertTriangle className="h-3.5 w-3.5" /> Saldo baixo</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Usados (mês)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-destructive">{monthDebits.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Adicionados (mês)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-success">{monthCredits.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Valor</TableHead><TableHead>Descrição</TableHead><TableHead>Data</TableHead></TableRow></TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhuma transação.</TableCell></TableRow>
              ) : transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.type === "credit" ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}</TableCell>
                  <TableCell className={`font-medium ${t.type === "credit" ? "text-success" : "text-destructive"}`}>{t.type === "credit" ? "+" : "-"}{Math.abs(Number(t.amount)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-muted-foreground">{t.description || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
