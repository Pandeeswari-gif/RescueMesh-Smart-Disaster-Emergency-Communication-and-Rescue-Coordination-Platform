let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join role-based room
    socket.on('join_role_room', (role) => {
      if (role) {
        socket.join(`role:${role}`);
        console.log(`[Socket.IO] Client ${socket.id} joined room: role:${role}`);
      }
    });

    // Join specific team room
    socket.on('join_team_room', (teamId) => {
      if (teamId) {
        socket.join(`team:${teamId}`);
        console.log(`[Socket.IO] Client ${socket.id} joined team room: team:${teamId}`);
      }
    });

    // Team live GPS ping simulation
    socket.on('team_location_ping', (data) => {
      io.emit('team:location_updated', data);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIo() {
  return ioInstance;
}

// Global emitter helper for controllers
function emitEvent(eventName, payload) {
  if (ioInstance) {
    ioInstance.emit(eventName, payload);
  }
}

module.exports = {
  initSocket,
  getIo,
  emitEvent
};
