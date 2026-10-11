import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import PriorityBadge from '../../components/Common/PriorityBadge';
import {
  ShieldAlert,
  AlertOctagon,
  Users,
  Truck,
  Building2,
  Home,
  Waves,
  Radio,
  Eye,
  Network,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Clock
} from 'lucide-react';

const CommandDashboard = () => {
  const { socket } = useSocket();
  const [analytics, setAnalytics] = useState(null);
  const [recentSOS, setRecentSOS] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, sosRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/sos')
      ]);
      setAnalytics(analyticsRes.data);
      setRecentSOS(sosRes.data.sos || []);
    } catch (err) {
      console.warn('[CommandDashboard] Failed to fetch live metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    if (socket) {
      socket.on('sos:new', () => fetchDashboardData());
      socket.on('sos:updated', () => fetchDashboardData());
      socket.on('team:status_changed', () => fetchDashboardData());
      socket.on('flood:surge_updated', () => fetchDashboardData());
    }

    return () => {
      if (socket) {
        socket.off('sos:new');
        socket.off('sos:updated');
        socket.off('team:status_changed');
        socket.off('flood:surge_updated');
      }
    };
  }, [socket]);

  const summary = analytics?.summary || {};
  const severityDist = analytics?.severityDist || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  const shelters = analytics?.shelters || { totalCapacity: 1, currentOccupancy: 0, occupancyPct: 0 };
  const hospitals = analytics?.hospitals || { totalIcu: 1, availIcu: 0, totalGen: 1, availGen: 0 };
  const teams = analytics?.teams || { total: 0, active: 0, available: 0, utilizationPct: 0 };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Simulation Quick Access */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <h1 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight">
              STATE EMERGENCY OPERATIONS CENTER (EOC)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Active Event: <strong className="text-slate-200">{summary.activeDisaster || 'River Basin Flood'}</strong> • Water Surge: <span className="text-cyan-400 font-bold font-mono">{summary.waterSurgeLevel?.toFixed(1) || '1.2'}m</span>
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/command/sos"
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg transition"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>SOS Dispatch</span>
          </Link>
          <Link
            to="/command/map"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-3 py-2 rounded-xl border border-slate-700 transition"
          >
            <span>Tactical Map</span>
          </Link>
          <Link
            to="/command/flood"
            className="flex items-center gap-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-200 text-xs px-3 py-2 rounded-xl transition font-semibold"
          >
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>Flood Surge Simulator</span>
          </Link>
          <Link
            to="/command/drone"
            className="flex items-center gap-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-200 text-xs px-3 py-2 rounded-xl transition font-semibold"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Drone FLIR</span>
          </Link>
          <Link
            to="/command/mesh"
            className="flex items-center gap-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 text-indigo-200 text-xs px-3 py-2 rounded-xl transition font-semibold"
          >
            <Network className="w-3.5 h-3.5 text-indigo-400" />
            <span>P2P Mesh</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total SOS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-400 block">Total SOS Incidents</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-100 font-mono">{summary.totalSOS || 0}</span>
            <span className="text-[10px] text-amber-400 font-bold">{summary.pendingSOS || 0} Pending</span>
          </div>
        </div>

        {/* Critical SOS */}
        <div className="bg-slate-900 border border-red-900/60 rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-red-400 block">Critical SOS (Score &gt; 80)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-red-400 font-mono animate-pulse">{summary.criticalSOS || 0}</span>
            <span className="text-[10px] text-red-300 font-bold">Urgent</span>
          </div>
        </div>

        {/* Rescue Teams */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-400 block">Rescue Teams Deployed</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-purple-400 font-mono">{teams.active || 0} / {teams.total || 0}</span>
            <span className="text-[10px] text-slate-400 font-mono">{teams.utilizationPct}% Active</span>
          </div>
        </div>

        {/* Shelter Occupancy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-400 block">Shelter Occupancy</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-400 font-mono">{shelters.occupancyPct || 0}%</span>
            <span className="text-[10px] text-emerald-300">{shelters.availableBeds?.toLocaleString() || 0} Free</span>
          </div>
        </div>

        {/* Hospital ICU Beds */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-400 block">Hospital ICU Available</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-blue-400 font-mono">{hospitals.availIcu || 0} / {hospitals.totalIcu || 0}</span>
            <span className="text-[10px] text-blue-300">{hospitals.totalOxygen || 0} O2 Ready</span>
          </div>
        </div>

        {/* Response Latency */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-400 block">Avg Response Time</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-cyan-400 font-mono">{summary.avgResponseTimeMin || 18}m</span>
            <span className="text-[10px] text-cyan-300 font-semibold">Triage Speed</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Severity Distribution & Live Incident Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Severity Matrix Distribution Chart */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              AI Severity Classification
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Live Database</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-400 font-bold">CRITICAL (81–100)</span>
                <span className="font-mono text-slate-200">{severityDist.CRITICAL || 0} incidents</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(severityDist.CRITICAL / (summary.totalSOS || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-orange-400 font-bold">HIGH (61–80)</span>
                <span className="font-mono text-slate-200">{severityDist.HIGH || 0} incidents</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(severityDist.HIGH / (summary.totalSOS || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-yellow-400 font-bold">MEDIUM (31–60)</span>
                <span className="font-mono text-slate-200">{severityDist.MEDIUM || 0} incidents</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-yellow-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(severityDist.MEDIUM / (summary.totalSOS || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-400 font-bold">LOW (0–30)</span>
                <span className="font-mono text-slate-200">{severityDist.LOW || 0} incidents</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(severityDist.LOW / (summary.totalSOS || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Intelligent Priority calculates: Declared triage severity, stranded count, medical condition, water depth, and waiting latency.
          </div>
        </div>

        {/* Live SOS Emergency Dispatch Queue */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-slate-100">Live Incoming SOS Queue</h3>
              </div>
              <Link
                to="/command/sos"
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                <span>Full Dispatch Console</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {recentSOS.slice(0, 5).map((sos) => (
                <div
                  key={sos._id}
                  className="p-3 bg-slate-800/70 hover:bg-slate-800 rounded-xl border border-slate-700/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-200">{sos.sosId}</span>
                      <PriorityBadge
                        score={sos.priorityScore}
                        level={sos.priorityLevel}
                        breakdown={sos.scoreBreakdown}
                      />
                      <span className="text-[10px] text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800 font-mono">
                        Water: {sos.floodWaterLevel || 0}m
                      </span>
                    </div>
                    <div className="text-slate-300 font-semibold">
                      {sos.citizenName} • {sos.affectedCount} victims ({sos.address})
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-lg">
                      {sos.description || 'Immediate extraction requested'}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      sos.status === 'PENDING' ? 'bg-red-950 text-red-300 border border-red-800' :
                      sos.status === 'DISPATCHED' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                      sos.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}>
                      {sos.status}
                    </span>
                    <Link
                      to="/command/sos"
                      className="text-[11px] text-blue-400 hover:underline font-semibold"
                    >
                      Assign Unit →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Socket.IO Active Listeners Enabled</span>
            <span className="text-emerald-400 font-mono">Real-time Push Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandDashboard;
