import React, { useState } from 'react';
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
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { authUser, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings & Preferences</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage system appearance, security credentials, and active session across all roles
        </p>
      </div>

      {/* Section 1: Appearance / Theme */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Appearance & Theme
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Choose your interface theme. Your preference is stored locally and applied across the entire app.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/40 text-[#166534] dark:text-green-300 border border-green-200 dark:border-green-800">
            Active: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            {/* Light Mode Option */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-lg border-2 text-left flex items-start gap-4 transition-colors ${
                theme === 'light'
                  ? 'border-[#166534] bg-green-50/50 dark:bg-green-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
              }`}
            >
              <div className={`p-2.5 rounded-md ${theme === 'light' ? 'bg-[#166534] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                <Sun className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Light Mode</span>
                  {theme === 'light' && <CheckCircle className="w-4 h-4 text-[#166534]" />}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Clean, crisp interface optimized for well-lit environments
                </p>
              </div>
            </button>

            {/* Dark Mode Option */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-lg border-2 text-left flex items-start gap-4 transition-colors ${
                theme === 'dark'
                  ? 'border-[#166534] bg-green-50/50 dark:bg-green-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
              }`}
            >
              <div className={`p-2.5 rounded-md ${theme === 'dark' ? 'bg-[#166534] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                <Moon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Dark Mode</span>
                  {theme === 'dark' && <CheckCircle className="w-4 h-4 text-[#166534]" />}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Soft contrast theme for night shifts and low light
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Security / Change Password */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center">
            <Lock className="w-4 h-4 mr-2 text-[#166534]" />
            Account Security & Password
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Update your account password securely. All passwords are encrypted with bcrypt salt hashing.
          </p>
        </div>

        <form onSubmit={handlePasswordChange} className="p-6 space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm focus:ring-[#166534] focus:border-[#166534]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              New Password * (min. 6 characters)
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm focus:ring-[#166534] focus:border-[#166534]"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm focus:ring-[#166534] focus:border-[#166534]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={changingPassword}
              className="px-5 py-2.5 bg-[#166534] text-white rounded-md text-sm font-semibold hover:bg-green-800 transition-colors shadow-sm disabled:opacity-50"
            >
              {changingPassword ? 'Updating Password...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Section 3: Account Profile & Session Logout */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center">
              <User className="w-4 h-4 mr-2 text-[#166534]" />
              Account & Session
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Review your signed-in identity and end your session securely
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-green-50 dark:bg-green-900/40 text-[#166534] dark:text-green-300 border border-green-200 dark:border-green-800">
            {authUser?.userType}
          </span>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm bg-gray-50 dark:bg-gray-900/40 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Full Name</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{authUser?.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Email Address</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{authUser?.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Phone</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{authUser?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sign Out of SmartFoodRescue</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Invalidates the authentication token and returns you to the login screen.
              </p>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center justify-center px-4 py-2 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md text-sm font-semibold transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
