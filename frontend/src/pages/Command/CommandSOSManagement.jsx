import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import PriorityBadge from '../../components/Common/PriorityBadge';
import {
  ShieldAlert,
  Search,
  Filter,
  Truck,
  CheckCircle2,
  AlertOctagon,
  Eye,
  X,
  Navigation,
  Check,
  AlertTriangle
} from 'lucide-react';

const CommandSOSManagement = () => {
  const { socket } = useSocket();
  const [sosList, setSosList] = useState([]);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Dispatch Modal state
  const [selectedSOS, setSelectedSOS] = useState(null);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [routePreview, setRoutePreview] = useState(null);

  // Details Modal state
  const [viewSOS, setViewSOS] = useState(null);

  const fetchSOSAndTeams = async () => {
    try {
      const [sosRes, teamRes] = await Promise.all([
        api.get('/sos', {
          params: {
            search,
            status: statusFilter || undefined,
            severity: severityFilter || undefined
          }
        }),
        api.get('/rescue-teams')
      ]);
      setSosList(sosRes.data.sos || []);
      setTeams(teamRes.data.teams || []);
    } catch (err) {
      console.warn('[CommandSOS] Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSOSAndTeams();

    if (socket) {
      socket.on('sos:new', () => fetchSOSAndTeams());
      socket.on('sos:updated', () => fetchSOSAndTeams());
      socket.on('team:status_changed', () => fetchSOSAndTeams());
    }

    return () => {
      if (socket) {
        socket.off('sos:new');
        socket.off('sos:updated');
        socket.off('team:status_changed');
      }
    };
  }, [search, statusFilter, severityFilter, socket]);

  const openDispatchModal = async (sos) => {
    setSelectedSOS(sos);
    setDispatchModalOpen(true);
    setSelectedTeamId('');
    setRoutePreview(null);

    // Fetch teams sorted by distance to this SOS
    try {
      const res = await api.get('/rescue-teams', {
        params: { lat: sos.latitude, lng: sos.longitude }
      });
      setTeams(res.data.teams || []);
      if (res.data.teams && res.data.teams.length > 0) {
        // Auto select nearest available team
        const available = res.data.teams.find(t => t.status === 'AVAILABLE') || res.data.teams[0];
        setSelectedTeamId(available._id);
        previewRoute(available._id, sos);
      }
    } catch (e) {
      console.warn('Failed to sort teams by distance', e);
    }
  };

  const previewRoute = async (teamId, sos) => {
    const team = teams.find(t => t._id === teamId);
    if (!team) return;
    try {
      const res = await api.post('/rescue/safe-route', {
        startLat: team.location.latitude,
        startLng: team.location.longitude,
        destLat: sos.latitude,
        destLng: sos.longitude,
        waterSurgeLevel: sos.floodWaterLevel || 1.2
      });
      setRoutePreview(res.data.routePlan);
    } catch (e) {
      console.warn('Failed to calculate safe route preview', e);
    }
  };

  const handleDispatchConfirm = async () => {
    if (!selectedSOS || !selectedTeamId) return;
    setDispatching(true);
    try {
      await api.post('/rescue-assignments', {
        sosId: selectedSOS._id,
        teamId: selectedTeamId,
        notes: `Rapid dispatch dispatched from Command HQ Console`
      });
      setDispatchModalOpen(false);
      fetchSOSAndTeams();
    } catch (err) {
      alert(err.response?.data?.message || 'Dispatch failed');
    } finally {
      setDispatching(false);
    }
  };

  const handleUpdateStatus = async (sosId, newStatus) => {
    try {
      await api.put(`/sos/${sosId}`, { status: newStatus });
      fetchSOSAndTeams();
    } catch (err) {
      alert('Status update failed');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-500" />
            SOS Emergency Incident Management & Dispatch Console
          </h1>
          <p className="text-xs text-slate-400">
            Real-time incident triage, AI priority scores, nearby rescue unit positioning, and safe route routing.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SOS ID, victim name, landmark..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="ON_ROUTE">ON_ROUTE</option>
            <option value="ON_SITE">ON_SITE</option>
            <option value="RESCUING">RESCUING</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* SOS Incidents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">SOS ID</th>
                <th className="py-3 px-4">Victim & Contact</th>
                <th className="py-3 px-4">Disaster / Surge</th>
                <th className="py-3 px-4">AI Priority Score</th>
                <th className="py-3 px-4">Affected</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Unit</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">Loading active emergency SOS incidents...</td>
                </tr>
              ) : sosList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">No emergency incidents found matching filters.</td>
                </tr>
              ) : (
                sosList.map((sos) => (
                  <tr key={sos._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">
                      {sos.sosId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{sos.citizenName}</div>
                      <span className="text-[11px] text-slate-400">{sos.citizenPhone}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-300">{sos.disasterType}</span>
                      <span className="text-[11px] text-cyan-400 block font-mono">
                        Water: {sos.floodWaterLevel || 0}m
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge
                        score={sos.priorityScore}
                        level={sos.priorityLevel}
                        breakdown={sos.scoreBreakdown}
                      />
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-200 font-mono">
                      {sos.affectedCount}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        sos.status === 'PENDING' ? 'bg-red-950 text-red-300 border border-red-800' :
                        sos.status === 'DISPATCHED' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                        sos.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}>
                        {sos.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {sos.assignedTeam ? (
                        <div className="text-[11px]">
                          <strong className="text-slate-200">{sos.assignedTeam.name}</strong>
                          <span className="text-slate-400 block">{sos.assignedTeam.leaderName}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setViewSOS(sos)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition"
                        title="View Details"
                      >
                        View
                      </button>

                      {sos.status === 'PENDING' && (
                        <button
                          onClick={() => openDispatchModal(sos)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[11px] shadow transition inline-flex items-center gap-1"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Dispatch</span>
                        </button>
                      )}

                      {sos.status !== 'RESOLVED' && sos.status !== 'PENDING' && (
                        <button
                          onClick={() => handleUpdateStatus(sos._id, 'RESOLVED')}
                          className="px-2 py-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded text-[11px] font-semibold transition"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISPATCH RESCUE TEAM MODAL */}
      {dispatchModalOpen && selectedSOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setDispatchModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Truck className="w-6 h-6 text-purple-400" />
              <div>
                <h3 className="font-bold text-slate-100 text-base">
                  Dispatch Rescue Team to Incident {selectedSOS.sosId}
                </h3>
                <p className="text-xs text-slate-400">
                  Victim: {selectedSOS.citizenName} • Location: {selectedSOS.address}
                </p>
              </div>
            </div>

            {/* Team Selection List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Select Field Rescue Unit (Sorted by Proximity)
              </span>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {teams.map(team => (
                  <label
                    key={team._id}
                    onClick={() => {
                      setSelectedTeamId(team._id);
                      previewRoute(team._id, selectedSOS);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition text-xs ${
                      selectedTeamId === team._id
                        ? 'bg-purple-950/60 border-purple-600 text-slate-100'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-100 text-xs">{team.name}</strong>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          team.status === 'AVAILABLE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {team.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        Vehicle: {team.vehicleType} • Leader: {team.leaderName} ({team.phone})
                      </span>
                    </div>

                    <div className="text-right">
                      {team.distanceKm !== undefined && (
                        <div className="font-bold font-mono text-purple-400 text-xs">
                          {team.distanceKm} km away
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400">Capacity: {team.capacity} victims</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Safe Route Preview */}
            {routePreview && (
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-slate-200">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <Navigation className="w-3.5 h-3.5" />
                    Safe Rescue Navigation Computed
                  </span>
                  <span className="text-slate-300 font-mono">
                    Distance: <strong>{routePreview.distanceKm} km</strong> • ETA: <strong>{routePreview.etaMinutes} mins</strong>
                  </span>
                </div>
                {routePreview.avoidedHazards && routePreview.avoidedHazards.length > 0 && (
                  <div className="text-[11px] text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Diverted route to avoid submerged zones: {routePreview.avoidedHazards.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDispatchModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatchConfirm}
                disabled={dispatching || !selectedTeamId}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/30 disabled:opacity-50 flex items-center gap-2"
              >
                <Truck className="w-4 h-4" />
                <span>{dispatching ? 'Dispatching...' : 'CONFIRM DISPATCH UNIT'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW SOS DETAILS MODAL */}
      {viewSOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 text-xs">
            <button
              onClick={() => setViewSOS(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <AlertOctagon className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-slate-100 text-base">Incident Report: {viewSOS.sosId}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 text-[11px] block">Victim Name:</span>
                <strong className="text-slate-200">{viewSOS.citizenName}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Phone Contact:</span>
                <strong className="text-slate-200">{viewSOS.citizenPhone}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Severity & Score:</span>
                <PriorityBadge score={viewSOS.priorityScore} level={viewSOS.priorityLevel} breakdown={viewSOS.scoreBreakdown} />
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Water Depth:</span>
                <strong className="text-cyan-400 font-mono">{viewSOS.floodWaterLevel}m</strong>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Location Landmark / GPS:</span>
              <p className="text-slate-300 font-mono">{viewSOS.address} ({viewSOS.latitude}, {viewSOS.longitude})</p>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Emergency Description:</span>
              <p className="p-3 bg-slate-800/80 rounded-lg text-slate-300 mt-1 border border-slate-700">
                {viewSOS.description || 'No description provided.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setViewSOS(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandSOSManagement;
