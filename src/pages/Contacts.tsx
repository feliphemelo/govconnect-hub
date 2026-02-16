import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function Contacts() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Contatos</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gestão de Contatos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cadastro e histórico de cidadãos.</p>
        </CardContent>
      </Card>
    </div>
  );
}
