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
    <div className="min-h-screen bg-[#EAF7F5] dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Soft Mint Ambient Glow Orbs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#12B8B0]/15 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-[#D9F3EF]/60 dark:bg-teal-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="flex justify-center mb-3">
          <Logo size={46} showText={true} textSize="text-2xl font-bold" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Create New Password
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Your new password must be at least 6 characters.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-[0_8px_32px_rgba(18,184,176,0.08)] rounded-3xl border border-white/90 dark:border-white/10">
          {!token ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-2xl bg-rose-100 text-rose-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Missing Reset Token</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No reset token was provided in the URL or the link is invalid. Please request a new password reset link.
              </p>
              <div className="pt-2">
                <Link
                  to="/auth/forgot-password"
                  className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#12B8B0] hover:bg-[#0EA29B] shadow-xs shadow-[#12B8B0]/25 transition-all"
                >
                  Request New Reset Link
                </Link>
              </div>
            </div>
          ) : resetCompleted ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-2xl bg-[#E1F6F3] dark:bg-teal-950/60 border border-[#BCE8E2] text-[#12B8B0] shadow-xs">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Password Reset Complete</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Your password has been successfully updated. You can now sign in with your new credentials.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/auth/login')}
                  className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#12B8B0] hover:bg-[#0EA29B] shadow-xs shadow-[#12B8B0]/25 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Sign In Now
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0]"
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
                      Updating password...
                    </>
                  ) : (
                    'Reset Password'
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

export default ResetPassword;
