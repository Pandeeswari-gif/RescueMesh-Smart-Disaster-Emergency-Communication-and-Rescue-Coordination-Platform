import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import {
  Building2,
  Activity,
  HeartPulse,
  Truck,
  Wind,
  CheckCircle2,
  Save,
  Plus,
  Minus
} from 'lucide-react';

const HospitalDashboard = () => {
  const { socket } = useSocket();
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchHospitals = async () => {
    try {
      const res = await api.get('/hospitals');
      const list = res.data.hospitals || [];
      setHospitals(list);
      if (list.length > 0 && !selectedHospital) {
        setSelectedHospital(list[0]);
        initForm(list[0]);
      }
    } catch (e) {
      console.warn('Failed to load hospitals', e);
    }
  };

  const initForm = (h) => {
    setFormData({
      icuBedsAvailable: h.icuBedsAvailable,
      generalBedsAvailable: h.generalBedsAvailable,
      emergencyBedsAvailable: h.emergencyBedsAvailable,
      oxygenCylindersAvailable: h.oxygenCylindersAvailable || 50,
      ambulancesAvailable: h.ambulancesAvailable || 4
    });
  };

  useEffect(() => {
    fetchHospitals();

    if (socket) {
      socket.on('hospital:updated', (updated) => {
        setHospitals(prev => prev.map(h => h._id === updated._id ? updated : h));
        if (selectedHospital && selectedHospital._id === updated._id) {
          setSelectedHospital(updated);
        }
      });
    }

    return () => {
      if (socket) socket.off('hospital:updated');
    };
  }, [socket, selectedHospital?._id]);

  const handleSelectHospital = (h) => {
    setSelectedHospital(h);
    initForm(h);
    setSavedSuccess(false);
  };

  const handleAdjust = (field, delta, max) => {
    setFormData(prev => {
      const current = prev[field] || 0;
      const nextVal = Math.max(0, Math.min(max !== undefined ? max : 9999, current + delta));
      return { ...prev, [field]: nextVal };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedHospital) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await api.put(`/hospitals/${selectedHospital._id}`, formData);
      setSelectedHospital(res.data.hospital);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update hospital records');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-400" />
          Hospital Emergency Bed & Critical Care Capacity Desk
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time healthcare triage management. Updates sync with Command HQ emergency dispatch in real-time.
        </p>
      </div>

      {/* Hospital Selection Tabs */}
      <div className="flex flex-wrap gap-2">
        {hospitals.map(h => (
          <button
            key={h._id}
            onClick={() => handleSelectHospital(h)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              selectedHospital?._id === h._id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {h.name}
          </button>
        ))}
      </div>

      {selectedHospital && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-100">{selectedHospital.name}</h2>
              <span className="text-xs text-slate-400">{selectedHospital.address} • Phone: {selectedHospital.phone}</span>
            </div>

            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800 animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                Updated in Live Command HQ System
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Interactive Counters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* ICU Beds */}
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold flex items-center gap-1 text-red-400">
                    <HeartPulse className="w-4 h-4" />
                    ICU Beds Available
                  </span>
                  <span>Total: {selectedHospital.icuBedsTotal}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => handleAdjust('icuBedsAvailable', -1, selectedHospital.icuBedsTotal)}
                    className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <span className="text-3xl font-black text-red-400 font-mono">
                    {formData.icuBedsAvailable || 0}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleAdjust('icuBedsAvailable', 1, selectedHospital.icuBedsTotal)}
                    className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Emergency Beds */}
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold flex items-center gap-1 text-amber-400">
                    <Activity className="w-4 h-4" />
                    Emergency Beds
                  </span>
                  <span>Total: {selectedHospital.emergencyBedsTotal}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => handleAdjust('emergencyBedsAvailable', -1, selectedHospital.emergencyBedsTotal)}
                    className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <span className="text-3xl font-black text-amber-400 font-mono">
                    {formData.emergencyBedsAvailable || 0}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleAdjust('emergencyBedsAvailable', 1, selectedHospital.emergencyBedsTotal)}
                    className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* General Inpatient Beds */}
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold flex items-center gap-1 text-blue-400">
                    <Building2 className="w-4 h-4" />
                    General Beds
                  </span>
                  <span>Total: {selectedHospital.generalBedsTotal}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => handleAdjust('generalBedsAvailable', -1, selectedHospital.generalBedsTotal)}
                    className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <span className="text-3xl font-black text-blue-400 font-mono">
                    {formData.generalBedsAvailable || 0}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleAdjust('generalBedsAvailable', 1, selectedHospital.generalBedsTotal)}
                    className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Critical Resources: Oxygen & Ambulances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Wind className="w-4 h-4 text-cyan-400" />
                    Medical Oxygen Cylinders Available
                  </span>
                  <span className="text-[11px] text-slate-400">47L High-Pressure Reserve</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAdjust('oxygenCylindersAvailable', -5)}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-white font-bold"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold font-mono text-cyan-400">{formData.oxygenCylindersAvailable}</span>
                  <button
                    type="button"
                    onClick={() => handleAdjust('oxygenCylindersAvailable', 5)}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    Ambulances Ready for Dispatch
                  </span>
                  <span className="text-[11px] text-slate-400">ALS / BLS Field Vehicles</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAdjust('ambulancesAvailable', -1)}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-white font-bold"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold font-mono text-emerald-400">{formData.ambulancesAvailable}</span>
                  <button
                    type="button"
                    onClick={() => handleAdjust('ambulancesAvailable', 1)}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Updating Command Registry...' : 'Save & Publish Live Capacity'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default HospitalDashboard;
