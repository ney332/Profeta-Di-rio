import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2, Facebook, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticle();
  }, [slug]);

  const loadArticle = async () => {
    try {
      const [articleRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/articles/slug/${slug}`),
        axios.get(`${API}/categories`)
      ]);

      setArticle(articleRes.data);
      setCategories(categoriesRes.data);

      // Load related articles
      const relatedRes = await axios.get(`${API}/articles?categoria_id=${articleRes.data.categoria_id}&limit=4`);
      setRelatedArticles(relatedRes.data.filter(a => a.id !== articleRes.data.id).slice(0, 3));

      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar artigo:", error);
      setLoading(false);
    }
  };

  const shareOnSocial = (platform) => {
    const url = window.location.href;
    const text = article.titulo;
    
    let shareUrl = "";
    if (platform === "facebook") {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    } else if (platform === "twitter") {
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    } else if (platform === "whatsapp") {
      shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="app-container">
        <Header categories={categories} />
        <div className="max-w-4xl mx-auto p-8">
          <Skeleton className="w-full h-96 mb-8" />
          <Skeleton className="w-3/4 h-12 mb-4" />
          <Skeleton className="w-full h-64" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="app-container">
        <Header categories={categories} />
        <div className="max-w-4xl mx-auto p-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Artigo não encontrado</h1>
          <Link to="/" className="text-blue-700 hover:underline">Voltar para home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header categories={categories} />

      <article className="max-w-4xl mx-auto px-4 md:px-8 py-12" data-testid="article-content">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm" data-testid="breadcrumb">
          <Link to="/" className="text-blue-700 hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <Link to={`/categoria/${article.categoria_nome.toLowerCase()}`} className="text-blue-700 hover:underline">
            {article.categoria_nome}
          </Link>
        </nav>

        {/* Category Badge */}
        <span className="article-category" data-testid="article-category">{article.categoria_nome}</span>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 mt-4" data-testid="article-title">
          {article.titulo}
        </h1>

        {/* Resumo/Lead */}
        <p className="text-xl text-gray-700 font-medium leading-relaxed mb-6 border-l-4 border-red-600 pl-6" data-testid="article-summary">
          {article.resumo}
        </p>

        {/* Meta Information */}
        <div className="flex items-center justify-between border-y border-gray-300 py-4 mb-8" data-testid="article-meta">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Por {article.autor_nome}</span>
            <span className="mx-2">•</span>
            <span>{formatDate(article.data_publicacao)}</span>
            {article.ultima_atualizacao !== article.data_publicacao && (
              <>
                <span className="mx-2">•</span>
                <span>Atualizado: {formatDate(article.ultima_atualizacao)}</span>
              </>
            )}
          </div>
          <div className="text-sm text-gray-600">
            <span>{article.visualizacoes} visualizações</span>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-sm font-semibold text-gray-700">Compartilhar:</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => shareOnSocial('facebook')}
            data-testid="share-facebook"
          >
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => shareOnSocial('twitter')}
            data-testid="share-twitter"
          >
            <Twitter className="h-4 w-4 mr-2" />
            Twitter
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => shareOnSocial('whatsapp')}
            data-testid="share-whatsapp"
          >
            <Share2 className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
        </div>

        {/* Featured Image */}
        <img 
          src={article.imagem_url} 
          alt={article.titulo}
          className="w-full h-auto rounded-lg shadow-lg mb-8"
          data-testid="article-image"
        />

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none" 
          style={{ 
            fontSize: '1.1rem', 
            lineHeight: '1.8',
            color: '#333'
          }}
          data-testid="article-body"
        >
          {article.conteudo.split('\n').map((paragraph, index) => (
            paragraph.trim() && <p key={index} className="mb-6">{paragraph}</p>
          ))}
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="bg-gray-100 py-12" data-testid="related-articles">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <h2 className="sidebar-title text-2xl mb-8">Leia Também</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map(relatedArticle => (
                <ArticleCard key={relatedArticle.id} article={relatedArticle} />
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}