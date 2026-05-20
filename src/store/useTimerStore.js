import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useTimerStore = create(
  persist(
    (set, get) => ({
      isRunning: false,
      startTime: null,
      elapsedTime: 0, // en secondes
      activeCaseId: null,
      activeCaseTitle: '',

      startTimer: (caseId, caseTitle) => {
        set({ 
          isRunning: true, 
          startTime: Date.now() - (get().elapsedTime * 1000),
          activeCaseId: caseId,
          activeCaseTitle: caseTitle
        });
      },

      pauseTimer: () => {
        if (get().isRunning) {
          const now = Date.now();
          const sessionElapsed = Math.floor((now - get().startTime) / 1000);
          set({ isRunning: false, elapsedTime: sessionElapsed });
        }
      },

      resetTimer: () => {
        set({ isRunning: false, startTime: null, elapsedTime: 0, activeCaseId: null, activeCaseTitle: '' });
      },

      // Pour l'affichage dynamique
      getDisplayTime: () => {
        if (!get().isRunning) return get().elapsedTime;
        return Math.floor((Date.now() - get().startTime) / 1000);
      }
    }),
    {
      name: 'lex-timer-storage', // Persistance locale pour ne pas perdre le temps au refresh
    }
  )
);

export default useTimerStore;
