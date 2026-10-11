import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Settings,
  Users,
  Activity,
  ShieldAlert,
  Database,
  Truck,
  Building2,
  Home,
  CheckCircle2
} from 'lucide-react';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminMetrics = async () => {
      try {
        const res = await api.get('/admin/analytics');
        setAnalytics(res.data);
      } catch (e) {
        console.warn('Failed to load admin analytics', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminMetrics();
  }, []);

  const summary = analytics?.summary || {};
  const teams = analytics?.teams || {};
  const shelters = analytics?.shelters || {};
  const hospitals = analytics?.hospitals || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          System Administration & Mission Critical Telemetry
        </h1>
        <p className="text-xs text-slate-400">
          Global platform operational health, agency integration metrics, user security, and audit logs.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-slate-400 text-[11px] block">Database Status</span>
          <div className="text-lg font-black text-emerald-400 font-mono mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            ONLINE
          </div>
          <span className="text-[10px] text-slate-500">Mongoose / Embedded Engine</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-slate-400 text-[11px] block">Total Registered Incidents</span>
          <div className="text-2xl font-black text-slate-100 font-mono mt-1">
            {summary.totalSOS || 0}
          </div>
          <span className="text-[10px] text-purple-400">{summary.resolvedSOS || 0} Safely Resolved</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-slate-400 text-[11px] block">Field Team Deployment</span>
          <div className="text-2xl font-black text-purple-400 font-mono mt-1">
            {teams.utilizationPct || 0}%
          </div>
          <span className="text-[10px] text-slate-400">{teams.active || 0} of {teams.total || 0} Units Deployed</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-slate-400 text-[11px] block">Overall Shelter Occupancy</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {shelters.occupancyPct || 0}%
          </div>
          <span className="text-[10px] text-slate-400">{shelters.availableBeds?.toLocaleString() || 0} Bunks Available</span>
        </div>
      </div>

      {/* Database Collections Health */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 text-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          Active Data Model Registries
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block">Users & Citizens</span>
            <strong className="text-base font-mono text-slate-100">6 Multi-Role Accounts</strong>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block">Field Rescue Teams</span>
            <strong className="text-base font-mono text-purple-400">{teams.total || 4} Certified Teams</strong>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block">Hospital ICU Total</span>
            <strong className="text-base font-mono text-blue-400">{hospitals.totalIcu || 110} Beds Total</strong>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block">Relief Shelters</span>
            <strong className="text-base font-mono text-emerald-400">{shelters.totalCapacity || 2400} Capacity</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
