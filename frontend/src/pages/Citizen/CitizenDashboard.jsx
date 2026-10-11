import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import PriorityBadge from '../../components/Common/PriorityBadge';
import {
  AlertOctagon,
  Shield,
  Truck,
  Building2,
  Home,
  CheckCircle,
  Clock,
  Navigation,
  Info,
  ExternalLink
} from 'lucide-react';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeSOS, setActiveSOS] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCitizenData = async () => {
    try {
      const [sosRes, shelterRes, hospRes] = await Promise.all([
        api.get('/sos', { params: { citizenId: user?._id } }),
        api.get('/shelters'),
        api.get('/hospitals')
      ]);

      if (sosRes.data.sos && sosRes.data.sos.length > 0) {
        // Find latest unresolved SOS
        const pending = sosRes.data.sos.find(s => s.status !== 'RESOLVED' && s.status !== 'CANCELLED');
        setActiveSOS(pending || sosRes.data.sos[0]);
      }
      setShelters(shelterRes.data.shelters || []);
      setHospitals(hospRes.data.hospitals || []);
    } catch (e) {
      console.warn('[CitizenDashboard] Could not fetch live data, using offline state', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitizenData();

    if (socket) {
      socket.on('sos:updated', (updated) => {
        if (activeSOS && activeSOS._id === updated._id) {
          setActiveSOS(updated);
        }
      });
      socket.on('rescue:dispatched', (data) => {
        if (activeSOS && activeSOS._id === data.sos._id) {
          setActiveSOS(data.sos);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('sos:updated');
        socket.off('rescue:dispatched');
      }
    };
  }, [user, socket, activeSOS?._id]);

  const getStepColor = (targetStep, currentStatus) => {
    const order = ['PENDING', 'DISPATCHED', 'ON_ROUTE', 'ON_SITE', 'RESCUING', 'RESOLVED'];
    const currentIndex = order.indexOf(currentStatus);
    const targetIndex = order.indexOf(targetStep);

    if (currentIndex >= targetIndex) return 'bg-emerald-500 text-white';
    return 'bg-slate-800 text-slate-500 border border-slate-700';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900/50 via-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Citizen Emergency Portal</span>
          <h1 className="text-xl md:text-2xl font-black text-slate-100 mt-0.5">
            Welcome, {user?.name || 'Citizen'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            RescueMesh connects stranded victims directly with Command HQ and Field Rescue Units using local mesh relays and smart priority dispatching.
          </p>
        </div>

        {/* SOS Button Call to Action */}
        <Link
          to="/citizen/sos"
          className="group relative inline-flex items-center gap-3 bg-red-600 hover:bg-red-500 text-white font-black text-sm px-6 py-3.5 rounded-xl shadow-2xl shadow-red-600/40 hover:scale-105 transition transform"
        >
          <span className="animate-ping absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-400 opacity-75"></span>
          <AlertOctagon className="w-6 h-6 animate-pulse" />
          <span>SUBMIT EMERGENCY SOS</span>
        </Link>
      </div>

      {/* Active SOS Tracker Status Card */}
      {activeSOS && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-100">{activeSOS.sosId}</h3>
                  <PriorityBadge
                    score={activeSOS.priorityScore}
                    level={activeSOS.priorityLevel}
                    breakdown={activeSOS.scoreBreakdown}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reported on {new Date(activeSOS.createdAt).toLocaleString()} • {activeSOS.affectedCount} persons stranded
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Current Status:</span>
              <span className="px-3 py-1 bg-blue-950 text-blue-300 border border-blue-800 rounded-full text-xs font-bold font-mono">
                {activeSOS.status}
              </span>
            </div>
          </div>

          {/* Rescue Timeline Step Progression */}
          <div className="py-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              {[
                { key: 'PENDING', label: '1. SOS Logged' },
                { key: 'DISPATCHED', label: '2. Team Assigned' },
                { key: 'ON_ROUTE', label: '3. En Route' },
                { key: 'ON_SITE', label: '4. On Scene' },
                { key: 'RESOLVED', label: '5. Safe / Rescued' }
              ].map((step) => (
                <div key={step.key} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1.5 transition ${getStepColor(step.key, activeSOS.status)}`}>
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Team Info */}
          {activeSOS.assignedTeam && (
            <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="font-bold text-slate-200">{activeSOS.assignedTeam.name || 'Assigned Field Unit'}</span>
                  <span className="text-slate-400 text-[11px] block">
                    Leader: {activeSOS.assignedTeam.leaderName} • Contact: {activeSOS.assignedTeam.phone}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800">
                Vehicle: {activeSOS.assignedTeam.vehicleType || 'Rescue Boat'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Grid: Nearby Shelters & Hospitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nearby Shelters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Home className="w-4 h-4 text-emerald-400" />
              Designated Emergency Relief Shelters
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">High Ground Safe Zones</span>
          </div>

          <div className="space-y-3">
            {shelters.slice(0, 3).map((shelter) => (
              <div key={shelter._id} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-200">{shelter.name}</h4>
                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                    {shelter.availableCapacity || shelter.totalCapacity - shelter.currentOccupancy} Beds Open
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-1">{shelter.address}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-700/50">
                  <span>Food/Water: {shelter.foodStockDays}d / {shelter.waterStockDays}d</span>
                  <span className="font-mono text-slate-300">Helpline: {shelter.phone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nearby Hospitals */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              Emergency Trauma & Hospital Triage
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Live Bed Matrix</span>
          </div>

          <div className="space-y-3">
            {hospitals.slice(0, 3).map((hosp) => (
              <div key={hosp._id} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-200">{hosp.name}</h4>
                  <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                    {hosp.icuBedsAvailable} ICU / {hosp.emergencyBedsAvailable} Emerg Beds
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-1">{hosp.address}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-700/50">
                  <span>Ambulances: {hosp.ambulancesAvailable} | Oxygen: {hosp.oxygenCylindersAvailable}</span>
                  <span className="font-mono text-slate-300">{hosp.phone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Instructions & Guidelines */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-xs text-slate-300">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-amber-400" />
          Critical Flood Survival Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-400">
          <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800">
            <strong className="text-slate-200 block mb-1">1. Move to High Ground</strong>
            Do not enter walking floodwaters above ankle height. If stranded inside a building, move to upper floors or roof terrace. Never enter an enclosed attic without a roof exit.
          </div>
          <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800">
            <strong className="text-slate-200 block mb-1">2. Electrical Hazard Warning</strong>
            Shut off the main electrical circuit breaker if safely accessible before water reaches outlets. Avoid standing in water near submerged utility poles or power lines.
          </div>
          <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800">
            <strong className="text-slate-200 block mb-1">3. Signal Rescue Teams</strong>
            Tie brightly colored cloth or life vests to roof railings. If cell service drops, keep your device turned on—RescueMesh P2P mesh will relay packets via nearby vehicles.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
