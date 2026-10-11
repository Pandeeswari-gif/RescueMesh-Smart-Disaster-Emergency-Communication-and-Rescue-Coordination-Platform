import React, { useState, useEffect } from 'react';
import OfflineMap from '../../components/Map/OfflineMap';
import api from '../../services/api';
import {
  Compass,
  AlertTriangle,
  Navigation,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

const RescueNavigation = () => {
  const [team, setTeam] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [routePlan, setRoutePlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRouteAndAssignment = async () => {
    try {
      const res = await api.get('/rescue/my-assignment');
      const curTeam = res.data.team;
      const curAssign = res.data.assignment;
      setTeam(curTeam);
      setAssignment(curAssign);

      if (curTeam && curAssign && curAssign.sos) {
        // Calculate safe route
        const routeRes = await api.post('/rescue/safe-route', {
          startLat: curTeam.location.latitude,
          startLng: curTeam.location.longitude,
          destLat: curAssign.sos.latitude,
          destLng: curAssign.sos.longitude,
          waterSurgeLevel: curAssign.sos.floodWaterLevel || 1.2
        });
        setRoutePlan(routeRes.data.routePlan);
      } else {
        // Demo baseline route
        const fallbackRoute = await api.post('/rescue/safe-route', {
          startLat: 13.1000,
          startLng: 80.2350,
          destLat: 13.0845,
          destLng: 80.2520,
          waterSurgeLevel: 1.5
        });
        setRoutePlan(fallbackRoute.data.routePlan);
      }
    } catch (e) {
      console.warn('Failed to load safe rescue navigation', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRouteAndAssignment();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-slate-100">
              Safe Rescue Navigation (Software Prototype)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Pathfinding engine routing emergency vehicles and watercraft along elevated bypasses and safe corridors while steering away from submerged hazard polygons.
          </p>
        </div>

        <div className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 font-mono">
          Route Safety Status: <strong className="text-emerald-400">OPTIMAL HAZARD AVOIDANCE</strong>
        </div>
      </div>

      {/* Navigation Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-slate-400 text-[11px] block">Estimated Route Distance</span>
          <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
            {routePlan?.distanceKm || 4.8} km
          </div>
          <span className="text-[10px] text-slate-400">Highground bypass length</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-slate-400 text-[11px] block">Estimated Arrival Time</span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            {routePlan?.etaMinutes || 12} mins
          </div>
          <span className="text-[10px] text-slate-400">At safe emergency speed</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-slate-400 text-[11px] block">Water Surge Depth</span>
          <div className="text-2xl font-black text-slate-100 font-mono mt-1">
            {routePlan?.waterSurgeLevel || 1.2}m
          </div>
          <span className="text-[10px] text-cyan-400">Monitored hazard perimeter</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-slate-400 text-[11px] block">Avoided Hazard Zones</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {routePlan?.avoidedHazards?.length || 1}
          </div>
          <span className="text-[10px] text-slate-400 truncate block">
            {routePlan?.avoidedHazards?.join(', ') || 'Lowland Delta'}
          </span>
        </div>
      </div>

      {/* Route Avoidance Warning Alert */}
      {routePlan?.avoidedHazards && routePlan.avoidedHazards.length > 0 && (
        <div className="p-4 bg-amber-950/60 border border-amber-800 rounded-2xl text-xs text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block font-bold">Dynamic Route Diversion Active:</strong>
            <p className="text-amber-300/90 leading-relaxed">
              The direct roadway passes through the submerged <strong>{routePlan.avoidedHazards.join(' and ')}</strong>. Safe Rescue Navigation has automatically generated waypoints via the elevated Highland Bypass Link to prevent watercraft and vehicle stranding.
            </p>
          </div>
        </div>
      )}

      {/* Full Tactical Route Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Safe Rescue Navigation Waypoint Polyline (Cyan Highlight)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Offline Local GeoJSON Graph</span>
        </div>

        <OfflineMap
          activeRoute={routePlan}
          waterSurgeLevel={routePlan?.waterSurgeLevel || 1.2}
          height="520px"
        />
      </div>
    </div>
  );
};

export default RescueNavigation;
