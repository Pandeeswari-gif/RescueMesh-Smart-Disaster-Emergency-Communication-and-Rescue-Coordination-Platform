import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import {
  Network,
  Play,
  SkipForward,
  Plus,
  RefreshCcw,
  Smartphone,
  Radio,
  Truck,
  Shield,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const CommandMeshSimulator = () => {
  const { socket } = useSocket();
  const [nodes, setNodes] = useState([]);
  const [packets, setPackets] = useState([]);
  const [activePacket, setActivePacket] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMeshState = async () => {
    try {
      const res = await api.get('/mesh/packets');
      setNodes(res.data.nodes || []);
      setPackets(res.data.packets || []);
      if (!activePacket && res.data.packets && res.data.packets.length > 0) {
        setActivePacket(res.data.packets[0]);
      }
    } catch (e) {
      console.warn('Failed to load mesh simulator state', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeshState();

    if (socket) {
      socket.on('mesh:packet_created', (data) => {
        setActivePacket(data.packet);
        fetchMeshState();
      });
      socket.on('mesh:packet_relayed', (data) => {
        setActivePacket(data.packet);
        fetchMeshState();
      });
    }

    return () => {
      if (socket) {
        socket.off('mesh:packet_created');
        socket.off('mesh:packet_relayed');
      }
    };
  }, [socket]);

  // Create simulated packet
  const handleInjectPacket = async () => {
    try {
      const res = await api.post('/mesh/packet', {
        sourceNodeId: 'NODE-CITIZEN-01',
        payload: {
          victimName: 'Stranded Resident (No Cellular Service)',
          disasterType: 'FLOOD',
          severity: 'CRITICAL',
          affectedCount: 3,
          message: 'Cell towers completely submerged. Generating multi-hop radio packet to reach EOC gateway.'
        }
      });
      setActivePacket(res.data.packet);
      fetchMeshState();
    } catch (e) {
      alert('Failed to inject mesh packet');
    }
  };

  // Step packet forward
  const handleStepHop = async () => {
    if (!activePacket || activePacket.status === 'DELIVERED') return;
    try {
      const res = await api.post(`/mesh/packet/${activePacket.packetId}/step`);
      setActivePacket(res.data.packet);
      fetchMeshState();
    } catch (e) {
      alert('Step forward failed');
    }
  };

  // Auto-run simulation
  const handleAutoRun = async () => {
    if (!activePacket || activePacket.status === 'DELIVERED') return;
    setSimulating(true);

    const interval = setInterval(async () => {
      try {
        const res = await api.post(`/mesh/packet/${activePacket.packetId}/step`);
        setActivePacket(res.data.packet);
        fetchMeshState();
        if (res.data.completed || res.data.packet.status === 'DELIVERED') {
          clearInterval(interval);
          setSimulating(false);
        }
      } catch (err) {
        clearInterval(interval);
        setSimulating(false);
      }
    }, 1200);
  };

  const getNodeIcon = (type) => {
    if (type === 'CITIZEN_PHONE') return <Smartphone className="w-5 h-5 text-amber-400" />;
    if (type === 'RELAY_NODE') return <Radio className="w-5 h-5 text-blue-400" />;
    if (type === 'RESCUE_VEHICLE') return <Truck className="w-5 h-5 text-purple-400" />;
    return <Shield className="w-5 h-5 text-emerald-400" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-slate-100">
              Off-Grid P2P Mesh Communication Simulator
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Store-and-forward peer-to-peer radio packet simulation across stranded citizen devices, solar relay beacons, mobile rescue vehicles, and Command HQ gateway.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInjectPacket}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New SOS Packet</span>
          </button>
          <button
            onClick={handleStepHop}
            disabled={!activePacket || activePacket.status === 'DELIVERED' || simulating}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <SkipForward className="w-4 h-4 text-cyan-400" />
            <span>Step Next Hop</span>
          </button>
          <button
            onClick={handleAutoRun}
            disabled={!activePacket || activePacket.status === 'DELIVERED' || simulating}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{simulating ? 'Relaying Packet...' : 'Auto-Run Relay'}</span>
          </button>
        </div>
      </div>

      {/* Network Topology Visual Graph */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Ad-Hoc Mesh Node Relay Pathway
          </span>
          <span className="text-[10px] text-indigo-400 font-mono bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
            Simulated P2P Mesh Relay
          </span>
        </div>

        {/* Multi-Hop Pipeline Nodes Visualization */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {[
            { id: 'NODE-CITIZEN-01', label: '1. Citizen Phone', role: 'Originator', desc: 'No cell coverage' },
            { id: 'NODE-RELAY-ALPHA', label: '2. Solar Relay Beacon', role: 'Store & Forward', desc: 'High ground mast' },
            { id: 'NODE-RESCUE-VEHICLE-1', label: '3. Rescue Van Alpha', role: 'Mobile Router', desc: 'Field transceiver' },
            { id: 'COMMAND_GATEWAY', label: '4. Command HQ Gateway', role: 'EOC Receiver', desc: 'Dispatched to database' }
          ].map((step, idx) => {
            const isReached = activePacket && (
              activePacket.hops.some(h => h.toNodeId === step.id) ||
              (step.id === 'NODE-CITIZEN-01')
            );
            const isDelivered = activePacket && activePacket.status === 'DELIVERED' && step.id === 'COMMAND_GATEWAY';

            return (
              <div
                key={step.id}
                className={`p-4 rounded-2xl border transition relative flex flex-col justify-between space-y-3 ${
                  isDelivered
                    ? 'bg-emerald-950/50 border-emerald-500 shadow-xl shadow-emerald-900/30'
                    : isReached
                    ? 'bg-blue-950/50 border-blue-500 shadow-lg'
                    : 'bg-slate-800/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                    {getNodeIcon(idx === 0 ? 'CITIZEN_PHONE' : idx === 1 ? 'RELAY_NODE' : idx === 2 ? 'RESCUE_VEHICLE' : 'COMMAND_GATEWAY')}
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    isDelivered ? 'bg-emerald-900 text-emerald-200' :
                    isReached ? 'bg-blue-900 text-blue-200 animate-pulse' :
                    'bg-slate-800 text-slate-500'
                  }`}>
                    {isDelivered ? 'DELIVERED' : isReached ? 'HOPS LINKED' : 'WAITING'}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-200 text-xs">{step.label}</h4>
                  <span className="text-[11px] text-slate-400 block">{step.role}</span>
                  <p className="text-[10px] text-slate-500 mt-1">{step.desc}</p>
                </div>

                <div className="pt-2 border-t border-slate-750 text-[10px] text-slate-400 font-mono flex justify-between">
                  <span>ID: {step.id.split('-').slice(-2).join('-')}</span>
                  <span>Hop #{idx}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Packet Inspection Box */}
        {activePacket && (
          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300">Packet ID:</span>
                <span className="font-mono text-cyan-400 font-bold">{activePacket.packetId}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  activePacket.status === 'DELIVERED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {activePacket.status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-slate-300 font-mono text-[11px]">
                <span>Hops Completed: <strong className="text-slate-100">{activePacket.hopCount}</strong></span>
                <span>TTL Remaining: <strong className="text-amber-400">{activePacket.ttlRemaining} / {activePacket.maxTtl}</strong></span>
                <span>Dup Suppressed: <strong className="text-emerald-400">TRUE</strong></span>
              </div>
            </div>

            <p className="text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[11px]">
              <strong>Payload:</strong> [{activePacket.payload.type}] {activePacket.payload.victimName} ({activePacket.payload.affectedCount} victims) - "{activePacket.payload.message}"
            </p>

            {/* Hop Path Log */}
            <div className="space-y-1 text-[11px] text-slate-400 font-mono">
              <span className="font-bold text-slate-300 block">Telemetry Relay Hop Log:</span>
              {activePacket.hops.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-cyan-400">[{i}]</span>
                  <span>{h.fromNodeId} → {h.toNodeId}</span>
                  <span className="text-slate-500">({h.signalRssi || -65} dBm)</span>
                  <span className="text-slate-500 text-[10px]">{new Date(h.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandMeshSimulator;
