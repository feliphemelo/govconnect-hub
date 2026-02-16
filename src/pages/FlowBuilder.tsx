import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow, Controls, Background, addEdge, useNodesState, useEdgesState,
  type Node, type Edge, type Connection, type NodeTypes, Handle, Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Save, Trash2, Play, Pause, Webhook, MessageSquare, GitBranch, Users, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Custom Node Components
function MessageNode({ data }: { data: any }) {
  return (
    <div className="bg-card border rounded-lg shadow-md p-3 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold">Mensagem</span>
      </div>
      <p className="text-xs text-muted-foreground">{data.message || "Configure..."}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  );
}

function ConditionNode({ data }: { data: any }) {
  return (
    <div className="bg-card border-2 border-warning rounded-lg shadow-md p-3 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-warning" />
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className="h-4 w-4 text-warning" />
        <span className="text-xs font-semibold">Condição</span>
      </div>
      <p className="text-xs text-muted-foreground">{data.condition || "Configure..."}</p>
      <Handle type="source" position={Position.Bottom} id="yes" className="!bg-green-500" style={{ left: "30%" }} />
      <Handle type="source" position={Position.Bottom} id="no" className="!bg-red-500" style={{ left: "70%" }} />
    </div>
  );
}

function WebhookNode({ data }: { data: any }) {
  return (
    <div className="bg-card border-2 border-info rounded-lg shadow-md p-3 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-info" />
      <div className="flex items-center gap-2 mb-2">
        <Webhook className="h-4 w-4 text-info" />
        <span className="text-xs font-semibold">Webhook</span>
      </div>
      <p className="text-xs text-muted-foreground">{data.webhook_name || "Selecione..."}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-info" />
    </div>
  );
}

function SectorNode({ data }: { data: any }) {
  return (
    <div className="bg-card border-2 border-success rounded-lg shadow-md p-3 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-success" />
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-4 w-4 text-success" />
        <span className="text-xs font-semibold">Atendimento</span>
      </div>
      <p className="text-xs text-muted-foreground">{data.sector_name || "Selecione setor..."}</p>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  message: MessageNode,
  condition: ConditionNode,
  webhook: WebhookNode,
  sector: SectorNode,
};

interface Flow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: string;
  trigger_value: string | null;
}

