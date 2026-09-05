import { useAuth } from '../../context/AuthContext';
import { LogOut, UserCircle } from 'lucide-react';

const Navbar = () => {
  const { authUser, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center">
        {/* Empty space for mobile menu toggle if needed */}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold text-gray-900">{authUser?.name || 'User'}</span>
          <span className="text-xs text-[#166534] bg-green-50 px-2 py-0.5 rounded-full font-medium tracking-wide">
            {authUser?.userType}
          </span>
        </div>
        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
          <UserCircle className="w-6 h-6" />
        </div>
        <button 
          onClick={signOut}
          className="text-gray-500 hover:text-red-600 transition-colors ml-2"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
