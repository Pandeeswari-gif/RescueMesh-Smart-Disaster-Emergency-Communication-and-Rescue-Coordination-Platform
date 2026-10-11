import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogIn, CheckCircle2, User, Key, AlertCircle } from 'lucide-react';

const DEMO_PRESETS = [
  { role: 'CITIZEN', title: 'Citizen / Victim', email: 'citizen@rescuemesh.org', desc: 'Report emergency SOS, locate nearby shelters & hospitals' },
  { role: 'COMMAND_HQ', title: 'Command Headquarters', email: 'hq@rescuemesh.org', desc: 'Coordinate multi-agency dispatch, live map, flood simulator' },
  { role: 'RESCUE_TEAM', title: 'Field Rescue Team Alpha', email: 'rescue1@rescuemesh.org', desc: 'Accept assignments, safe navigation route, update status' },
  { role: 'HOSPITAL_MANAGER', title: 'Hospital Emergency Desk', email: 'hospital@rescuemesh.org', desc: 'Manage ICU, emergency beds, oxygen, and ambulances' },
  { role: 'SHELTER_MANAGER', title: 'Shelter Relief Center', email: 'shelter@rescuemesh.org', desc: 'Manage shelter occupancy, food stocks, and water rations' },
  { role: 'ADMIN', title: 'System Administrator', email: 'admin@rescuemesh.org', desc: 'System-wide analytics, user roles, disaster parameters' }
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Emergency123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      redirectUser(data.user.role);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials or start backend.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = async (presetEmail, role) => {
    setEmail(presetEmail);
    setPassword('Emergency123!');
    setLoading(true);
    setError('');
    try {
      const data = await login(presetEmail, 'Emergency123!');
      redirectUser(data.user.role);
    } catch (err) {
      setError(err.response?.data?.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (role) => {
    if (role === 'CITIZEN') navigate('/citizen/dashboard');
    else if (role === 'COMMAND_HQ') navigate('/command/dashboard');
    else if (role === 'RESCUE_TEAM') navigate('/rescue/dashboard');
    else if (role === 'HOSPITAL_MANAGER') navigate('/hospital/dashboard');
    else if (role === 'SHELTER_MANAGER') navigate('/shelter/dashboard');
    else if (role === 'ADMIN') navigate('/admin/dashboard');
    else navigate('/citizen/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Brand Header */}
      <div className="text-center mb-6 max-w-md">
        <div className="inline-flex p-3 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-3 shadow-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black tracking-wider text-slate-100">RESCUEMESH</h1>
        <p className="text-xs text-slate-400 mt-1">
          Smart Disaster Emergency Communication & Rescue Coordination Platform
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl w-full">
        {/* Login Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-blue-400" />
              Sign In to Operational Portal
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials to access your dedicated role dashboard.
            </p>

            {error && (
              <div className="mt-4 p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. hq@rescuemesh.org"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-lg shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Need an account?{' '}
            <Link to="/register" className="text-blue-400 hover:underline font-semibold">
              Register as Citizen
            </Link>
          </div>
        </div>

        {/* Quick One-Click Demo Role Cards */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                One-Click Quick Role Switcher (Demo Mode)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any role to test and evaluate the corresponding dashboard immediately.
              </p>
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
              Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_PRESETS.map((p) => (
              <button
                key={p.role}
                type="button"
                onClick={() => handlePresetSelect(p.email, p.role)}
                className="text-left p-3 rounded-xl bg-slate-800/80 hover:bg-blue-950/60 border border-slate-700/80 hover:border-blue-500/50 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200 group-hover:text-blue-300 transition">
                      {p.title}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                      {p.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{p.desc}</p>
                </div>
                <div className="mt-2 text-[10px] text-blue-400 font-semibold group-hover:translate-x-0.5 transition">
                  Login as {p.role} →
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Demo Password for all accounts: <strong className="text-slate-200 font-mono">Emergency123!</strong></span>
            <span className="text-emerald-400">Offline-Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
