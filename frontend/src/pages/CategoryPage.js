import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import Sidebar from "@/components/Sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryPage() {
  const { slug } = useParams();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [slug]);

  const loadData = async () => {
    try {
      const categoriesRes = await axios.get(`${API}/categories`);
      setCategories(categoriesRes.data);

      const category = categoriesRes.data.find(c => c.slug === slug);
      if (category) {
        setCurrentCategory(category);
        const articlesRes = await axios.get(`${API}/articles?categoria_id=${category.id}&limit=50`);
        setArticles(articlesRes.data);
      }

      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar categoria:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <Header categories={categories} />
        <div className="px-8 py-8">
          <Skeleton className="w-64 h-12 mb-8" />
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

      <div className="px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold mb-8" data-testid="category-title">
              {currentCategory?.nome}
            </h1>

            {articles.length === 0 ? (
              <p className="text-gray-600">Nenhuma notícia encontrada nesta categoria.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="articles-grid">
                {articles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}