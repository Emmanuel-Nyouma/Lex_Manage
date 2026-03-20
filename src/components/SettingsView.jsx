import React from 'react';
import { 
  Settings, 
  Languages, 
  Moon, 
  Sun, 
  Monitor, 
  Check,
  Type
} from 'lucide-react';
import { Card } from './UI';
import { translations } from '../utils/translations';

const SettingsView = ({ language, setLanguage, theme, setTheme }) => {
  const t = translations[language];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.settings}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{t.settings_desc}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Selection */}
        <Card className="p-6 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
              <Languages size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{t.language}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.language_desc}</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { id: 'en', label: 'English', flag: '🇺🇸' },
              { id: 'fr', label: 'Français', flag: '🇫🇷' }
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  language === lang.id
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span className="font-medium text-sm">{lang.label}</span>
                </div>
                {language === lang.id && <Check size={16} />}
              </button>
            ))}
          </div>
        </Card>

        {/* Theme Selection */}
        <Card className="p-6 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Monitor size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{t.theme}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.appearance_desc}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                theme === 'light'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Sun size={24} />
              <span className="text-xs font-bold uppercase tracking-wider">{t.light_mode}</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                theme === 'dark'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Moon size={24} />
              <span className="text-xs font-bold uppercase tracking-wider">{t.dark_mode}</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsView;
