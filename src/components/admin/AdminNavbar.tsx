import { useAuth } from '../../hooks/useAuth';

export default function AdminNavbar() {
  const { logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <span className="text-xl font-bold">Blog Admin</span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="index2.html" className="text-white/90 hover:text-purple-500 transition-colors">
              View Blog
            </a>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}