export default function FlowBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [showNewFlow, setShowNewFlow] = useState(false);
  const [flowName, setFlowName] = useState("");
  const [flowDesc, setFlowDesc] = useState("");
  const [flowTrigger, setFlowTrigger] = useState("keyword");
  const [flowTriggerValue, setFlowTriggerValue] = useState("");
  const [webhooks, setWebhooks] = useState<{ id: string; name: string }[]>([]);
  const [sectors, setSectors] = useState<{ id: string; name: string }[]>([]);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [configNode, setConfigNode] = useState<Node | null>(null);
  const [nodeContent, setNodeContent] = useState<any>({});

  const getCompanyId = async () => {
    const { data } = await supabase.from("profiles").select("company_id").eq("user_id", user!.id).maybeSingle();
    return data?.company_id;
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: flowData }, { data: whData }, { data: secData }] = await Promise.all([
        supabase.from("chatbot_flows").select("*").order("created_at", { ascending: false }),
        supabase.from("webhooks").select("id, name"),
        supabase.from("sectors").select("id, name").eq("is_active", true),
      ]);
      setFlows((flowData as Flow[]) ?? []);
      setWebhooks(whData ?? []);
      setSectors(secData ?? []);
    };
    load();
  }, [user]);

  const createFlow = async () => {
    if (!flowName) return;
    const companyId = await getCompanyId();
    if (!companyId) return;
    await supabase.from("chatbot_flows").insert({
      company_id: companyId,
      name: flowName,
      description: flowDesc || null,
      trigger_type: flowTrigger,
      trigger_value: flowTriggerValue || null,
    });
    toast({ title: "Fluxo criado" });
    setShowNewFlow(false);
    setFlowName(""); setFlowDesc("");
    const { data } = await supabase.from("chatbot_flows").select("*").order("created_at", { ascending: false });
    setFlows((data as Flow[]) ?? []);
  };

  const loadFlowNodes = async (flow: Flow) => {
    setSelectedFlow(flow);
    const [{ data: nodeData }, { data: edgeData }] = await Promise.all([
      supabase.from("flow_nodes").select("*").eq("flow_id", flow.id),
      supabase.from("flow_edges").select("*").eq("flow_id", flow.id),
    ]);

    const rfNodes: Node[] = (nodeData ?? []).map((n: any) => ({
      id: n.id,
      type: n.node_type,
      position: { x: n.position_x, y: n.position_y },
      data: n.content ?? {},
    }));

    const rfEdges: Edge[] = (edgeData ?? []).map((e: any) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      label: e.label,
      animated: true,
    }));

    setNodes(rfNodes);
    setEdges(rfEdges);
  };

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)), [setEdges]);

  const addNode = async (type: string) => {
    if (!selectedFlow) return;
    const id = crypto.randomUUID();
    const newNode: Node = {
      id,
      type,
      position: { x: 250, y: nodes.length * 120 + 50 },
      data: {},
    };
    setNodes((nds) => [...nds, newNode]);

    await supabase.from("flow_nodes").insert({
      id,
      flow_id: selectedFlow.id,
      node_type: type,
      position_x: newNode.position.x,
      position_y: newNode.position.y,
      content: {} as any,
    });
  };

  const saveFlow = async () => {
    if (!selectedFlow) return;
    // Save node positions and edges
    for (const node of nodes) {
      await supabase.from("flow_nodes").update({
        position_x: node.position.x,
        position_y: node.position.y,
        content: node.data as any,
      }).eq("id", node.id);
    }
    // Delete old edges and re-insert
    await supabase.from("flow_edges").delete().eq("flow_id", selectedFlow.id);
    for (const edge of edges) {
      await supabase.from("flow_edges").insert({
        flow_id: selectedFlow.id,
        source_node_id: edge.source,
        target_node_id: edge.target,
        label: typeof edge.label === "string" ? edge.label : null,
      });
    }
    toast({ title: "Fluxo salvo!" });
  };

  const toggleFlow = async (flow: Flow) => {
    await supabase.from("chatbot_flows").update({ is_active: !flow.is_active }).eq("id", flow.id);
    setFlows(flows.map(f => f.id === flow.id ? { ...f, is_active: !f.is_active } : f));
  };

  const deleteFlow = async (id: string) => {
    await supabase.from("chatbot_flows").delete().eq("id", id);
    setFlows(flows.filter(f => f.id !== id));
    if (selectedFlow?.id === id) setSelectedFlow(null);
  };

  const onNodeDoubleClick = (_: any, node: Node) => {
    setConfigNode(node);
    setNodeContent(node.data ?? {});
    setShowNodeConfig(true);
  };

  const saveNodeConfig = () => {
    if (!configNode) return;
    setNodes(nds => nds.map(n => n.id === configNode.id ? { ...n, data: { ...nodeContent } } : n));
    setShowNodeConfig(false);
  };

  if (selectedFlow) {
    return (
      <div className="space-y-4 h-[calc(100vh-7rem)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedFlow(null)}><ArrowLeft className="h-4 w-4" /></Button>
            <h2 className="text-lg font-bold">{selectedFlow.name}</h2>
            <Badge variant={selectedFlow.is_active ? "default" : "secondary"}>{selectedFlow.is_active ? "Ativo" : "Inativo"}</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => addNode("message")}><MessageSquare className="h-4 w-4 mr-1" /> Mensagem</Button>
            <Button variant="outline" size="sm" onClick={() => addNode("condition")}><GitBranch className="h-4 w-4 mr-1" /> Condição</Button>
            <Button variant="outline" size="sm" onClick={() => addNode("webhook")}><Webhook className="h-4 w-4 mr-1" /> Webhook</Button>
            <Button variant="outline" size="sm" onClick={() => addNode("sector")}><Users className="h-4 w-4 mr-1" /> Setor</Button>
            <Button size="sm" onClick={saveFlow}><Save className="h-4 w-4 mr-1" /> Salvar</Button>
          </div>
        </div>
        <div className="border rounded-lg h-[calc(100%-3.5rem)] bg-background">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDoubleClick={onNodeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>

        {/* Node Config Dialog */}
        <Dialog open={showNodeConfig} onOpenChange={setShowNodeConfig}>
          <DialogContent>
            <DialogHeader><DialogTitle>Configurar Nó</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {configNode?.type === "message" && (
                <div className="space-y-2"><Label>Mensagem</Label><Textarea value={nodeContent.message ?? ""} onChange={(e) => setNodeContent({ ...nodeContent, message: e.target.value })} /></div>
              )}
              {configNode?.type === "condition" && (
                <div className="space-y-2"><Label>Condição</Label><Input value={nodeContent.condition ?? ""} onChange={(e) => setNodeContent({ ...nodeContent, condition: e.target.value })} placeholder="Ex: contém 'sim'" /></div>
              )}
              {configNode?.type === "webhook" && (
                <div className="space-y-2">
                  <Label>Webhook</Label>
                  <Select value={nodeContent.webhook_id ?? ""} onValueChange={(v) => {
                    const wh = webhooks.find(w => w.id === v);
                    setNodeContent({ ...nodeContent, webhook_id: v, webhook_name: wh?.name });
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione um webhook" /></SelectTrigger>
                    <SelectContent>
                      {webhooks.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {configNode?.type === "sector" && (
                <div className="space-y-2">
                  <Label>Setor/Fila</Label>
                  <Select value={nodeContent.sector_id ?? ""} onValueChange={(v) => {
                    const s = sectors.find(s => s.id === v);
                    setNodeContent({ ...nodeContent, sector_id: v, sector_name: s?.name });
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione um setor" /></SelectTrigger>
                    <SelectContent>
                      {sectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={saveNodeConfig} className="w-full">Salvar Configuração</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Construtor de Fluxos</h1>
        <Dialog open={showNewFlow} onOpenChange={setShowNewFlow}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Novo Fluxo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Fluxo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome *</Label><Input value={flowName} onChange={(e) => setFlowName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={flowDesc} onChange={(e) => setFlowDesc(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gatilho</Label>
                  <Select value={flowTrigger} onValueChange={setFlowTrigger}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keyword">Palavra-chave</SelectItem>
                      <SelectItem value="menu">Menu do Chatbot</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Valor do Gatilho</Label><Input value={flowTriggerValue} onChange={(e) => setFlowTriggerValue(e.target.value)} placeholder="Ex: #suporte" /></div>
              </div>
              <Button onClick={createFlow} className="w-full">Criar Fluxo</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Gatilho</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flows.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum fluxo criado.</TableCell></TableRow>
              ) : flows.map((f) => (
                <TableRow key={f.id} className="cursor-pointer" onClick={() => loadFlowNodes(f)}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell><Badge variant="outline">{f.trigger_type}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={f.is_active ? "default" : "secondary"}>{f.is_active ? "Ativo" : "Inativo"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleFlow(f)}>
                        {f.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteFlow(f.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
