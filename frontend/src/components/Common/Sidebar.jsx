import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  AlertOctagon,
  History,
  Shield,
  MapPin,
  Package,
  Radio,
  Eye,
  Waves,
  Network,
  Truck,
  Compass,
  Building2,
  Home,
  Users,
  FileText,
  Settings
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role || 'CITIZEN';

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
      isActive
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
    }`;

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between p-3 shrink-0 h-[calc(100vh-53px)] overflow-y-auto">
      <div className="space-y-4">
        {/* Role Badge Header */}
        <div className="px-3 py-2 bg-slate-800/60 rounded-lg border border-slate-700/60">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Current Role</div>
          <div className="font-bold text-xs text-blue-400 mt-0.5">{role}</div>
        </div>

        {/* Citizen Navigation */}
        {role === 'CITIZEN' && (
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">Citizen Portal</div>
            <NavLink to="/citizen/dashboard" className={linkClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Citizen Dashboard</span>
            </NavLink>
            <NavLink to="/citizen/sos" className={linkClass}>
              <AlertOctagon className="w-4 h-4 text-red-400" />
              <span className="text-red-300 font-bold">Emergency SOS</span>
            </NavLink>
            <NavLink to="/citizen/history" className={linkClass}>
              <History className="w-4 h-4" />
              <span>My SOS History</span>
            </NavLink>
          </nav>
        )}

        {/* Command HQ Navigation */}
        {(role === 'COMMAND_HQ' || role === 'ADMIN') && (
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">Command & Control</div>
            <NavLink to="/command/dashboard" className={linkClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Command Dashboard</span>
            </NavLink>
            <NavLink to="/command/sos" className={linkClass}>
              <Shield className="w-4 h-4 text-amber-400" />
              <span>SOS & Rescue Dispatch</span>
            </NavLink>
            <NavLink to="/command/map" className={linkClass}>
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Tactical Disaster Map</span>
            </NavLink>
            <NavLink to="/command/resources" className={linkClass}>
              <Package className="w-4 h-4" />
              <span>Resource Logistics</span>
            </NavLink>
            <NavLink to="/command/broadcast" className={linkClass}>
              <Radio className="w-4 h-4 text-purple-400" />
              <span>Emergency Broadcast</span>
            </NavLink>

            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-3 mb-1">Disaster Simulators</div>
            <NavLink to="/command/flood" className={linkClass}>
              <Waves className="w-4 h-4 text-cyan-400" />
              <span>Flood Surge Simulator</span>
            </NavLink>
            <NavLink to="/command/drone" className={linkClass}>
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Drone FLIR Recon</span>
            </NavLink>
            <NavLink to="/command/mesh" className={linkClass}>
              <Network className="w-4 h-4 text-indigo-400" />
              <span>P2P Mesh Simulator</span>
            </NavLink>
          </nav>
        )}

        {/* Rescue Team Navigation */}
        {(role === 'RESCUE_TEAM' || role === 'ADMIN') && (
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">Rescue Operations</div>
            <NavLink to="/rescue/dashboard" className={linkClass}>
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Rescue Team Console</span>
            </NavLink>
            <NavLink to="/rescue/assignments" className={linkClass}>
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Incident Assignments</span>
            </NavLink>
            <NavLink to="/rescue/navigation" className={linkClass}>
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Safe Route Navigation</span>
            </NavLink>
          </nav>
        )}

        {/* Hospital Module Navigation */}
        {(role === 'HOSPITAL_MANAGER' || role === 'ADMIN') && (
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">Healthcare Triage</div>
            <NavLink to="/hospital/dashboard" className={linkClass}>
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Hospital & ICU Capacity</span>
            </NavLink>
          </nav>
        )}

        {/* Shelter Module Navigation */}
        {(role === 'SHELTER_MANAGER' || role === 'ADMIN') && (
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">Shelter Logistics</div>
            <NavLink to="/shelter/dashboard" className={linkClass}>
              <Home className="w-4 h-4 text-emerald-400" />
              <span>Shelter Capacity & Stocks</span>
            </NavLink>
          </nav>
        )}

        {/* Admin Navigation */}
        {role === 'ADMIN' && (
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-2 mb-1">Administration</div>
            <NavLink to="/admin/dashboard" className={linkClass}>
              <Settings className="w-4 h-4 text-slate-400" />
              <span>System Analytics</span>
            </NavLink>
            <NavLink to="/admin/users" className={linkClass}>
              <Users className="w-4 h-4 text-slate-400" />
              <span>User & Role Directory</span>
            </NavLink>
            <NavLink to="/admin/disasters" className={linkClass}>
              <AlertOctagon className="w-4 h-4 text-red-400" />
              <span>Disasters Config</span>
            </NavLink>
            <NavLink to="/admin/audit" className={linkClass}>
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Audit Compliance Log</span>
            </NavLink>
          </nav>
        )}
      </div>

      {/* Offline Status footer */}
      <div className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center justify-between">
          <span>Engine Mode:</span>
          <span className="text-emerald-400 font-bold">Offline-First</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">Local GeoJSON & Socket Hub</div>
      </div>
    </aside>
  );
};

export default Sidebar;
