import { useState } from 'react';
import MobileMenu from './MobileMenu';
import DesktopMenu from './DesktopMenu';
import { Menu, X } from 'lucide-react';
import { useScrollPosition } from '../../hooks/useScrollPosition';
import { navbarStyles as styles } from '../../utils/styles/navbarStyles';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isScrolled = useScrollPosition(20);

  return (
    <nav
      className={`${styles.container} ${isScrolled ? styles.scrolled : styles.transparent} ${styles.hover}`}
    >
      <div className={styles.inner}>
        <div className={styles.content}>
          <div className="flex-shrink-0">
            <a href="/" className="text-xl font-bold">Atharva Shirke</a>
          </div>

          <DesktopMenu />

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg hover:text-black hover:bg-black/10 group"
            >
              {isMenuOpen ? (
                <X
                  size={24}
                  className="text-white group-hover:text-black group-hover:shadow-[0_0_10px_2px_rgba(0,0,0,0.8)] transition-all"
                />
              ) : (
                <Menu
                  size={24}
                  className="text-white group-hover:text-black group-hover:shadow-[0_0_10px_2px_rgba(0,0,0,0.8)] transition-all"
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