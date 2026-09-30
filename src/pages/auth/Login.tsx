import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/ui/Logo';
import toast from 'react-hot-toast';
import { Sparkles, ArrowRight } from 'lucide-react';

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
      await signIn({ email: email.trim().toLowerCase(), password });
      toast.success('Successfully logged in');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-[#EAF7F5] dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Soft Mint Ambient Glow Orbs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#12B8B0]/15 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-[#D9F3EF]/60 dark:bg-teal-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 left-1/4 w-96 h-96 bg-[#12B8B0]/10 dark:bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="flex justify-center mb-3">
          <Logo size={46} showText={true} textSize="text-2xl font-bold" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/40 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#12B8B0]" />
          Zero Waste Platform
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Welcome back
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Access your donor, NGO, or volunteer dispatch workspace
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-[0_8px_32px_rgba(18,184,176,0.08)] rounded-3xl border border-white/90 dark:border-white/10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link to="/auth/forgot-password" className="text-xs font-medium text-[#12B8B0] hover:text-[#0EA29B] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#12B8B0] hover:bg-[#0EA29B] shadow-xs shadow-[#12B8B0]/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/auth/register"
                className="font-bold text-[#12B8B0] hover:text-[#0EA29B] transition-colors"
              >
                Register now
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-[#D2EBE6] dark:border-white/10 rounded-2xl p-4 shadow-xs">
          <h4 className="text-xs font-bold text-[#0F766E] dark:text-teal-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#12B8B0]"></span> Quick Demo Credentials:
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@smartfoodrescue.com', 'Admin@123')}
              className="text-left p-2.5 bg-white/80 dark:bg-slate-800/80 border border-[#D2EBE6] dark:border-slate-700 rounded-xl text-xs hover:border-[#12B8B0] hover:bg-[#EAF7F5]/50 transition-all cursor-pointer"
            >
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">Admin Desk</span>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] font-mono block truncate">admin@smartfoodrescue.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('donor@smartfoodrescue.com', 'Donor@123')}
              className="text-left p-2.5 bg-white/80 dark:bg-slate-800/80 border border-[#D2EBE6] dark:border-slate-700 rounded-xl text-xs hover:border-[#12B8B0] hover:bg-[#EAF7F5]/50 transition-all cursor-pointer"
            >
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">Donor (Hotel)</span>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] font-mono block truncate">donor@smartfoodrescue.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('ngo@smartfoodrescue.com', 'Ngo@123')}
              className="text-left p-2.5 bg-white/80 dark:bg-slate-800/80 border border-[#D2EBE6] dark:border-slate-700 rounded-xl text-xs hover:border-[#12B8B0] hover:bg-[#EAF7F5]/50 transition-all cursor-pointer"
            >
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">NGO (Shelter)</span>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] font-mono block truncate">ngo@smartfoodrescue.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('volunteer@smartfoodrescue.com', 'Volunteer@123')}
              className="text-left p-2.5 bg-white/80 dark:bg-slate-800/80 border border-[#D2EBE6] dark:border-slate-700 rounded-xl text-xs hover:border-[#12B8B0] hover:bg-[#EAF7F5]/50 transition-all cursor-pointer"
            >
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">Volunteer Courier</span>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] font-mono block truncate">volunteer@smartfoodrescue.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
