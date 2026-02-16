import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SignatureDoc {
  id: string;
  title: string;
  document_url: string;
  status: string;
  contact_id: string | null;
  sent_at: string | null;
  signed_at: string | null;
  qr_code: string | null;
  created_at: string;
}

export default function Signatures() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [docs, setDocs] = useState<SignatureDoc[]>([]);
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [contactId, setContactId] = useState("");

  const getCompanyId = async () => {
    const { data } = await supabase.from("profiles").select("company_id").eq("user_id", user!.id).maybeSingle();
    return data?.company_id;
  };

  const load = async () => {
    const { data } = await supabase.from("signature_documents").select("*").order("created_at", { ascending: false });
    setDocs((data as SignatureDoc[]) ?? []);
    const { data: c } = await supabase.from("contacts").select("id, name").eq("is_blocked", false).order("name");
    setContacts(c ?? []);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const create = async () => {
    if (!title || !docUrl) return;
    const companyId = await getCompanyId();
    if (!companyId) return;
    await supabase.from("signature_documents").insert({
      company_id: companyId, title, document_url: docUrl,
      contact_id: contactId || null, qr_code: `QR-${Date.now().toString(36).toUpperCase()}`,
    });
    toast({ title: "Documento criado" });
    setDialogOpen(false); setTitle(""); setDocUrl(""); setContactId("");
    load();
  };

  const sendDoc = async (id: string) => {
    await supabase.from("signature_documents").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "Documento enviado (simulado)" });
    load();
  };

  const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pendente", variant: "secondary" },
    sent: { label: "Enviado", variant: "outline" },
    agreed: { label: "Assinado", variant: "default" },
    disagreed: { label: "Recusado", variant: "destructive" },
    expired: { label: "Expirado", variant: "destructive" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assinaturas Eletrônicas</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Enviar para Assinatura</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div className="space-y-2"><Label>URL do PDF *</Label><Input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://..." /></div>
              <div className="space-y-2">
                <Label>Enviar para</Label>
                <Select value={contactId} onValueChange={setContactId}><SelectTrigger><SelectValue placeholder="Contato" /></SelectTrigger><SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <Button onClick={create} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Status</TableHead><TableHead>QR Code</TableHead><TableHead>Enviado</TableHead><TableHead className="w-[60px]" /></TableRow></TableHeader>
            <TableBody>
              {docs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum documento.</TableCell></TableRow>
              ) : docs.map((d) => {
                const badge = statusBadge[d.status] || statusBadge.pending;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{d.qr_code || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.sent_at ? new Date(d.sent_at).toLocaleString("pt-BR") : "—"}</TableCell>
                    <TableCell>{d.status === "pending" && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => sendDoc(d.id)}><Send className="h-3.5 w-3.5 text-primary" /></Button>}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
