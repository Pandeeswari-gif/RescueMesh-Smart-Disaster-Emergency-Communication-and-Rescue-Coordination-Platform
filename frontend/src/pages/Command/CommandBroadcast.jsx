import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import {
  Radio,
  Send,
  Smartphone,
  Wifi,
  Volume2,
  Network,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const CHANNELS = [
  { id: 'IN_APP', label: 'In-App Alert Banner', icon: Radio, desc: 'Pushed to all active dashboards and mobile web sessions' },
  { id: 'LOCAL_NETWORK', label: 'Local LAN Gateway Broadcast', icon: Wifi, desc: 'Transmitted via local municipal intranet & access points' },
  { id: 'SMS_SIMULATION', label: 'Cellular Emergency SMS Broadcast (Simulated)', icon: Smartphone, desc: 'Simulated cell-broadcast to regional handsets' },
  { id: 'RADIO_SIMULATION', label: 'Emergency Frequency Radio Chime (Simulated)', icon: Volume2, desc: 'Simulated VHF disaster frequency audio interrupt' },
  { id: 'MESH_BROADCAST', label: 'Off-Grid P2P Mesh Flood Packet', icon: Network, desc: 'Broadcasted over ad-hoc peer relay nodes' }
];

const CommandBroadcast = () => {
  const { socket } = useSocket();
  const [broadcasts, setBroadcasts] = useState([]);
  const [formData, setFormData] = useState({
    title: 'FLASH FLOOD EVACUATION ADVISORY',
    message: 'Water surge in Zone Beta Lowlands has reached 1.8m. Immediate evacuation to North Hill Shelter or Metro Sports Complex recommended. Avoid Riverside Causeway.',
    type: 'EVACUATION',
    severity: 'EVACUATE_NOW',
    targetZone: 'Zone Beta & River Basin',
    channels: ['IN_APP', 'LOCAL_NETWORK', 'SMS_SIMULATION', 'RADIO_SIMULATION', 'MESH_BROADCAST']
  });

  const [loading, setLoading] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [activePreviewChannel, setActivePreviewChannel] = useState('SMS_SIMULATION');

  const fetchBroadcasts = async () => {
    try {
      const res = await api.get('/broadcasts');
      setBroadcasts(res.data.broadcasts || []);
    } catch (e) {
      console.warn('Failed to fetch broadcasts', e);
    }
  };

  useEffect(() => {
    fetchBroadcasts();

    if (socket) {
      socket.on('broadcast:new', () => fetchBroadcasts());
    }

    return () => {
      if (socket) socket.off('broadcast:new');
    };
  }, [socket]);

  const handleChannelToggle = (channelId) => {
    setFormData(prev => {
      const exists = prev.channels.includes(channelId);
      const updated = exists
        ? prev.channels.filter(c => c !== channelId)
        : [...prev.channels, channelId];
      return { ...prev, channels: updated };
    });
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSentSuccess(false);
    try {
      await api.post('/broadcasts', formData);
      setSentSuccess(true);
      fetchBroadcasts();
      setTimeout(() => setSentSuccess(false), 5000);
    } catch (err) {
      alert(err.response?.data?.message || 'Broadcast failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-400" />
          Multi-Channel Emergency Alert & Broadcast Studio
        </h1>
        <p className="text-xs text-slate-400">
          Simultaneously transmit emergency warnings, evacuation orders, and shelter info across in-app banners, local networks, simulated cellular SMS, and P2P mesh radios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Broadcast Form */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Compose Emergency Broadcast Transmission
          </h2>

          {sentSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Broadcast dispatched successfully across selected transmission channels!</span>
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Broadcast Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Alert Classification</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500"
                >
                  <option value="FLOOD_WARNING">🌊 Flood Warning</option>
                  <option value="EVACUATION">🚨 Evacuation Order</option>
                  <option value="SHELTER_INFO">⛺ Shelter Information</option>
                  <option value="ROAD_CLOSURE">🚧 Road Closure</option>
                  <option value="MEDICAL_EMERGENCY">🚑 Medical Emergency</option>
                  <option value="GENERAL_EMERGENCY">⚠️ General Emergency</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Severity Level</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-red-500"
                >
                  <option value="EVACUATE_NOW" className="text-red-400">EVACUATE NOW (Urgent)</option>
                  <option value="CRITICAL" className="text-red-400">CRITICAL Danger</option>
                  <option value="WARNING" className="text-amber-400">WARNING Advisory</option>
                  <option value="INFO" className="text-blue-400">INFO Notice</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Sector / Zone</label>
                <input
                  type="text"
                  required
                  value={formData.targetZone}
                  onChange={(e) => setFormData({ ...formData, targetZone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Alert Message</label>
              <textarea
                rows={3}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-red-500 leading-relaxed"
              />
            </div>

            {/* Transmission Channels Selector */}
            <div className="space-y-2 pt-1">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] block">
                Select Broadcast Transmission Channels
              </span>

              <div className="space-y-2">
                {CHANNELS.map((ch) => {
                  const Icon = ch.icon;
                  const isSelected = formData.channels.includes(ch.id);
                  return (
                    <label
                      key={ch.id}
                      onClick={() => handleChannelToggle(ch.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-950/60 border-blue-600 text-slate-100'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                        <div>
                          <strong className="text-xs text-slate-200 block">{ch.label}</strong>
                          <span className="text-[10px] text-slate-400">{ch.desc}</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded accent-blue-500"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || formData.channels.length === 0}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-xs py-3 rounded-xl shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Transmitting Alert...' : 'TRANSMIT EMERGENCY BROADCAST NOW'}</span>
            </button>
          </form>
        </div>

        {/* Live Channel Simulation Previews */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Simulated Output Preview
              </h3>
              <div className="flex gap-1">
                {['SMS_SIMULATION', 'RADIO_SIMULATION', 'IN_APP'].map(ch => (
                  <button
                    key={ch}
                    onClick={() => setActivePreviewChannel(ch)}
                    className={`px-2 py-1 rounded text-[10px] font-bold ${
                      activePreviewChannel === ch
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ch.replace('_SIMULATION', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Handset SMS Preview */}
            {activePreviewChannel === 'SMS_SIMULATION' && (
              <div className="max-w-[260px] mx-auto bg-slate-950 border-4 border-slate-800 rounded-3xl p-3 shadow-2xl relative">
                <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto mb-3"></div>
                <div className="p-3 bg-slate-800/90 rounded-2xl border border-red-800 text-xs shadow-lg space-y-1 animate-pulse">
                  <div className="flex items-center justify-between text-[10px] text-red-400 font-bold">
                    <span>EMERGENCY ALERT</span>
                    <span>NOW</span>
                  </div>
                  <strong className="text-slate-100 text-[11px] block">{formData.title}</strong>
                  <p className="text-[10px] text-slate-300 leading-tight">{formData.message}</p>
                  <span className="text-[9px] text-slate-400 block pt-1">Cell Broadcast ID: #CB-9912</span>
                </div>
                <div className="w-8 h-1 bg-slate-700 rounded-full mx-auto mt-4"></div>
              </div>
            )}

            {/* Radio Frequency Preview */}
            {activePreviewChannel === 'RADIO_SIMULATION' && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                <div className="flex items-center gap-2 text-red-400">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span className="font-mono font-bold">VHF FREQ 156.800 MHz (CH 16 / DISTRESS)</span>
                </div>
                <div className="h-8 bg-slate-900 rounded-lg flex items-center justify-center gap-1 overflow-hidden">
                  {[...Array(24)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-cyan-400 rounded-full animate-pulse"
                      style={{ height: `${20 + (i % 5) * 15}%`, animationDelay: `${i * 60}ms` }}
                    />
                  ))}
                </div>
                <div className="font-mono text-[11px] text-slate-300 bg-slate-900 p-2 rounded border border-slate-800">
                  &gt; [AUDIO CHIME TONE 1050 Hz ACTIVE]<br/>
                  &gt; SCRIPT: "ALL STATIONS. THIS IS COMMAND OPERATIONS. {formData.title}. {formData.message}"
                </div>
              </div>
            )}

            {/* In-App Banner Preview */}
            {activePreviewChannel === 'IN_APP' && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-2 text-red-300 font-bold">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>EMERGENCY BANNER: {formData.title}</span>
                </div>
                <p className="text-slate-300 text-[11px]">{formData.message}</p>
              </div>
            )}
          </div>

          {/* Broadcast History */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Transmission History</span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {broadcasts.map(b => (
                <div key={b._id} className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-200">{b.title}</strong>
                    <span className="text-[10px] text-slate-400">{new Date(b.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{b.message}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Target: {b.targetZone}</span>
                    <span className="font-mono text-cyan-400">~{b.reachCount?.toLocaleString()} reached</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandBroadcast;
