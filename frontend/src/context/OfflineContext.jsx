import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPendingQueue, saveToQueue, syncPendingItems } from '../services/offlineSync';

const OfflineContext = createContext(null);

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [forcedOffline, setForcedOffline] = useState(false);
  const [pendingQueue, setPendingQueue] = useState(getPendingQueue());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncMessage, setLastSyncMessage] = useState(null);

  // Real browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (!forcedOffline) {
        setIsOnline(true);
        triggerSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setPendingQueue(getPendingQueue());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [forcedOffline]);

  const triggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncPendingItems((queuedItem, syncedData) => {
        setLastSyncMessage(`Synced queued SOS (${syncedData.sosId}) successfully to Command HQ.`);
      });
      setPendingQueue(getPendingQueue());
    } catch (e) {
      console.warn('[OfflineContext] Sync cycle completed with warnings', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Queue an emergency SOS locally while offline
  const queueOfflineSOS = (sosData) => {
    const queued = saveToQueue({
      actionType: 'SOS_SUBMIT',
      data: sosData
    });
    setPendingQueue(getPendingQueue());
    return queued;
  };

  // Toggle offline simulation for live hackathon/testing demonstration
  const toggleSimulateOffline = () => {
    setForcedOffline(prev => {
      const nextVal = !prev;
      if (nextVal) {
        setIsOnline(false);
      } else {
        setIsOnline(window.navigator.onLine);
        triggerSync();
      }
      return nextVal;
    });
  };

  const effectiveOnline = isOnline && !forcedOffline;

  return (
    <OfflineContext.Provider value={{
      isOnline: effectiveOnline,
      forcedOffline,
      pendingCount: pendingQueue.length,
      pendingQueue,
      isSyncing,
      lastSyncMessage,
      queueOfflineSOS,
      triggerSync,
      toggleSimulateOffline
    }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within an OfflineProvider');
  return context;
};
