import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/ui/Logo';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn({ email, password });
      toast.success('Successfully logged in');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-3">
          <Logo size={44} showText={true} textSize="text-2xl font-bold" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-[#1e3a5f]">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link to="/auth/forgot-password" className="font-medium text-[#166534] hover:text-green-800">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#166534] hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#166534] disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/auth/register"
                className="font-medium text-[#1e3a5f] hover:text-blue-900"
              >
                Register here
              </Link>
            </div>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Demo Credentials:</h4>
          <ul className="text-xs text-blue-800 space-y-1 font-mono">
            <li>Admin: admin@smartfoodrescue.com / Admin@123</li>
            <li>Donor: donor@smartfoodrescue.com / Donor@123</li>
            <li>NGO: ngo@smartfoodrescue.com / Ngo@123</li>
            <li>Volunteer: volunteer@smartfoodrescue.com / Volunteer@123</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
