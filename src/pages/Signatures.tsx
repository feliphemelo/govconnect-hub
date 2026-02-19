import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function Signatures() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Signatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Settings className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold mb-2">Signatures em Desenvolvimento</h3>
            <p>Esta funcionalidade será implementada em breve.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
