import { useEffect, useRef } from 'react';
import { useNavigate, useMatches } from '@tanstack/react-router';
import { commandPaletteStore } from '@/features/command-palette';

type HotkeyHandler = () => void;

interface ActivityPageHotkeyHandlers {
  onStartStop?: HotkeyHandler;
  onAddDistraction?: HotkeyHandler;
}

/**
 * Global hotkeys.
 */
export function useGlobalHotkeys() {
  const navigate = useNavigate();
  const pendingGRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Cmd/Ctrl + K: Toggle palette (always active, even in inputs)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        commandPaletteStore.toggle();
        return;
      }

      // Skip other hotkeys if typing in input
      if (isInputFocused) {
        pendingGRef.current = false;
        return;
      }

      // g + key navigation (vim-style)
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        pendingGRef.current = true;
        // Reset after timeout
        setTimeout(() => {
          pendingGRef.current = false;
        }, 1000);
        return;
      }

      if (pendingGRef.current) {
        pendingGRef.current = false;
        if (e.key === 'd') {
          e.preventDefault();
          navigate({ to: '/dashboard' });
          return;
        }
        if (e.key === 'a') {
          e.preventDefault();
          navigate({ to: '/activities' });
          return;
        }
        if (e.key === 'n') {
          e.preventDefault();
          navigate({ to: '/analytics' });
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}

/**
 * Activity page specific hotkeys.
 */
export function useActivityPageHotkeys(handlers: ActivityPageHotkeyHandlers = {}) {
  const matches = useMatches();
  const isOnActivityPage = matches.some((m) => m.routeId === '/_auth/activities/$activityId');

  useEffect(() => {
    if (!isOnActivityPage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Skip if typing in input
      if (isInputFocused) return;

      // Space: Start/Stop timer
      if (e.code === 'Space') {
        e.preventDefault();
        handlers.onStartStop?.();
        return;
      }

      // Shift + D: Add distraction
      if (e.shiftKey && e.key === 'D') {
        e.preventDefault();
        handlers.onAddDistraction?.();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOnActivityPage, handlers]);
}
