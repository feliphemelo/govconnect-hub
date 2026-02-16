import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";

export default function Chatbot() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Chatbot</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Construtor de Chatbot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Editor visual de menus e automações.</p>
        </CardContent>
      </Card>
    </div>
  );
}
