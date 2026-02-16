import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Webhook } from "lucide-react";

export default function Webhooks() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Webhooks</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            Configuração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Webhooks de entrada e saída (n8n, Typebot).</p>
        </CardContent>
      </Card>
    </div>
  );
}
