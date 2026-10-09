import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const TooltipContext = createContext({ show() {}, hide() {} });
export const useTooltip = () => useContext(TooltipContext);

export function TooltipProvider({ children }) {
  const [tip, setTip] = useState(null);
  const show = useCallback((e, content) => setTip({ x: e.clientX + 12, y: e.clientY - 30, content }), []);
  const hide = useCallback(() => setTip(null), []);
  const api = useMemo(() => ({ show, hide }), [show, hide]);
  return (
    <TooltipContext.Provider value={api}>
      {children}
      {tip && <div className="tip" style={{ display: 'block', left: tip.x, top: tip.y }}>{tip.content}</div>}
    </TooltipContext.Provider>
  );
}
