import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-xl mb-4">Profeta Diário</h3>
            <p className="text-gray-400 text-sm">
              Seu portal de notícias mais confiável. Informação de qualidade, sempre atualizada.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Seções</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/categoria/politica" className="footer-link">Política</Link></li>
              <li><Link to="/categoria/economia" className="footer-link">Economia</Link></li>
              <li><Link to="/categoria/tecnologia" className="footer-link">Tecnologia</Link></li>
              <li><Link to="/categoria/esportes" className="footer-link">Esportes</Link></li>
              <li><Link to="/categoria/cultura" className="footer-link">Cultura</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Institucional</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="footer-link">Quem Somos</a></li>
              <li><a href="#" className="footer-link">Fale Conosco</a></li>
              <li><a href="#" className="footer-link">Política de Privacidade</a></li>
              <li><a href="#" className="footer-link">Termos de Uso</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Redes Sociais</h4>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition" data-testid="social-facebook">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition" data-testid="social-twitter">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition" data-testid="social-instagram">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition" data-testid="social-youtube">
                <Youtube className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-6 pb-4 text-center text-sm text-gray-400">
          <p>&copy; 2025 Profeta Diário. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}