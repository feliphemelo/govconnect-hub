import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BarChart3, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Poll {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  questions: PollQuestion[];
}

interface PollQuestion {
  id: string;
  question: string;
  question_type: string;
  options: string[] | null;
  votes: { answer: string; count: number }[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--warning))", "hsl(var(--success))", "#8b5cf6", "#f97316"];

export default function Polls() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newPoll, setNewPoll] = useState({ title: "", starts_at: "", ends_at: "" });
  const [newQuestion, setNewQuestion] = useState({ question: "", question_type: "closed", options: "" });

  const load = async () => {
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user!.id).maybeSingle();
    if (!profile) return;

    const { data: pollsData } = await supabase.from("polls").select("*").eq("company_id", profile.company_id).order("created_at", { ascending: false });
    if (!pollsData) return;

    const enriched: Poll[] = [];
    for (const p of pollsData) {
      const { data: qs } = await supabase.from("poll_questions").select("*").eq("poll_id", p.id).order("sort_order");
      const questions: PollQuestion[] = [];
      for (const q of qs ?? []) {
        const { data: votes } = await supabase.from("poll_votes").select("answer").eq("question_id", q.id);
        const voteMap: Record<string, number> = {};
        (votes ?? []).forEach(v => { voteMap[v.answer] = (voteMap[v.answer] || 0) + 1; });
        questions.push({
          ...q,
          options: q.options as string[] | null,
          votes: Object.entries(voteMap).map(([answer, count]) => ({ answer, count })),
        });
      }
      enriched.push({ ...p, is_active: p.is_active ?? true, questions });
    }
    setPolls(enriched);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const createPoll = async () => {
    if (!newPoll.title) return;
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user!.id).maybeSingle();
    if (!profile) return;
    await supabase.from("polls").insert({
      company_id: profile.company_id,
      title: newPoll.title,
      starts_at: newPoll.starts_at || new Date().toISOString(),
      ends_at: newPoll.ends_at || null,
    } as any);
    toast({ title: "Enquete criada" });
    setNewPoll({ title: "", starts_at: "", ends_at: "" });
    setShowNew(false);
    load();
  };

  const addQuestion = async (pollId: string) => {
    if (!newQuestion.question) return;
    const opts = newQuestion.question_type === "affirmative"
      ? ["Sim", "Não"]
      : newQuestion.options.split(",").map(o => o.trim()).filter(Boolean);
    await supabase.from("poll_questions").insert({
      poll_id: pollId,
      question: newQuestion.question,
      question_type: newQuestion.question_type,
      options: opts,
    } as any);
    toast({ title: "Pergunta adicionada" });
    setNewQuestion({ question: "", question_type: "closed", options: "" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Enquetes & Pesquisas</h1>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nova Enquete</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Enquete</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Título</Label><Input value={newPoll.title} onChange={e => setNewPoll(p => ({ ...p, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Início</Label><Input type="datetime-local" value={newPoll.starts_at} onChange={e => setNewPoll(p => ({ ...p, starts_at: e.target.value }))} /></div>
                <div><Label>Término</Label><Input type="datetime-local" value={newPoll.ends_at} onChange={e => setNewPoll(p => ({ ...p, ends_at: e.target.value }))} /></div>
              </div>
              <Button onClick={createPoll} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Poll list */}
        <Card>
          <CardHeader><CardTitle className="text-base">Enquetes</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Status</TableHead><TableHead>Perguntas</TableHead></TableRow></TableHeader>
              <TableBody>
                {polls.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nenhuma enquete.</TableCell></TableRow>
                ) : polls.map(p => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPoll(p)}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell><Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Ativa" : "Encerrada"}</Badge></TableCell>
                    <TableCell>{p.questions.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Selected poll details */}
        {selectedPoll && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{selectedPoll.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add question form */}
                <div className="space-y-2 border rounded-lg p-3">
                  <Label className="text-xs font-medium">Adicionar Pergunta</Label>
                  <Input placeholder="Pergunta" value={newQuestion.question} onChange={e => setNewQuestion(p => ({ ...p, question: e.target.value }))} />
                  <div className="flex gap-2">
                    <Select value={newQuestion.question_type} onValueChange={v => setNewQuestion(p => ({ ...p, question_type: v }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="affirmative">Sim/Não</SelectItem>
                        <SelectItem value="closed">Lista de opções</SelectItem>
                      </SelectContent>
                    </Select>
                    {newQuestion.question_type === "closed" && (
                      <Input placeholder="Opções (vírgula)" value={newQuestion.options} onChange={e => setNewQuestion(p => ({ ...p, options: e.target.value }))} className="flex-1" />
                    )}
                  </div>
                  <Button size="sm" onClick={() => addQuestion(selectedPoll.id)}>Adicionar</Button>
                </div>

                {/* Questions with charts */}
                {selectedPoll.questions.map(q => (
                  <Card key={q.id}>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">{q.question}</CardTitle></CardHeader>
                    <CardContent>
                      {q.votes.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sem votos ainda.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={q.votes}>
                              <XAxis dataKey="answer" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip />
                              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                          <ResponsiveContainer width="100%" height={150}>
                            <PieChart>
                              <Pie data={q.votes} dataKey="count" nameKey="answer" cx="50%" cy="50%" outerRadius={55} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {q.votes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
