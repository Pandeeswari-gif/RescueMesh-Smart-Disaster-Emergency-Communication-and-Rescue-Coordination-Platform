import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useOffline } from '../../context/OfflineContext';
import {
  ShieldAlert,
  Radio,
  Bell,
  LogOut,
  UserCheck,
  ChevronDown,
  Activity,
  X,
  RefreshCcw
} from 'lucide-react';

const DEMO_ROLES = [
  { role: 'CITIZEN', label: 'Citizen / Victim', email: 'citizen@rescuemesh.org' },
  { role: 'COMMAND_HQ', label: 'Command HQ', email: 'hq@rescuemesh.org' },
  { role: 'RESCUE_TEAM', label: 'Rescue Team Alpha', email: 'rescue1@rescuemesh.org' },
  { role: 'HOSPITAL_MANAGER', label: 'Hospital Admin', email: 'hospital@rescuemesh.org' },
  { role: 'SHELTER_MANAGER', label: 'Shelter Director', email: 'shelter@rescuemesh.org' },
  { role: 'ADMIN', label: 'System Admin', email: 'admin@rescuemesh.org' }
];

const Navbar = () => {
  const { user, logout, switchDemoRole } = useAuth();
  const { isConnected, liveAlerts, clearAlert, lastBroadcast } = useSocket();
  const { isOnline } = useOffline();
  const navigate = useNavigate();

  const [alertsOpen, setAlertsOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const handleRoleSwitch = async (email, role) => {
    setRoleSwitcherOpen(false);
    await switchDemoRole(email);
    // Route to appropriate dashboard
    if (role === 'CITIZEN') navigate('/citizen/dashboard');
    else if (role === 'COMMAND_HQ') navigate('/command/dashboard');
    else if (role === 'RESCUE_TEAM') navigate('/rescue/dashboard');
    else if (role === 'HOSPITAL_MANAGER') navigate('/hospital/dashboard');
    else if (role === 'SHELTER_MANAGER') navigate('/shelter/dashboard');
    else if (role === 'ADMIN') navigate('/admin/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-105 transition">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-wider text-base text-white">RESCUEMESH</span>
              <span className="bg-blue-900/60 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-700">
                v2.6
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block tracking-tight">
              Smart Disaster Emergency Communication & Rescue Coordination Platform
            </p>
          </div>
        </Link>
      </div>

      {/* Broadcast Ticker Bar */}
      {lastBroadcast && (
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-red-950/60 border border-red-800/80 rounded-full max-w-md animate-pulse">
          <Radio className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="text-xs text-red-200 truncate font-medium">
            <strong>ALERT:</strong> {lastBroadcast.title} – {lastBroadcast.message}
          </span>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Network Connectivity Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isOnline
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
              : 'bg-amber-950/80 text-amber-300 border-amber-800'
          }`}
          title={isOnline ? 'Online: WebSocket live sync active' : 'Offline Mode Active'}
        >
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          <span className="hidden md:inline">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </div>

        {/* Real-Time Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setAlertsOpen(!alertsOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 relative transition"
            title="Real-time emergency incident alerts"
          >
            <Bell className="w-4 h-4" />
            {liveAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {liveAlerts.length}
              </span>
            )}
          </button>

          {/* Alerts Dropdown */}
          {alertsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <h4 className="font-bold text-xs text-slate-200">Live Incident Alerts</h4>
                </div>
                <span className="text-[10px] text-slate-400">Socket.IO Push</span>
              </div>

              <div className="mt-2 max-h-72 overflow-y-auto space-y-2 pr-1">
                {liveAlerts.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No active emergency alerts.</p>
                ) : (
                  liveAlerts.map(alert => (
                    <div key={alert.id} className="p-2.5 rounded-lg bg-slate-800 border border-slate-700/80 text-xs relative">
                      <button
                        onClick={() => clearAlert(alert.id)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mb-1 ${
                        alert.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-700' : 'bg-blue-950 text-blue-300 border border-blue-700'
                      }`}>
                        {alert.type}
                      </span>
                      <h5 className="font-semibold text-slate-200 text-xs pr-4">{alert.title}</h5>
                      <p className="text-slate-400 text-[11px] mt-0.5">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Demo Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 px-2.5 py-1.5 rounded-lg transition"
            title="Switch demo role instantly for presentation"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline font-medium">Demo Role:</span>
            <span className="font-bold text-blue-300">{user?.role || 'Switch Role'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleSwitcherOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs">
              <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                Switch Active Role
              </div>
              <div className="mt-1 space-y-1">
                {DEMO_ROLES.map(r => (
                  <button
                    key={r.role}
                    onClick={() => handleRoleSwitch(r.email, r.role)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg transition flex items-center justify-between ${
                      user?.role === r.role ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{r.label}</span>
                    <span className="text-[10px] opacity-70 font-mono">{r.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <span className="text-xs text-slate-300 hidden md:inline font-medium truncate max-w-[120px]">
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-300 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
