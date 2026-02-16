import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSignature } from "lucide-react";

export default function Signatures() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Assinaturas Eletrônicas</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Envio de PDFs para assinatura via WhatsApp.</p>
        </CardContent>
      </Card>
    </div>
  );
}
