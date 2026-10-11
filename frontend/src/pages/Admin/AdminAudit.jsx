import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText, Clock, Shield } from 'lucide-react';

const AdminAudit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/admin/audit');
        setLogs(res.data.logs || []);
      } catch (e) {
        console.warn('Failed to load audit logs', e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          Immutable Activity & Operations Audit Trail
        </h1>
        <p className="text-xs text-slate-400">
          Cryptographically recorded operations log for multi-agency accountability, dispatch verification, and compliance.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Origin IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-purple-400">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-cyan-300 font-semibold">
                    {log.entity}
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    {log.userName} ({log.role})
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-sans max-w-xs truncate">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAudit;
