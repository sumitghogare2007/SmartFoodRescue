import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, Bell, Moon, Sun } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Navbar = () => {
  const { authUser, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Rescue Operations';
    if (path.includes('/donations/new')) return 'New Food Donation';
    if (path.includes('/donations')) return 'Donations Directory';
    if (path.includes('/pickups')) return 'Fleet & Pickups';
    if (path.includes('/users')) return 'Platform Directory';
    if (path.includes('/settings')) return 'Settings & Preferences';
    return 'Rescue Desk';
  };

  const initial = (authUser?.name || 'S').trim().charAt(0).toUpperCase();

  return (
    <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-[#D2EBE6]/80 dark:border-white/10 h-16 flex items-center justify-between px-6 transition-colors z-10 shadow-xs">
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
      
      {/* Right Controls (matching screenshot top-right) */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Quick Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-[#D5EFEA] dark:border-slate-700/80 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#12B8B0] hover:bg-[#EAF7F5] dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
          title={`Switch to ${theme === 'dark' ? 'Soft Mint' : 'Dark'} Theme`}
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

        {/* User Pill Button (matching screenshot pill: [S] sumit / Library admin) */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2">
          <div className="flex items-center gap-2.5 bg-white/80 dark:bg-slate-800/80 border border-[#D5EFEA] dark:border-slate-700/80 rounded-2xl py-1.5 px-2.5 sm:px-3 shadow-xs">
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
            <button 
              onClick={signOut}
              className="text-slate-400 hover:text-rose-500 transition-colors ml-1 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
