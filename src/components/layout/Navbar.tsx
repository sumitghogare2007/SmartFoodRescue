import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  LogOut, 
  Bell, 
  Moon, 
  Sun, 
  ChevronDown, 
  User, 
  KeyRound, 
  Palette, 
  Settings as SettingsIcon,
  Sparkles,
  Check
} from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { authUser, signOut } = useAuth();
  const { theme, setTheme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Rescue Operations';
    if (path.includes('/donations/new')) return 'New Food Donation';
    if (path.includes('/donations')) return 'Donations Directory';
    if (path.includes('/pickups')) return 'Fleet & Pickups';
    if (path.includes('/users')) return 'Platform Directory';
    if (path.includes('/settings')) return 'Settings & Preferences';
    if (path.includes('/profile')) return 'My Profile';
    return 'Rescue Desk';
  };

  const initial = (authUser?.name || 'S').trim().charAt(0).toUpperCase();

  return (
    <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-[#D2EBE6]/80 dark:border-white/10 h-16 flex items-center justify-between px-6 transition-colors z-30 shadow-xs">
      {/* Page Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#12B8B0] dark:text-teal-400 bg-[#E1F6F3] dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-[#BCE8E2] dark:border-teal-800/40">
            {authUser?.userType || 'PLATFORM'}
          </span>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
            {getPageTitle()}
          </h1>
        </div>
      </div>
      
      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Quick Dark/Light/Mint Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-[#D5EFEA] dark:border-slate-700/80 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#12B8B0] hover:bg-[#EAF7F5] dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
          title={`Active theme: ${theme}. Click to switch.`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-[#12B8B0]" />
          )}
        </button>

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button 
            className="w-9 h-9 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-[#D5EFEA] dark:border-slate-700/80 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#12B8B0] hover:bg-[#EAF7F5] dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          <span className="absolute 1.5 -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#12B8B0] ring-2 ring-white dark:ring-slate-900" />
        </div>

        {/* User Pill Button with Dropdown */}
        <div className="relative pl-1 sm:pl-2" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 bg-white/80 dark:bg-slate-800/80 hover:bg-[#EAF7F5] dark:hover:bg-slate-800/90 border border-[#D5EFEA] dark:border-slate-700/80 rounded-2xl py-1.5 px-2.5 sm:px-3 shadow-xs transition-all cursor-pointer text-left"
            aria-expanded={dropdownOpen}
          >
            <div className="w-7 h-7 rounded-xl bg-[#12B8B0] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {initial}
            </div>
            <div className="hidden sm:flex flex-col text-left min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">
                {authUser?.name || 'sumit'}
              </span>
              <span className="text-[10px] text-slate-400 capitalize truncate">
                {authUser?.userType ? `${authUser.userType.toLowerCase()} workspace` : 'Active'}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-[#12B8B0]' : ''}`} />
          </button>

          {/* User Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-[#D2EBE6] dark:border-white/10 shadow-[0_12px_40px_rgba(18,184,176,0.15)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header inside Dropdown */}
              <div className="px-4 py-3 border-b border-[#D2EBE6]/70 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#12B8B0] to-[#0EA29B] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {authUser?.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {authUser?.email}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] dark:text-teal-300 bg-[#E1F6F3] dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-[#BCE8E2] dark:border-teal-800/40">
                    {authUser?.userType}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="p-1.5 space-y-0.5">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#EAF7F5] dark:hover:bg-slate-800/80 hover:text-[#0F766E] dark:hover:text-teal-300 transition-colors"
                >
                  <User className="w-4 h-4 text-[#12B8B0]" />
                  <span>My Profile</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/settings?tab=password');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#EAF7F5] dark:hover:bg-slate-800/80 hover:text-[#0F766E] dark:hover:text-teal-300 transition-colors cursor-pointer text-left"
                >
                  <KeyRound className="w-4 h-4 text-[#12B8B0]" />
                  <span>Change Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/settings?tab=theme');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#EAF7F5] dark:hover:bg-slate-800/80 hover:text-[#0F766E] dark:hover:text-teal-300 transition-colors cursor-pointer text-left"
                >
                  <Palette className="w-4 h-4 text-[#12B8B0]" />
                  <span>Change Theme</span>
                </button>

                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#EAF7F5] dark:hover:bg-slate-800/80 hover:text-[#0F766E] dark:hover:text-teal-300 transition-colors"
                >
                  <SettingsIcon className="w-4 h-4 text-[#12B8B0]" />
                  <span>All Settings</span>
                </Link>
              </div>

              {/* Theme Quick Selector in Dropdown */}
              <div className="px-3 py-2 mx-1.5 rounded-xl bg-[#EAF7F5]/60 dark:bg-slate-800/50 border border-[#D2EBE6]/70 dark:border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#12B8B0]" /> Quick Theme
                </p>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setTheme('mint')}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      theme === 'mint'
                        ? 'bg-[#12B8B0] text-white shadow-xs'
                        : 'bg-white/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-[#12B8B0]'
                    }`}
                  >
                    <span>Mint</span>
                    {theme === 'mint' && <Check className="w-2.5 h-2.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-white/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <span>Light</span>
                    {theme === 'light' && <Check className="w-2.5 h-2.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-900 text-teal-300 border border-teal-500/40 shadow-xs'
                        : 'bg-white/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <span>Dark</span>
                    {theme === 'dark' && <Check className="w-2.5 h-2.5" />}
                  </button>
                </div>
              </div>

              {/* Logout button */}
              <div className="p-1.5 pt-2 border-t border-[#D2EBE6]/70 dark:border-white/10 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
