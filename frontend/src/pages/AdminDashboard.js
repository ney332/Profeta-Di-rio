import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { PlusCircle, Edit, Trash2, LogOut, BarChart } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, token, logout } = useContext(AuthContext);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ total_articles: 0, total_views: 0 });
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({
    titulo: "",
    resumo: "",
    conteudo: "",
    categoria_id: "",
    destaque: false,
    imagem_url: ""
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [articlesRes, categoriesRes, statsRes] = await Promise.all([
        axios.get(`${API}/articles?limit=100`, config),
        axios.get(`${API}/categories`, config),
        axios.get(`${API}/stats`, config)
      ]);

      setArticles(articlesRes.data);
      setCategories(categoriesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      if (error.response?.status === 401) {
        logout();
        navigate("/admin/login");
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formDataImg = new FormData();
      formDataImg.append('file', file);

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API}/upload-image`, formDataImg, config);
      
      setFormData({ ...formData, imagem_url: response.data.image_url });
      toast.success("Imagem carregada com sucesso!");
    } catch (error) {
      toast.error("Erro ao fazer upload da imagem");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (editingArticle) {
        await axios.put(`${API}/articles/${editingArticle.id}`, formData, config);
        toast.success("Artigo atualizado com sucesso!");
      } else {
        await axios.post(`${API}/articles`, formData, config);
        toast.success("Artigo criado com sucesso!");
      }

      setShowForm(false);
      setEditingArticle(null);
      setFormData({
        titulo: "",
        resumo: "",
        conteudo: "",
        categoria_id: "",
        destaque: false,
        imagem_url: ""
      });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao salvar artigo");
    }
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setFormData({
      titulo: article.titulo,
      resumo: article.resumo,
      conteudo: article.conteudo,
      categoria_id: article.categoria_id,
      destaque: article.destaque,
      imagem_url: article.imagem_url
    });
    setShowForm(true);
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm("Tem certeza que deseja deletar este artigo?")) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API}/articles/${articleId}`, config);
      toast.success("Artigo deletado com sucesso!");
      loadData();
    } catch (error) {
      toast.error("Erro ao deletar artigo");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="dashboard-title">Painel Administrativo</h1>
            <p className="text-blue-200">Bem-vindo, {user?.nome}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="logout-button">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Artigos</CardTitle>
              <BarChart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="total-articles">{stats.total_articles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Visualizações</CardTitle>
              <BarChart className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="total-views">{stats.total_views}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{categories.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Gerenciar Artigos</h2>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingArticle(null);
                setFormData({
                  titulo: "",
                  resumo: "",
                  conteudo: "",
                  categoria_id: "",
                  destaque: false,
                  imagem_url: ""
                });
              }} data-testid="new-article-button">
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Artigo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle data-testid="form-title">{editingArticle ? "Editar Artigo" : "Novo Artigo"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    data-testid="input-titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select 
                    value={formData.categoria_id} 
                    onValueChange={(value) => setFormData({...formData, categoria_id: value})}
                    required
                  >
                    <SelectTrigger data-testid="select-categoria">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="resumo">Resumo *</Label>
                  <Textarea
                    id="resumo"
                    data-testid="input-resumo"
                    value={formData.resumo}
                    onChange={(e) => setFormData({...formData, resumo: e.target.value})}
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="conteudo">Conteúdo *</Label>
                  <Textarea
                    id="conteudo"
                    data-testid="input-conteudo"
                    value={formData.conteudo}
                    onChange={(e) => setFormData({...formData, conteudo: e.target.value})}
                    rows={10}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="imagem">Imagem da Notícia *</Label>
                  <Input
                    id="imagem"
                    data-testid="input-imagem"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <p className="text-sm text-gray-600 mt-2">Carregando imagem...</p>}
                  {formData.imagem_url && (
                    <img src={formData.imagem_url} alt="Preview" className="mt-4 w-full h-48 object-cover rounded" />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="destaque"
                    data-testid="switch-destaque"
                    checked={formData.destaque}
                    onCheckedChange={(checked) => setFormData({...formData, destaque: checked})}
                  />
                  <Label htmlFor="destaque">Marcar como Breaking News / Destaque</Label>
                </div>
                <Button type="submit" className="w-full" disabled={!formData.imagem_url} data-testid="save-article-button">
                  {editingArticle ? "Atualizar Artigo" : "Criar Artigo"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Articles List */}
        <div className="bg-white rounded-lg shadow" data-testid="articles-list">
          {articles.length === 0 ? (
            <div className="p-8 text-center text-gray-600">Nenhum artigo criado ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visualizações</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destaque</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {articles.map(article => (
                    <tr key={article.id} data-testid={`article-row-${article.id}`}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{article.titulo}</div>
                        <div className="text-sm text-gray-500">{new Date(article.data_publicacao).toLocaleDateString('pt-BR')}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{article.categoria_nome}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{article.visualizacoes}</td>
                      <td className="px-6 py-4">
                        {article.destaque && <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Sim</span>}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(article)}
                            data-testid={`edit-article-${article.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(article.id)}
                            data-testid={`delete-article-${article.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}