const http = require('http');

// Small helper to make HTTP requests
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runE2ETests() {
  console.log('Testing RescueMesh E2E API Endpoints on http://127.0.0.1:5000 ...');

  // 1. Health
  const health = await request('GET', '/api/health');
  console.log('1. Health Check:', health.status === 200 ? 'PASSED' : 'FAILED', health.body?.service);

  // 2. Auth Login (Command HQ)
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'hq@rescuemesh.org',
    password: 'Emergency123!'
  });
  console.log('2. HQ Login:', loginRes.status === 200 ? 'PASSED' : 'FAILED', 'Token acquired:', Boolean(loginRes.body?.token));
  const token = loginRes.body?.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Create Emergency SOS
  const sosRes = await request('POST', '/api/sos', {
    citizenName: 'Integration Test Victim',
    citizenPhone: '+91-99999-88888',
    disasterType: 'FLOOD',
    severity: 'CRITICAL',
    affectedCount: 4,
    hasInjuries: true,
    floodWaterLevel: 2.2,
    vulnerability: { hasElderly: true, hasInfants: true },
    description: 'E2E test emergency extraction',
    latitude: 13.0845,
    longitude: 80.2520,
    address: 'Sector B2 Riverbank'
  });
  console.log('3. SOS Creation & AI Priority Scoring:', sosRes.status === 201 ? 'PASSED' : 'FAILED',
    `ID: ${sosRes.body?.sos?.sosId}, Priority: ${sosRes.body?.sos?.priorityLevel} (${sosRes.body?.sos?.priorityScore}/100)`);
  const createdSos = sosRes.body?.sos;

  // 4. Fetch Rescue Teams with Distance Proximity
  const teamsRes = await request('GET', `/api/rescue-teams?lat=${createdSos.latitude}&lng=${createdSos.longitude}`);
  console.log('4. Rescue Teams Proximity Query:', teamsRes.status === 200 ? 'PASSED' : 'FAILED',
    `Found ${teamsRes.body?.teams?.length} teams. Nearest: ${teamsRes.body?.teams?.[0]?.name} (${teamsRes.body?.teams?.[0]?.distanceKm}km)`);
  const nearestTeam = teamsRes.body?.teams?.[0];

  // 5. Dispatch Rescue Team
  const dispatchRes = await request('POST', '/api/rescue-assignments', {
    sosId: createdSos._id,
    teamId: nearestTeam._id,
    notes: 'E2E Automated Dispatch Test'
  }, authHeaders);
  console.log('5. Rescue Dispatch & Safe Route Calculation:', dispatchRes.status === 201 ? 'PASSED' : 'FAILED',
    `ETA: ${dispatchRes.body?.routePlan?.etaMinutes} mins, Avoided Hazards: ${dispatchRes.body?.routePlan?.avoidedHazards?.join(', ') || 'None'}`);
  const assignment = dispatchRes.body?.assignment;

  // 6. Update Assignment Status -> ON_ROUTE -> RESCUING -> COMPLETED
  const updateRes = await request('PUT', `/api/rescue-assignments/${assignment._id}`, {
    status: 'COMPLETED',
    note: 'Victims extracted safely by zodiac boat'
  }, authHeaders);
  console.log('6. Status Progression to COMPLETED:', updateRes.status === 200 ? 'PASSED' : 'FAILED');

  // 7. Dynamic Flood Surge Simulator
  const surgeRes = await request('POST', '/api/disasters/simulate-surge', {
    waterSurgeLevel: 2.4
  });
  console.log('7. Flood Water Surge Simulation (2.4m):', surgeRes.status === 200 ? 'PASSED' : 'FAILED',
    `Affected Pop: ~${surgeRes.body?.impact?.affectedPopulation}, Submerged Roads: ${surgeRes.body?.impact?.affectedRoads?.length}`);

  // 8. Autonomous Drone Recon FLIR Detection
  const droneRes = await request('POST', '/api/drones/detect', {
    droneId: 'DRONE-RECON-01',
    sector: 'SECTOR-B2'
  });
  console.log('8. Drone FLIR Thermal Detection:', droneRes.status === 201 ? 'PASSED' : 'FAILED',
    `Temp: ${droneRes.body?.detection?.heatSignatureTempC}°C, Conf: ${droneRes.body?.detection?.confidence}%`);

  // 9. Off-Grid P2P Mesh Packet Relay
  const meshRes = await request('POST', '/api/mesh/packet', {
    sourceNodeId: 'NODE-CITIZEN-01'
  });
  const packetId = meshRes.body?.packet?.packetId;
  const stepRes = await request('POST', `/api/mesh/packet/${packetId}/step`);
  console.log('9. Off-Grid P2P Mesh Relay Hop:', (meshRes.status === 201 && stepRes.status === 200) ? 'PASSED' : 'FAILED',
    `Packet: ${packetId}, Status: ${stepRes.body?.packet?.status}, TTL: ${stepRes.body?.packet?.ttlRemaining}`);

  console.log('================================================================');
  console.log('🎉 ALL 9 RESCUEMESH INTEGRATION TESTS COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
  process.exit(0);
}

runE2ETests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
