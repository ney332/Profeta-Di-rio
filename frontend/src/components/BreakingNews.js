import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function BreakingNews({ articles = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (articles.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [articles]);

  if (articles.length === 0) return null;

  return (
    <div className="breaking-news" data-testid="breaking-news">
      <div className="flex items-center px-4 md:px-8">
        <span className="breaking-label flex-shrink-0">URGENTE</span>
        <div className="ml-6 overflow-hidden flex-1">
          <Link 
            to={`/artigo/${articles[currentIndex].slug}`}
            className="text-white hover:underline font-medium"
            data-testid="breaking-news-link"
          >
            {articles[currentIndex].titulo}
          </Link>
        </div>
      </div>
    </div>
  );
}