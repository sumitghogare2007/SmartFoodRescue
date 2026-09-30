import { NavigationProvider } from '../../context/NavigationContext';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';

const AppLayout = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FCFB] via-[#EAF7F5] to-[#D9F3EF] dark:from-[#0F2327] dark:to-[#050E12] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#12B8B0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FCFB] via-[#EAF7F5] to-[#D9F3EF] dark:from-[#0F2327] dark:via-[#09171C] dark:to-[#050E12] text-slate-800 dark:text-slate-100 flex h-screen overflow-hidden transition-colors relative">
      {/* Subtle ambient decorative gradient orbs for glassmorphic depth */}
      <div className="pointer-events-none fixed -top-40 -right-40 w-96 h-96 rounded-full bg-[#12B8B0]/10 dark:bg-[#12B8B0]/5 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#D9F3EF]/60 dark:bg-teal-900/10 blur-3xl" />

      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 z-10">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors">
          <NavigationProvider><Outlet /></NavigationProvider>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
