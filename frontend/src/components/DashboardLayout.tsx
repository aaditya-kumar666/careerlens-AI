import React from 'react';
import { useApp, type Page } from '../context/AppContext';
import { 
  LayoutDashboard, 
  SearchCode, 
  Github, 
  FolderGit, 
  Route, 
  Compass, 
  PlaySquare, 
  Settings, 
  LogOut,
  Loader2,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  page: Page;
  active: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    currentPage, 
    setCurrentPage, 
    userEmail, 
    profile, 
    logout, 
    isLoading, 
    loadingStep,
    theme,
    toggleTheme
  } = useApp();

  const menuItems: { icon: React.ReactNode; label: string; page: Page }[] = [
    { icon: <LayoutDashboard size={18} />, label: 'Overview Dashboard', page: 'dashboard' },
    { icon: <SearchCode size={18} />, label: 'Skill Verification', page: 'skills' },
    { icon: <Github size={18} />, label: 'GitHub Intelligence', page: 'github' },
    { icon: <FolderGit size={18} />, label: 'Portfolio Gaps', page: 'portfolio' },
    { icon: <Route size={18} />, label: 'Career Roadmap', page: 'roadmap' },
    { icon: <Compass size={18} />, label: 'Recommended Projects', page: 'projects' },
    { icon: <PlaySquare size={18} />, label: 'Career Simulator', page: 'simulator' },
    { icon: <Settings size={18} />, label: 'Profile Settings', page: 'settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
          <Loader2 size={40} className="animate-spin text-blue-500" />
          <div className="text-lg font-bold text-white">Analyzing Career Profile...</div>
          <div className="text-sm text-slate-400 font-mono animate-pulse">{loadingStep}</div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950 p-6 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
              C
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              CareerLens<span className="text-blue-500 font-bold">AI</span>
            </span>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.page}
                icon={item.icon}
                label={item.label}
                page={item.page}
                active={currentPage === item.page}
                onClick={() => setCurrentPage(item.page)}
              />
            ))}
          </nav>
        </div>

        {/* Profile and Logout Footer */}
        <div className="border-t border-slate-900 pt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 font-mono truncate">{userEmail}</span>
            <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded self-start truncate max-w-full">
              {profile?.target_role || 'Target Not Set'}
            </span>
          </div>
          <div className="flex gap-2 w-full">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span>Theme</span>
            </button>
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 transition-all"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar for Mobile Nav Toggle */}
        <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between md:hidden sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white">
              C
            </div>
            <span className="font-extrabold text-lg text-white">CareerLens</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-white"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={logout}
              className="p-2 text-slate-400 hover:text-white"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Main Content Pane */}
        <main className="p-6 md:p-10 max-w-6xl mx-auto w-full flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
