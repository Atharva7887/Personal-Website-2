import { socialLinks } from '../../data/socialLinks';

export default function MorePageFooter() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Navigation Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Navigation</h3>
            <nav className="space-y-2">
              <a href="index.html" className="block text-gray-400 hover:text-white">
                Home
              </a>
              <a href="index2.html" className="block text-gray-400 hover:text-white">
                Blog
              </a>
              <a href="#certifications" className="block text-gray-400 hover:text-white">
                Certifications
              </a>
              <a href="#languages" className="block text-gray-400 hover:text-white">
                Languages
              </a>
            </nav>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            <div className="space-y-2">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-gray-400 hover:text-white"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-2">
              <p className="text-gray-400">
                <a href="mailto:athshirke2002@gmail.com" className="hover:text-white">
                  athshirke2002@gmail.com
                </a>
              </p>
              <p className="text-gray-400">
                <a href="tel:+917887333939" className="hover:text-white">
                  +91 7887333939
                </a>
              </p>
              <p className="text-gray-400">
                Pune, Maharashtra, India
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>© {new Date().getFullYear()} Atharva Shirke. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}