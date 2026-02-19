import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";
import { Plus, Pencil, Trash2, Smartphone, QrCode, Link } from "lucide-react";

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  phone_number: string;
  api_key?: string;
  webhook_url?: string;
  status: "connected" | "disconnected" | "connecting";
  is_active: boolean;
  created_at: string;
}

export default function SettingsWhatsApp() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstance, setEditingInstance] = useState<WhatsAppInstance | null>(null);
  const [formData, setFormData] = useState({
    instance_name: "",
    phone_number: "",
    api_key: "",
    webhook_url: "",
  });
  const { toast } = useToast();

  const loadInstances = async () => {
    try {
      const data = await apiClient.whatsapp.getConfig();
      setInstances(data.instances || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar instâncias WhatsApp",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.instance_name.trim() || !formData.phone_number.trim()) {
      toast({
        title: "Erro",
        description: "Nome da instância e número são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingInstance) {
        await apiClient.whatsapp.updateConfig(editingInstance.id, formData);
        toast({
          title: "Sucesso",
          description: "Instância WhatsApp atualizada com sucesso!",
        });
      } else {
        await apiClient.whatsapp.createConfig(formData);
        toast({
          title: "Sucesso",
          description: "Instância WhatsApp criada com sucesso!",
        });
      }

      setDialogOpen(false);
      setFormData({
        instance_name: "",
        phone_number: "",
        api_key: "",
        webhook_url: "",
      });
      setEditingInstance(null);
      loadInstances();
    } catch (error: any) {
      toast({
        title: "Erro",
        description:
          error.message ||
          `Erro ao ${editingInstance ? "atualizar" : "criar"} instância`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (instance: WhatsAppInstance) => {
    setEditingInstance(instance);
    setFormData({
      instance_name: instance.instance_name,
      phone_number: instance.phone_number,
      api_key: instance.api_key || "",
      webhook_url: instance.webhook_url || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta instância WhatsApp?"))
      return;

    try {
      await apiClient.whatsapp.deleteConfig(id);
      toast({
        title: "Sucesso",
        description: "Instância WhatsApp excluída com sucesso!",
      });
      loadInstances();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir instância",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (instance: WhatsAppInstance) => {
    try {
      await apiClient.whatsapp.updateConfig(instance.id, {
        is_active: !instance.is_active,
      });
      toast({
        title: "Sucesso",
        description: `Instância ${!instance.is_active ? "ativada" : "desativada"} com sucesso!`,
      });
      loadInstances();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status",
        variant: "destructive",
      });
    }
  };

  const handleOpenDialog = () => {
    setEditingInstance(null);
    setFormData({
      instance_name: "",
      phone_number: "",
      api_key: "",
      webhook_url: "",
    });
    setDialogOpen(true);
  };

  useEffect(() => {
    loadInstances();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: "default",
      disconnected: "secondary",
      connecting: "outline",
    };
    const labels = {
      connected: "Conectado",
      disconnected: "Desconectado",
      connecting: "Conectando...",
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Configurações WhatsApp
            </CardTitle>
            <Button onClick={handleOpenDialog} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nova Instância
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : instances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nenhuma instância WhatsApp configurada</p>
              <p className="text-sm mt-1">
                Clique em "Nova Instância" para começar
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Instância</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">
                      {instance.instance_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {instance.phone_number}
                    </TableCell>
                    <TableCell>{getStatusBadge(instance.status)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={instance.is_active}
                        onCheckedChange={() => handleToggleActive(instance)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Conectar/QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(instance)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(instance.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingInstance ? "Editar Instância" : "Nova Instância WhatsApp"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="instance_name">Nome da Instância *</Label>
                <Input
                  id="instance_name"
                  value={formData.instance_name}
                  onChange={(e) =>
                    setFormData({ ...formData, instance_name: e.target.value })
                  }
                  placeholder="Ex: WhatsApp Principal"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Número WhatsApp *</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  placeholder="5511999999999"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Formato: Código do país + DDD + Número (sem espaços ou caracteres especiais)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">API Key (Opcional)</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) =>
                    setFormData({ ...formData, api_key: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_url">
                  <div className="flex items-center gap-2">
                    <Link className="w-4 h-4" />
                    Webhook URL (Opcional)
                  </div>
                </Label>
                <Input
                  id="webhook_url"
                  value={formData.webhook_url}
                  onChange={(e) =>
                    setFormData({ ...formData, webhook_url: e.target.value })
                  }
                  placeholder="https://seu-dominio.com/webhook"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingInstance ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
