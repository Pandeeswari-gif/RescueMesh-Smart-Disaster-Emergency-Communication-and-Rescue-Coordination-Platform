import api from './api';

const QUEUE_KEY = 'rescuemesh_offline_queue';

export const getPendingQueue = () => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveToQueue = (item) => {
  try {
    const queue = getPendingQueue();
    const queuedItem = {
      ...item,
      queuedAt: new Date().toISOString(),
      queueId: `QUEUE-${Date.now()}`
    };
    queue.push(queuedItem);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return queuedItem;
  } catch (e) {
    console.error('[OfflineSync] Failed to save queue item', e);
    return null;
  }
};

export const removeFromQueue = (queueId) => {
  try {
    const queue = getPendingQueue();
    const updated = queue.filter(item => item.queueId !== queueId);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('[OfflineSync] Failed to remove item from queue', e);
  }
};

export const syncPendingItems = async (onItemSynced) => {
  const queue = getPendingQueue();
  if (queue.length === 0) return { success: true, count: 0 };

  console.log(`[OfflineSync] Syncing ${queue.length} pending items to backend...`);
  let syncedCount = 0;

  for (const item of queue) {
    try {
      if (item.actionType === 'SOS_SUBMIT') {
        const response = await api.post('/sos', {
          ...item.data,
          isOfflineQueued: true
        });
        if (response.data.success) {
          removeFromQueue(item.queueId);
          syncedCount++;
          if (onItemSynced) onItemSynced(item, response.data.sos);
        }
      }
    } catch (err) {
      console.warn(`[OfflineSync] Failed to sync item ${item.queueId}, keeping in queue`, err.message);
    }
  }

  return { success: true, count: syncedCount, remaining: getPendingQueue().length };
};
