import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";

export default function Broadcasts() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Disparos</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Envio em Massa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Agendamento e disparo de mensagens.</p>
        </CardContent>
      </Card>
    </div>
  );
}
