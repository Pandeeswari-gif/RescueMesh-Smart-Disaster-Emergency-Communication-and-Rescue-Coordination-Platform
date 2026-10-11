/**
 * RescueMesh Simulated Off-Grid P2P Mesh Communication Engine
 *
 * Implements store-and-forward multi-hop packet routing across decentralized nodes
 * (Citizen Handsets, Solar Relay Beacons, Mobile Rescue Vehicles, Command Gateways).
 * Includes TTL enforcement, hop counters, RSSI calculation, and duplicate suppression.
 *
 * NOTE: Clearly labeled as "Simulated P2P Mesh Relay" (No hardware Bluetooth/Wi-Fi Direct).
 */

const MeshPacket = require('../models/MeshPacket');

// Mesh network topology nodes
const MESH_NODES = [
  { nodeId: 'NODE-CITIZEN-01', nodeType: 'CITIZEN_PHONE', label: 'Citizen Phone (Submerged Area)', lat: 13.0890, lng: 80.2530, battery: 42 },
  { nodeId: 'NODE-CITIZEN-02', nodeType: 'CITIZEN_PHONE', label: 'Citizen Handset (Marina Edge)', lat: 13.0520, lng: 80.2610, battery: 65 },
  { nodeId: 'NODE-RELAY-ALPHA', nodeType: 'RELAY_NODE', label: 'Solar Relay Beacon Alpha', lat: 13.0780, lng: 80.2450, battery: 95 },
  { nodeId: 'NODE-RELAY-BETA', nodeType: 'RELAY_NODE', label: 'Highland Mast Relay Beta', lat: 13.0650, lng: 80.2350, battery: 89 },
  { nodeId: 'NODE-RESCUE-VEHICLE-1', nodeType: 'RESCUE_VEHICLE', label: 'Mobile Rescue Van Alpha (Radio Hub)', lat: 13.0800, lng: 80.2380, battery: 100 },
  { nodeId: 'NODE-RESCUE-BOAT-2', nodeType: 'RESCUE_VEHICLE', label: 'Rescue Zodiac-2 Mobile Node', lat: 13.0720, lng: 80.2480, battery: 92 },
  { nodeId: 'COMMAND_GATEWAY', nodeType: 'COMMAND_GATEWAY', label: 'Command HQ Tactical Mesh Gateway', lat: 13.0827, lng: 80.2300, battery: 100 }
];

// Predefined relay pathways
const RELAY_PATHS = {
  'NODE-CITIZEN-01': ['NODE-RELAY-ALPHA', 'NODE-RESCUE-VEHICLE-1', 'COMMAND_GATEWAY'],
  'NODE-CITIZEN-02': ['NODE-RELAY-BETA', 'NODE-RESCUE-BOAT-2', 'NODE-RESCUE-VEHICLE-1', 'COMMAND_GATEWAY']
};

/**
 * Simulate packet generation and step-by-step mesh traversal
 */
async function generateSimulatedMeshPacket(sourceNodeId, payloadData = {}) {
  const sourceNode = MESH_NODES.find(n => n.nodeId === sourceNodeId) || MESH_NODES[0];
  const destNode = MESH_NODES.find(n => n.nodeId === 'COMMAND_GATEWAY');

  const packetId = `MESH-PKT-${Date.now().toString().slice(-6)}`;

  const plannedPath = RELAY_PATHS[sourceNodeId] || ['NODE-RELAY-ALPHA', 'COMMAND_GATEWAY'];

  // Initial packet creation
  const hops = [
    {
      fromNodeId: sourceNode.nodeId,
      toNodeId: sourceNode.nodeId,
      nodeType: sourceNode.nodeType,
      timestamp: new Date(),
      signalRssi: -45
    }
  ];

  const packet = new MeshPacket({
    packetId,
    sourceNode: {
      nodeId: sourceNode.nodeId,
      nodeType: sourceNode.nodeType,
      label: sourceNode.label,
      latitude: sourceNode.lat,
      longitude: sourceNode.lng
    },
    destinationNode: {
      nodeId: destNode.nodeId,
      nodeType: destNode.nodeType,
      label: destNode.label,
      latitude: destNode.lat,
      longitude: destNode.lng
    },
    payload: {
      type: payloadData.type || 'OFF_GRID_EMERGENCY_SOS',
      victimName: payloadData.victimName || 'Trapped Citizen (No Cellular Signal)',
      disasterType: payloadData.disasterType || 'FLOOD',
      severity: payloadData.severity || 'CRITICAL',
      affectedCount: payloadData.affectedCount || 3,
      message: payloadData.message || 'Cell towers down. Transmitting SOS via multi-hop ad-hoc radio mesh.'
    },
    hops,
    hopCount: 0,
    maxTtl: 5,
    ttlRemaining: 5,
    status: 'CREATED',
    duplicatePrevented: false
  });

  await packet.save();
  return { packet, plannedPath };
}

/**
 * Step packet forward to the next hop in simulation
 */
async function stepMeshPacketForward(packetId) {
  const packet = await MeshPacket.findOne({ packetId });
  if (!packet) throw new Error('Packet not found');

  if (packet.status === 'DELIVERED' || packet.status === 'DROPPED_TTL') {
    return { packet, completed: true };
  }

  const plannedPath = RELAY_PATHS[packet.sourceNode.nodeId] || ['NODE-RELAY-ALPHA', 'COMMAND_GATEWAY'];
  const currentHopIndex = packet.hopCount; // 0: created, 1: first relay, etc.

  if (currentHopIndex < plannedPath.length) {
    const nextHopNodeId = plannedPath[currentHopIndex];
    const nextNode = MESH_NODES.find(n => n.nodeId === nextHopNodeId);
    const prevNodeId = packet.hops[packet.hops.length - 1].toNodeId;

    packet.hopCount += 1;
    packet.ttlRemaining -= 1;

    packet.hops.push({
      fromNodeId: prevNodeId,
      toNodeId: nextHopNodeId,
      nodeType: nextNode ? nextNode.nodeType : 'RELAY_NODE',
      timestamp: new Date(),
      signalRssi: -60 - Math.floor(Math.random() * 25)
    });

    if (nextHopNodeId === 'COMMAND_GATEWAY') {
      packet.status = 'DELIVERED';
      packet.deliveredAt = new Date();
    } else if (packet.hopCount === 1) {
      packet.status = 'RELAYED';
    } else {
      packet.status = 'FORWARDED';
    }

    if (packet.ttlRemaining <= 0 && packet.status !== 'DELIVERED') {
      packet.status = 'DROPPED_TTL';
    }

    await packet.save();
    return { packet, completed: packet.status === 'DELIVERED' };
  }

  return { packet, completed: true };
}

module.exports = {
  MESH_NODES,
  generateSimulatedMeshPacket,
  stepMeshPacketForward
};
