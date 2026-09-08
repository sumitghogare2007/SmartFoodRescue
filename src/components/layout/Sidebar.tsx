import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Users,
  Settings,
  Heart
} from 'lucide-react';

const Sidebar = () => {
  const { authUser } = useAuth();
  const userType = authUser?.userType;

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(userType === 'DONOR' || userType === 'ADMIN' ? [{ to: '/donations/new', label: 'Donate Food', icon: Heart }] : []),
    ...(userType !== 'VOLUNTEER' ? [{ to: '/donations', label: 'Donations', icon: Package }] : []),
    ...(userType === 'NGO' || userType === 'VOLUNTEER' || userType === 'ADMIN' ? [{ to: '/pickups', label: 'Pickups', icon: Truck }] : []),
    ...(userType === 'ADMIN' ? [{ to: '/users', label: 'Users', icon: Users }] : []),
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col transition-colors">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 text-[#1e3a5f] dark:text-emerald-400">
        <Heart className="text-[#166534] dark:text-emerald-400 w-6 h-6" />
        <h1 className="text-xl font-bold">SmartFoodRescue</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                isActive 
                  ? 'bg-green-50 dark:bg-green-950/40 text-[#166534] dark:text-green-300' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 hover:text-[#1e3a5f] dark:hover:text-white'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <NavLink 
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
              isActive
                ? 'bg-green-50 dark:bg-green-950/40 text-[#166534] dark:text-green-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 hover:text-[#1e3a5f] dark:hover:text-white'
            }`
          }
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
