import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function Credits() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Créditos</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Carteira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Saldo, consumo e histórico de transações.</p>
        </CardContent>
      </Card>
    </div>
  );
}
