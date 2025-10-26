import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
    nome: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const response = await axios.post(`${API}${endpoint}`, formData);

      if (isLogin) {
        login(response.data.access_token, response.data.user);
        toast.success("Login realizado com sucesso!");
        navigate("/admin/dashboard");
      } else {
        toast.success("Conta criada com sucesso! Faça login agora.");
        setIsLogin(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao processar solicitação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-red-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" data-testid="admin-login-card">
        <CardHeader>
          <CardTitle className="text-2xl text-center" data-testid="login-title">
            {isLogin ? "Área Administrativa" : "Criar Conta"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? "Faça login para gerenciar o blog" : "Registre-se para gerenciar o blog"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  data-testid="input-nome"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  required={!isLogin}
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                data-testid="input-email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                data-testid="input-senha"
                type="password"
                placeholder="••••••••"
                value={formData.senha}
                onChange={(e) => setFormData({...formData, senha: e.target.value})}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
              data-testid="submit-button"
            >
              {loading ? "Processando..." : (isLogin ? "Entrar" : "Registrar")}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-700 hover:underline"
              data-testid="toggle-mode"
            >
              {isLogin ? "Não tem uma conta? Registre-se" : "Já tem uma conta? Faça login"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}