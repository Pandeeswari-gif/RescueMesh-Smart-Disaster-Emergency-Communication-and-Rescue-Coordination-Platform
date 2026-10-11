const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const SOS = require('../models/SOS');
const RescueTeam = require('../models/RescueTeam');
const RescueAssignment = require('../models/RescueAssignment');
const Hospital = require('../models/Hospital');
const Shelter = require('../models/Shelter');
const Resource = require('../models/Resource');
const Disaster = require('../models/Disaster');
const Broadcast = require('../models/Broadcast');
const MeshPacket = require('../models/MeshPacket');
const Drone = require('../models/Drone');
const DroneDetection = require('../models/DroneDetection');
const HazardZone = require('../models/HazardZone');
const AuditLog = require('../models/AuditLog');

async function seedDatabase() {
  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    SOS.deleteMany({}),
    RescueTeam.deleteMany({}),
    RescueAssignment.deleteMany({}),
    Hospital.deleteMany({}),
    Shelter.deleteMany({}),
    Resource.deleteMany({}),
    Disaster.deleteMany({}),
    Broadcast.deleteMany({}),
    MeshPacket.deleteMany({}),
    Drone.deleteMany({}),
    DroneDetection.deleteMany({}),
    HazardZone.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  console.log('[Seed] Creating demo accounts for all 6 roles...');
  const commonPassword = 'Emergency123!';

  const users = await User.create([
    {
      name: 'Ravi Kumar (Citizen / Victim)',
      email: 'citizen@rescuemesh.org',
      phone: '+91-98765-43001',
      password: commonPassword,
      role: 'CITIZEN',
      address: 'House #42, Riverside Colony, Zone Beta',
      latitude: 13.0845,
      longitude: 80.2520,
      status: 'ACTIVE'
    },
    {
      name: 'Commander Sarah Jenkins',
      email: 'hq@rescuemesh.org',
      phone: '+91-98765-43002',
      password: commonPassword,
      role: 'COMMAND_HQ',
      address: 'State Emergency Operations Center (EOC), Zone Alpha',
      latitude: 13.0827,
      longitude: 80.2300,
      status: 'ACTIVE'
    },
    {
      name: 'Captain Vikram Rao (Team Alpha Lead)',
      email: 'rescue1@rescuemesh.org',
      phone: '+91-98765-43003',
      password: commonPassword,
      role: 'RESCUE_TEAM',
      address: 'Station 1 Fire & Water Rescue Depot, Zone Alpha',
      latitude: 13.1000,
      longitude: 80.2350,
      status: 'ACTIVE'
    },
    {
      name: 'Dr. Anita Desai (Hospital Administrator)',
      email: 'hospital@rescuemesh.org',
      phone: '+91-98765-43004',
      password: commonPassword,
      role: 'HOSPITAL_MANAGER',
      address: 'City Central Trauma Hospital, Zone Alpha',
      latitude: 13.0820,
      longitude: 80.2350,
      status: 'ACTIVE'
    },
    {
      name: 'Karthik Menon (Shelter Relief Director)',
      email: 'shelter@rescuemesh.org',
      phone: '+91-98765-43005',
      password: commonPassword,
      role: 'SHELTER_MANAGER',
      address: 'Metro Sports Indoor Relief Camp, Zone Gamma',
      latitude: 13.0750,
      longitude: 80.2250,
      status: 'ACTIVE'
    },
    {
      name: 'Chief Admin David Vance',
      email: 'admin@rescuemesh.org',
      phone: '+91-98765-43006',
      password: commonPassword,
      role: 'ADMIN',
      address: 'Central Disaster Management Secretariat',
      latitude: 13.0827,
      longitude: 80.2300,
      status: 'ACTIVE'
    }
  ]);

  const citizenUser = users[0];
  const hqUser = users[1];
  const rescueUser = users[2];
  const hospUser = users[3];
  const shelterUser = users[4];
  const adminUser = users[5];

  console.log('[Seed] Creating Rescue Teams...');
  const teams = await RescueTeam.create([
    {
      name: 'Rescue Team Alpha - Rapid Boat Extraction',
      leaderName: 'Capt. Vikram Rao',
      phone: '+91-98765-43003',
      status: 'AVAILABLE',
      location: { latitude: 13.1000, longitude: 80.2350 },
      membersCount: 6,
      vehicleType: 'Zodiac Rescue Boat',
      equipment: ['Inflatable Zodiac Raft 40HP', 'Heavy Duty Winch', 'Emergency Trauma Kit', 'Life Vests x12', 'Satellite Radio'],
      capacity: 8,
      baseStation: 'Sector 1 Highground Station',
      accountUser: rescueUser._id
    },
    {
      name: 'Rescue Team Bravo - Amphibious All-Terrain',
      leaderName: 'Lt. Ananya Sharma',
      phone: '+91-98765-43011',
      status: 'AVAILABLE',
      location: { latitude: 13.0600, longitude: 80.2300 },
      membersCount: 5,
      vehicleType: 'Amphibious 8x8 Vehicle',
      equipment: ['8x8 High Clearance Vehicle', 'Thermal Camera Scope', 'Portable Oxygen Unit', 'Generator Kit'],
      capacity: 10,
      baseStation: 'Sector 2 Water Depot'
    },
    {
      name: 'Rescue Team Charlie - Urban Search & Extraction',
      leaderName: 'Insp. David Wilson',
      phone: '+91-98765-43012',
      status: 'AVAILABLE',
      location: { latitude: 13.0450, longitude: 80.2600 },
      membersCount: 7,
      vehicleType: 'Emergency All-Terrain Van',
      equipment: ['Hydraulic Cutters', 'Stretcher Carriers', 'Defibrillator Unit', 'Mesh Relay Nodes x4'],
      capacity: 6,
      baseStation: 'Sector 3 Coastal Rapid Unit'
    },
    {
      name: 'Rescue Team Delta - Aerial Recon & Swift Response',
      leaderName: 'Cmdr. Priya Nair',
      phone: '+91-98765-43013',
      status: 'AVAILABLE',
      location: { latitude: 13.0827, longitude: 80.2300 },
      membersCount: 4,
      vehicleType: 'Tactical Drone Carrier',
      equipment: ['Long-Range UAV Drones x2', 'FLIR Infrared Sensor Kit', 'Emergency Food Drops'],
      capacity: 4,
      baseStation: 'EOC Command Base'
    }
  ]);

  console.log('[Seed] Creating Disaster Scenario...');
  const disaster = await Disaster.create({
    name: 'Metropolitan River Basin Cyclone & Flash Flood',
    type: 'FLOOD',
    severity: 'SEVERE',
    epicenter: {
      latitude: 13.0827,
      longitude: 80.2500,
      locationName: 'Central River Delta Lowlands'
    },
    radiusKm: 18.0,
    waterSurgeLevel: 1.2,
    active: true,
    affectedPopulationEstimate: 145000,
    declaredAt: new Date(Date.now() - 3600000 * 4) // 4 hours ago
  });

  console.log('[Seed] Creating Hazard Zones...');
  await HazardZone.create([
    {
      zoneId: 'HZ-DELTA-01',
      name: 'River Basin Delta Lowlands',
      disasterType: 'FLOOD',
      polygonCoordinates: [
        [80.2420, 13.1050],
        [80.2520, 13.1020],
        [80.2580, 13.0800],
        [80.2540, 13.0600],
        [80.2440, 13.0650],
        [80.2450, 13.0900],
        [80.2420, 13.1050]
      ],
      baseRiskLevel: 'CRITICAL',
      criticalSurgeThreshold: 1.0,
      isBlockedRoad: true,
      affectedSectors: ['Zone Beta', 'Riverside Causeway']
    },
    {
      zoneId: 'HZ-MARINA-02',
      name: 'Marina Coastal Creek Overflow Area',
      disasterType: 'FLOOD',
      polygonCoordinates: [
        [80.2550, 13.0550],
        [80.2750, 13.0580],
        [80.2780, 13.0400],
        [80.2580, 13.0380],
        [80.2550, 13.0550]
      ],
      baseRiskLevel: 'HIGH',
      criticalSurgeThreshold: 1.8,
      isBlockedRoad: false,
      affectedSectors: ['Zone Delta']
    },
    {
      zoneId: 'HZ-NORTH-03',
      name: 'North Slum Lowland Inundation',
      disasterType: 'FLOOD',
      polygonCoordinates: [
        [80.2320, 13.1180],
        [80.2480, 13.1150],
        [80.2460, 13.1000],
        [80.2300, 13.1020],
        [80.2320, 13.1180]
      ],
      baseRiskLevel: 'HIGH',
      criticalSurgeThreshold: 1.5,
      isBlockedRoad: false,
      affectedSectors: ['North Grand Trunk Periphery']
    }
  ]);

  console.log('[Seed] Creating Shelters...');
  await Shelter.create([
    {
      name: 'Metro Sports Indoor Stadium Relief Camp',
      address: '22 West Boulevard, Zone Gamma',
      location: { latitude: 13.0750, longitude: 80.2250 },
      totalCapacity: 1200,
      currentOccupancy: 640,
      foodStockDays: 6,
      waterStockDays: 5,
      medicalSupport: true,
      status: 'OPEN',
      elevation: 14.5,
      floodRiskThreshold: 2.5,
      phone: '+91-98765-43202',
      manager: shelterUser._id
    },
    {
      name: 'North Hill Community Center Relief Shelter',
      address: '108 Hillside Road, Zone Alpha',
      location: { latitude: 13.1050, longitude: 80.2200 },
      totalCapacity: 500,
      currentOccupancy: 190,
      foodStockDays: 8,
      waterStockDays: 7,
      medicalSupport: true,
      status: 'OPEN',
      elevation: 16.0,
      floodRiskThreshold: 3.0,
      phone: '+91-98765-43201'
    },
    {
      name: 'Highland Polytechnic Relief Center',
      address: '5 College Ring Road, Zone Gamma',
      location: { latitude: 13.0380, longitude: 80.2150 },
      totalCapacity: 400,
      currentOccupancy: 310,
      foodStockDays: 4,
      waterStockDays: 3,
      medicalSupport: false,
      status: 'OPEN',
      elevation: 18.0,
      floodRiskThreshold: 3.0,
      phone: '+91-98765-43203'
    },
    {
      name: 'Riverside Vocational School Relief Base (At Risk)',
      address: 'Riverside Sector 4, Zone Beta',
      location: { latitude: 13.0680, longitude: 80.2520 },
      totalCapacity: 300,
      currentOccupancy: 95,
      foodStockDays: 2,
      waterStockDays: 2,
      medicalSupport: true,
      status: 'OPEN',
      elevation: 2.1,
      floodRiskThreshold: 1.5,
      phone: '+91-98765-43204'
    }
  ]);

  console.log('[Seed] Creating Hospitals...');
  await Hospital.create([
    {
      name: 'City Central Trauma & General Hospital',
      address: '1 Central Hospital Way, Zone Alpha',
      location: { latitude: 13.0820, longitude: 80.2350 },
      icuBedsTotal: 40,
      icuBedsAvailable: 12,
      generalBedsTotal: 250,
      generalBedsAvailable: 48,
      emergencyBedsTotal: 50,
      emergencyBedsAvailable: 19,
      oxygenCylindersAvailable: 130,
      ambulancesAvailable: 8,
      phone: '+91-98765-43101',
      elevation: 14.0,
      floodRiskThreshold: 2.8,
      manager: hospUser._id
    },
    {
      name: 'St. Jude Emergency Medical Center',
      address: '45 Cathedral Road, Zone Gamma',
      location: { latitude: 13.0650, longitude: 80.2200 },
      icuBedsTotal: 25,
      icuBedsAvailable: 7,
      generalBedsTotal: 140,
      generalBedsAvailable: 34,
      emergencyBedsTotal: 30,
      emergencyBedsAvailable: 12,
      oxygenCylindersAvailable: 70,
      ambulancesAvailable: 5,
      phone: '+91-98765-43102',
      elevation: 15.2,
      floodRiskThreshold: 3.0
    },
    {
      name: 'Apollo Coastal Emergency Trauma Hospital',
      address: '77 Coastal Highway, Zone Delta',
      location: { latitude: 13.0450, longitude: 80.2550 },
      icuBedsTotal: 35,
      icuBedsAvailable: 4,
      generalBedsTotal: 180,
      generalBedsAvailable: 21,
      emergencyBedsTotal: 40,
      emergencyBedsAvailable: 8,
      oxygenCylindersAvailable: 85,
      ambulancesAvailable: 6,
      phone: '+91-98765-43103',
      elevation: 7.5,
      floodRiskThreshold: 2.0
    },
    {
      name: 'Riverside Primary Health Clinic (Submerged Perimeter)',
      address: '12 Riverbank Lane, Zone Beta',
      location: { latitude: 13.0700, longitude: 80.2480 },
      icuBedsTotal: 10,
      icuBedsAvailable: 1,
      generalBedsTotal: 60,
      generalBedsAvailable: 6,
      emergencyBedsTotal: 15,
      emergencyBedsAvailable: 2,
      oxygenCylindersAvailable: 22,
      ambulancesAvailable: 1,
      phone: '+91-98765-43104',
      elevation: 1.8,
      floodRiskThreshold: 1.2
    }
  ]);

  console.log('[Seed] Creating Resources...');
  await Resource.create([
    {
      name: 'Inflatable Zodiac Rescue Boats (Heavy Duty)',
      type: 'RESCUE_BOAT',
      quantity: 14,
      unit: 'boats',
      location: { latitude: 13.0827, longitude: 80.2300, depotName: 'Central Logistics Yard' },
      status: 'AVAILABLE'
    },
    {
      name: 'Paramedic Advanced Life Support Ambulances',
      type: 'AMBULANCE',
      quantity: 18,
      unit: 'vehicles',
      location: { latitude: 13.0820, longitude: 80.2350, depotName: 'City Hospital Depot' },
      status: 'AVAILABLE'
    },
    {
      name: 'Emergency Medical Field Triage Kits',
      type: 'MEDICAL_KIT',
      quantity: 350,
      unit: 'kits',
      location: { latitude: 13.0827, longitude: 80.2300, depotName: 'Disaster Health Warehouse' },
      status: 'AVAILABLE'
    },
    {
      name: 'High-Calorie Ready-to-Eat Food Rations',
      type: 'FOOD_RATIONS',
      quantity: 8500,
      unit: 'packs',
      location: { latitude: 13.0750, longitude: 80.2250, depotName: 'Metro Relief Storage' },
      status: 'AVAILABLE'
    },
    {
      name: 'Purified Emergency Drinking Water (5L)',
      type: 'DRINKING_WATER',
      quantity: 12000,
      unit: 'bottles',
      location: { latitude: 13.0750, longitude: 80.2250, depotName: 'Metro Relief Storage' },
      status: 'AVAILABLE'
    },
    {
      name: 'Thermal Foil & Wool Emergency Blankets',
      type: 'BLANKET',
      quantity: 4200,
      unit: 'blankets',
      location: { latitude: 13.1050, longitude: 80.2200, depotName: 'North Hill Depot' },
      status: 'AVAILABLE'
    },
    {
      name: 'Medical Oxygen Cylinders (47L High Pressure)',
      type: 'OXYGEN_CYLINDER',
      quantity: 160,
      unit: 'cylinders',
      location: { latitude: 13.0820, longitude: 80.2350, depotName: 'City Hospital Gas Reserve' },
      status: 'AVAILABLE'
    },
    {
      name: 'SOLAS Approved Adult & Child Life Jackets',
      type: 'LIFE_JACKET',
      quantity: 800,
      unit: 'jackets',
      location: { latitude: 13.0600, longitude: 80.2300, depotName: 'Maritime Station 2' },
      status: 'AVAILABLE'
    },
    {
      name: 'Heavy Diesel Submersible Water De-watering Pumps',
      type: 'OTHER',
      quantity: 24,
      unit: 'units',
      location: { latitude: 13.0827, longitude: 80.2300, depotName: 'Public Works Depot' },
      status: 'AVAILABLE'
    }
  ]);

  console.log('[Seed] Creating Realistic Active SOS Requests...');
  await SOS.create([
    {
      sosId: 'SOS-2026-9001',
      citizen: citizenUser._id,
      citizenName: 'Ravi Kumar (Citizen Demo)',
      citizenPhone: '+91-98765-43001',
      disasterType: 'FLOOD',
      severity: 'CRITICAL',
      affectedCount: 3,
      hasInjuries: true,
      floodWaterLevel: 2.1,
      vulnerability: { hasElderly: true, hasInfants: true, hasDisabled: false, hasPregnant: false },
      description: 'Water has breached 2nd floor balcony! Grandmother and 8-month infant stranded. Power lines snapped in water nearby.',
      latitude: 13.0845,
      longitude: 80.2520,
      address: 'House #42, Riverside Colony, Zone Beta',
      priorityScore: 92,
      priorityLevel: 'CRITICAL',
      scoreBreakdown: [
        { factor: 'Declared Severity Level', points: 35, reason: 'Initial triage severity marked as CRITICAL' },
        { factor: 'Multiple Victims', points: 10, reason: '3 individuals affected at this location' },
        { factor: 'Medical Emergency / Severe Injuries', points: 20, reason: 'Life-threatening medical condition reported' },
        { factor: 'Extreme Water Depth', points: 15, reason: 'Water level at 2.1m exceeds safety height' },
        { factor: 'High Vulnerability Demographics', points: 10, reason: 'Presence of Senior Citizens, Infants / Children' },
        { factor: 'Response Latency Escalation', points: 2, reason: 'Awaiting immediate dispatch' }
      ],
      status: 'PENDING'
    },
    {
      sosId: 'SOS-2026-9002',
      citizenName: 'Meera Krishnan',
      citizenPhone: '+91-98765-88211',
      disasterType: 'FLOOD',
      severity: 'HIGH',
      affectedCount: 6,
      hasInjuries: false,
      floodWaterLevel: 1.4,
      vulnerability: { hasElderly: true, hasInfants: false, hasDisabled: true, hasPregnant: false },
      description: 'Ground floor submerged completely. 6 family members on roof with wheelchair patient. Running low on drinking water.',
      latitude: 13.0720,
      longitude: 80.2480,
      address: 'Flat 3B, Cooum Riverview Apts, Zone Beta',
      priorityScore: 72,
      priorityLevel: 'HIGH',
      scoreBreakdown: [
        { factor: 'Declared Severity Level', points: 25, reason: 'Initial triage severity marked as HIGH' },
        { factor: 'Significant Victim Group', points: 15, reason: 'Group of 6 individuals requiring extraction' },
        { factor: 'Moderate Water Surge', points: 10, reason: 'Water level at 1.4m prevents foot evacuation' },
        { factor: 'High Vulnerability Demographics', points: 10, reason: 'Presence of Senior Citizens, Persons with Disabilities' }
      ],
      status: 'PENDING'
    },
    {
      sosId: 'SOS-2026-9003',
      citizenName: 'Anil Gupta',
      citizenPhone: '+91-98765-77344',
      disasterType: 'FLOOD',
      severity: 'MEDIUM',
      affectedCount: 2,
      hasInjuries: false,
      floodWaterLevel: 0.6,
      vulnerability: { hasElderly: false, hasInfants: false, hasDisabled: false, hasPregnant: false },
      description: 'Street flooded up to knee level. Need evacuation assistance to nearest shelter before nightfall.',
      latitude: 13.0530,
      longitude: 80.2620,
      address: '14 Marina Creek Approach Road, Zone Delta',
      priorityScore: 35,
      priorityLevel: 'MEDIUM',
      scoreBreakdown: [
        { factor: 'Declared Severity Level', points: 15, reason: 'Initial triage severity marked as MEDIUM' },
        { factor: 'Multiple Victims', points: 10, reason: '2 individuals affected at this location' },
        { factor: 'Shallow Flood Inundation', points: 5, reason: 'Water level at 0.6m threatens ground floor safety' }
      ],
      status: 'PENDING'
    },
    {
      sosId: 'SOS-2026-9004',
      citizenName: 'Deepa Sundaram',
      citizenPhone: '+91-98765-66120',
      disasterType: 'FLOOD',
      severity: 'LOW',
      affectedCount: 1,
      hasInjuries: false,
      floodWaterLevel: 0.2,
      vulnerability: { hasElderly: false, hasInfants: false, hasDisabled: false, hasPregnant: false },
      description: 'Water receding, requesting dry rations and clean water supply information.',
      latitude: 13.0980,
      longitude: 80.2280,
      address: '29 North Grand Trunk Road, Zone Alpha',
      priorityScore: 15,
      priorityLevel: 'LOW',
      scoreBreakdown: [
        { factor: 'Declared Severity Level', points: 5, reason: 'Initial triage severity marked as LOW' },
        { factor: 'Single Victim', points: 5, reason: 'Single stranded individual report' },
        { factor: 'Shallow Flood Inundation', points: 5, reason: 'Water level at 0.2m' }
      ],
      status: 'RESOLVED',
      resolvedAt: new Date(Date.now() - 1800000)
    }
  ]);

  console.log('[Seed] Creating Autonomous Drone data...');
  await Drone.create([
    {
      droneId: 'DRONE-RECON-01',
      name: 'Talon-1 Recon UAV (FLIR Dual Radiometric)',
      model: 'Matrice 300 RTK - Boson Thermal',
      status: 'PATROLLING',
      batteryLevel: 89,
      currentSector: 'SECTOR-B2',
      latitude: 13.0845,
      longitude: 80.2515,
      altitudeM: 80,
      flirSensorActive: true,
      scanCoveragePercent: 54
    },
    {
      droneId: 'DRONE-RECON-02',
      name: 'Falcon-X Heavy Thermal Scout',
      model: 'Heavy Hexacopter FLIR Vue Pro R',
      status: 'IDLE',
      batteryLevel: 100,
      currentSector: 'SECTOR-C1',
      latitude: 13.0827,
      longitude: 80.2300,
      altitudeM: 0,
      flirSensorActive: true,
      scanCoveragePercent: 0
    }
  ]);

  console.log('[Seed] Creating Drone Detection...');
  await DroneDetection.create({
    detectionId: 'DET-882101',
    droneId: 'DRONE-RECON-01',
    droneName: 'Talon-1 Recon UAV',
    sector: 'SECTOR-B2',
    location: { latitude: 13.0845, longitude: 80.2512 },
    heatSignatureTempC: 36.9,
    confidence: 94,
    estimatedVictims: 3,
    status: 'DETECTED',
    detectedAt: new Date(Date.now() - 600000)
  });

  console.log('[Seed] Creating Off-Grid P2P Mesh Packets...');
  await MeshPacket.create({
    packetId: 'MESH-PKT-009101',
    sourceNode: {
      nodeId: 'NODE-CITIZEN-01',
      nodeType: 'CITIZEN_PHONE',
      label: 'Citizen Handset (Submerged Zone Beta)',
      latitude: 13.0890,
      longitude: 80.2530
    },
    destinationNode: {
      nodeId: 'COMMAND_GATEWAY',
      nodeType: 'COMMAND_GATEWAY',
      label: 'Command HQ Tactical Mesh Gateway',
      latitude: 13.0827,
      longitude: 80.2300
    },
    payload: {
      type: 'OFF_GRID_EMERGENCY_SOS',
      victimName: 'Kavita Sundar',
      disasterType: 'FLOOD',
      severity: 'CRITICAL',
      affectedCount: 4,
      message: 'All cell towers in Zone Beta down. Cellular no-service. Relayed through mobile mesh nodes.'
    },
    hops: [
      { fromNodeId: 'NODE-CITIZEN-01', toNodeId: 'NODE-CITIZEN-01', nodeType: 'CITIZEN_PHONE', timestamp: new Date(Date.now() - 120000), signalRssi: -48 },
      { fromNodeId: 'NODE-CITIZEN-01', toNodeId: 'NODE-RELAY-ALPHA', nodeType: 'RELAY_NODE', timestamp: new Date(Date.now() - 90000), signalRssi: -62 },
      { fromNodeId: 'NODE-RELAY-ALPHA', toNodeId: 'NODE-RESCUE-VEHICLE-1', nodeType: 'RESCUE_VEHICLE', timestamp: new Date(Date.now() - 45000), signalRssi: -71 },
      { fromNodeId: 'NODE-RESCUE-VEHICLE-1', toNodeId: 'COMMAND_GATEWAY', nodeType: 'COMMAND_GATEWAY', timestamp: new Date(), signalRssi: -55 }
    ],
    hopCount: 3,
    maxTtl: 5,
    ttlRemaining: 2,
    status: 'DELIVERED',
    duplicatePrevented: false,
    deliveredAt: new Date()
  });

  console.log('[Seed] Creating Emergency Broadcasts...');
  await Broadcast.create([
    {
      title: 'FLASH FLOOD EMERGENCY EVACUATION - ZONE BETA',
      message: 'Urgent: Water levels in River Basin Delta lowlands have exceeded 1.5m and are rising. All residents must evacuate to Metro Sports Relief Camp or North Hill Shelter immediately. Avoid Riverside Causeway.',
      type: 'EVACUATION',
      severity: 'EVACUATE_NOW',
      channels: ['IN_APP', 'LOCAL_NETWORK', 'SMS_SIMULATION', 'RADIO_SIMULATION', 'MESH_BROADCAST'],
      targetZone: 'Zone Beta & River Basin',
      sentBy: hqUser._id,
      senderName: 'State EOC Operations',
      reachCount: 34500
    },
    {
      title: 'SHELTER & MEDICAL TRIAGE CAPACITIES AVAILABLE',
      message: 'North Hill Community Shelter has 310 available beds with doctors and pediatric formula. City Central Trauma Hospital triage is active for critical extractions.',
      type: 'SHELTER_INFO',
      severity: 'INFO',
      channels: ['IN_APP', 'LOCAL_NETWORK', 'SMS_SIMULATION'],
      targetZone: 'ALL_SECTORS',
      sentBy: hqUser._id,
      senderName: 'Health Command Desk',
      reachCount: 18200
    }
  ]);

  console.log('[Seed] Creating Audit Log...');
  await AuditLog.create([
    {
      user: adminUser._id,
      userName: adminUser.name,
      role: 'ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      entity: 'SYSTEM',
      entityId: 'SYS-INIT',
      details: 'Disaster management system initialized and seeded with metropolitan flood baseline data.',
      ipAddress: '127.0.0.1'
    },
    {
      user: hqUser._id,
      userName: hqUser.name,
      role: 'COMMAND_HQ',
      action: 'BROADCAST_SENT',
      entity: 'BROADCAST',
      entityId: 'BC-001',
      details: 'Emergency evacuation warning broadcasted to Zone Beta residents across 5 channels.',
      ipAddress: '127.0.0.1'
    }
  ]);

  console.log('====================================================');
  console.log('✅ RESCUEMESH SEED COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
  console.log('Demo Credentials for All 6 Roles (Password: Emergency123!):');
  console.log('1. CITIZEN:          citizen@rescuemesh.org');
  console.log('2. COMMAND_HQ:       hq@rescuemesh.org');
  console.log('3. RESCUE_TEAM:      rescue1@rescuemesh.org');
  console.log('4. HOSPITAL_MANAGER: hospital@rescuemesh.org');
  console.log('5. SHELTER_MANAGER:  shelter@rescuemesh.org');
  console.log('6. ADMIN:            admin@rescuemesh.org');
  console.log('====================================================');
}

// If executed directly from command line: node seedData.js
if (require.main === module) {
  require('dotenv').config({ path: '../.env' });
  const { connectDB } = require('../config/db');
  connectDB()
    .then(() => seedDatabase())
    .then(() => {
      console.log('[Seed] Process exiting normally.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}

module.exports = {
  seedDatabase
};
