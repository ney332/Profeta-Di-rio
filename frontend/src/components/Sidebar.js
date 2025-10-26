import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function Sidebar() {
  const [popularArticles, setPopularArticles] = useState([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    loadPopular();
  }, []);

  const loadPopular = async () => {
    try {
      const response = await axios.get(`${API}/articles/popular?limit=5`);
      setPopularArticles(response.data);
    } catch (error) {
      console.error("Erro ao carregar populares:", error);
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    toast.success("Obrigado por se inscrever! Em breve você receberá nossas notícias.");
    setEmail("");
  };

  return (
    <div className="space-y-8">
      {/* Most Popular */}
      <div className="sidebar" data-testid="sidebar-popular">
        <h3 className="sidebar-title flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Mais Lidas
        </h3>
        <div className="space-y-4">
          {popularArticles.map((article, index) => (
            <Link 
              key={article.id} 
              to={`/artigo/${article.slug}`}
              className="block group"
              data-testid={`popular-article-${index}`}
            >
              <div className="flex gap-3">
                <span className="text-3xl font-bold text-gray-300 flex-shrink-0">{index + 1}</span>
                <div>
                  <h4 className="font-semibold text-sm group-hover:text-blue-700 transition">
                    {article.titulo}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">{article.visualizacoes} visualizações</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="sidebar" data-testid="sidebar-newsletter">
        <h3 className="sidebar-title">Newsletter</h3>
        <p className="text-sm text-gray-600 mb-4">
          Receba as principais notícias diretamente no seu email.
        </p>
        <form onSubmit={handleNewsletterSubmit} className="space-y-3">
          <Input 
            type="email" 
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            data-testid="newsletter-input"
          />
          <Button type="submit" className="w-full" data-testid="newsletter-submit">
            Inscrever-se
          </Button>
        </form>
      </div>

      {/* Ad Space */}
      <div className="sidebar text-center" data-testid="sidebar-ad">
        <p className="text-xs text-gray-400 mb-2">PUBLICIDADE</p>
        <div className="bg-gray-200 h-64 flex items-center justify-center text-gray-500">
          Banner 300x250
        </div>
      </div>
    </div>
  );
}