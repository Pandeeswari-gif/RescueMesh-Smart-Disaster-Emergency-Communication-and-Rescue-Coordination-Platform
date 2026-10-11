import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// Import local offline GeoJSON assets
import roadsGeoJSON from '../../data/maps/roads.geojson';
import zonesGeoJSON from '../../data/maps/zones.geojson';
import sheltersGeoJSON from '../../data/maps/shelters.geojson';
import hospitalsGeoJSON from '../../data/maps/hospitals.geojson';
import rescueCentersGeoJSON from '../../data/maps/rescue-centers.geojson';
import hazardZonesGeoJSON from '../../data/maps/hazard-zones.geojson';

// Fix default leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG Icon Generator for reliable offline rendering
const createCustomIcon = (bgColor, label, pulse = false) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 11px;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        border: 2px solid white;
        ${pulse ? 'animation: pulse 1.5s infinite;' : ''}
      ">
        ${label}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

const OfflineMap = ({
  sosList = [],
  teamsList = [],
  activeRoute = null,
  waterSurgeLevel = 1.2,
  onMarkerClick = null,
  center = [13.0827, 80.2500],
  zoom = 13,
  height = '550px'
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const dynamicLayersRef = useRef({});

  // Layer toggles
  const [layers, setLayers] = useState({
    zones: true,
    hazards: true,
    roads: true,
    shelters: true,
    hospitals: true,
    rescueTeams: true,
    sosVictims: true
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet Map
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: false
      });

      // Optional OSM Tile Layer with silent fallback (won't crash if offline)
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        opacity: 0.35,
        className: 'filter invert hue-rotate-180 brightness-75'
      });
      tileLayer.on('tileerror', () => {
        // Silently swallow tile 404s when running offline
      });
      tileLayer.addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous dynamic layers
    Object.values(dynamicLayersRef.current).forEach(layerGroup => {
      if (layerGroup) map.removeLayer(layerGroup);
    });
    dynamicLayersRef.current = {};

    // 1. Urban Zones Layer
    if (layers.zones) {
      const zoneLayer = L.geoJSON(zonesGeoJSON, {
        style: (feature) => ({
          color: feature.properties.color || '#3b82f6',
          weight: 2,
          opacity: 0.6,
          fillColor: feature.properties.color || '#3b82f6',
          fillOpacity: 0.12,
          dashArray: '4, 4'
        }),
        onEachFeature: (feature, layer) => {
          layer.bindPopup(`
            <div style="color: #0f172a; font-family: sans-serif; padding: 4px;">
              <h4 style="margin: 0 0 4px; font-weight: bold;">${feature.properties.name}</h4>
              <p style="margin: 0; font-size: 12px;">Sector ID: ${feature.properties.zoneId}</p>
              <p style="margin: 0; font-size: 12px;">Est. Population: ${feature.properties.population.toLocaleString()}</p>
              <span style="display:inline-block; margin-top: 4px; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #e2e8f0; color: #1e293b;">
                Risk: ${feature.properties.riskLevel}
              </span>
            </div>
          `);
        }
      }).addTo(map);
      dynamicLayersRef.current.zones = zoneLayer;
    }

    // 2. Hazard & Flood Surge Polygons
    if (layers.hazards) {
      const hazardLayer = L.geoJSON(hazardZonesGeoJSON, {
        style: (feature) => {
          const isCritical = waterSurgeLevel >= (feature.properties.baseSurgeLevel || 0.5);
          return {
            color: isCritical ? '#ef4444' : '#f97316',
            weight: 3,
            fillColor: isCritical ? '#dc2626' : '#ea580c',
            fillOpacity: Math.min(0.7, 0.25 + (waterSurgeLevel / 3.0) * 0.4),
          };
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(`
            <div style="color: #0f172a; font-family: sans-serif; padding: 4px;">
              <h4 style="margin: 0 0 4px; font-weight: bold; color: #dc2626;">⚠️ ${feature.properties.name}</h4>
              <p style="margin: 0; font-size: 12px;">Current Water Surge: <strong>${waterSurgeLevel.toFixed(1)}m</strong></p>
              <p style="margin: 0; font-size: 12px;">Critical Threshold: ${feature.properties.criticalSurgeThreshold}m</p>
              <p style="margin: 4px 0 0; font-size: 11px; color: #64748b;">Road Status: ${feature.properties.isBlockedRoad ? 'Inundated / Blocked' : 'Impassable for Light Vehicles'}</p>
            </div>
          `);
        }
      }).addTo(map);
      dynamicLayersRef.current.hazards = hazardLayer;
    }

    // 3. Roads Network
    if (layers.roads) {
      const roadLayer = L.geoJSON(roadsGeoJSON, {
        style: (feature) => {
          const isBlocked = feature.properties.isBlocked || (feature.properties.elevation <= waterSurgeLevel);
          return {
            color: isBlocked ? '#ef4444' : '#64748b',
            weight: isBlocked ? 3 : 2,
            opacity: isBlocked ? 0.9 : 0.6,
            dashArray: isBlocked ? '6, 6' : null
          };
        },
        onEachFeature: (feature, layer) => {
          const isBlocked = feature.properties.isBlocked || (feature.properties.elevation <= waterSurgeLevel);
          layer.bindPopup(`
            <div style="color: #0f172a; font-family: sans-serif;">
              <strong>${feature.properties.name}</strong><br/>
              Elevation: ${feature.properties.elevation}m<br/>
              Status: <span style="color: ${isBlocked ? '#dc2626' : '#16a34a'}; font-weight: bold;">
                ${isBlocked ? 'SUBMERGED / CLOSED' : 'PASSABLE'}
              </span>
            </div>
          `);
        }
      }).addTo(map);
      dynamicLayersRef.current.roads = roadLayer;
    }

    // 4. Shelters
    if (layers.shelters) {
      const shelterLayer = L.geoJSON(sheltersGeoJSON, {
        pointToLayer: (feature, latlng) => {
          return L.marker(latlng, { icon: createCustomIcon('#10b981', '⛺') });
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          layer.bindPopup(`
            <div style="color: #0f172a; font-family: sans-serif; padding: 4px;">
              <h4 style="margin: 0 0 4px; font-weight: bold; color: #047857;">⛺ ${p.name}</h4>
              <p style="margin: 0; font-size: 12px;">Capacity: <strong>${p.occupancy} / ${p.capacity}</strong> (${p.capacity - p.occupancy} beds open)</p>
              <p style="margin: 0; font-size: 12px;">Supplies: ${p.foodDays}d food | ${p.waterDays}d water</p>
              <p style="margin: 0; font-size: 12px;">Medical Triage: ${p.medicalSupport ? 'Available' : 'Basic'}</p>
              <p style="margin: 4px 0 0; font-size: 11px; color: #475569;">Helpline: ${p.phone}</p>
            </div>
          `);
        }
      }).addTo(map);
      dynamicLayersRef.current.shelters = shelterLayer;
    }

    // 5. Hospitals
    if (layers.hospitals) {
      const hospitalLayer = L.geoJSON(hospitalsGeoJSON, {
        pointToLayer: (feature, latlng) => {
          return L.marker(latlng, { icon: createCustomIcon('#2563eb', '🏥') });
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          layer.bindPopup(`
            <div style="color: #0f172a; font-family: sans-serif; padding: 4px;">
              <h4 style="margin: 0 0 4px; font-weight: bold; color: #1d4ed8;">🏥 ${p.name}</h4>
              <p style="margin: 0; font-size: 12px;">ICU Beds Available: <strong>${p.icuBedsAvailable} / ${p.icuBedsTotal}</strong></p>
              <p style="margin: 0; font-size: 12px;">Emergency Beds: ${p.emergencyBedsAvailable} / ${p.emergencyBedsTotal}</p>
              <p style="margin: 0; font-size: 12px;">Ambulances Ready: ${p.ambulances} | O2 Cylinders: ${p.oxygenCylinders}</p>
              <p style="margin: 4px 0 0; font-size: 11px; color: #475569;">Contact: ${p.phone}</p>
            </div>
          `);
        }
      }).addTo(map);
      dynamicLayersRef.current.hospitals = hospitalLayer;
    }

    // 6. Rescue Teams Live Markers
    if (layers.rescueTeams && teamsList.length > 0) {
      const teamGroup = L.layerGroup();
      teamsList.forEach(team => {
        if (!team.location || !team.location.latitude) return;
        const marker = L.marker([team.location.latitude, team.location.longitude], {
          icon: createCustomIcon('#8b5cf6', '🚒')
        });
        marker.bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif; padding: 4px;">
            <h4 style="margin: 0 0 4px; font-weight: bold; color: #6d28d9;">🚒 ${team.name}</h4>
            <p style="margin: 0; font-size: 12px;">Leader: ${team.leaderName} (${team.phone})</p>
            <p style="margin: 0; font-size: 12px;">Vehicle: ${team.vehicleType}</p>
            <p style="margin: 0; font-size: 12px;">Status: <strong>${team.status}</strong></p>
            <p style="margin: 4px 0 0; font-size: 11px; color: #64748b;">Equipment: ${team.equipment ? team.equipment.join(', ') : 'Standard Kit'}</p>
          </div>
        `);
        teamGroup.addLayer(marker);
      });
      teamGroup.addTo(map);
      dynamicLayersRef.current.rescueTeams = teamGroup;
    }

    // 7. Active SOS Emergency Markers
    if (layers.sosVictims && sosList.length > 0) {
      const sosGroup = L.layerGroup();
      sosList.forEach(sos => {
        if (!sos.latitude || !sos.longitude) return;
        let color = '#ef4444';
        let pulse = false;
        if (sos.priorityLevel === 'CRITICAL') { color = '#dc2626'; pulse = true; }
        else if (sos.priorityLevel === 'HIGH') color = '#ea580c';
        else if (sos.priorityLevel === 'MEDIUM') color = '#eab308';
        else color = '#10b981';

        const marker = L.marker([sos.latitude, sos.longitude], {
          icon: createCustomIcon(color, '🆘', pulse)
        });

        marker.on('click', () => {
          if (onMarkerClick) onMarkerClick(sos);
        });

        marker.bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif; padding: 4px; min-width: 180px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
              <strong style="color: #dc2626;">${sos.sosId}</strong>
              <span style="background: ${color}; color: white; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
                ${sos.priorityLevel} (${sos.priorityScore || 0})
              </span>
            </div>
            <p style="margin: 0; font-size: 12px;"><strong>Victim:</strong> ${sos.citizenName}</p>
            <p style="margin: 0; font-size: 12px;"><strong>Affected:</strong> ${sos.affectedCount} persons</p>
            <p style="margin: 0; font-size: 12px;"><strong>Type:</strong> ${sos.disasterType} | Water: ${sos.floodWaterLevel}m</p>
            <p style="margin: 4px 0 0; font-size: 11px; color: #475569;">${sos.description || 'Immediate extraction requested'}</p>
            <div style="margin-top: 6px; padding: 2px 4px; background: #f1f5f9; border-radius: 4px; font-size: 11px;">
              Status: <strong>${sos.status}</strong>
            </div>
          </div>
        `);
        sosGroup.addLayer(marker);
      });
      sosGroup.addTo(map);
      dynamicLayersRef.current.sosVictims = sosGroup;
    }

    // 8. Safe Rescue Navigation Polyline
    if (activeRoute && activeRoute.routeCoordinates && activeRoute.routeCoordinates.length > 0) {
      // Leaflet expects [lat, lng] array
      const latlngs = activeRoute.routeCoordinates.map(c => [c[1], c[0]]);
      const routePolyline = L.polyline(latlngs, {
        color: '#38bdf8',
        weight: 5,
        opacity: 0.9,
        dashArray: '1, 8'
      }).addTo(map);

      routePolyline.bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif;">
          <strong>Safe Rescue Corridor</strong><br/>
          Est. Distance: ${activeRoute.distanceKm || activeRoute.estimatedDistanceKm} km<br/>
          ETA: ${activeRoute.etaMinutes || activeRoute.estimatedTimeMin} mins<br/>
          <span style="color: #0284c7; font-weight: bold;">Avoided Hazard Zones:</span> ${activeRoute.avoidedHazards ? activeRoute.avoidedHazards.join(', ') : 'None'}
        </div>
      `);
      dynamicLayersRef.current.activeRoute = routePolyline;
      map.fitBounds(routePolyline.getBounds(), { padding: [50, 50] });
    }

  }, [sosList, teamsList, activeRoute, waterSurgeLevel, layers]);

  const toggleLayer = (layerKey) => {
    setLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-900">
      {/* Tactical Layer Switcher Overlay */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-3 text-xs shadow-xl flex flex-col gap-2 max-w-xs">
        <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          Tactical Map Layers (Offline)
        </span>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input type="checkbox" checked={layers.hazards} onChange={() => toggleLayer('hazards')} className="rounded accent-red-500" />
            <span>⚠️ Hazards</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input type="checkbox" checked={layers.sosVictims} onChange={() => toggleLayer('sosVictims')} className="rounded accent-red-500" />
            <span>🆘 SOS Pins</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input type="checkbox" checked={layers.rescueTeams} onChange={() => toggleLayer('rescueTeams')} className="rounded accent-purple-500" />
            <span>🚒 Teams</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input type="checkbox" checked={layers.shelters} onChange={() => toggleLayer('shelters')} className="rounded accent-emerald-500" />
            <span>⛺ Shelters</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input type="checkbox" checked={layers.hospitals} onChange={() => toggleLayer('hospitals')} className="rounded accent-blue-500" />
            <span>🏥 Hospitals</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input type="checkbox" checked={layers.roads} onChange={() => toggleLayer('roads')} className="rounded accent-slate-400" />
            <span>🛣️ Roads</span>
          </label>
        </div>
        <div className="pt-1.5 border-t border-slate-700/80 flex justify-between items-center text-[10px] text-slate-400">
          <span>Surge: <strong className="text-amber-400">{waterSurgeLevel.toFixed(1)}m</strong></span>
          <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded">Local GeoJSON</span>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height }} className="w-full" />
    </div>
  );
};

export default OfflineMap;
