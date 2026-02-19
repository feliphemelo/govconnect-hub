import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "lucide-react";

export default function Reports() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BarChart className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold mb-2">Relatórios em Desenvolvimento</h3>
            <p>Funcionalidade será implementada em breve.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
