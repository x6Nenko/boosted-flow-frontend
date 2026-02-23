import { useState, useRef, useCallback } from 'react';

type CopyState = 'idle' | 'copied';

export function useCopyFeedback(resetMs = 2000): [CopyState, () => void] {
  const [state, setState] = useState<CopyState>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const trigger = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setState('copied');
    timeoutRef.current = setTimeout(() => setState('idle'), resetMs);
  }, [resetMs]);

  return [state, trigger];
}
