import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FormInput } from '../ui/FormInput';

export default function LoginForm() {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(credentials.username, credentials.password);
      if (success) {
        // Redirect will happen automatically due to auth state change
        window.location.reload();
      } else {
        setError('Invalid credentials. Try using admin/admin123');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        label="Username"
        name="username"
        value={credentials.username}
        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
        disabled={isLoading}
      />

      <FormInput
        label="Password"
        name="password"
        type="password"
        value={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        disabled={isLoading}
      />

      {error && (
        <div className="text-red-500 text-sm bg-red-500/10 border border-red-500 p-2 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>

      <div className="text-sm text-gray-400 text-center mt-4">
        <p>Default credentials:</p>
        <p>Username: admin</p>
        <p>Password: admin123</p>
      </div>
    </form>
  );
}