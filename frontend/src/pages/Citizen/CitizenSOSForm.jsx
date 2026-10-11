import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import api from '../../services/api';
import PriorityBadge from '../../components/Common/PriorityBadge';
import {
  AlertOctagon,
  MapPin,
  Users,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  WifiOff,
  Navigation,
  Clock
} from 'lucide-react';

const CitizenSOSForm = () => {
  const { user } = useAuth();
  const { isOnline, queueOfflineSOS } = useOffline();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    citizenName: user?.name || 'Ravi Kumar',
    citizenPhone: user?.phone || '+91-98765-43001',
    disasterType: 'FLOOD',
    severity: 'CRITICAL',
    affectedCount: 3,
    hasInjuries: true,
    floodWaterLevel: 1.8,
    vulnerability: {
      hasElderly: true,
      hasInfants: true,
      hasDisabled: false,
      hasPregnant: false
    },
    description: 'Balcony submerged, 3 family members trapped on rooftop with elderly grandmother.',
    address: 'House #42, Riverside Colony, Zone Beta',
    latitude: 13.0845,
    longitude: 80.2520
  });

  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleVulnChange = (field) => {
    setFormData(prev => ({
      ...prev,
      vulnerability: {
        ...prev.vulnerability,
        [field]: !prev.vulnerability[field]
      }
    }));
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            latitude: parseFloat(pos.coords.latitude.toFixed(4)),
            longitude: parseFloat(pos.coords.longitude.toFixed(4))
          }));
        },
        (err) => {
          // Fallback to simulated disaster coordinates in Zone Beta
          setFormData(prev => ({ ...prev, latitude: 13.0845, longitude: 80.2520 }));
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      ...formData,
      affectedCount: parseInt(formData.affectedCount, 10),
      floodWaterLevel: parseFloat(formData.floodWaterLevel),
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude)
    };

    if (!isOnline) {
      // Offline Flow
      const queued = queueOfflineSOS(payload);
      setLoading(false);
      setSuccessResult({
        offline: true,
        sosId: queued.queueId,
        priorityLevel: formData.severity,
        priorityScore: 85,
        message: 'Your emergency SOS has been safely saved in your browser local storage. It will automatically dispatch to Command HQ the instant connectivity resumes.'
      });
      return;
    }

    try {
      const res = await api.post('/sos', payload);
      if (res.data.success) {
        setSuccessResult({
          offline: false,
          sos: res.data.sos,
          message: res.data.message
        });
      }
    } catch (err) {
      // Fallback to offline queue if request failed
      console.warn('[SOS Form] Network failure, queueing locally', err);
      const queued = queueOfflineSOS(payload);
      setSuccessResult({
        offline: true,
        sosId: queued.queueId,
        priorityLevel: formData.severity,
        priorityScore: 85,
        message: 'Network unreachable. Emergency SOS saved into local offline queue. Will auto-sync when online.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-100">Emergency SOS Request Form</h1>
          <p className="text-xs text-slate-400">
            Submit critical extraction requirements directly to Command HQ and nearby rescue units.
          </p>
        </div>
      </div>

      {/* Confirmation Card if SOS is Submitted */}
      {successResult ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-lg font-bold text-slate-100">
            {successResult.offline ? 'SOS Queued Locally (Offline Mode)' : 'Emergency SOS Transmitted!'}
          </h2>

          <p className="text-xs text-slate-300 max-w-lg mx-auto">
            {successResult.message}
          </p>

          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 max-w-md mx-auto text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Incident Reference:</span>
              <strong className="text-red-400 font-mono text-sm">
                {successResult.sos?.sosId || successResult.sosId}
              </strong>
            </div>

            {successResult.sos && (
              <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                <span className="text-slate-400">AI Priority Score:</span>
                <PriorityBadge
                  score={successResult.sos.priorityScore}
                  level={successResult.sos.priorityLevel}
                  breakdown={successResult.sos.scoreBreakdown}
                />
              </div>
            )}
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/citizen/dashboard')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition"
            >
              Go to Citizen Dashboard
            </button>
            <button
              onClick={() => { setSuccessResult(null); }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition"
            >
              Submit Another SOS
            </button>
          </div>
        </div>
      ) : (
        /* The SOS Submission Form */
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Victim Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reporter / Victim Name</label>
              <input
                type="text"
                name="citizenName"
                required
                value={formData.citizenName}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
              <input
                type="tel"
                name="citizenPhone"
                required
                value={formData.citizenPhone}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Disaster Type & Declared Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Disaster Type</label>
              <select
                name="disasterType"
                value={formData.disasterType}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="FLOOD">🌊 Flood / Water Surge</option>
                <option value="EARTHQUAKE">🏚️ Earthquake / Structural Damage</option>
                <option value="CYCLONE">🌪️ Cyclone / Hurricane</option>
                <option value="LANDSLIDE">⛰️ Landslide / Mudflow</option>
                <option value="FIRE">🔥 Urban Fire Hazard</option>
                <option value="BUILDING_COLLAPSE">🏢 Building Collapse</option>
                <option value="MEDICAL">🚑 Acute Medical Emergency</option>
                <option value="OTHER">⚠️ Other Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Severity Assessment</label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-bold"
              >
                <option value="CRITICAL" className="text-red-400">CRITICAL – Immediate Threat to Life</option>
                <option value="HIGH" className="text-orange-400">HIGH – Severe Inundation / Rising Danger</option>
                <option value="MEDIUM" className="text-yellow-400">MEDIUM – Trapped but Currently Safe</option>
                <option value="LOW" className="text-emerald-400">LOW – Assistance / Supply Needs</option>
              </select>
            </div>
          </div>

          {/* Victims Count & Water Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Number of Stranded People (Victims)
              </label>
              <input
                type="number"
                name="affectedCount"
                min="1"
                max="50"
                required
                value={formData.affectedCount}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Estimated Water Level (Meters)
                </label>
                <span className="text-xs font-bold text-cyan-400 font-mono">{formData.floodWaterLevel}m</span>
              </div>
              <input
                type="range"
                name="floodWaterLevel"
                min="0.0"
                max="3.0"
                step="0.1"
                value={formData.floodWaterLevel}
                onChange={handleChange}
                className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Critical Indicators & Vulnerability Checkboxes */}
          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              Vulnerability & Medical Factors (AI Severity Inputs)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-200 p-2 bg-slate-800 rounded-lg hover:bg-slate-750">
                <input
                  type="checkbox"
                  name="hasInjuries"
                  checked={formData.hasInjuries}
                  onChange={handleChange}
                  className="rounded accent-red-500 w-4 h-4"
                />
                <span className="font-semibold text-red-300">Severe Injuries / Medical Condition</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-200 p-2 bg-slate-800 rounded-lg hover:bg-slate-750">
                <input
                  type="checkbox"
                  checked={formData.vulnerability.hasElderly}
                  onChange={() => handleVulnChange('hasElderly')}
                  className="rounded accent-blue-500 w-4 h-4"
                />
                <span>Senior Citizens Stranded</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-200 p-2 bg-slate-800 rounded-lg hover:bg-slate-750">
                <input
                  type="checkbox"
                  checked={formData.vulnerability.hasInfants}
                  onChange={() => handleVulnChange('hasInfants')}
                  className="rounded accent-blue-500 w-4 h-4"
                />
                <span>Infants / Small Children</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-200 p-2 bg-slate-800 rounded-lg hover:bg-slate-750">
                <input
                  type="checkbox"
                  checked={formData.vulnerability.hasDisabled}
                  onChange={() => handleVulnChange('hasDisabled')}
                  className="rounded accent-blue-500 w-4 h-4"
                />
                <span>Persons with Disabilities / Non-Ambulatory</span>
              </label>
            </div>
          </div>

          {/* Location & GPS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Emergency Location</label>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Auto-Detect My GPS</span>
              </button>
            </div>

            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address / Nearby Landmark"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Latitude</label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  required
                  value={formData.latitude}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Longitude</label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  required
                  value={formData.longitude}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description & Specific Hazards (Power lines, water depth, rooftop access)
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe exact conditions so dispatchers can assign the right vehicle (boat, truck, helicopter)..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Offline Notice */}
          {!isOnline && (
            <div className="p-3 bg-amber-950/60 border border-amber-800 rounded-xl text-xs text-amber-200 flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Offline Mode Engaged:</strong> This SOS will be cached locally on your device and queued for automatic transmission to Command HQ once any connectivity or mesh relay is detected.
              </span>
            </div>
          )}

          {/* Submit SOS Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-sm py-3.5 rounded-xl shadow-xl shadow-red-600/30 transition transform hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <AlertOctagon className="w-5 h-5 animate-pulse" />
            <span>{loading ? 'Processing SOS...' : 'BROADCAST EMERGENCY SOS NOW'}</span>
          </button>
        </form>
      )}
    </div>
  );
};

export default CitizenSOSForm;
