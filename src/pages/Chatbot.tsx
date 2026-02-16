import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, Trash2, MessageSquare, Settings2, FileText, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface MenuItem {
  id: string;
  title: string;
  message: string | null;
  menu_type: string;
  action_type: string | null;
  action_target: string | null;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
}

interface ChatbotConfig {
  id?: string;
  welcome_message: string;
  farewell_message: string;
  error_message: string;
  return_message: string;
  public_notice: string;
  ai_enabled: boolean;
  ai_mode: string;
  ai_personality: string;
  ai_name: string;
  ai_trigger_command: string;
}

interface KBItem {
  id: string;
  title: string;
  content: string;
  source_type: string;
  category: string | null;
}

export default function Chatbot() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Menu state
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [menuDialog, setMenuDialog] = useState(false);
  const [menuTitle, setMenuTitle] = useState("");
  const [menuMessage, setMenuMessage] = useState("");
  const [menuType, setMenuType] = useState("list");
  const [actionType, setActionType] = useState("");
  const [actionTarget, setActionTarget] = useState("");

  // Config state
  const [config, setConfig] = useState<ChatbotConfig>({
    welcome_message: "Olá! Bem-vindo ao nosso atendimento.",
    farewell_message: "Obrigado pelo contato!",
    error_message: "Desculpe, não entendi.",
    return_message: "Voltando ao menu principal...",
    public_notice: "",
    ai_enabled: false,
    ai_mode: "passive",
    ai_personality: "formal",
    ai_name: "Assistente",
    ai_trigger_command: "/ia",
  });

  // Knowledge base
  const [kbItems, setKbItems] = useState<KBItem[]>([]);
  const [kbDialog, setKbDialog] = useState(false);
  const [kbTitle, setKbTitle] = useState("");
  const [kbContent, setKbContent] = useState("");
  const [kbCategory, setKbCategory] = useState("");

  const getCompanyId = async () => {
    const { data } = await supabase.from("profiles").select("company_id").eq("user_id", user!.id).maybeSingle();
    return data?.company_id;
  };

  const loadMenus = async () => {
    const { data } = await supabase.from("chatbot_menus").select("*").order("sort_order");
    setMenus((data as MenuItem[]) ?? []);
  };

  const loadConfig = async () => {
    const { data } = await supabase.from("chatbot_config").select("*").maybeSingle();
    if (data) setConfig(data as any);
  };

  const loadKB = async () => {
    const { data } = await supabase.from("knowledge_base").select("id, title, content, source_type, category").order("created_at", { ascending: false });
    setKbItems((data as KBItem[]) ?? []);
  };

  useEffect(() => {
    if (user) { loadMenus(); loadConfig(); loadKB(); }
  }, [user]);

  const addMenu = async () => {
    if (!menuTitle) return;
    const companyId = await getCompanyId();
    if (!companyId) return;
    await supabase.from("chatbot_menus").insert({
      company_id: companyId,
      title: menuTitle,
      message: menuMessage || null,
      menu_type: menuType,
      action_type: actionType || null,
      action_target: actionTarget || null,
      sort_order: menus.length,
    });
    toast({ title: "Item de menu criado" });
    setMenuDialog(false);
    setMenuTitle(""); setMenuMessage(""); setActionType(""); setActionTarget("");
    loadMenus();
  };

  const deleteMenu = async (id: string) => {
    await supabase.from("chatbot_menus").delete().eq("id", id);
    loadMenus();
  };

  const saveConfig = async () => {
    const companyId = await getCompanyId();
    if (!companyId) return;
    const payload = { ...config, company_id: companyId };
    if (config.id) {
      await supabase.from("chatbot_config").update(payload as any).eq("id", config.id);
    } else {
      await supabase.from("chatbot_config").insert(payload as any);
    }
    toast({ title: "Configurações salvas" });
    loadConfig();
  };

  const addKB = async () => {
    if (!kbTitle || !kbContent) return;
    const companyId = await getCompanyId();
    if (!companyId) return;
    await supabase.from("knowledge_base").insert({
      company_id: companyId,
      title: kbTitle,
      content: kbContent,
      category: kbCategory || null,
      source_type: "text",
    });
    toast({ title: "Conhecimento adicionado" });
    setKbDialog(false); setKbTitle(""); setKbContent(""); setKbCategory("");
    loadKB();
  };

  const deleteKB = async (id: string) => {
    await supabase.from("knowledge_base").delete().eq("id", id);
    loadKB();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Chatbot & IA</h1>
      <Tabs defaultValue="menus">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="menus" className="gap-1.5 text-xs"><MessageSquare className="h-3.5 w-3.5" /> Menus</TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5 text-xs"><Settings2 className="h-3.5 w-3.5" /> Mensagens</TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5 text-xs"><Bot className="h-3.5 w-3.5" /> IA</TabsTrigger>
          <TabsTrigger value="kb" className="gap-1.5 text-xs"><Brain className="h-3.5 w-3.5" /> Base</TabsTrigger>
        </TabsList>

        {/* MENUS TAB */}
        <TabsContent value="menus">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Itens do Menu</CardTitle>
              <Dialog open={menuDialog} onOpenChange={setMenuDialog}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Item de Menu</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Título *</Label><Input value={menuTitle} onChange={(e) => setMenuTitle(e.target.value)} placeholder="Ex: Saúde" /></div>
                    <div className="space-y-2"><Label>Mensagem</Label><Textarea value={menuMessage} onChange={(e) => setMenuMessage(e.target.value)} placeholder="Mensagem exibida ao selecionar" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de Menu</Label>
                        <Select value={menuType} onValueChange={setMenuType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="list">Lista</SelectItem><SelectItem value="buttons">Botões</SelectItem></SelectContent></Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Ação</Label>
                        <Select value={actionType} onValueChange={setActionType}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="submenu">Submenu</SelectItem><SelectItem value="sector">Setor Humano</SelectItem><SelectItem value="form">Formulário</SelectItem><SelectItem value="message">Mensagem</SelectItem><SelectItem value="survey">Pesquisa</SelectItem></SelectContent></Select>
                      </div>
                    </div>
                    <Button onClick={addMenu} className="w-full">Salvar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Tipo</TableHead><TableHead>Ação</TableHead><TableHead className="w-[60px]" /></TableRow></TableHeader>
                <TableBody>
                  {menus.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum item de menu.</TableCell></TableRow>
                  ) : menus.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.title}</TableCell>
                      <TableCell><Badge variant="outline">{m.menu_type}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{m.action_type || "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMenu(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONFIG TAB */}
        <TabsContent value="config">
          <Card>
            <CardHeader><CardTitle className="text-base">Mensagens do Chatbot</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Boas-vindas</Label><Textarea value={config.welcome_message} onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })} /></div>
              <div className="space-y-2"><Label>Despedida</Label><Textarea value={config.farewell_message} onChange={(e) => setConfig({ ...config, farewell_message: e.target.value })} /></div>
              <div className="space-y-2"><Label>Erro</Label><Textarea value={config.error_message} onChange={(e) => setConfig({ ...config, error_message: e.target.value })} /></div>
              <div className="space-y-2"><Label>Retorno ao menu</Label><Textarea value={config.return_message} onChange={(e) => setConfig({ ...config, return_message: e.target.value })} /></div>
              <div className="space-y-2"><Label>Aviso de Utilidade Pública</Label><Textarea value={config.public_notice} onChange={(e) => setConfig({ ...config, public_notice: e.target.value })} placeholder="Aviso temporário..." /></div>
              <Button onClick={saveConfig}>Salvar Mensagens</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI TAB */}
        <TabsContent value="ai">
          <Card>
            <CardHeader><CardTitle className="text-base">Configuração da IA</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>IA Habilitada</Label>
                <Switch checked={config.ai_enabled} onCheckedChange={(v) => setConfig({ ...config, ai_enabled: v })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Modo</Label>
                  <Select value={config.ai_mode} onValueChange={(v) => setConfig({ ...config, ai_mode: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="passive">Passivo (por comando)</SelectItem><SelectItem value="active">Ativo (automático)</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2">
                  <Label>Personalidade</Label>
                  <Select value={config.ai_personality} onValueChange={(v) => setConfig({ ...config, ai_personality: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="formal">Formal</SelectItem><SelectItem value="casual">Descontraída</SelectItem></SelectContent></Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome da IA</Label><Input value={config.ai_name} onChange={(e) => setConfig({ ...config, ai_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Comando de ativação</Label><Input value={config.ai_trigger_command} onChange={(e) => setConfig({ ...config, ai_trigger_command: e.target.value })} /></div>
              </div>
              <Button onClick={saveConfig}>Salvar Configurações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KNOWLEDGE BASE TAB */}
        <TabsContent value="kb">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Base de Conhecimento</CardTitle>
              <Dialog open={kbDialog} onOpenChange={setKbDialog}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Adicionar Conhecimento</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Título *</Label><Input value={kbTitle} onChange={(e) => setKbTitle(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Conteúdo *</Label><Textarea value={kbContent} onChange={(e) => setKbContent(e.target.value)} rows={6} /></div>
                    <div className="space-y-2"><Label>Categoria</Label><Input value={kbCategory} onChange={(e) => setKbCategory(e.target.value)} placeholder="Ex: Saúde, Educação" /></div>
                    <Button onClick={addKB} className="w-full">Salvar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Categoria</TableHead><TableHead>Tipo</TableHead><TableHead className="w-[60px]" /></TableRow></TableHeader>
                <TableBody>
                  {kbItems.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum item na base.</TableCell></TableRow>
                  ) : kbItems.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium">{k.title}</TableCell>
                      <TableCell className="text-muted-foreground">{k.category || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{k.source_type}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteKB(k.id)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
