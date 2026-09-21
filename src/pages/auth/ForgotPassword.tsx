import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import { apiClient } from '../../lib/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/auth/forgot-password', { email: cleanEmail });
      setSubmitted(true);
      toast.success('Reset link requested');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Unable to process your request. Please try again.';
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
          Forgot your password?
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your registered email and we will send you instructions to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-[#166534]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Check your email</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                If an account exists for <span className="font-semibold text-gray-900">{email}</span>, a password reset link has been sent to your inbox.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800 text-left">
                <strong>Note:</strong> The reset link is valid for <strong>30 minutes</strong>. If you don't see it in your inbox, please check your spam or junk folder.
              </div>

              <div className="pt-4 space-y-3">
                <Link
                  to="/auth/login"
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#166534] hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#166534]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Sign In
                </Link>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-sm text-[#166534] hover:text-green-800 font-medium cursor-pointer"
                >
                  Didn't receive it? Try another email
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
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
                      Sending reset link...
                    </>
                  ) : (
                    'Send Reset Link'
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

export default ForgotPassword;
