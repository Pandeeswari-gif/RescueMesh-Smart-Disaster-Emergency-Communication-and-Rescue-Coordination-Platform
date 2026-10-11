import React from 'react';
import { useOffline } from '../../context/OfflineContext';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

const OfflineBanner = () => {
  const { isOnline, forcedOffline, pendingCount, isSyncing, triggerSync, toggleSimulateOffline, lastSyncMessage } = useOffline();

  if (isOnline && pendingCount === 0 && !lastSyncMessage) {
    return null;
  }

  return (
    <div className={`w-full px-4 py-2 text-xs font-medium border-b flex flex-wrap items-center justify-between transition-all ${
      !isOnline
        ? 'bg-amber-950/80 border-amber-800 text-amber-200'
        : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
    }`}>
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span className="font-bold tracking-wide">OFFLINE MODE ACTIVE:</span>
            <span>Local IndexedDB/localStorage storage active. Maps & offline workflows running locally.</span>
            {pendingCount > 0 && (
              <span className="bg-amber-800 text-amber-100 px-2 py-0.5 rounded-full text-[11px] font-bold">
                {pendingCount} Pending Operation{pendingCount > 1 ? 's' : ''} Queued
              </span>
            )}
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">ONLINE:</span>
            <span>{lastSyncMessage || 'Connected to RescueMesh Command Cloud.'}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 mt-1 sm:mt-0">
        {pendingCount > 0 && isOnline && (
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1 rounded shadow text-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Queued Items'}
          </button>
        )}

        <button
          onClick={toggleSimulateOffline}
          className={`px-2.5 py-1 rounded text-xs border transition ${
            forcedOffline
              ? 'bg-amber-700 hover:bg-amber-600 text-white border-amber-600'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'
          }`}
          title="Toggle simulated network disconnection for testing offline-first behavior"
        >
          {forcedOffline ? 'Exit Offline Simulation' : 'Simulate Offline Mode'}
        </button>
      </div>
    </div>
  );
};

export default OfflineBanner;
