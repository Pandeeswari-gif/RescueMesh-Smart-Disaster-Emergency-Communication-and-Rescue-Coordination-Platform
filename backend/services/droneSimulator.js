/**
 * RescueMesh Autonomous Drone Reconnaissance Simulation Engine
 *
 * Simulates UAV flight sweeps across designated disaster grid sectors.
 * Emulates FLIR thermal infrared radiometry detection (heat signature signatures
 * of human body temperatures 36.5°C–37.5°C in flooded/collapsed lowlands).
 *
 * NOTE: Clearly labeled as "Autonomous Drone Reconnaissance Simulation" (No drone hardware).
 */

const Drone = require('../models/Drone');
const DroneDetection = require('../models/DroneDetection');

const SIMULATED_VICTIM_HOTSPOTS = [
  {
    sector: 'SECTOR-B2',
    lat: 13.0845,
    lng: 80.2512,
    temp: 36.9,
    confidence: 94,
    estimatedVictims: 3,
    description: 'Thermal cluster detected on flat residential rooftop surrounded by 1.8m floodwaters'
  },
  {
    sector: 'SECTOR-C1',
    lat: 13.0515,
    lng: 80.2640,
    temp: 37.1,
    confidence: 89,
    estimatedVictims: 1,
    description: 'Isolated heat signature atop stranded delivery vehicle near Marina Creek'
  },
  {
    sector: 'SECTOR-A3',
    lat: 13.1120,
    lng: 80.2410,
    temp: 36.7,
    confidence: 91,
    estimatedVictims: 2,
    description: 'Sub-canopy human heat signature detected in North Slum periphery'
  }
];

async function simulateDroneScanStep(droneId) {
  let drone = await Drone.findOne({ droneId });
  if (!drone) {
    drone = await Drone.create({
      droneId: droneId || 'DRONE-RECON-01',
      name: 'Talon-1 Recon UAV (FLIR Radiometric)',
      status: 'SCANNING',
      batteryLevel: 85,
      currentSector: 'SECTOR-B2',
      latitude: 13.0840,
      longitude: 80.2505,
      altitudeM: 75,
      flirSensorActive: true,
      scanCoveragePercent: 45
    });
  }

  // Update battery and position slightly
  drone.batteryLevel = Math.max(10, drone.batteryLevel - 1);
  drone.scanCoveragePercent = Math.min(100, drone.scanCoveragePercent + 5);
  drone.latitude += (Math.random() - 0.5) * 0.001;
  drone.longitude += (Math.random() - 0.5) * 0.001;
  await drone.save();

  // Check if hotspot is detected in this sector
  const hotspot = SIMULATED_VICTIM_HOTSPOTS.find(h => h.sector === drone.currentSector) || SIMULATED_VICTIM_HOTSPOTS[0];

  const detectionId = `DET-${Date.now().toString().slice(-6)}`;
  const detection = new DroneDetection({
    detectionId,
    droneId: drone.droneId,
    droneName: drone.name,
    sector: drone.currentSector,
    location: {
      latitude: hotspot.lat,
      longitude: hotspot.lng
    },
    heatSignatureTempC: hotspot.temp,
    confidence: hotspot.confidence,
    estimatedVictims: hotspot.estimatedVictims,
    status: 'DETECTED'
  });

  await detection.save();
  return { drone, detection, hotspot };
}

module.exports = {
  simulateDroneScanStep,
  SIMULATED_VICTIM_HOTSPOTS
};
