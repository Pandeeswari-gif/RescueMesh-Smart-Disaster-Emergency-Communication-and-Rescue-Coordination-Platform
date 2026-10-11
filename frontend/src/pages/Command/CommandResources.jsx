import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { Package, Plus, Search, Filter, Trash2, Edit2, CheckCircle2, X } from 'lucide-react';

const CommandResources = () => {
  const { socket } = useSocket();
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'RESCUE_BOAT',
    quantity: 10,
    unit: 'boats',
    depotName: 'Central Logistics Yard',
    latitude: 13.0827,
    longitude: 80.2300,
    status: 'AVAILABLE'
  });

  const fetchResources = async () => {
    try {
      const res = await api.get('/resources', {
        params: {
          search,
          type: typeFilter || undefined,
          status: statusFilter || undefined
        }
      });
      setResources(res.data.resources || []);
    } catch (e) {
      console.warn('Failed to fetch resources', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();

    if (socket) {
      socket.on('resource:updated', () => fetchResources());
      socket.on('resource:deleted', () => fetchResources());
    }

    return () => {
      if (socket) {
        socket.off('resource:updated');
        socket.off('resource:deleted');
      }
    };
  }, [search, typeFilter, statusFilter, socket]);

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      name: '',
      type: 'RESCUE_BOAT',
      quantity: 10,
      unit: 'boats',
      depotName: 'Central Logistics Yard',
      latitude: 13.0827,
      longitude: 80.2300,
      status: 'AVAILABLE'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (resItem) => {
    setEditId(resItem._id);
    setFormData({
      name: resItem.name,
      type: resItem.type,
      quantity: resItem.quantity,
      unit: resItem.unit,
      depotName: resItem.location?.depotName || 'Depot',
      latitude: resItem.location?.latitude || 13.0827,
      longitude: resItem.location?.longitude || 80.2300,
      status: resItem.status
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      type: formData.type,
      quantity: parseInt(formData.quantity, 10),
      unit: formData.unit,
      status: formData.status,
      location: {
        depotName: formData.depotName,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      }
    };

    try {
      if (editId) {
        await api.put(`/resources/${editId}`, payload);
      } else {
        await api.post('/resources', payload);
      }
      setModalOpen(false);
      fetchResources();
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource from active inventory?')) return;
    try {
      await api.delete(`/resources/${id}`);
      fetchResources();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            Emergency Disaster Resource & Logistics Management
          </h1>
          <p className="text-xs text-slate-400">
            Track and deploy heavy vehicles, boats, medical supplies, food rations, clean water, and oxygen reserves.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Emergency Resource</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resource name or depot location..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Resource Types</option>
            <option value="RESCUE_BOAT">Rescue Boats</option>
            <option value="AMBULANCE">Ambulances</option>
            <option value="MEDICAL_KIT">Medical Triage Kits</option>
            <option value="FOOD_RATIONS">Food Rations</option>
            <option value="DRINKING_WATER">Drinking Water</option>
            <option value="OXYGEN_CYLINDER">Oxygen Cylinders</option>
            <option value="BLANKET">Blankets</option>
            <option value="LIFE_JACKET">Life Jackets</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ALLOCATED">ALLOCATED</option>
            <option value="IN_TRANSIT">IN_TRANSIT</option>
            <option value="DEPLETED">DEPLETED</option>
          </select>
        </div>
      </div>

      {/* Resource Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-8 text-slate-500 text-xs">Loading logistics inventory...</div>
        ) : resources.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-slate-500 text-xs">No resources matching filter.</div>
        ) : (
          resources.map((resItem) => (
            <div
              key={resItem._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-slate-100 leading-snug">{resItem.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    resItem.status === 'AVAILABLE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    resItem.status === 'ALLOCATED' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                    resItem.status === 'DEPLETED' ? 'bg-red-950 text-red-300 border border-red-800' :
                    'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}>
                    {resItem.status}
                  </span>
                </div>
                <span className="text-[11px] text-blue-400 font-mono block mt-0.5">{resItem.type}</span>
                <p className="text-slate-400 text-xs mt-1">Depot: {resItem.location?.depotName || 'Central Logistics Hub'}</p>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Available Stock:</span>
                <strong className="text-base text-slate-100 font-mono">
                  {resItem.quantity} <span className="text-xs text-slate-400 font-normal">{resItem.unit}</span>
                </strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleOpenEdit(resItem)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(resItem._id)}
                  className="p-1.5 bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-300 rounded-lg transition"
                  title="Remove from inventory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Resource Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              {editId ? 'Update Resource Stock' : 'Add Emergency Resource'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Resource Item Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Inflatable Heavy-Duty Zodiac Raft"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Category Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="RESCUE_BOAT">RESCUE_BOAT</option>
                    <option value="AMBULANCE">AMBULANCE</option>
                    <option value="MEDICAL_KIT">MEDICAL_KIT</option>
                    <option value="FOOD_RATIONS">FOOD_RATIONS</option>
                    <option value="DRINKING_WATER">DRINKING_WATER</option>
                    <option value="OXYGEN_CYLINDER">OXYGEN_CYLINDER</option>
                    <option value="BLANKET">BLANKET</option>
                    <option value="LIFE_JACKET">LIFE_JACKET</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="ALLOCATED">ALLOCATED</option>
                    <option value="IN_TRANSIT">IN_TRANSIT</option>
                    <option value="DEPLETED">DEPLETED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Unit Label</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="units, boats, packs..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Depot Name / Base</label>
                <input
                  type="text"
                  required
                  value={formData.depotName}
                  onChange={(e) => setFormData({ ...formData, depotName: e.target.value })}
                  placeholder="Central Logistics Depot"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow transition"
                >
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandResources;
