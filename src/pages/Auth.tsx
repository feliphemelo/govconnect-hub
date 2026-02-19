import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MessageSquare, Eye, EyeOff } from "lucide-react";

const API_URL = 'https://atendimento.nextplan.tec.br/api';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        console.log('🔵 Fazendo login com fetch direto...');
        
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('🟢 Login successful:', data);

        // Salvar token no localStorage
        localStorage.setItem('govchat_token', data.token);

        // Disparar evento de auth state change
        window.dispatchEvent(new CustomEvent('authStateChange', { 
          detail: { event: 'SIGNED_IN', session: { access_token: data.token, user: data.user } }
        }));

        toast({
          title: "Login realizado!",
          description: "Bem-vindo ao GovChat",
        });

        navigate("/dashboard");
      } else {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email, 
            password,
            full_name: fullName,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Registration failed' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();

        // Salvar token
        localStorage.setItem('govchat_token', data.token);

        toast({
          title: "Cadastro realizado!",
          description: "Sua conta foi criada com sucesso.",
        });

        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error('🔴 Auth error:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Falha na autenticação",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    toast({ 
      title: "Funcionalidade em desenvolvimento", 
      description: "Entre em contato com o administrador para resetar sua senha." 
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <MessageSquare className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">GovChat</CardTitle>
            <CardDescription>Sistema de Atendimento ao Cidadão</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Aguarde..." : isLogin ? "Entrar" : "Cadastrar"}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
              >
                {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
