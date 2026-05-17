import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour détecter l'inactivité de l'utilisateur
 * @param {number} timeoutMS - Délai en millisecondes (défaut 15 min)
 */
export const useIdleTimeout = (timeoutMS = 15 * 60 * 1000) => {
  const [isIdle, setIsIdle] = useState(false);

  const handleActivity = useCallback(() => {
    setIsIdle(false);
  }, []);

  useEffect(() => {
    let timeoutId;

    const setupTimeout = () => {
      timeoutId = setTimeout(() => setIsIdle(true), timeoutMS);
    };

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      handleActivity();
      setupTimeout();
    };

    // Événements à surveiller
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => window.addEventListener(event, resetTimeout));
    setupTimeout();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimeout));
    };
  }, [timeoutMS, handleActivity]);

  return { isIdle, setIsIdle };
};
