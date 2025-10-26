import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Header({ categories = [] }) {
  return (
    <header className="site-header">
      <div className="px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <Link to="/" data-testid="site-logo">
          <h1 className="site-logo">Imprensa Online</h1>
        </Link>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input 
            type="search" 
            placeholder="Buscar notícias..." 
            className="pl-10 bg-white"
            data-testid="search-input"
          />
        </div>
      </div>
      
      <nav className="nav-menu" data-testid="nav-menu">
        <div className="px-4 md:px-8 flex flex-wrap items-center justify-center md:justify-start gap-2">
          <Link to="/" className="nav-link" data-testid="nav-home">Home</Link>
          {categories.map(category => (
            <Link 
              key={category.id} 
              to={`/categoria/${category.slug}`} 
              className="nav-link"
              data-testid={`nav-${category.slug}`}
            >
              {category.nome}
            </Link>
          ))}
          <Link to="/admin/login" className="nav-link" data-testid="nav-admin">Admin</Link>
        </div>
      </nav>
    </header>
  );
}