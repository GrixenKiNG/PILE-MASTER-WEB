import { useState, useCallback, useEffect } from 'react';

interface SyncEvent {
  id: string;
  timestamp: string;
  type: string;
  data: any;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  lastRetryTime?: string;
}

/**
 * Custom hook for managing offline sync functionality
 * Handles queue management, retry logic, and sync status tracking
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState<SyncEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Simulate online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const addToQueue = useCallback((eventId: string, eventType: string, data: any) => {
    const syncEvent: SyncEvent = {
      id: eventId,
      timestamp: new Date().toISOString(),
      type: eventType,
      data,
      syncStatus: 'pending',
      retryCount: 0,
    };

    setSyncQueue(prev => [...prev, syncEvent]);
    return syncEvent;
  }, []);

  const removeFromQueue = useCallback((eventId: string) => {
    setSyncQueue(prev => prev.filter(e => e.id !== eventId));
  }, []);

  const updateSyncStatus = useCallback((eventId: string, status: SyncEvent['syncStatus']) => {
    setSyncQueue(prev =>
      prev.map(e =>
        e.id === eventId
          ? { ...e, syncStatus: status, lastRetryTime: new Date().toISOString() }
          : e
      )
    );
  }, []);

  const incrementRetryCount = useCallback((eventId: string) => {
    setSyncQueue(prev =>
      prev.map(e =>
        e.id === eventId
          ? { ...e, retryCount: e.retryCount + 1 }
          : e
      )
    );
  }, []);

  const syncPendingEvents = useCallback(async (): Promise<boolean> => {
    if (!isOnline || syncQueue.length === 0) {
      return false;
    }

    try {
      setIsSyncing(true);
      setSyncError(null);

      const pendingEvents = syncQueue.filter(e => e.syncStatus === 'pending' || e.syncStatus === 'failed');

      for (const event of pendingEvents) {
        updateSyncStatus(event.id, 'syncing');

        try {
          // Mock sync - in production, send to backend API
          await new Promise(resolve => setTimeout(resolve, 500));

          updateSyncStatus(event.id, 'synced');
        } catch (error) {
          incrementRetryCount(event.id);

          if (event.retryCount >= 3) {
            updateSyncStatus(event.id, 'failed');
          } else {
            updateSyncStatus(event.id, 'pending');
          }
        }
      }

      setLastSyncTime(new Date().toISOString());
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setSyncError(errorMessage);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, syncQueue, updateSyncStatus, incrementRetryCount]);

  const getPendingCount = useCallback((): number => {
    return syncQueue.filter(e => e.syncStatus === 'pending').length;
  }, [syncQueue]);

  const getFailedCount = useCallback((): number => {
    return syncQueue.filter(e => e.syncStatus === 'failed').length;
  }, [syncQueue]);

  const getSyncedCount = useCallback((): number => {
    return syncQueue.filter(e => e.syncStatus === 'synced').length;
  }, [syncQueue]);

  const clearSyncedEvents = useCallback(() => {
    setSyncQueue(prev => prev.filter(e => e.syncStatus !== 'synced'));
  }, []);

  const retryFailedEvents = useCallback(() => {
    setSyncQueue(prev =>
      prev.map(e =>
        e.syncStatus === 'failed' ? { ...e, syncStatus: 'pending', retryCount: 0 } : e
      )
    );
  }, []);

  const getTotalQueueSize = useCallback((): number => {
    return syncQueue.reduce((sum, event) => sum + JSON.stringify(event.data).length, 0);
  }, [syncQueue]);

  const getTotalQueueSizeInKB = useCallback((): string => {
    return (getTotalQueueSize() / 1024).toFixed(2);
  }, [getTotalQueueSize]);

  return {
    isOnline,
    syncQueue,
    isSyncing,
    lastSyncTime,
    syncError,
    addToQueue,
    removeFromQueue,
    updateSyncStatus,
    incrementRetryCount,
    syncPendingEvents,
    getPendingCount,
    getFailedCount,
    getSyncedCount,
    clearSyncedEvents,
    retryFailedEvents,
    getTotalQueueSize,
    getTotalQueueSizeInKB,
  };
}
