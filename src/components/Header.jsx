import React from 'react';
import { Search, Bell, Menu, Bot } from 'lucide-react';

const Header = () => {
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center flex-1 max-w-xl">
        <div className="w-full flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-amber-500/50 transition-all group">
          <Search size={18} className="text-slate-400 mr-2 group-focus-within:text-amber-500 transition-colors" />
          <input 
            className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400" 
            placeholder="Rechercher un dossier, un client, une pièce... (⌘K)" 
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

        <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-sm font-bold transition-all shadow-sm">
          <Bot size={18} />
          <span>Assistant IA</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
