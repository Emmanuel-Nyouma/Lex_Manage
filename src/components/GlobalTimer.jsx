import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, ChevronDown, Check, X, Loader2 } from 'lucide-react';
import useTimerStore from '../store/useTimerStore';
import useLexStore from '../store/useLexStore';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const GlobalTimer = () => {
  const { isRunning, startTimer, pauseTimer, resetTimer, activeCaseId, activeCaseTitle, getDisplayTime } = useTimerStore();
  const { cases, currentUser, fetchCases } = useLexStore();
  const [time, setTime] = useState(getDisplayTime());
  const [isSaveModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Mise à jour de l'affichage toutes les secondes
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(getDisplayTime());
      }, 1000);
    } else {
      setTime(getDisplayTime());
    }
    return () => clearInterval(interval);
  }, [isRunning, getDisplayTime]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v < 10 ? "0" + v : v).join(":");
  };

  const handleStop = () => {
    pauseTimer();
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Veuillez saisir une description");
      return;
    }

    setIsSaving(true);
    try {
      const durationMinutes = Math.max(1, Math.ceil(time / 60));
      
      const { error } = await supabase
        .from('time_entries')
        .insert({
          firm_id: currentUser.firm_id,
          case_id: activeCaseId,
          user_id: currentUser.id,
          duration_minutes: durationMinutes,
          description: description
        });

      if (error) throw error;

      toast.success("Temps enregistré avec succès !");
      resetTimer();
      setTime(0);
      setDescription('');
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Widget Flottant / Barre de Header */}
      <div className={`flex items-center gap-3 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-2xl transition-all border border-slate-700 ${isRunning ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-900' : ''}`}>
        <div className="flex items-center gap-2 border-r border-slate-700 pr-3">
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-amber-500 animate-pulse' : 'bg-slate-500'}`}></div>
          <span className="font-mono text-lg font-bold tracking-wider w-20">{formatTime(time)}</span>
        </div>

        <div className="flex items-center gap-1">
          {!isRunning ? (
            <button 
              onClick={() => {
                if (!activeCaseId) {
                  toast.warning("Veuillez sélectionner un dossier");
                  return;
                }
                startTimer(activeCaseId, activeCaseTitle);
              }}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-emerald-400 transition-colors"
            >
              <Play size={20} fill="currentColor" />
            </button>
          ) : (
            <button 
              onClick={pauseTimer}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-amber-400 transition-colors"
            >
              <Pause size={20} fill="currentColor" />
            </button>
          )}

          <button 
            onClick={handleStop}
            disabled={time === 0}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-red-400 transition-colors disabled:opacity-30"
          >
            <Square size={20} fill="currentColor" />
          </button>
        </div>

        <div className="relative group ml-1">
          <select 
            value={activeCaseId || ''}
            onChange={(e) => {
              const selected = cases.find(c => c.id === e.target.value);
              if (selected) startTimer(selected.id, selected.title);
            }}
            className="bg-transparent text-xs font-semibold text-slate-300 outline-none cursor-pointer max-w-[150px] truncate appearance-none pr-4"
          >
            <option value="" disabled className="bg-slate-900">Dossier en cours...</option>
            {cases.map(c => (
              <option key={c.id} value={c.id} className="bg-slate-900">{c.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
        </div>
      </div>

      {/* Modal de Sauvegarde */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Enregistrer le temps</h3>
                  <p className="text-sm text-slate-500">{activeCaseTitle}</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl mb-6 text-center">
                <span className="text-3xl font-mono font-bold text-slate-900 dark:text-white">{formatTime(time)}</span>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Durée totale accumulée</p>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description de la prestation</label>
                  <textarea 
                    autoFocus
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ex: Rédaction des conclusions d'appel, Recherches jurisprudentielles..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white min-h-[100px]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      startTimer(activeCaseId, activeCaseTitle); // Reprendre si on annule
                    }}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Reprendre
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3 bg-amber-500 text-slate-950 rounded-xl font-bold hover:bg-amber-600 shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalTimer;
