/**
 * RescueMesh Safe Rescue Navigation Engine (Software Prototype)
 *
 * Computes safe traversal waypoints between rescue units and victim locations,
 * dynamically steering routes away from active flood polygons, submerged causeways,
 * and high-risk hazard zones.
 */

// Local known safe waypoints & junctions across metropolitan highgrounds
const SAFE_HIGHWAY_JUNCTIONS = [
  { id: 'J_NORTH_HIGH', lat: 13.1150, lng: 80.2150, elevation: 18.0, name: 'North Bypass Elevated Junction' },
  { id: 'J_CENTRAL_HQ', lat: 13.0827, lng: 80.2300, elevation: 15.0, name: 'Command Center Central Hub' },
  { id: 'J_WEST_PLATEAU', lat: 13.0600, lng: 80.2120, elevation: 19.5, name: 'West Ridge Overpass' },
  { id: 'J_SOUTH_HIGH', lat: 13.0400, lng: 80.2200, elevation: 16.0, name: 'South Highground Connector' },
  { id: 'J_EAST_CORRIDOR', lat: 13.0900, lng: 80.2750, elevation: 11.0, name: 'Coastal Northern Elevated Road' },
  { id: 'J_BRIDGE_ALPHA', lat: 13.0780, lng: 80.2650, elevation: 14.0, name: 'Alpha Elevated Viaduct' }
];

// Hazard zones definitions for path avoidance testing
const HAZARD_POLYGONS = [
  {
    name: 'River Basin Delta Lowlands',
    minLat: 13.0600, maxLat: 13.1050,
    minLng: 80.2420, maxLng: 80.2580,
    waterThreshold: 0.8
  },
  {
    name: 'Marina Creek Overflow Area',
    minLat: 13.0380, maxLat: 13.0580,
    minLng: 80.2550, maxLng: 80.2780,
    waterThreshold: 1.2
  },
  {
    name: 'North Slum Lowland Inundation',
    minLat: 13.1000, maxLat: 13.1180,
    minLng: 80.2300, maxLng: 80.2480,
    waterThreshold: 0.6
  }
];

// Check if a point is inside a bounding box
function isPointInHazard(lat, lng, surgeLevel = 1.0) {
  for (const hz of HAZARD_POLYGONS) {
    if (surgeLevel >= hz.waterThreshold) {
      if (lat >= hz.minLat && lat <= hz.maxLat && lng >= hz.minLng && lng <= hz.maxLng) {
        return hz.name;
      }
    }
  }
  return null;
}

// Calculate Haversine distance in KM
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Plan a safe route avoiding flooded and hazard zones
 */
function planSafeRescueRoute(startLat, startLng, destLat, destLng, waterSurgeLevel = 1.2) {
  const avoidedHazards = new Set();
  const routePoints = [];

  // Start point
  routePoints.push([startLng, startLat]);

  // Check if direct line crosses hazard areas
  const testSteps = 10;
  let directCrossesHazard = false;
  for (let i = 1; i < testSteps; i++) {
    const interpLat = startLat + (destLat - startLat) * (i / testSteps);
    const interpLng = startLng + (destLng - startLng) * (i / testSteps);
    const hazardHit = isPointInHazard(interpLat, interpLng, waterSurgeLevel);
    if (hazardHit) {
      directCrossesHazard = true;
      avoidedHazards.add(hazardHit);
    }
  }

  // If direct line crosses hazard zones or surge is high, route through safe highground waypoints
  if (directCrossesHazard || waterSurgeLevel > 1.0) {
    // Select the best highground junction that avoids hazards
    const safeJunctions = SAFE_HIGHWAY_JUNCTIONS.filter(j => !isPointInHazard(j.lat, j.lng, waterSurgeLevel));

    if (safeJunctions.length > 0) {
      // Pick waypoint that minimizes (start->waypoint + waypoint->dest) while remaining safe
      let bestWp = safeJunctions[0];
      let bestDist = Infinity;

      for (const j of safeJunctions) {
        const d = haversineKm(startLat, startLng, j.lat, j.lng) + haversineKm(j.lat, j.lng, destLat, destLng);
        if (d < bestDist) {
          bestDist = d;
          bestWp = j;
        }
      }

      // Add intermediate waypoint
      routePoints.push([bestWp.lng, bestWp.lat]);

      // If destination is in or near a flood zone, generate safe perimeter approach waypoint
      const destHazard = isPointInHazard(destLat, destLng, waterSurgeLevel);
      if (destHazard) {
        avoidedHazards.add(destHazard);
        // Approach point 200m away on safe axis
        const approachLat = destLat + (destLat > 13.08 ? 0.003 : -0.003);
        const approachLng = destLng - 0.004;
        routePoints.push([approachLng, approachLat]);
      }
    }
  }

  // Add final destination
  routePoints.push([destLng, destLat]);

  // Calculate total route distance
  let totalKm = 0;
  for (let i = 0; i < routePoints.length - 1; i++) {
    totalKm += haversineKm(routePoints[i][1], routePoints[i][0], routePoints[i + 1][1], routePoints[i + 1][0]);
  }

  // Assume emergency vehicle speed: 30 km/h in urban flood conditions
  const speedKmH = waterSurgeLevel > 1.5 ? 22 : 35;
  const etaMinutes = Math.max(3, Math.round((totalKm / speedKmH) * 60));

  return {
    engine: 'Safe Rescue Navigation (Software Prototype)',
    routeCoordinates: routePoints, // Leaflet GeoJSON polyline format [[lng, lat], ...]
    distanceKm: parseFloat(totalKm.toFixed(2)),
    etaMinutes,
    avoidedHazards: Array.from(avoidedHazards),
    waterSurgeLevel,
    isDirectRoute: !directCrossesHazard,
    safetyStatus: avoidedHazards.size > 0 ? 'Diverted around submerged hazard zones' : 'Optimal safe corridor'
  };
}

module.exports = {
  planSafeRescueRoute,
  haversineKm,
  isPointInHazard
};
