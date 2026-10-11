import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import {
  Eye,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  Thermometer,
  Battery,
  Navigation,
  Compass,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const SECTORS = ['SECTOR-A1', 'SECTOR-A2', 'SECTOR-B1', 'SECTOR-B2', 'SECTOR-C1', 'SECTOR-C2'];

const CommandDroneRecon = () => {
  const { socket } = useSocket();
  const [drones, setDrones] = useState([]);
  const [activeSector, setActiveSector] = useState('SECTOR-B2');
  const [isScanning, setIsScanning] = useState(false);
  const [detections, setDetections] = useState([]);
  const [latestDetection, setLatestDetection] = useState(null);
  const [converting, setConverting] = useState(false);
  const canvasRef = useRef(null);

  const fetchDrones = async () => {
    try {
      const res = await api.get('/drones');
      setDrones(res.data.drones || []);
      setDetections(res.data.detections || []);
    } catch (e) {
      console.warn('Failed to fetch drones', e);
    }
  };

  useEffect(() => {
    fetchDrones();

    if (socket) {
      socket.on('drone:detection', (data) => {
        setLatestDetection(data.detection);
        fetchDrones();
      });
    }

    return () => {
      if (socket) socket.off('drone:detection');
    };
  }, [socket]);

  // FLIR Thermal Simulation Canvas Painter
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let angle = 0;

    const renderThermalView = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Cold water / landscape background (Dark Blue / Violet gradient)
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.5, '#09153a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Sector Grid Lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 40; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 40; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 3. FLIR Crosshair & Range Rings
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.arc(cx, cy, 70, 0, Math.PI * 2);
      ctx.arc(cx, cy, 130, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshair tick marks
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy); ctx.lineTo(cx + 15, cy);
      ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy + 15);
      ctx.stroke();

      // 4. Scanning Cone Sweeper if active
      if (isScanning) {
        angle += 0.03;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        const sweepGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 150);
        sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
        sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
        ctx.fillStyle = sweepGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 150, -0.4, 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 5. Heat Hotspots (Human Body 36.8°C false-color Yellow-White glow)
      const hotspots = [
        { x: cx + 45, y: cy - 30, temp: '36.9°C', confidence: '94%' },
        { x: cx - 60, y: cy + 40, temp: '37.1°C', confidence: '89%' }
      ];

      hotspots.forEach(h => {
        // Glowing false color thermal heat signature
        const radGrad = ctx.createRadialGradient(h.x, h.y, 2, h.x, h.y, 22);
        radGrad.addColorStop(0, '#ffffff'); // pure white core = 37.5C
        radGrad.addColorStop(0.3, '#facc15'); // bright yellow
        radGrad.addColorStop(0.7, '#ea580c'); // orange
        radGrad.addColorStop(1, 'rgba(220, 38, 38, 0)'); // fade out
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(h.x, h.y, 22, 0, Math.PI * 2);
        ctx.fill();

        // Target box
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(h.x - 14, h.y - 14, 28, 28);

        // Heat Tag
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`HUMAN ${h.temp}`, h.x + 18, h.y - 4);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`CONF: ${h.confidence}`, h.x + 18, h.y + 8);
      });

      // Overlay Telemetry text
      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px monospace';
      ctx.fillText(`FLIR RADIOMETRIC: DUAL BOSON 640`, 12, 20);
      ctx.fillText(`FOV: 45° | NUC: CALIBRATED | PALETTE: IRONBOW`, 12, 35);
      ctx.fillText(`SECTOR: ${activeSector}`, canvas.width - 160, 20);

      animationFrameId = requestAnimationFrame(renderThermalView);
    };

    renderThermalView();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isScanning, activeSector]);

  // Scan trigger step
  const handleStartScan = async () => {
    setIsScanning(true);
    try {
      const drone = drones[0] || { droneId: 'DRONE-RECON-01' };
      await api.post('/drones/detect', {
        droneId: drone.droneId,
        sector: activeSector
      });
      fetchDrones();
    } catch (e) {
      console.warn('Drone scan trigger error', e);
    }
  };

  const handlePauseScan = () => {
    setIsScanning(false);
  };

  const handleResetScan = () => {
    setIsScanning(false);
    setLatestDetection(null);
  };

  const handleConvertToSOS = async (detectionId) => {
    setConverting(true);
    try {
      const res = await api.post(`/drones/detection/${detectionId}/convert-to-sos`);
      alert(`Success! Detection converted to official emergency incident ${res.data.sos.sosId}`);
      fetchDrones();
      setLatestDetection(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Conversion failed');
    } finally {
      setConverting(false);
    }
  };

  const drone1 = drones[0] || {
    name: 'Talon-1 Recon UAV',
    batteryLevel: 88,
    altitudeM: 80,
    status: 'SCANNING'
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold text-slate-100">
              Autonomous Drone Reconnaissance Simulation
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulated UAV sector scanning with radiometric FLIR thermal false-color imaging to locate unreported trapped flood victims.
          </p>
        </div>

        <div className="p-2 bg-amber-950/60 border border-amber-800 rounded-xl text-xs text-amber-200 font-medium">
          Note: Software Reconnaissance Simulation (No drone hardware claim).
        </div>
      </div>

      {/* Main Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FLIR Thermal Canvas & Controls */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                FLIR Long-Wave Infrared (LWIR) Thermal Feed
              </h3>
            </div>

            {/* Simulation Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleStartScan}
                disabled={isScanning}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>START SCAN</span>
              </button>
              <button
                onClick={handlePauseScan}
                disabled={!isScanning}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700 transition disabled:opacity-50"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>PAUSE</span>
              </button>
              <button
                onClick={handleResetScan}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition"
                title="Reset Scan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Thermal Viewport Canvas */}
          <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex justify-center items-center shadow-inner">
            <canvas
              ref={canvasRef}
              width={640}
              height={360}
              className="w-full max-h-[380px] object-contain"
            />
          </div>

          {/* Sector Selector Grid */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Operational Grid Sectors:
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {SECTORS.map(sec => (
                <button
                  key={sec}
                  onClick={() => setActiveSector(sec)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                    activeSector === sec
                      ? 'bg-amber-600 text-white shadow-lg'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drone Telemetry & Detections Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Drone Telemetry Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 text-xs">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center justify-between">
              <span>UAV Telemetry</span>
              <span className="text-[10px] text-emerald-400 font-mono">LINK STABLE</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 text-[10px] block">Altitude AGL</span>
                <strong className="text-sm font-mono text-cyan-400">{drone1.altitudeM}m</strong>
              </div>
              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 text-[10px] block">Battery Status</span>
                <strong className="text-sm font-mono text-emerald-400 flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5" />
                  {drone1.batteryLevel}%
                </strong>
              </div>
            </div>

            <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Patrol UAV:</span>
                <strong className="text-slate-100">{drone1.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Sector:</span>
                <span className="font-mono text-amber-400">{activeSector}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scan Status:</span>
                <span className="font-mono text-slate-200">{isScanning ? 'SWEEPING' : 'IDLE'}</span>
              </div>
            </div>
          </div>

          {/* Thermal Detections Log Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 text-xs">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center justify-between">
              <span>Thermal Detections</span>
              <Thermometer className="w-3.5 h-3.5 text-red-400" />
            </h3>

            {latestDetection && latestDetection.status !== 'CONVERTED_TO_SOS' && (
              <div className="p-3 bg-red-950/80 border border-red-700 rounded-xl space-y-2 animate-pulse">
                <div className="flex justify-between items-center text-red-300 font-bold">
                  <span>UNREPORTED VICTIMS DETECTED!</span>
                  <span className="text-[10px] font-mono">{latestDetection.heatSignatureTempC}°C</span>
                </div>
                <p className="text-[11px] text-red-200">
                  Heat cluster in <strong>{latestDetection.sector}</strong>. Estimated {latestDetection.estimatedVictims} stranded victims with {latestDetection.confidence}% confidence.
                </p>
                <button
                  onClick={() => handleConvertToSOS(latestDetection._id)}
                  disabled={converting}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-2 rounded-lg shadow transition"
                >
                  {converting ? 'Converting...' : 'Escalate to Official SOS & Dispatch'}
                </button>
              </div>
            )}

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {detections.map(det => (
                <div key={det._id} className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
                  <div className="flex justify-between items-center">
                    <strong className="text-slate-200 font-mono">{det.detectionId}</strong>
                    <span className="text-[10px] text-amber-400 font-bold">{det.heatSignatureTempC}°C</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{det.sector} ({det.estimatedVictims} victims)</span>
                    <span className="font-mono text-slate-300">{det.confidence}% conf</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-0.5 flex justify-between">
                    <span>Status: {det.status}</span>
                    {det.status === 'DETECTED' && (
                      <button
                        onClick={() => handleConvertToSOS(det._id)}
                        className="text-blue-400 hover:underline font-semibold"
                      >
                        Convert to SOS →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandDroneRecon;
