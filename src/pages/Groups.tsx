import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export default function Groups() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Grupos</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Grupos Temáticos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Gestão de grupos e comunidades.</p>
        </CardContent>
      </Card>
    </div>
  );
}
