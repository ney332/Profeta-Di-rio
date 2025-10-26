import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreakingNews from "@/components/BreakingNews";
import ArticleCard from "@/components/ArticleCard";
import Sidebar from "@/components/Sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/articles?limit=20`),
        axios.get(`${API}/categories`)
      ]);

      setArticles(articlesRes.data);
      setCategories(categoriesRes.data);
      
      // Set featured article (first with destaque=true or first article)
      const featured = articlesRes.data.find(a => a.destaque) || articlesRes.data[0];
      setFeaturedArticle(featured);
      
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setLoading(false);
    }
  };

  const getArticlesByCategory = (categoryId) => {
    return articles.filter(a => a.categoria_id === categoryId).slice(0, 4);
  };

  if (loading) {
    return (
      <div className="app-container">
        <Header categories={categories} />
        <div className="p-8">
          <Skeleton className="w-full h-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header categories={categories} />
      <BreakingNews articles={articles.filter(a => a.destaque).slice(0, 5)} />

      <div className="px-4 md:px-8 py-8">
        {/* Featured Article */}
        {featuredArticle && (
          <Link to={`/artigo/${featuredArticle.slug}`} data-testid="featured-article-link">
            <div className="featured-main" data-testid="featured-article">
              <img src={featuredArticle.imagem_url} alt={featuredArticle.titulo} />
              <div className="featured-overlay">
                <span className="article-category">{featuredArticle.categoria_nome}</span>
                <h1 className="featured-title">{featuredArticle.titulo}</h1>
                <p className="text-lg text-gray-200">{featuredArticle.resumo}</p>
              </div>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {categories.map(category => {
              const categoryArticles = getArticlesByCategory(category.id);
              if (categoryArticles.length === 0) return null;

              return (
                <div key={category.id} className="mb-12" data-testid={`category-section-${category.slug}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="sidebar-title text-2xl">{category.nome}</h2>
                    <Link 
                      to={`/categoria/${category.slug}`} 
                      className="text-blue-700 hover:text-blue-900 font-semibold text-sm"
                      data-testid={`view-all-${category.slug}`}
                    >
                      Ver Todas →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categoryArticles.map(article => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}