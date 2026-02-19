import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";

interface Sector {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export default function SettingsSectors() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const { toast } = useToast();

  const loadSectors = async () => {
    try {
      const data = await apiClient.sectors.list();
      setSectors(data.sectors || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar setores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do setor é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingSector) {
        await apiClient.sectors.update(editingSector.id, formData);
        toast({
          title: "Sucesso",
          description: "Setor atualizado com sucesso!",
        });
      } else {
        await apiClient.sectors.create(formData);
        toast({
          title: "Sucesso",
          description: "Setor criado com sucesso!",
        });
      }
      
      setDialogOpen(false);
      setFormData({ name: "", description: "" });
      setEditingSector(null);
      loadSectors();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || `Erro ao ${editingSector ? 'atualizar' : 'criar'} setor`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (sector: Sector) => {
    setEditingSector(sector);
    setFormData({
      name: sector.name,
      description: sector.description || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este setor?")) return;

    try {
      await apiClient.sectors.delete(id);
      toast({
        title: "Sucesso",
        description: "Setor excluído com sucesso!",
      });
      loadSectors();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir setor",
        variant: "destructive",
      });
    }
  };

  const handleOpenDialog = () => {
    setEditingSector(null);
    setFormData({ name: "", description: "" });
    setDialogOpen(true);
  };

  useEffect(() => {
    loadSectors();
  }, []);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Setores
            </CardTitle>
            <Button onClick={handleOpenDialog} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Setor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : sectors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum setor cadastrado</p>
              <p className="text-sm mt-1">
                Clique em "Novo Setor" para começar
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectors.map((sector) => (
                  <TableRow key={sector.id}>
                    <TableCell className="font-medium">{sector.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {sector.description || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(sector.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(sector)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(sector.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSector ? "Editar Setor" : "Novo Setor"}
            </DialogTitle>
            <DialogDescription>
              {editingSector
                ? "Atualize as informações do setor"
                : "Crie um novo setor para organizar sua equipe"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Suporte, Financeiro, RH..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descrição opcional do setor"
                  rows={3}
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
                {editingSector ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
