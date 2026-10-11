import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import {
  Home,
  Users,
  Utensils,
  Droplet,
  ShieldCheck,
  CheckCircle2,
  Save,
  Plus,
  Minus
} from 'lucide-react';

const ShelterDashboard = () => {
  const { socket } = useSocket();
  const [shelters, setShelters] = useState([]);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchShelters = async () => {
    try {
      const res = await api.get('/shelters');
      const list = res.data.shelters || [];
      setShelters(list);
      if (list.length > 0 && !selectedShelter) {
        setSelectedShelter(list[0]);
        initForm(list[0]);
      }
    } catch (e) {
      console.warn('Failed to load shelters', e);
    }
  };

  const initForm = (s) => {
    setFormData({
      currentOccupancy: s.currentOccupancy,
      totalCapacity: s.totalCapacity,
      foodStockDays: s.foodStockDays,
      waterStockDays: s.waterStockDays,
      medicalSupport: s.medicalSupport,
      status: s.status
    });
  };

  useEffect(() => {
    fetchShelters();

    if (socket) {
      socket.on('shelter:updated', (updated) => {
        setShelters(prev => prev.map(s => s._id === updated._id ? updated : s));
        if (selectedShelter && selectedShelter._id === updated._id) {
          setSelectedShelter(updated);
        }
      });
    }

    return () => {
      if (socket) socket.off('shelter:updated');
    };
  }, [socket, selectedShelter?._id]);

  const handleSelectShelter = (s) => {
    setSelectedShelter(s);
    initForm(s);
    setSavedSuccess(false);
  };

  const handleAdjust = (field, delta, max = 9999) => {
    setFormData(prev => {
      const current = prev[field] || 0;
      const nextVal = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [field]: nextVal };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedShelter) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await api.put(`/shelters/${selectedShelter._id}`, formData);
      setSelectedShelter(res.data.shelter);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update shelter');
    } finally {
      setSaving(false);
    }
  };

  const availableBeds = Math.max(0, (formData.totalCapacity || 1) - (formData.currentOccupancy || 0));
  const occupancyPct = Math.min(100, Math.round(((formData.currentOccupancy || 0) / (formData.totalCapacity || 1)) * 100));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Home className="w-6 h-6 text-emerald-400" />
          Emergency Shelter Capacity & Relief Supply Console
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage intake capacities, automatically calculate available bed space, and monitor essential food/water rations.
        </p>
      </div>

      {/* Shelter Selection Tabs */}
      <div className="flex flex-wrap gap-2">
        {shelters.map(s => (
          <button
            key={s._id}
            onClick={() => handleSelectShelter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              selectedShelter?._id === s._id
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {selectedShelter && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-100">{selectedShelter.name}</h2>
              <span className="text-xs text-slate-400">{selectedShelter.address} • Helpline: {selectedShelter.phone}</span>
            </div>

            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800 animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                Capacity Synced with Command HQ
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Real-time Automated Capacity Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
                <span className="text-xs text-slate-400 block">Total Maximum Capacity</span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-100 font-mono">{formData.totalCapacity}</span>
                  <span className="text-[10px] text-slate-400">Total Bunks</span>
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
                <span className="text-xs text-slate-400 block">Current Occupancy (Intake)</span>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleAdjust('currentOccupancy', -10, formData.totalCapacity)}
                    className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold"
                  >
                    -
                  </button>
                  <span className="text-2xl font-black text-amber-400 font-mono">{formData.currentOccupancy}</span>
                  <button
                    type="button"
                    onClick={() => handleAdjust('currentOccupancy', 10, formData.totalCapacity)}
                    className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
                <span className="text-xs text-slate-400 block">Calculated Available Beds</span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-emerald-400 font-mono">{availableBeds}</span>
                  <span className="text-[10px] text-emerald-300 font-semibold">Ready for Evacuees</span>
                </div>
              </div>
            </div>

            {/* Occupancy Progress Bar */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Occupancy Percentage:</span>
                <span className="font-bold font-mono text-slate-100">{occupancyPct}% Filled</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    occupancyPct >= 90 ? 'bg-red-500' :
                    occupancyPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>
            </div>

            {/* Supplies & Logistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <Utensils className="w-4 h-4 text-amber-400" />
                  Food Supply Stock
                </span>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleAdjust('foodStockDays', -1)}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-white font-bold"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold font-mono text-slate-100">{formData.foodStockDays} Days</span>
                  <button
                    type="button"
                    onClick={() => handleAdjust('foodStockDays', 1)}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <Droplet className="w-4 h-4 text-cyan-400" />
                  Clean Drinking Water
                </span>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleAdjust('waterStockDays', -1)}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-white font-bold"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold font-mono text-slate-100">{formData.waterStockDays} Days</span>
                  <button
                    type="button"
                    onClick={() => handleAdjust('waterStockDays', 1)}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex flex-col justify-between">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Medical Support Triage
                </span>
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={formData.medicalSupport}
                    onChange={(e) => setFormData({ ...formData, medicalSupport: e.target.checked })}
                    className="rounded accent-emerald-500 w-4 h-4"
                  />
                  <span className="text-xs text-slate-200 font-bold">
                    {formData.medicalSupport ? 'Doctor / First-Aid Active' : 'No Medical Staff'}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Updating Command Registry...' : 'Publish Shelter Availability'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ShelterDashboard;
