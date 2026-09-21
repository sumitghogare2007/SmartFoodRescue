import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import { apiClient } from '../../lib/api';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Reset token is missing or invalid. Please request a new link.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/api/auth/reset-password', {
        token,
        newPassword,
        confirmPassword,
      });

      setResetCompleted(true);
      toast.success(res.data?.message || 'Password reset successful!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to reset password. The link may have expired.';
      toast.error(msg);
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
          Create New Password
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Your new password must be at least 6 characters.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          {!token ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Missing Reset Token</h3>
              <p className="text-sm text-gray-600">
                No reset token was provided in the URL or the link is invalid. Please request a new password reset link.
              </p>
              <div className="pt-2">
                <Link
                  to="/auth/forgot-password"
                  className="w-full inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#166534] hover:bg-green-800"
                >
                  Request New Reset Link
                </Link>
              </div>
            </div>
          ) : resetCompleted ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-[#166534]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Password Reset Complete</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your password has been successfully updated. You can now sign in with your new credentials.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/auth/login')}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#166534] hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#166534]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Sign In Now
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#166534] focus:border-[#166534] sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#166534] hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#166534] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <Link
                  to="/auth/login"
                  className="inline-flex items-center text-sm font-medium text-[#166534] hover:text-green-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
