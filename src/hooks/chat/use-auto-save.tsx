import { useEffect, useRef, useCallback } from 'react';
import { chatConfig } from '@/config/chat';

interface AutoSaveOptions {
  sessionId: string | null;
  userId: string;
  enabled?: boolean;
}

/**
 * Hook for auto-saving chat sessions periodically
 * Simplified for use with Vercel AI SDK - just touches session timestamps
 */
export function useAutoSave({ sessionId, userId, enabled = true }: AutoSaveOptions) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);

  const touchSession = useCallback(async () => {
    if (!sessionId || !userId) return;

    try {
      await fetch('/api/chat/sessions/touch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId })
      });
      lastSaveRef.current = Date.now();
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [sessionId, userId]);

  const scheduleAutoSave = useCallback(() => {
    if (!enabled || !sessionId || !userId) return;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule the next save
    saveTimeoutRef.current = setTimeout(async () => {
      await touchSession();
    }, chatConfig.autoSaveInterval);
  }, [enabled, sessionId, userId, touchSession]);

  // Trigger auto-save when session or user changes
  useEffect(() => {
    if (enabled && sessionId && userId) {
      // Initial delay before first auto-save
      const initialDelay = setTimeout(() => {
        scheduleAutoSave();
      }, chatConfig.autoSaveInterval);

      return () => {
        clearTimeout(initialDelay);
      };
    }
  }, [enabled, sessionId, userId, scheduleAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Manual save function
  const saveNow = useCallback(async () => {
    await touchSession();
    // Reschedule the next auto-save
    scheduleAutoSave();
  }, [touchSession, scheduleAutoSave]);

  return {
    saveNow,
    lastSaveTime: lastSaveRef.current,
    isAutoSaveEnabled: enabled && !!sessionId && !!userId
  };
}
