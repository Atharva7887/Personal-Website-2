import React from 'react';
import { NAV_ITEMS } from '../../constants/navigation';
import { smoothScroll } from '../../utils/scrollUtils';

interface MobileMenuProps {
  isOpen: boolean;
  isBlogPage?: boolean;
}

export default function MobileMenu({ isOpen, isBlogPage = false }: MobileMenuProps) {
  if (!isOpen) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, item: string) => {
    if (isBlogPage && item === 'Blog') {
      return; // Allow default behavior for Blog link when on blog page
    }
    
    if (item === 'More') {
      return; // Allow default behavior for More link
    }
    
    if (!isBlogPage && item !== 'Blog') {
      e.preventDefault();
      smoothScroll(item.toLowerCase());
    }
  };

  return (
    <div className="md:hidden">
      <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        {NAV_ITEMS.map((item) => {
          // Determine the correct href based on the current page and nav item
          const href = isBlogPage
            ? item === 'Blog'
              ? '#' // If we're on blog page and it's the blog link
              : item === 'More'
              ? 'more.html' // Link to more.html for More
              : `index.html${item === 'About' ? '' : `#${item.toLowerCase()}`}` // Link back to main page with correct anchor
            : item === 'Blog'
            ? 'index2.html' // If we're on main page and it's the blog link
            : item === 'More'
            ? 'more.html' // Link to more.html for More
            : `#${item.toLowerCase()}`; // Regular anchor link

          return (
            <a
              key={item}
              href={href}
              onClick={(e) => handleClick(e, item)}
              className="block px-3 py-2 rounded-lg hover:bg-white/10 hover:text-purple-500 transition-all"
            >
              {item}
            </a>
          );
        })}
      </div>
    </div>
  );
}