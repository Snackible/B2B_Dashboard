import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const FlashContext = createContext(() => {});
/** flash(message) briefly replaces the header status text (e.g. "selection saved locally"). */
export const useFlash = () => useContext(FlashContext);

export function useFlashState() {
  const [message, setMessage] = useState(null);
  const timer = useRef(null);
  const flash = useCallback((msg) => {
    setMessage(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 1500);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [message, flash];
}

export const FlashProvider = FlashContext.Provider;
