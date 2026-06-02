import { useEffect } from 'react';

export const useKeyboardNavigation = (onClose, onSubmit) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        if (onSubmit) {
          e.preventDefault();
          onSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onSubmit]);
};
