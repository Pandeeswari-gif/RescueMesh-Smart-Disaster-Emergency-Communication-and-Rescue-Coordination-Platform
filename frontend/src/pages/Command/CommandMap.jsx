import React, { useState, useEffect } from 'react';
import OfflineMap from '../../components/Map/OfflineMap';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import PriorityBadge from '../../components/Common/PriorityBadge';
import { MapPin, ShieldAlert, Waves, RefreshCw, X, Truck } from 'lucide-react';

const CommandMap = () => {
  const { socket } = useSocket();
  const [sosList, setSosList] = useState([]);
  const [teams, setTeams] = useState([]);
  const [waterSurgeLevel, setWaterSurgeLevel] = useState(1.2);
  const [selectedSOS, setSelectedSOS] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMapData = async () => {
    try {
      const [sosRes, teamRes, disasterRes] = await Promise.all([
        api.get('/sos'),
        api.get('/rescue-teams'),
        api.get('/disasters')
      ]);
      setSosList(sosRes.data.sos || []);
      setTeams(teamRes.data.teams || []);
      const activeDisaster = disasterRes.data.disasters?.find(d => d.active);
      if (activeDisaster) {
        setWaterSurgeLevel(activeDisaster.waterSurgeLevel || 1.2);
      }
    } catch (e) {
      console.warn('[CommandMap] Using cached offline map data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();

    if (socket) {
      socket.on('sos:new', () => fetchMapData());
      socket.on('team:status_changed', () => fetchMapData());
      socket.on('team:location_updated', () => fetchMapData());
      socket.on('flood:surge_updated', (data) => {
        if (data.disaster && data.disaster.waterSurgeLevel !== undefined) {
          setWaterSurgeLevel(data.disaster.waterSurgeLevel);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('sos:new');
        socket.off('team:status_changed');
        socket.off('team:location_updated');
        socket.off('flood:surge_updated');
      }
    };
  }, [socket]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-full flex flex-col">
      {/* Map Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100">Tactical Disaster Geospatial Command Map</h1>
            <p className="text-[11px] text-slate-400">
              Bundled Offline GeoJSON Layers • Roads, Hazards, Inundation Zones, Shelters, and Live Units
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <Waves className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300">Flood Surge:</span>
            <span className="font-bold text-cyan-300 font-mono">{waterSurgeLevel.toFixed(1)}m</span>
          </div>

          <button
            onClick={fetchMapData}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 border border-slate-700 transition"
            title="Refresh map pins"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Map Container */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
        <OfflineMap
          sosList={sosList}
          teamsList={teams}
          waterSurgeLevel={waterSurgeLevel}
          onMarkerClick={(sos) => setSelectedSOS(sos)}
          height="620px"
        />

        {/* Floating Selected SOS Inspection Card */}
        {selectedSOS && (
          <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/95 border border-slate-700 rounded-xl p-4 shadow-2xl max-w-sm w-full text-xs backdrop-blur space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-100 text-sm">{selectedSOS.sosId}</span>
              <button
                onClick={() => setSelectedSOS(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <PriorityBadge
                score={selectedSOS.priorityScore}
                level={selectedSOS.priorityLevel}
                breakdown={selectedSOS.scoreBreakdown}
              />
              <span className="text-slate-400 font-mono">Water: {selectedSOS.floodWaterLevel}m</span>
            </div>

            <div className="pt-1">
              <span className="font-semibold text-slate-200 block">{selectedSOS.citizenName}</span>
              <span className="text-[11px] text-slate-400">{selectedSOS.citizenPhone} • {selectedSOS.affectedCount} persons</span>
              <p className="text-slate-300 text-[11px] mt-1 bg-slate-800/80 p-2 rounded border border-slate-700">
                {selectedSOS.description || 'Extraction requested at coordinates.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">Status: <strong className="text-slate-200">{selectedSOS.status}</strong></span>
              {selectedSOS.assignedTeam && (
                <span className="text-purple-400 font-semibold flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  Unit Assigned
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandMap;
