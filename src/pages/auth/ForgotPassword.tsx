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
    <div className="min-h-screen bg-[#EAF7F5] dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Soft Mint Ambient Glow Orbs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#12B8B0]/15 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-[#D9F3EF]/60 dark:bg-teal-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="flex justify-center mb-3">
          <Logo size={46} showText={true} textSize="text-2xl font-bold" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Forgot your password?
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Enter your registered email and we'll generate an instant secure reset link.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-[0_8px_32px_rgba(18,184,176,0.08)] rounded-3xl border border-white/90 dark:border-white/10">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-2xl bg-[#E1F6F3] dark:bg-teal-950/60 border border-[#BCE8E2] text-[#12B8B0] shadow-xs">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Check your email</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                If an account exists for <span className="font-bold text-slate-800 dark:text-slate-200">{email}</span>, instructions have been dispatched.
              </p>
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-3.5 text-xs text-amber-800 dark:text-amber-200 text-left">
                <strong>Note:</strong> The reset link is valid for <strong>30 minutes</strong>.
              </div>

              {devResetUrl && (
                <div className="bg-[#EAF7F5]/80 dark:bg-teal-950/40 border border-[#BCE8E2] dark:border-teal-800/40 rounded-2xl p-4 text-left space-y-2.5 shadow-2xs">
                  <div className="flex items-center text-[#0F766E] dark:text-teal-300 font-bold text-xs uppercase tracking-wide">
                    <KeyRound className="w-4 h-4 mr-1.5 text-[#12B8B0] flex-shrink-0" />
                    <span>Direct Password Reset Link</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {emailSent
                      ? 'Link also dispatched to email. You can also click below to reset immediately:'
                      : 'Development Mode: Click below to reset your password directly:'}
                  </p>
                  <div className="pt-1 flex flex-col sm:flex-row gap-2">
                    <Link
                      to={devResetUrl.replace(/^https?:\/\/[^/]+/, '') || devResetUrl}
                      className="inline-flex items-center justify-center px-3.5 py-2 bg-[#12B8B0] hover:bg-[#0EA29B] text-white text-xs font-bold rounded-xl transition shadow-xs shadow-[#12B8B0]/25"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Open Reset Page
                    </Link>
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="inline-flex items-center justify-center px-3.5 py-2 bg-white dark:bg-slate-800 border border-[#D2EBE6] dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-[#EAF7F5] transition cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1.5 text-[#12B8B0]" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
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
                  className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#12B8B0] hover:bg-[#0EA29B] shadow-xs shadow-[#12B8B0]/25 transition-all"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Sign In
                </Link>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-[#12B8B0] hover:text-[#0EA29B] font-semibold cursor-pointer"
                >
                  Didn't receive it? Try another email
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start">
                  <AlertCircle className="w-4 h-4 mr-2 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="you@domain.org"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#12B8B0] hover:bg-[#0EA29B] shadow-xs shadow-[#12B8B0]/25 transition-all disabled:opacity-50 cursor-pointer"
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
                  className="inline-flex items-center text-xs font-semibold text-[#12B8B0] hover:text-[#0EA29B]"
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
