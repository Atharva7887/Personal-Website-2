import LoginForm from '../components/auth/LoginForm';
import { BlogBackground } from '../components/backgrounds/BlogBackground';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

export default function LoginPage() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      window.location.reload();
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-black text-white">
      <BlogBackground />
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md p-8 bg-gray-900/50 rounded-lg backdrop-blur-sm">
          <h1 className="text-2xl font-bold mb-6 text-center">Blog Admin</h1>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}