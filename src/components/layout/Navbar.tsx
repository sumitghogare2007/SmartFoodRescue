import { useAuth } from '../../context/AuthContext';
import { LogOut, UserCircle } from 'lucide-react';
import Logo from '../ui/Logo';

const Navbar = () => {
  const { authUser, signOut } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6 transition-colors">
      <div className="flex items-center">
        <Logo size={28} showText={true} textSize="text-base sm:text-lg font-bold" />
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{authUser?.name || 'User'}</span>
          <span className="text-xs text-[#166534] dark:text-green-300 bg-green-50 dark:bg-green-950/50 border border-transparent dark:border-green-800/60 px-2 py-0.5 rounded-full font-medium tracking-wide">
            {authUser?.userType}
          </span>
        </div>
        <div className="h-8 w-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300">
          <UserCircle className="w-6 h-6" />
        </div>
        <button 
          onClick={signOut}
          className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-2"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
