import { useEffect, useRef, useCallback } from 'react';
import { chatConfig } from '@/config/chat';

interface AutoSaveOptions {
  sessionId: string | null;
  userId: string;
  onSave: () => Promise<void>;
  enabled?: boolean;
}

/**
 * Hook for auto-saving chat sessions periodically
 * Saves the current session state to the database at configured intervals
 */
export function useAutoSave({ sessionId, userId, onSave, enabled = true }: AutoSaveOptions) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);

  const scheduleAutoSave = useCallback(() => {
    if (!enabled || !sessionId || !userId) return;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule the next save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSave();
        lastSaveRef.current = Date.now();
        console.log(`Auto-saved session ${sessionId} at ${new Date().toLocaleTimeString()}`);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, chatConfig.autoSaveInterval);
  }, [enabled, sessionId, userId, onSave]);

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
    if (!sessionId || !userId) return;

    try {
      await onSave();
      lastSaveRef.current = Date.now();
      
      // Reschedule the next auto-save
      scheduleAutoSave();
    } catch (error) {
      console.error('Manual save failed:', error);
    }
  }, [sessionId, userId, onSave, scheduleAutoSave]);

  return {
    saveNow,
    lastSaveTime: lastSaveRef.current,
    isAutoSaveEnabled: enabled && !!sessionId && !!userId
  };
}
