import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../ui/Logo';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Users,
  Settings,
  Heart,
  ChevronRight,
  Moon,
  Sun,
  Shield,
  ShieldCheck,
  Building2
} from 'lucide-react';

const Sidebar = () => {
  const { authUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const userType = authUser?.userType;

  const getRoleIcon = () => {
    switch (userType) {
      case 'ADMIN': return <ShieldCheck className="w-4 h-4 text-[#12B8B0]" />;
      case 'NGO': return <Building2 className="w-4 h-4 text-[#12B8B0]" />;
      case 'VOLUNTEER': return <Truck className="w-4 h-4 text-[#12B8B0]" />;
      default: return <Heart className="w-4 h-4 text-[#12B8B0]" />;
    }
  };

  const navSections = [
    {
      title: 'OVERVIEW',
      links: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'OPERATIONS',
      links: [
        ...(userType === 'DONOR' || userType === 'ADMIN' ? [{ to: '/donations/new', label: 'Donate Food', icon: Heart }] : []),
        ...(userType !== 'VOLUNTEER' ? [{ to: '/donations', label: 'Donations', icon: Package }] : []),
        ...(userType === 'NGO' || userType === 'VOLUNTEER' || userType === 'ADMIN' ? [{ to: '/pickups', label: 'Pickups', icon: Truck }] : []),
      ]
    },
    ...(userType === 'ADMIN' ? [{
      title: 'MANAGEMENT',
      links: [
        { to: '/users', label: 'Users & Roles', icon: Users },
      ]
    }] : [])
  ];

  return (
    <aside className="w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-[#D2EBE6] dark:border-white/10 h-full flex flex-col transition-colors z-20 shadow-[4px_0_24px_rgba(18,184,176,0.03)]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#D2EBE6]/70 dark:border-white/10 flex items-center justify-between">
        <Logo size={28} showText={true} textSize="text-lg font-bold" />
      </div>

      {/* User Mini Profile Card (matching screenshot) */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-[#EAF7F5]/80 dark:bg-slate-800/70 border border-[#CEEAE5] dark:border-slate-700/80 rounded-2xl p-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center border border-[#BCE8E2] dark:border-slate-600 shadow-xs flex-shrink-0">
              {getRoleIcon()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] dark:text-teal-300 truncate">
                {userType || 'User'}
              </p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {authUser?.name || 'sumit'}
              </p>
            </div>
          </div>
          <span 
            className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] ring-2 ring-emerald-500/20 flex-shrink-0"
            title="Online & Connected"
          />
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1.5">
              {section.title}
            </p>
            {section.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/dashboard'}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-[#E1F6F3] dark:bg-teal-950/40 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/50 shadow-xs font-semibold' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-[#EAF7F5]/70 dark:hover:bg-slate-800/60 hover:text-[#0F766E] dark:hover:text-teal-300 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <link.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#12B8B0]' : 'text-slate-400 group-hover:text-[#12B8B0]'}`} />
                      <span>{link.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#12B8B0] flex-shrink-0" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}

        {/* Preferences / Settings */}
        <div className="space-y-1 pt-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1.5">
            PREFERENCES
          </p>
          <NavLink 
            to="/settings"
            className={({ isActive }) =>
              `group flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#E1F6F3] dark:bg-teal-950/40 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/50 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-[#EAF7F5]/70 dark:hover:bg-slate-800/60 hover:text-[#0F766E] dark:hover:text-teal-300 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <Settings className={`w-4 h-4 transition-colors ${isActive ? 'text-[#12B8B0]' : 'text-slate-400 group-hover:text-[#12B8B0]'}`} />
                  <span>Settings</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#12B8B0] flex-shrink-0" />}
              </>
            )}
          </NavLink>
        </div>
      </nav>
      
      {/* Bottom Footer with Dark Theme Toggle matching screenshot */}
      <div className="p-3.5 border-t border-[#D2EBE6]/70 dark:border-white/10 space-y-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-800/60 hover:bg-[#EAF7F5] dark:hover:bg-slate-800 border border-[#D5EFEA] dark:border-slate-700/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#12B8B0]" />
            )}
            <span>Use dark theme</span>
          </div>
          <span className="text-[11px] font-semibold text-[#0F766E] dark:text-teal-300 bg-[#E1F6F3] dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-[#BCE8E2] dark:border-teal-800/40">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </button>

        <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-400 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-[#12B8B0]" />
            <span>Secure workspace</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">v2.4</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
