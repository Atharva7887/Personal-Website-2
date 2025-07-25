import { useState } from 'react';
import MobileMenu from './MobileMenu';
import DesktopMenu from './DesktopMenu';
import { Menu, X } from 'lucide-react';
import { useScrollPosition } from '../../hooks/useScrollPosition';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isScrolled = useScrollPosition(20);

  return (
    <nav className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl transition-all duration-500 ${
      isScrolled 
        ? 'bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl shadow-purple-500/10' 
        : 'bg-white/5 backdrop-blur-sm border border-white/10'
    } rounded-2xl`}>
      <div className="px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <a href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hover:from-purple-300 hover:to-pink-300 transition-all duration-300">
              Atharva Shirke
            </a>
          </div>

          <DesktopMenu />

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl hover:bg-white/10 group transition-all duration-300"
            >
              {isMenuOpen ? (
                <X
                  size={24}
                  className="text-white group-hover:text-purple-400 transition-all duration-300"
                />
              ) : (
                <Menu
                  size={24}
                  className="text-white group-hover:text-purple-400 transition-all duration-300"
                />
              )}
            </button>
          </div>
        </div>
      </div>

      <MobileMenu isOpen={isMenuOpen} />
    </nav>
  );
}