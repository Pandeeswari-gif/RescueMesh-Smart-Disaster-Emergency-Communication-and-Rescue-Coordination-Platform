import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import PriorityBadge from '../../components/Common/PriorityBadge';
import {
  Truck,
  Compass,
  CheckCircle,
  AlertOctagon,
  Shield,
  Activity,
  Users,
  Navigation,
  PhoneCall,
  Clock
} from 'lucide-react';

const STATUS_OPTIONS = [
  { status: 'AVAILABLE', label: 'AVAILABLE', color: 'bg-emerald-600 hover:bg-emerald-500' },
  { status: 'DISPATCHED', label: 'DISPATCHED', color: 'bg-purple-600 hover:bg-purple-500' },
  { status: 'ON_ROUTE', label: 'ON_ROUTE', color: 'bg-blue-600 hover:bg-blue-500' },
  { status: 'ON_SITE', label: 'ON_SITE', color: 'bg-yellow-600 hover:bg-yellow-500' },
  { status: 'RESCUING', label: 'RESCUING', color: 'bg-orange-600 hover:bg-orange-500' },
  { status: 'COMPLETED', label: 'COMPLETED', color: 'bg-emerald-700 hover:bg-emerald-600' },
  { status: 'OFFLINE', label: 'OFFLINE', color: 'bg-slate-700 hover:bg-slate-600' }
];

const RescueDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [team, setTeam] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchTeamData = async () => {
    try {
      const res = await api.get('/rescue/my-assignment');
      setTeam(res.data.team);
      setAssignment(res.data.assignment);
    } catch (e) {
      console.warn('Failed to load rescue team data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();

    if (socket) {
      socket.on('rescue:dispatched', () => fetchTeamData());
      socket.on('team:status_changed', () => fetchTeamData());
    }

    return () => {
      if (socket) {
        socket.off('rescue:dispatched');
        socket.off('team:status_changed');
      }
    };
  }, [socket]);

  const handleUpdateStatus = async (newStatus) => {
    if (!assignment && newStatus !== 'AVAILABLE' && newStatus !== 'OFFLINE') {
      alert('No active assignment to update status for. You can set AVAILABLE or OFFLINE.');
    }

    setUpdating(true);
    try {
      if (assignment) {
        await api.put(`/rescue-assignments/${assignment._id}`, { status: newStatus });
      }
      fetchTeamData();
    } catch (err) {
      alert('Status update failed');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">{team?.name || 'Field Rescue Unit Alpha'}</h1>
            <p className="text-xs text-slate-400">
              Team Leader: <strong className="text-slate-200">{team?.leaderName || user?.name}</strong> • Base: {team?.baseStation || 'Sector 1 Station'}
            </p>
          </div>
        </div>

        {/* Current Operational Status Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Live Status:</span>
          <span className="px-3 py-1 bg-purple-950 text-purple-300 border border-purple-800 rounded-full text-xs font-bold font-mono">
            {team?.status || 'AVAILABLE'}
          </span>
        </div>
      </div>

      {/* Operational Status Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
          Update Field Operational Status (Broadcasts to HQ in Real-Time):
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.status}
              onClick={() => handleUpdateStatus(opt.status)}
              disabled={updating}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow ${
                team?.status === opt.status
                  ? `${opt.color} text-white ring-2 ring-white/30 scale-105`
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
              }`}
            >
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Assignment Mission Card */}
      {assignment ? (
        <div className="bg-slate-900 border border-purple-900/60 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <h2 className="text-base font-bold text-slate-100">
                ACTIVE RESCUE MISSION: {assignment.sos?.sosId}
              </h2>
              <PriorityBadge
                score={assignment.sos?.priorityScore}
                level={assignment.sos?.priorityLevel}
                breakdown={assignment.sos?.scoreBreakdown}
              />
            </div>

            <Link
              to="/rescue/navigation"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition"
            >
              <Compass className="w-4 h-4" />
              <span>Launch Safe Route Navigation</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Victim Contact:</span>
              <strong className="text-slate-100 text-sm">{assignment.sos?.citizenName}</strong>
              <span className="text-slate-400 block">{assignment.sos?.citizenPhone}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Stranded Count & Hazard:</span>
              <strong className="text-slate-100">{assignment.sos?.affectedCount} Victims</strong>
              <span className="text-cyan-400 block font-mono">Surge Depth: {assignment.sos?.floodWaterLevel || 0}m</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Location Landmark:</span>
              <span className="text-slate-200">{assignment.sos?.address}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400 text-[11px] block mb-0.5">Victim Situation Report:</span>
            <p className="text-slate-200">{assignment.sos?.description || 'Immediate boat/vehicle extraction required.'}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
            <span>Dispatched: {new Date(assignment.dispatchedAt).toLocaleTimeString()}</span>
            <span className="text-cyan-400 font-mono font-semibold">
              Est. Travel: {assignment.estimatedDistanceKm} km ({assignment.estimatedTimeMin} mins ETA)
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
          <Truck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="font-bold text-slate-200 text-sm">Unit Available on Standby</h3>
          <p className="mt-1">Currently no active dispatch assignment. Waiting for Command HQ dispatch orders.</p>
        </div>
      )}

      {/* Team Capability & Equipment Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 text-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Unit Capabilities & Gear Inventory
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Primary Transport</span>
            <strong className="text-slate-200">{team?.vehicleType || 'Zodiac Rescue Boat'}</strong>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Extraction Capacity</span>
            <strong className="text-slate-200">{team?.capacity || 8} victims per run</strong>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Unit Personnel</span>
            <strong className="text-slate-200">{team?.membersCount || 5} certified rescuers</strong>
          </div>
        </div>

        <div className="pt-2">
          <span className="text-slate-400 text-[11px] block mb-1">Standard Equipment Loadout:</span>
          <div className="flex flex-wrap gap-1.5">
            {team?.equipment?.map((item, idx) => (
              <span key={idx} className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[11px]">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescueDashboard;
