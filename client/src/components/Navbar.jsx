import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bot, Sparkles, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'History', path: '/history' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto glass rounded-2xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
            <Bot size={22} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight leading-none italic">SmartRecruit <span className="text-blue-400">AI</span></span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Pro Coach</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {token && navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-all duration-300 relative group ${
                location.pathname === item.path ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.name}
              <span className={`absolute -bottom-1 left-0 h-[2px] bg-blue-500 transition-all duration-300 ${
                location.pathname === item.path ? 'w-full' : 'w-0 group-hover:w-full'
              }`} />
            </Link>
          ))}
          
          {token ? (
            <div className="flex items-center gap-4">
              <Link
                to="/interview"
                className="px-6 py-2.5 bg-white text-slate-950 hover:bg-blue-500 hover:text-white rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 shadow-xl hover:shadow-blue-500/20"
              >
                <Sparkles size={16} /> Start Mock
              </Link>
              <button
                onClick={handleLogout}
                className="p-2.5 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-white/5"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold transition-all duration-300 shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
