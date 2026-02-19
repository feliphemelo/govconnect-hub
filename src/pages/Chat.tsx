import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function Chat() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold mb-2">Chat em Desenvolvimento</h3>
            <p>Esta funcionalidade será implementada em breve.</p>
            <p className="text-sm mt-2">Usuário: {user?.email}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
