import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function Chat() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Atendimento ao Vivo</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Interface de atendimento em tempo real será implementada aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
}
