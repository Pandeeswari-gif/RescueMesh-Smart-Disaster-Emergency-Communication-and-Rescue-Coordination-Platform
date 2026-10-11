import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { OfflineProvider } from './context/OfflineContext';
import MainLayout from './layouts/MainLayout';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Citizen Pages
import CitizenDashboard from './pages/Citizen/CitizenDashboard';
import CitizenSOSForm from './pages/Citizen/CitizenSOSForm';
import CitizenHistory from './pages/Citizen/CitizenHistory';

// Command HQ Pages
import CommandDashboard from './pages/Command/CommandDashboard';
import CommandSOSManagement from './pages/Command/CommandSOSManagement';
import CommandMap from './pages/Command/CommandMap';
import CommandResources from './pages/Command/CommandResources';
import CommandBroadcast from './pages/Command/CommandBroadcast';
import CommandFloodSimulator from './pages/Command/CommandFloodSimulator';
import CommandDroneRecon from './pages/Command/CommandDroneRecon';
import CommandMeshSimulator from './pages/Command/CommandMeshSimulator';

// Rescue Team Pages
import RescueDashboard from './pages/Rescue/RescueDashboard';
import RescueAssignments from './pages/Rescue/RescueAssignments';
import RescueNavigation from './pages/Rescue/RescueNavigation';

// Healthcare & Shelter Pages
import HospitalDashboard from './pages/Hospital/HospitalDashboard';
import ShelterDashboard from './pages/Shelter/ShelterDashboard';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminDisasters from './pages/Admin/AdminDisasters';
import AdminAudit from './pages/Admin/AdminAudit';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-400">Verifying session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's primary dashboard if accessing unauthorized route
    if (user.role === 'CITIZEN') return <Navigate to="/citizen/dashboard" replace />;
    if (user.role === 'COMMAND_HQ') return <Navigate to="/command/dashboard" replace />;
    if (user.role === 'RESCUE_TEAM') return <Navigate to="/rescue/dashboard" replace />;
    if (user.role === 'HOSPITAL_MANAGER') return <Navigate to="/hospital/dashboard" replace />;
    if (user.role === 'SHELTER_MANAGER') return <Navigate to="/shelter/dashboard" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

// Default Route Redirector
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'CITIZEN') return <Navigate to="/citizen/dashboard" replace />;
  if (user.role === 'COMMAND_HQ') return <Navigate to="/command/dashboard" replace />;
  if (user.role === 'RESCUE_TEAM') return <Navigate to="/rescue/dashboard" replace />;
  if (user.role === 'HOSPITAL_MANAGER') return <Navigate to="/hospital/dashboard" replace />;
  if (user.role === 'SHELTER_MANAGER') return <Navigate to="/shelter/dashboard" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/citizen/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <OfflineProvider>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<RootRedirect />} />

              {/* Main Application with Sidebar & Navbar Layout */}
              <Route element={<MainLayout />}>
                {/* Citizen Routes */}
                <Route
                  path="/citizen/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['CITIZEN', 'COMMAND_HQ', 'ADMIN']}>
                      <CitizenDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/citizen/sos"
                  element={
                    <ProtectedRoute allowedRoles={['CITIZEN', 'COMMAND_HQ', 'ADMIN']}>
                      <CitizenSOSForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/citizen/history"
                  element={
                    <ProtectedRoute allowedRoles={['CITIZEN', 'COMMAND_HQ', 'ADMIN']}>
                      <CitizenHistory />
                    </ProtectedRoute>
                  }
                />

                {/* Command HQ Routes */}
                <Route
                  path="/command/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['COMMAND_HQ', 'ADMIN']}>
                      <CommandDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/command/sos"
                  element={
                    <ProtectedRoute allowedRoles={['COMMAND_HQ', 'ADMIN']}>
                      <CommandSOSManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/command/map"
                  element={
                    <ProtectedRoute allowedRoles={['COMMAND_HQ', 'ADMIN']}>
                      <CommandMap />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/command/resources"
                  element={
                    <ProtectedRoute allowedRoles={['COMMAND_HQ', 'ADMIN']}>
                      <CommandResources />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/command/broadcast"
                  element={
                    <ProtectedRoute allowedRoles={['COMMAND_HQ', 'ADMIN']}>
                      <CommandBroadcast />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/command/flood"
                  element={
                    <ProtectedRoute allowedRoles={['COMMAND_HQ', 'ADMIN']}>
                      <CommandFloodSimulator />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/command/drone"
                  element={
                    <ProtectedRoute allowedRoles={['COMMAND_HQ', 'ADMIN']}>
                      <CommandDroneRecon />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/command/mesh"
                  element={
                    <ProtectedRoute allowedRoles={['COMMAND_HQ', 'ADMIN']}>
                      <CommandMeshSimulator />
                    </ProtectedRoute>
                  }
                />

                {/* Rescue Team Routes */}
                <Route
                  path="/rescue/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['RESCUE_TEAM', 'COMMAND_HQ', 'ADMIN']}>
                      <RescueDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/rescue/assignments"
                  element={
                    <ProtectedRoute allowedRoles={['RESCUE_TEAM', 'COMMAND_HQ', 'ADMIN']}>
                      <RescueAssignments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/rescue/navigation"
                  element={
                    <ProtectedRoute allowedRoles={['RESCUE_TEAM', 'COMMAND_HQ', 'ADMIN']}>
                      <RescueNavigation />
                    </ProtectedRoute>
                  }
                />

                {/* Healthcare & Shelter Routes */}
                <Route
                  path="/hospital/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['HOSPITAL_MANAGER', 'COMMAND_HQ', 'ADMIN']}>
                      <HospitalDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shelter/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['SHELTER_MANAGER', 'COMMAND_HQ', 'ADMIN']}>
                      <ShelterDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminUsers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/disasters"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDisasters />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/audit"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'COMMAND_HQ']}>
                      <AdminAudit />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </OfflineProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
