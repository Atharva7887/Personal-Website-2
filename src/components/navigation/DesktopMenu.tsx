import React from 'react';
import { NAV_ITEMS } from '../../constants/navigation';
import { smoothScroll } from '../../utils/scrollUtils';

interface DesktopMenuProps {
  isBlogPage?: boolean;
}

export default function DesktopMenu({ isBlogPage = false }: DesktopMenuProps) {
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
    <div className="hidden md:block">
      <div className="ml-10 flex items-center space-x-2">
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
              className="relative group px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/10"
            >
              <span className="text-white/90 hover:text-purple-400 transition-all duration-300 font-medium">
                {item}
              </span>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 group-hover:w-3/4 rounded-full" />
            </a>
          );
        })}
      </div>
    </div>
  );
}