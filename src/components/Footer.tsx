export default function Footer() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Grid container for sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Navigation Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Navigation</h3>
            <nav aria-label="Footer Navigation">
              <ul className="space-y-2">
                <li>
                  <a href="#about" className="text-gray-400 hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#projects"
                    className="text-gray-400 hover:text-white"
                  >
                    Projects
                  </a>
                </li>
                <li>
                  <a href="/blog" className="text-gray-400 hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-gray-400 hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Blog Categories Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Blog Categories</h3>
            <nav aria-label="Blog Categories">
              <ul className="space-y-2">
                <li>
                  <a
                    href="/blog#technology"
                    className="text-gray-400 hover:text-white"
                  >
                    Technology
                  </a>
                </li>
                <li>
                  <a
                    href="/blog#programming"
                    className="text-gray-400 hover:text-white"
                  >
                    Programming
                  </a>
                </li>
                <li>
                  <a
                    href="/blog#ai-ml"
                    className="text-gray-400 hover:text-white"
                  >
                    AI & ML
                  </a>
                </li>
                <li>
                  <a
                    href="/blog#web-development"
                    className="text-gray-400 hover:text-white"
                  >
                    Web Development
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Social and See More Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Social Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Social</h3>
              <nav aria-label="Social Links">
                <ul className="space-y-2">
                  <li>
                    <a
                      href="https://linkedin.com/in/your-profile"
                      className="text-gray-400 hover:text-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LinkedIn
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/your-username"
                      className="text-gray-400 hover:text-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://twitter.com/your-handle"
                      className="text-gray-400 hover:text-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Twitter
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            {/* See More Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">See More</h3>
              <nav aria-label="See More Links">
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/more.html#certifications"
                      className="text-gray-400 hover:text-white"
                    >
                      Certifications
                    </a>
                  </li>
                  <li>
                    <a
                      href="/more.html#languages"
                      className="text-gray-400 hover:text-white"
                    >
                      Languages
                    </a>
                  </li>
                  <li>
                    <a
                      href="/more.html#extra-curricular"
                      className="text-gray-400 hover:text-white"
                    >
                      Extra Curricular Activities
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>

        {/* Footer bottom section */}
        <div className="pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>© 2024 Atharva Shirke. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
