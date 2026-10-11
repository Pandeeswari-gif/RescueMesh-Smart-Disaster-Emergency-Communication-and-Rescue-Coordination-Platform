import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [lastBroadcast, setLastBroadcast] = useState(null);

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      console.log('[Socket.IO] Connected to backend');
      if (user && user.role) {
        socket.emit('join_role_room', user.role);
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log('[Socket.IO] Disconnected from backend');
    };

    const onNewSOS = (sos) => {
      addAlert({
        id: Date.now(),
        type: 'SOS',
        title: `EMERGENCY SOS: ${sos.sosId}`,
        message: `${sos.citizenName} (${sos.affectedCount} victims) - ${sos.severity} Priority`,
        severity: sos.priorityLevel,
        time: new Date()
      });
    };

    const onBroadcast = (broadcast) => {
      setLastBroadcast(broadcast);
      addAlert({
        id: Date.now(),
        type: 'BROADCAST',
        title: `BROADCAST: ${broadcast.title}`,
        message: broadcast.message,
        severity: broadcast.severity,
        time: new Date()
      });
    };

    const onDroneDetection = (data) => {
      addAlert({
        id: Date.now(),
        type: 'DRONE',
        title: `UAV THERMAL DETECT: ${data.detection.sector}`,
        message: `Heat cluster (${data.detection.heatSignatureTempC}°C) - ${data.detection.estimatedVictims} victims estimated`,
        severity: 'CRITICAL',
        time: new Date()
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('sos:new', onNewSOS);
    socket.on('broadcast:new', onBroadcast);
    socket.on('drone:detection', onDroneDetection);

    if (user && user.role && socket.connected) {
      socket.emit('join_role_room', user.role);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('sos:new', onNewSOS);
      socket.off('broadcast:new', onBroadcast);
      socket.off('drone:detection', onDroneDetection);
    };
  }, [user]);

  const addAlert = (alert) => {
    setLiveAlerts(prev => [alert, ...prev.slice(0, 19)]);
  };

  const clearAlert = (id) => {
    setLiveAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, liveAlerts, lastBroadcast, clearAlert }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
