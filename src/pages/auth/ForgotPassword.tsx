import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, Loader2, KeyRound, ExternalLink, Copy, Check } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import { apiClient } from '../../lib/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setDevResetUrl(null);
    setCopied(false);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/api/auth/forgot-password', { email: cleanEmail });
      setSubmitted(true);
      setEmailSent(res.data?.emailSent ?? false);
      if (res.data?.resetUrl) {
        setDevResetUrl(res.data.resetUrl);
      }
      toast.success(res.data?.message || 'Password reset link generated!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Unable to process your request. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (devResetUrl) {
      navigator.clipboard.writeText(devResetUrl);
      setCopied(true);
      toast.success('Reset link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
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

              {devResetUrl && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-left space-y-2 shadow-sm">
                  <div className="flex items-center text-emerald-800 font-semibold text-xs uppercase tracking-wide">
                    <KeyRound className="w-4 h-4 mr-1.5 text-emerald-700 flex-shrink-0" />
                    <span>Direct Password Reset Link</span>
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    {emailSent
                      ? 'Link also dispatched to email. You can also click below to reset immediately:'
                      : 'Development Mode: Since SMTP email delivery is unavailable locally, use this direct link to reset your password:'}
                  </p>
                  <div className="pt-1 flex flex-col sm:flex-row gap-2">
                    <Link
                      to={devResetUrl.replace(/^https?:\/\/[^/]+/, '') || devResetUrl}
                      className="inline-flex items-center justify-center px-3 py-1.5 bg-[#166534] text-white text-xs font-semibold rounded hover:bg-green-800 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Open Reset Password Page
                    </Link>
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="inline-flex items-center justify-center px-3 py-1.5 bg-white border border-emerald-400 text-emerald-800 text-xs font-medium rounded hover:bg-emerald-100 transition cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                          Copy Link
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

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
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{errorMessage}</p>
                    {errorMessage.toLowerCase().includes('no user exists') && (
                      <p className="mt-1 text-xs text-red-600">
                        Don't have an account yet?{' '}
                        <Link to="/auth/register" className="font-semibold underline hover:text-red-800">
                          Register here
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              )}

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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
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
