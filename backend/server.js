const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB, isMemory } = require('./config/db');
const { initSocket } = require('./sockets/socketHandler');
const errorHandler = require('./middleware/errorHandler');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const sosRoutes = require('./routes/sosRoutes');
const rescueRoutes = require('./routes/rescueRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const shelterRoutes = require('./routes/shelterRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const disasterRoutes = require('./routes/disasterRoutes');
const broadcastRoutes = require('./routes/broadcastRoutes');
const meshRoutes = require('./routes/meshRoutes');
const droneRoutes = require('./routes/droneRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with permissive CORS for local network and frontend dev
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

initSocket(io);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder for optional citizen evidence photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'RescueMesh Emergency Backend API',
    databaseEngine: isMemory() ? 'Embedded MongoMemoryServer (Zero-Config)' : 'Local/External MongoDB',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api', rescueRoutes); // /api/rescue-teams, /api/rescue-assignments, etc.
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/mesh', meshRoutes);
app.use('/api/drones', droneRoutes);
app.use('/api/admin', adminRoutes);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start Server after Database Connection
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log('===========================================================');
    console.log(`🚀 RescueMesh Server running on port ${PORT}`);
    console.log(`📡 WebSocket / Socket.IO ready on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('===========================================================');
  });
}).catch((err) => {
  console.error('[Server Error] Fatal database connection error:', err);
  process.exit(1);
});
