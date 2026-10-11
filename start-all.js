const { spawn } = require('child_process');
const path = require('path');

console.log('================================================================');
console.log('🚀 Launching RescueMesh Emergency Full-Stack Platform');
console.log('================================================================');

// 1. Launch Backend Server (API, WebSockets, Database Engine)
console.log('[Backend] Starting Node.js Express & Socket.IO server on port 5000...');
const backend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// 2. Launch Frontend (React + Vite + Leaflet)
console.log('[Frontend] Starting Vite React server on port 3000...');
const frontend = spawn('node', [path.join('node_modules', 'vite', 'bin', 'vite.js')], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

process.on('SIGINT', () => {
  console.log('\n[RescueMesh] Gracefully stopping all services...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});
