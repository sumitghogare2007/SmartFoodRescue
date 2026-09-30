import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../lib/api';
import { 
  Sun, 
  Moon, 
  Lock, 
  User, 
  Mail, 
  Phone, 
  LogOut, 
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
  MapPin,
  Palette,
  KeyRound,
  ShieldCheck,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

type TabType = 'all' | 'theme' | 'password' | 'account' | 'session';

const Settings: React.FC = () => {
  const { authUser, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialTab = (searchParams.get('tab') as TabType) || 'all';
  const [activeTab, setActiveTab] = useState<TabType>(
    ['all', 'theme', 'password', 'account', 'session'].includes(initialTab) ? initialTab : 'all'
  );

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && ['all', 'theme', 'password', 'account', 'session'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    if (newTab === 'all') {
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ tab: newTab }, { replace: true });
    }
  };

  const [locating, setLocating] = useState(false);
  const saveFacilityLocation = async () => {
    setLocating(true);
    try {
      if (!window.isSecureContext || !navigator.geolocation) throw new Error('Location capture requires HTTPS or localhost.');
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject,
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }));
      const role = authUser?.userType === 'DONOR' ? 'donors' : 'ngos';
      const profile = (await apiClient.get(`/api/${role}/me`)).data;
      const id = typeof profile.locationId === 'string' ? profile.locationId : profile.locationId?._id;
      if (!id) throw new Error('Facility location record is missing. Please contact an administrator.');
      await apiClient.put(`/api/locations/${id}/coordinates`, {
        latitude: position.coords.latitude, longitude: position.coords.longitude, timestamp: position.timestamp
      });
      toast.success('Facility coordinates saved. Reopen tracking to load the updated destination.');
    } catch (error: any) {
      toast.error(error.code === 1 ? 'Location permission denied. Please enable it in browser settings.' :
        error.response?.data?.message || error.message || 'Could not save facility coordinates.');
    } finally { setLocating(false); }
  };

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await apiClient.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      toast.success(response.data?.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to change password';
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header with Instant Logout Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-white/90 dark:border-white/10 shadow-[0_8px_32px_rgba(18,184,176,0.06)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#12B8B0] dark:text-teal-400 bg-[#E1F6F3] dark:bg-teal-950/60 px-2.5 py-0.5 rounded-md border border-[#BCE8E2] dark:border-teal-800/40">
              System Settings
            </span>
            <span className="text-xs font-semibold text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {authUser?.userType} Workspace
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">Settings & Preferences</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Switch themes, update your password, calibrate facility GPS, or manage your active login session.
          </p>
        </div>

        {/* Header Quick Sign Out Button */}
        <button
          type="button"
          onClick={signOut}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all text-xs font-bold shadow-xs cursor-pointer shrink-0"
          title="Sign out of your account"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-[#EAF7F5]/70 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-[#D2EBE6] dark:border-white/10 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'all'
              ? 'bg-white dark:bg-slate-900 text-[#0F766E] dark:text-teal-300 shadow-xs border border-[#BCE8E2] dark:border-teal-800/40'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#0F766E] dark:hover:text-teal-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#12B8B0]" />
          <span>All Settings</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('theme')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'theme'
              ? 'bg-white dark:bg-slate-900 text-[#0F766E] dark:text-teal-300 shadow-xs border border-[#BCE8E2] dark:border-teal-800/40'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#0F766E] dark:hover:text-teal-300'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-[#12B8B0]" />
          <span>Appearance & Theme</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('password')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'password'
              ? 'bg-white dark:bg-slate-900 text-[#0F766E] dark:text-teal-300 shadow-xs border border-[#BCE8E2] dark:border-teal-800/40'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#0F766E] dark:hover:text-teal-300'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 text-[#12B8B0]" />
          <span>Change Password</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('account')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'account'
              ? 'bg-white dark:bg-slate-900 text-[#0F766E] dark:text-teal-300 shadow-xs border border-[#BCE8E2] dark:border-teal-800/40'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#0F766E] dark:hover:text-teal-300'
          }`}
        >
          <User className="w-3.5 h-3.5 text-[#12B8B0]" />
          <span>Account & Profile</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('session')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'session'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shadow-xs border border-rose-200 dark:border-rose-900/50'
              : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
          }`}
        >
          <LogOut className="w-3.5 h-3.5 text-rose-500" />
          <span>Logout & Session</span>
        </button>
      </div>

      {/* SECTION 1: APPEARANCE & THEME */}
      {(activeTab === 'all' || activeTab === 'theme') && (
        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] border border-white/90 dark:border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#D2EBE6]/70 dark:border-white/10 bg-[#F8FCFB]/80 dark:bg-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Appearance & Theme
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Choose your interface theme. Your preference is saved locally across all devices and dashboards.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/40">
              Active: {theme === 'mint' ? 'Soft Mint Aqua' : theme === 'dark' ? 'Dark Mode' : 'Clean Light'}
            </span>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Soft Mint Aqua Glassmorphism Option */}
              <button
                type="button"
                onClick={() => {
                  setTheme('mint');
                  toast.success('Soft Mint Aqua theme applied!');
                }}
                className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                  theme === 'mint'
                    ? 'border-[#12B8B0] bg-[#EAF7F5]/80 dark:bg-teal-950/40 shadow-sm shadow-[#12B8B0]/20 ring-2 ring-[#12B8B0]/25'
                    : 'border-slate-200 dark:border-slate-700 hover:border-[#12B8B0]/40 bg-white/60 dark:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className={`p-2.5 rounded-xl ${theme === 'mint' ? 'bg-[#12B8B0] text-white shadow-xs' : 'bg-[#E1F6F3] text-[#0F766E]'}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  {theme === 'mint' && <CheckCircle className="w-5 h-5 text-[#12B8B0]" />}
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    Soft Mint Aqua
                    <span className="text-[10px] uppercase tracking-wide bg-[#12B8B0] text-white px-1.5 py-0.2 rounded-md font-bold">Flagship</span>
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Subtle white-to-mint gradient, translucent white cards, and teal accents (#12B8B0)
                  </p>
                </div>
              </button>

              {/* Clean Light Mode Option */}
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  toast.success('Clean Light theme applied!');
                }}
                className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-[#12B8B0] bg-slate-50 dark:bg-slate-800/50 shadow-sm ring-2 ring-[#12B8B0]/25'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white/60 dark:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className={`p-2.5 rounded-xl ${theme === 'light' ? 'bg-slate-800 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    <Sun className="w-5 h-5" />
                  </div>
                  {theme === 'light' && <CheckCircle className="w-5 h-5 text-[#12B8B0]" />}
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Clean Light</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Classic crisp minimalist white interface
                  </p>
                </div>
              </button>

              {/* Dark Mode Option */}
              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  toast.success('Dark Glassmorphism theme applied!');
                }}
                className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-[#12B8B0] bg-slate-900/80 shadow-sm shadow-[#12B8B0]/20 ring-2 ring-[#12B8B0]/25'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white/60 dark:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-[#12B8B0] text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    <Moon className="w-5 h-5" />
                  </div>
                  {theme === 'dark' && <CheckCircle className="w-5 h-5 text-[#12B8B0]" />}
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Dark Glassmorphism</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Deep ocean slate theme with mint ambient accents for night shifts
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: SECURITY & CHANGE PASSWORD */}
      {(activeTab === 'all' || activeTab === 'password') && (
        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] border border-white/90 dark:border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#D2EBE6]/70 dark:border-white/10 bg-[#F8FCFB]/80 dark:bg-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Account Security & Password
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update your account password securely. All passwords are encrypted with bcrypt salt hashing.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bcrypt Encrypted</span>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="p-6 space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password * (min. 6 characters)
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 chars)"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2EBE6] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={changingPassword}
                className="px-5 py-2.5 bg-[#12B8B0] hover:bg-[#0EA29B] text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-[#12B8B0]/25 disabled:opacity-50 cursor-pointer"
              >
                {changingPassword ? 'Updating Password...' : 'Save New Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 3: ACCOUNT & PROFILE / FACILITY */}
      {(activeTab === 'all' || activeTab === 'account') && (
        <div className="space-y-6">
          <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] border border-white/90 dark:border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#D2EBE6]/70 dark:border-white/10 bg-[#F8FCFB]/80 dark:bg-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Account Profile Details
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Your authenticated personal identity and credentials
                  </p>
                </div>
              </div>
              <Link 
                to="/profile" 
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/40 hover:bg-[#D2EBE6] transition-colors"
              >
                View Full Profile →
              </Link>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm bg-[#F8FCFB]/80 dark:bg-slate-800/60 p-4.5 rounded-2xl border border-[#D2EBE6]/70 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#EAF7F5] dark:bg-teal-950/60 text-[#12B8B0]">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Full Name</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{authUser?.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#EAF7F5] dark:bg-teal-950/60 text-[#12B8B0]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Email Address</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{authUser?.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#EAF7F5] dark:bg-teal-950/60 text-[#12B8B0]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Phone</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{authUser?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Facility map location for Donor & NGO */}
          {['DONOR', 'NGO'].includes(authUser?.userType || '') && (
            <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/90 dark:border-white/10 shadow-[0_8px_32px_rgba(18,184,176,0.06)] space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                <MapPin className="w-4 h-4 text-[#12B8B0]" />
                <h2>Facility GPS Coordinates</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Use this while physically at your pickup location or NGO headquarters. This saves precise GPS coordinates used for volunteer fleet routing.
              </p>
              <button 
                onClick={saveFacilityLocation} 
                disabled={locating} 
                className="px-5 py-2.5 bg-[#12B8B0] hover:bg-[#0EA29B] text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-[#12B8B0]/25 disabled:opacity-50 cursor-pointer"
              >
                {locating ? 'Calibrating GPS...' : 'Save Current Device Location as Facility'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: ACTIVE SESSION & LOGOUT */}
      {(activeTab === 'all' || activeTab === 'session') && (
        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] border border-rose-200/60 dark:border-rose-900/40 overflow-hidden">
          <div className="px-6 py-4 border-b border-rose-100 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  Active Session & Sign Out
                </h2>
                <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                  End your authenticated session across this browser safely
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
              Active: {authUser?.userType}
            </span>
          </div>

          <div className="p-6 space-y-6">
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                Signed in as: <span className="text-[#0F766E] dark:text-teal-300 font-bold">{authUser?.name}</span> ({authUser?.email})
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Signing out clears your JSON Web Token (JWT) from local session storage and securely terminates your session.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Ready to sign out?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  You will need your password or magic link to log in again.
                </p>
              </div>

              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-rose-600/25 cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
                Sign Out of SmartFoodRescue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
