import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PriorityBadge from '../../components/Common/PriorityBadge';
import { History, Shield, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const CitizenHistory = () => {
  const { user } = useAuth();
  const [sosList, setSosList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/sos', { params: { citizenId: user?._id } });
        setSosList(res.data.sos || []);
      } catch (err) {
        console.warn('[CitizenHistory] Failed to fetch history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">My Emergency SOS Records</h1>
          <p className="text-xs text-slate-400">
            Historical log of emergency requests, response timelines, and team dispatch status.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading incident history...</div>
      ) : sosList.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
          <Shield className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p>No past emergency SOS records found under your account.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sosList.map((sos) => (
            <div
              key={sos._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-100">{sos.sosId}</span>
                  <PriorityBadge
                    score={sos.priorityScore}
                    level={sos.priorityLevel}
                    breakdown={sos.scoreBreakdown}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                    sos.status === 'RESOLVED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}>
                    {sos.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Disaster Type:</span>
                  <strong className="text-slate-200">{sos.disasterType}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Victims Affected:</span>
                  <strong className="text-slate-200">{sos.affectedCount} persons</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Water Level:</span>
                  <strong className="text-cyan-400 font-mono">{sos.floodWaterLevel || 0}m</strong>
                </div>
              </div>

              <p className="text-xs text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
                {sos.description || 'No detailed description provided.'}
              </p>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Logged: {new Date(sos.createdAt).toLocaleString()}
                </span>
                {sos.assignedTeam && (
                  <span className="text-slate-300">
                    Dispatched Unit: <strong>{sos.assignedTeam.name || 'Field Rescue Unit'}</strong>
                  </span>
                )}
                {sos.resolvedAt && (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolved: {new Date(sos.resolvedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitizenHistory;
