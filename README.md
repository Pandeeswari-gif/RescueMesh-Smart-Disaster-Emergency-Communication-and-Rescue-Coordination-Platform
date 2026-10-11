# RescueMesh – Smart Disaster Emergency Communication and Rescue Coordination Platform

> **Tagline**: *"Smart Disaster Emergency Communication & Rescue Coordination Platform"*

[![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Socket.IO%20%2B%20Leaflet-blue)](#tech-stack)
[![Offline First](https://img.shields.io/badge/Offline--First-Enabled-success)](#offline-first-architecture)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

---

## 1. Abstract

During major natural catastrophes such as flash floods, cyclones, and earthquakes, traditional commercial telecommunications and internet infrastructure frequently collapse due to power outages and submerged cell towers. Central emergency command centers lose situational awareness, emergency helplines become congested, and trapped victims cannot relay their survival needs. 

**RescueMesh** is an emergency management and disaster rescue coordination platform engineered to operate reliably in local-first, bandwidth-constrained, and completely off-grid disaster zones. Built with full-stack MERN (MongoDB, Express, React, Node.js), real-time WebSockets (Socket.IO), and an offline-bundled Leaflet geospatial engine, RescueMesh coordinates multi-agency operations between Citizens, Command Headquarters, Field Rescue Teams, Relief Shelters, Hospitals, and Logistics Coordinators without requiring external paid APIs or internet access.

---

## 2. Problem Statement & Proposed Solution

### The Problem
1. **Infrastructure Blackout**: Terrestrial cellular towers and internet gateways fail during catastrophic flooding.
2. **Triage Inefficiency**: Emergency calls lack standardized situational data, resulting in sub-optimal dispatch decisions.
3. **Hazardous Routing**: Dispatched rescue teams risk vehicle submersion by navigating roads that have become inundated.
4. **Unreported Victims**: Trapped individuals on rooftops or remote lowlands without cellular connectivity remain invisible to dispatchers.
5. **Multi-Agency Fragmentation**: Shelters, trauma hospitals, vehicle depots, and command centers operate in silos with stale capacity data.

### The RescueMesh Solution
- **Offline-First Resilience**: All core services function over Local Area Networks (LAN) and local host environments using bundled GeoJSON map data (`roads.geojson`, `zones.geojson`, `shelters.geojson`, `hospitals.geojson`, `hazard-zones.geojson`).
- **AI-Assisted Intelligent Severity Scoring**: Transparent, rule-based triage algorithm (0–100) that evaluates victim count, flood water level, injuries, demographics, and waiting time with explainable rationale breakdown.
- **Safe Rescue Navigation**: Software-based pathfinding engine that dynamically reroutes emergency vehicles and boats around active flood polygons and submerged causeways.
- **Dynamic Flood Water Surge Simulator**: Real-time hydrological surge slider (0.0m–3.0m) dynamically expanding flood hazard boundaries, flagging at-risk hospitals/shelters, and recalculating routes.
- **Autonomous Drone Reconnaissance Simulation**: Simulated thermal infrared (FLIR) radiometric sensor sweeps identifying human body heat clusters in unmapped sectors, allowing one-click escalation to official SOS dispatch.
- **Off-Grid P2P Mesh Communication Simulation**: Store-and-forward packet transmission graph simulating multi-hop relays between citizen phones, solar relay masts, mobile rescue vehicles, and Command HQ.
- **Real-Time Synchronized Hub**: Socket.IO event architecture ensuring Command HQ receives live SOS alerts, team status changes, hospital bed counts, and shelter occupancy without manual page refreshes.

---

## 3. Technology Stack

- **Frontend**:
  - React.js 18 + Vite
  - Tailwind CSS + Lucide Icons (Tactical Dark Command Theme)
  - Leaflet.js (Local offline vector rendering with zero tile dependency)
  - Socket.IO Client (Real-time live push events)
  - Axios (REST client with automatic offline queue interceptors)
  - HTML5 LocalStorage & IndexedDB (Offline action queuing and sync)
- **Backend**:
  - Node.js + Express.js
  - Socket.IO Server (Role-based rooms & event dispatching)
  - JSON Web Tokens (JWT) + bcryptjs (Secure authentication & RBAC)
  - Priority & Pathfinding Engines (Deterministic rules-based scoring & routing)
- **Database**:
  - MongoDB with Mongoose ODM
  - Dual-Mode Engine: Connects to local MongoDB (`mongodb://127.0.0.1:27017/rescuemesh`), with automatic fallback to embedded in-memory MongoDB (`mongodb-memory-server`) for zero-configuration startup.

---

## 4. System Architecture

```
+--------------------------------------------------------------------------------------------------+
|                                    RescueMesh Architecture                                       |
+--------------------------------------------------------------------------------------------------+
|  Frontend Layer (React 18 + Vite + Tailwind + Leaflet.js + Socket.IO Client)                     |
|  - Offline Status Bar & Action Queue Sync                                                        |
|  - 6 Role Dashboards: Citizen, Command HQ, Rescue Team, Hospital, Shelter, Admin                 |
|  - Simulation Consoles: Flood Surge (0-3m), FLIR Thermal Drone Recon, P2P Mesh Graph             |
|  - Safe Rescue Navigation avoiding Hazard & Water Surge Polygons                                  |
|  - One-Click Demo Role Switcher / Demo Credential Autologin                                     |
+--------------------------------------------------------------------------------------------------+
                                        | (REST + WebSockets)
+--------------------------------------------------------------------------------------------------+
|  Backend Layer (Node.js + Express + Socket.IO + JWT + Explainable AI Severity Engine)            |
|  - Controllers: Auth, SOS, Rescue, Hospitals, Shelters, Resources, Disasters, Drone, Mesh, Audit |
|  - Real-Time Broadcast & Event Emitters                                                          |
|  - Safe Navigation Engine & Point-in-Polygon Hazard Collision Detector                           |
+--------------------------------------------------------------------------------------------------+
                                        | (Mongoose ODM)
+--------------------------------------------------------------------------------------------------+
|  Database Layer (MongoDB / Zero-Config Embedded MongoMemoryServer Fallback)                       |
|  - 14 Collections: Users, SOS, RescueTeams, RescueAssignments, Hospitals, Shelters,              |
|    Resources, Disasters, Broadcasts, MeshPackets, Drones, DroneDetections, HazardZones, AuditLogs |
+--------------------------------------------------------------------------------------------------+
```

---

## 5. User Roles & Pre-Seeded Demo Credentials

RescueMesh enforces Role-Based Access Control (RBAC) across frontend routes and backend APIs. Every role has a designated dashboard and pre-configured demo account.

| Role | Demo Email | Password | Primary Functions |
| :--- | :--- | :--- | :--- |
| **CITIZEN** | `citizen@rescuemesh.org` | `Emergency123!` | Report SOS, track rescue team status, view highground shelters & hospitals |
| **COMMAND_HQ** | `hq@rescuemesh.org` | `Emergency123!` | Tactical overview, incident triage, team dispatch, emergency broadcasts, simulations |
| **RESCUE_TEAM** | `rescue1@rescuemesh.org` | `Emergency123!` | Accept assignments, launch Safe Route Navigation, update operational status |
| **HOSPITAL_MANAGER** | `hospital@rescuemesh.org` | `Emergency123!` | Manage ICU beds, general beds, emergency triage, oxygen cylinders, ambulances |
| **SHELTER_MANAGER** | `shelter@rescuemesh.org` | `Emergency123!` | Track bunk occupancy, available capacity, food rations, and water supplies |
| **ADMIN** | `admin@rescuemesh.org` | `Emergency123!` | Platform-wide metrics, user role directory, disaster scenarios, immutable audit logs |

> **Tip**: The login screen features a **"One-Click Quick Role Switcher"** and the top navigation bar includes an instant role toggle to facilitate hackathon and evaluator walkthroughs.

---

## 6. Detailed Feature Modules

### 6.1 Citizen Module & Intelligent Severity Scoring
- **Emergency SOS Submission**: Stranded citizens enter disaster type, severity level, affected count, water depth, medical injuries, and vulnerable demographic checkboxes (infants, elderly, disabled, pregnant).
- **Explainable "AI-Assisted Intelligent Severity Scoring"**:
  - Score range: `0–100` (Low: 0–30, Medium: 31–60, High: 61–80, Critical: 81–100).
  - Transparent itemized rationale breakdown (e.g. *Declared Severity: +35 pts*, *Multiple Victims: +10 pts*, *Life-threatening Injuries: +20 pts*, *Extreme Water Depth: +15 pts*, *High Vulnerability Demographics: +10 pts*).
  - Explicitly labeled as deterministic rule-based AI scoring (no ungrounded black-box claims).
- **Offline SOS Queue**: If network connectivity drops, the SOS is instantly written to local storage. Once connectivity returns, it automatically synchronizes with Command HQ.

### 6.2 Command HQ Tactical Dashboard & Rescue Dispatch
- **Live Incident Desk**: Real-time filterable SOS table with status tags (`PENDING`, `DISPATCHED`, `ON_ROUTE`, `ON_SITE`, `RESCUING`, `RESOLVED`).
- **One-Click Dispatch Engine**: Selecting an SOS opens the nearest rescue teams sorted by Haversine distance, shows equipment/capacity, calculates a safe route, and dispatches the unit in real time via Socket.IO.
- **Multi-Channel Emergency Broadcasting**: Transmits simultaneous emergency alerts across In-App banners, Local Network multicast, simulated SMS cell broadcasts, radio frequency audio chimes, and P2P mesh packets.

### 6.3 Safe Rescue Navigation (Software Prototype)
- Calculates optimal travel coordinates connecting rescue bases to victim coordinates.
- Cross-references the coordinate vector against active hazard polygons and flood surge zones.
- Generates diverted waypoints through safe elevated bypasses (e.g. Highland Link) when lowland causeways are submerged.
- Returns distance (km), ETA (mins), and explicitly itemized avoided hazard zones.

### 6.4 Dynamic Flood Water Surge Simulator
- Interactive slider from `0.0m` to `3.0m`.
- Hydrological calculation dynamically expands flood hazard polygons on the map.
- Real-time detection of submerged roads (e.g. Riverside Causeway blocked at &gt;1.0m, Beta Bridge at &gt;2.0m).
- Evaluates affected populations and flags at-risk shelters and medical clinics.
- Dynamically recalculates safe rescue routes as water levels change.

### 6.5 Autonomous Drone Reconnaissance Simulation
- Simulates UAV sweeps across designated disaster sectors (Sectors A1–C3).
- **FLIR-Style Thermal Visualizer**: Canvas rendering false-color radiometry (cold blue water background vs. glowing 36.5°C–37.5°C human heat signatures).
- Scanning cone sweep with Start, Pause, and Reset controls.
- Detects unreported victims and triggers an alert at Command HQ with one-click **"Convert to Official SOS & Dispatch Team"**.

### 6.6 Off-Grid P2P Mesh Communication Simulation
- Models decentralized disaster communications when cellular towers are down.
- Visual network topology graph linking Citizen Handsets &rarr; Solar Relay Masts &rarr; Mobile Rescue Vehicles &rarr; Command Gateway.
- Simulates packet creation, hop counters, TTL decrements, signal RSSI, store-and-forward queues, and duplicate suppression.
- Step-by-step or auto-run relay animation showing the packet progression to delivery.

### 6.7 Healthcare & Shelter Capacity Management
- **Hospitals**: Real-time management of ICU beds, emergency trauma beds, general beds, oxygen cylinders, and active ambulances.
- **Shelters**: Automated formula: `Available Capacity = Total Capacity - Current Occupancy`, color-coded occupancy percentage gauges, and food/water ration tracking in days.

### 6.8 Audit Trail & Analytics
- Immutable audit log recording all operations (`SOS_CREATED`, `TEAM_DISPATCHED`, `RESOURCE_ALLOCATED`, `BROADCAST_SENT`, `HOSPITAL_UPDATED`, `SHELTER_UPDATED`, `FLOOD_SURGE_UPDATED`).
- System analytics computed directly from MongoDB (severity distribution, response latencies, fleet utilization, aggregate shelter capacities).

---

## 7. Database Models (Mongoose)

1. `User`: Name, email, phone, hashed password, role (`CITIZEN`, `COMMAND_HQ`, `RESCUE_TEAM`, `SHELTER_MANAGER`, `HOSPITAL_MANAGER`, `ADMIN`), coordinates, status.
2. `SOS`: `sosId`, citizen reference, disaster type, severity, affected count, injuries flag, water level, vulnerability demographic flags, priority score (0–100), score breakdown, status, assigned team, location.
3. `RescueTeam`: Name, leader, phone, status (`AVAILABLE`, `DISPATCHED`, `ON_ROUTE`, `ON_SITE`, `RESCUING`, `COMPLETED`, `OFFLINE`), location, vehicle type, equipment loadout, capacity.
4. `RescueAssignment`: SOS ref, Team ref, route coordinates polyline, avoided hazards, distance, ETA, status timeline.
5. `Hospital`: Name, address, coordinates, ICU beds, general beds, emergency beds, oxygen cylinders, ambulances.
6. `Shelter`: Name, address, coordinates, total capacity, current occupancy, food days, water days, medical support flag, virtual available capacity.
7. `Resource`: Equipment/supply name, type, quantity, unit, depot location, status, allocation reference.
8. `Disaster`: Event name, type, epicenter, radius, active flag, water surge level (0.0m–3.0m).
9. `Broadcast`: Title, message, alert type, severity, channels array, target zone, sentBy, reach count.
10. `MeshPacket`: Packet ID, source node, destination gateway, payload, hop history array, TTL, status.
11. `Drone`: Drone ID, model, status, battery percentage, active sector, coordinates, altitude, sensor status.
12. `DroneDetection`: Detection ID, drone ref, sector, coordinates, thermal temperature, confidence %, status.
13. `HazardZone`: Zone ID, name, disaster type, polygon coordinates, base risk level, critical surge threshold.
14. `AuditLog`: User ref, operator name, role, action, entity, entity ID, details, IP address, timestamp.

---

## 8. REST API Endpoints

### Authentication
- `POST /api/auth/register` — Register a citizen/operator account.
- `POST /api/auth/login` — Authenticate and receive JWT token.
- `GET /api/auth/me` — Get authenticated user profile.
- `GET /api/auth/demo-accounts` — List pre-seeded credentials.

### SOS Emergency
- `POST /api/sos` — Submit emergency SOS (calculates priority score & fires WebSocket).
- `GET /api/sos` — List SOS records (supports filtering by severity, status, search).
- `GET /api/sos/:id` — Get single SOS details.
- `PUT /api/sos/:id` — Update SOS status or priority.
- `DELETE /api/sos/:id` — Remove SOS incident.

### Rescue & Navigation
- `GET /api/rescue-teams` — Get rescue teams (supports proximity sorting via `?lat=&lng=`).
- `POST /api/rescue-assignments` — Dispatch rescue unit (calculates safe route & notifies team).
- `PUT /api/rescue-assignments/:id` — Update assignment timeline & team status.
- `POST /api/rescue/safe-route` — Compute safe route avoiding active hazard polygons.
- `GET /api/rescue/my-assignment` — Get active mission for authenticated rescue unit.

### Facilities & Resources
- `GET /api/hospitals` & `PUT /api/hospitals/:id` — Manage hospital bed and oxygen capacities.
- `GET /api/shelters` & `PUT /api/shelters/:id` — Manage shelter occupancy and food/water stocks.
- `GET /api/resources`, `POST /api/resources`, `PUT /api/resources/:id`, `DELETE /api/resources/:id` — Resource logistics inventory.

### Disaster & Simulations
- `GET /api/disasters` & `POST /api/disasters` — Active disasters and hazard zones.
- `PUT /api/disasters/:id` — Update water surge level (triggers real-time polygon recalculation).
- `POST /api/disasters/simulate-surge` — On-the-fly hydrological impact calculation.
- `GET /api/drones` & `POST /api/drones/detect` — Trigger drone FLIR sector scan.
- `POST /api/drones/detection/:id/convert-to-sos` — Convert UAV thermal detection into an SOS.
- `GET /api/mesh/packets` & `POST /api/mesh/packet` — Create and inspect P2P mesh packets.
- `POST /api/mesh/packet/:id/step` — Step mesh packet to the next relay hop.
- `POST /api/broadcasts` & `GET /api/broadcasts` — Multi-channel emergency broadcasts.
- `GET /api/admin/analytics` & `GET /api/admin/audit` — Live analytics and immutable audit logs.
- `GET /api/health` — Service and database engine health status.

---

## 9. Installation and Running

### Prerequisites
- **Node.js**: Version 18+ (tested on Node.js v24.x)
- **npm**: Version 9+
- **MongoDB**: Optional (If local MongoDB is not running on port 27017, the system automatically runs on an embedded in-memory MongoDB runner with zero configuration required).

### Option 1: One-Command Startup (Recommended)
From the root directory:
```bash
# 1. Install dependencies
npm run install:all

# 2. Seed database
npm run seed

# 3. Launch both Backend & Frontend simultaneously
npm run dev
```

### Option 2: Running Backend and Frontend in Separate Terminals

#### Terminal 1 — Backend:
```bash
cd backend
npm install
npm run seed
npm run dev
```
*Backend runs at `http://localhost:5000` with WebSocket ready.*

#### Terminal 2 — Frontend:
```bash
cd frontend
npm install
npm run dev
```
*Frontend opens at `http://localhost:3000`.*

---

## 10. Complete End-to-End Demo Walkthrough

Follow this step-by-step scenario during your project presentation or defense:

1. **Sign In**:
   - Navigate to `http://localhost:3000/login`.
   - Click the **"Citizen / Victim"** card from the One-Click Quick Role Switcher.
2. **Submit Critical SOS**:
   - Click **"SUBMIT EMERGENCY SOS"**.
   - Select Disaster: `Flood`, Severity: `CRITICAL`, Victims: `3`, Water Level: `2.0m`.
   - Check `Severe Injuries / Medical Condition` and `Senior Citizens Stranded`.
   - Click **"BROADCAST EMERGENCY SOS NOW"**.
   - Inspect the **AI-Assisted Intelligent Severity Score** (~92/100, CRITICAL) and click **"Explain"** to view the factor points breakdown.
3. **Command HQ Receipt & Dispatch**:
   - Use the top navigation role switcher to switch to **"Command HQ"**.
   - Notice the real-time notification alert badge and the new incident in the queue.
   - Navigate to **"SOS & Rescue Dispatch"** (`/command/sos`).
   - Click **"Dispatch"** on the incident.
   - The modal automatically sorts rescue teams by distance and calculates **Safe Rescue Navigation** avoiding submerged hazard zones. Click **"CONFIRM DISPATCH UNIT"**.
4. **Field Rescue Execution**:
   - Switch to **"Rescue Team Alpha"** (`/rescue/dashboard`).
   - Observe the active mission card and click **"Launch Safe Route Navigation"** (`/rescue/navigation`) to inspect the diverted cyan route polyline.
   - Progress the mission status buttons: `ON_ROUTE` &rarr; `ON_SITE` &rarr; `RESCUING` &rarr; `COMPLETED`.
5. **Dynamic Flood Surge Simulator**:
   - Switch back to **Command HQ** and open **"Flood Surge Simulator"** (`/command/flood`).
   - Drag the water surge slider from `1.2m` to `2.4m`.
   - Observe the hazard polygons expanding, roads becoming blocked, and safe routes recalculating dynamically.
   - Click **"Broadcast Surge to All Systems"**.
6. **Autonomous Drone FLIR Reconnaissance**:
   - Open **"Drone FLIR Recon"** (`/command/drone`).
   - Select `SECTOR-B2` and click **"START SCAN"**.
   - Observe the radiometric thermal canvas rendering cold blue water with hot glowing yellow-white human heat signatures (~36.9°C).
   - An unreported victim cluster is flagged. Click **"Escalate to Official SOS & Dispatch"**.
7. **Off-Grid P2P Mesh Communication**:
   - Open **"P2P Mesh Simulator"** (`/command/mesh`).
   - Click **"Generate New SOS Packet"**.
   - Click **"Step Next Hop"** or **"Auto-Run Relay"** to watch the store-and-forward packet traverse: *Citizen Phone &rarr; Solar Relay &rarr; Rescue Van &rarr; Command Gateway*.
8. **Offline-First Resilience Demonstration**:
   - Click **"Simulate Offline Mode"** in the top offline banner.
   - Notice the yellow alert: *"Offline Mode Active"*.
   - Submit an SOS—it is safely queued in local storage without network errors.
   - Click **"Exit Offline Simulation"** and observe the queue automatically synchronizing with Command HQ.

---

## 11. Project Limitations (Transparent Engineering)

To maintain academic and professional integrity, the following implementation boundaries are documented:
1. **Drone Reconnaissance**: Software simulation with synthetic thermal radiometry; no physical drone telemetry hardware required.
2. **P2P Mesh Communication**: Software simulation demonstrating hop counters, TTL, store-and-forward queuing, and duplicate suppression; no physical Bluetooth or Wi-Fi Direct chipset dependencies.
3. **Emergency Broadcasts**: Software simulation generating in-app banners, mobile SMS previews, and radio tone previews; no paid SMS gateways or external radio APIs used.
4. **Offline Maps**: Uses Leaflet.js with bundled local GeoJSON files; does not rely on online tile providers for core functionality.
5. **Safe Route Calculation**: Deterministic software prototype pathfinding on local road and waypoint graphs with collision checking against hazard polygons.
6. **AI Severity Scoring**: Transparent, explainable rule-based scoring algorithm; not a trained deep-learning model.

---

## 12. Future Scope

- Integration with physical ESP32 / LoRa SX1262 mesh hardware modules via Web Serial API.
- Native mobile client packaging using Capacitor / React Native.
- Real-world RTK-GPS integration for certified disaster response fleets.
- Machine learning vision models (YOLOv8-Thermal) deployed on edge UAV hardware for automated human detection in thermal video feeds.

---

## 13. License

Distributed under the MIT License. Developed for disaster response, humanitarian assistance, and hackathon presentation.
