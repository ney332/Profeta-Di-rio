import { Link } from "react-router-dom";
import { Clock } from "lucide-react";

export default function ArticleCard({ article }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Link to={`/artigo/${article.slug}`} data-testid={`article-card-${article.id}`}>
      <div className="article-card">
        <img 
          src={article.imagem_url} 
          alt={article.titulo}
          className="article-image"
          data-testid="article-card-image"
        />
        <div className="p-5">
          <span className="article-category" data-testid="article-card-category">{article.categoria_nome}</span>
          <h3 className="article-title" data-testid="article-card-title">{article.titulo}</h3>
          <p className="article-excerpt" data-testid="article-card-excerpt">
            {article.resumo.length > 120 ? article.resumo.substring(0, 120) + '...' : article.resumo}
          </p>
          <div className="article-meta flex items-center gap-2" data-testid="article-card-meta">
            <Clock className="h-4 w-4" />
            <span>{formatDate(article.data_publicacao)}</span>
            <span>•</span>
            <span>{article.visualizacoes} views</span>
          </div>
        </div>
      </div>
    </Link>
  );
}