import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PriorityBadge from '../../components/Common/PriorityBadge';
import { Shield, Compass, Truck, CheckCircle2, Clock } from 'lucide-react';

const RescueAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/sos');
      const assigned = res.data.sos?.filter(s => s.assignedTeam) || [];
      setAssignments(assigned);
    } catch (e) {
      console.warn('Failed to load assignments', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          Field Rescue Incident Assignment Log
        </h1>
        <p className="text-xs text-slate-400">
          History of dispatched incidents, victim extraction milestones, and safe navigation logs.
        </p>
      </div>

      <div className="space-y-4">
        {assignments.map(sos => (
          <div key={sos._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-100 text-sm">{sos.sosId}</span>
                <PriorityBadge score={sos.priorityScore} level={sos.priorityLevel} breakdown={sos.scoreBreakdown} />
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  sos.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  'bg-purple-950 text-purple-300 border border-purple-800'
                }`}>
                  {sos.status}
                </span>
                <Link
                  to="/rescue/navigation"
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Navigate</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400 text-[11px] block">Victim:</span>
                <strong className="text-slate-200">{sos.citizenName} ({sos.affectedCount} persons)</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Assigned Unit:</span>
                <strong className="text-purple-400">{sos.assignedTeam?.name || 'Rescue Team Alpha'}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Location:</span>
                <span className="text-slate-300">{sos.address}</span>
              </div>
            </div>

            <p className="text-slate-300 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
              {sos.description || 'Emergency assistance requested.'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RescueAssignments;
