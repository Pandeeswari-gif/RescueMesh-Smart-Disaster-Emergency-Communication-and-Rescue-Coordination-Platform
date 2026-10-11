import React, { useState, useEffect } from 'react';
import OfflineMap from '../../components/Map/OfflineMap';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import {
  Waves,
  AlertTriangle,
  Users,
  Home,
  Building2,
  Compass,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

const CommandFloodSimulator = () => {
  const { socket } = useSocket();
  const [waterSurgeLevel, setWaterSurgeLevel] = useState(1.2);
  const [impactData, setImpactData] = useState(null);
  const [disaster, setDisaster] = useState(null);
  const [teams, setTeams] = useState([]);
  const [sosList, setSosList] = useState([]);
  const [safeRoute, setSafeRoute] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const fetchSimulatorState = async () => {
    try {
      const [disasterRes, teamRes, sosRes] = await Promise.all([
        api.get('/disasters'),
        api.get('/rescue-teams'),
        api.get('/sos')
      ]);

      const active = disasterRes.data.disasters?.find(d => d.active) || disasterRes.data.disasters?.[0];
      if (active) {
        setDisaster(active);
        setWaterSurgeLevel(active.waterSurgeLevel || 1.2);
        calculateImpact(active.waterSurgeLevel || 1.2);
      }
      setTeams(teamRes.data.teams || []);
      setSosList(sosRes.data.sos || []);
    } catch (e) {
      console.warn('Failed to load flood simulator state', e);
    }
  };

  const calculateImpact = async (level) => {
    try {
      const res = await api.post('/disasters/simulate-surge', { waterSurgeLevel: level });
      setImpactData(res.data.impact);

      // Recalculate safe route for demo between Team 1 and critical SOS
      if (teams.length > 0 && sosList.length > 0) {
        const team = teams[0];
        const criticalSos = sosList.find(s => s.priorityLevel === 'CRITICAL') || sosList[0];
        if (team && criticalSos) {
          const routeRes = await api.post('/rescue/safe-route', {
            startLat: team.location.latitude,
            startLng: team.location.longitude,
            destLat: criticalSos.latitude,
            destLng: criticalSos.longitude,
            waterSurgeLevel: level
          });
          setSafeRoute(routeRes.data.routePlan);
        }
      }
    } catch (e) {
      console.warn('Surge impact calculation failed', e);
    }
  };

  useEffect(() => {
    fetchSimulatorState();
  }, []);

  const handleSliderChange = (e) => {
    const newLevel = parseFloat(e.target.value);
    setWaterSurgeLevel(newLevel);
    calculateImpact(newLevel);
  };

  const handleCommitSurgeToSystem = async () => {
    setSimulating(true);
    try {
      if (disaster) {
        await api.put(`/disasters/${disaster._id}`, { waterSurgeLevel });
      } else {
        await api.put('/disasters/active', { waterSurgeLevel });
      }
      alert(`Water surge level ${waterSurgeLevel.toFixed(1)}m broadcasted to all rescue units and tactical dashboards!`);
    } catch (err) {
      alert('Failed to update live disaster surge');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Waves className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-slate-100">
              Dynamic Flood Water Surge & Inundation Simulator
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time elevation and hydrological simulation: expand hazard polygons, detect inundated roads, assess shelter risk, and recalculate safe rescue paths.
          </p>
        </div>

        <button
          onClick={handleCommitSurgeToSystem}
          disabled={simulating}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 self-start md:self-auto transition disabled:opacity-50"
        >
          <Waves className="w-4 h-4" />
          <span>{simulating ? 'Broadcasting Surge...' : 'Broadcast Surge to All Systems'}</span>
        </button>
      </div>

      {/* Simulator Control Slider Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Water Surge Elevation Slider (0.0m – 3.0m)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-cyan-400 font-mono">
                {waterSurgeLevel.toFixed(1)}m
              </span>
              <span className="text-xs font-semibold text-slate-300">
                Above Baseline River Water Level
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
              waterSurgeLevel >= 2.2 ? 'bg-red-950 text-red-300 border border-red-800 animate-pulse' :
              waterSurgeLevel >= 1.5 ? 'bg-orange-950 text-orange-300 border border-orange-800' :
              waterSurgeLevel >= 0.8 ? 'bg-yellow-950 text-yellow-300 border border-yellow-800' :
              'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {impactData?.severityClassification || 'MODERATE_SURGE'}
            </span>
          </div>
        </div>

        {/* The Range Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="0.0"
            max="3.0"
            step="0.1"
            value={waterSurgeLevel}
            onChange={handleSliderChange}
            className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>0.0m (Baseline)</span>
            <span>0.8m (Lowlands Inundated)</span>
            <span>1.5m (Causeways Submerged)</span>
            <span>2.2m (Extreme Critical Surge)</span>
            <span>3.0m (Catastrophic Breach)</span>
          </div>
        </div>
      </div>

      {/* Dynamic Impact Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Affected Population */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Users className="w-4 h-4 text-purple-400" />
            <span>Affected Population</span>
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            ~{impactData?.affectedPopulation?.toLocaleString() || '145,000'}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Inundation perimeter</span>
        </div>

        {/* Affected Roads */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Compass className="w-4 h-4 text-red-400" />
            <span>Submerged Roads</span>
          </div>
          <div className="text-2xl font-black text-red-400 font-mono">
            {impactData?.affectedRoads?.length || 0} Blocked
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {impactData?.affectedRoads?.map(r => r.name).join(', ') || 'All Arteries Clear'}
          </span>
        </div>

        {/* Shelters at Risk */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Home className="w-4 h-4 text-amber-400" />
            <span>Shelters at Risk</span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {impactData?.affectedShelters?.length || 0}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {impactData?.affectedShelters?.length > 0 ? 'Secondary relocation advised' : 'All safe on high ground'}
          </span>
        </div>

        {/* Hospitals at Risk */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>Hospitals Impacted</span>
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            {impactData?.affectedHospitals?.length || 0}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {impactData?.affectedHospitals?.length > 0 ? 'Riverbank clinic submerged' : 'High ground trauma ready'}
          </span>
        </div>
      </div>

      {/* Interactive Map with Dynamic Surge Hazard Expansion & Recalculated Safe Route */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Live Geospatial Inundation & Dynamic Route Recalculation
            </h3>
          </div>
          {safeRoute && (
            <div className="text-xs text-slate-300 font-mono bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
              Recalculated Route ETA: <strong className="text-cyan-400">{safeRoute.etaMinutes} mins</strong> ({safeRoute.distanceKm} km)
            </div>
          )}
        </div>

        <OfflineMap
          sosList={sosList}
          teamsList={teams}
          activeRoute={safeRoute}
          waterSurgeLevel={waterSurgeLevel}
          height="500px"
        />

        {safeRoute && safeRoute.avoidedHazards && safeRoute.avoidedHazards.length > 0 && (
          <div className="p-3 bg-amber-950/60 border border-amber-800 rounded-xl text-xs text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Safe Rescue Route Recalculation:</strong> Navigation corridor dynamically rerouted around {safeRoute.avoidedHazards.join(', ')} due to {waterSurgeLevel.toFixed(1)}m water surge!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandFloodSimulator;
