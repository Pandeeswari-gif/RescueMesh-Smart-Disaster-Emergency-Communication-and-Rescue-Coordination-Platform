import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { AlertOctagon, Waves, CheckCircle2, Save } from 'lucide-react';

const AdminDisasters = () => {
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDisaster, setActiveDisaster] = useState(null);
  const [formData, setFormData] = useState({});

  const fetchDisasters = async () => {
    try {
      const res = await api.get('/disasters');
      const list = res.data.disasters || [];
      setDisasters(list);
      const active = list.find(d => d.active) || list[0];
      if (active) {
        setActiveDisaster(active);
        setFormData({
          name: active.name,
          type: active.type,
          severity: active.severity,
          radiusKm: active.radiusKm,
          waterSurgeLevel: active.waterSurgeLevel,
          affectedPopulationEstimate: active.affectedPopulationEstimate
        });
      }
    } catch (e) {
      console.warn('Failed to load disasters', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisasters();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!activeDisaster) return;
    try {
      await api.put(`/disasters/${activeDisaster._id}`, formData);
      alert('Disaster parameters updated successfully!');
      fetchDisasters();
    } catch (e) {
      alert('Failed to update disaster');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-red-500" />
          Disaster Event Management & Scenario Configuration
        </h1>
        <p className="text-xs text-slate-400">
          Configure active disaster types, epicenters, severity parameters, and baseline surge depths.
        </p>
      </div>

      {activeDisaster && (
        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Disaster Event Title</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Event Type</label>
              <select
                value={formData.type || 'FLOOD'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="FLOOD">FLOOD</option>
                <option value="CYCLONE">CYCLONE</option>
                <option value="EARTHQUAKE">EARTHQUAKE</option>
                <option value="LANDSLIDE">LANDSLIDE</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Severity Scale</label>
              <select
                value={formData.severity || 'SEVERE'}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="CATASTROPHIC">CATASTROPHIC</option>
                <option value="SEVERE">SEVERE</option>
                <option value="HIGH">HIGH</option>
                <option value="MODERATE">MODERATE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Disaster Radius (Km)</label>
              <input
                type="number"
                step="any"
                value={formData.radiusKm || 15}
                onChange={(e) => setFormData({ ...formData, radiusKm: parseFloat(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Affected Population Estimate</label>
              <input
                type="number"
                value={formData.affectedPopulationEstimate || 150000}
                onChange={(e) => setFormData({ ...formData, affectedPopulationEstimate: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Update Scenario Parameters</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminDisasters;
