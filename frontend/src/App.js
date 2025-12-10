import React from 'react';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navigation } from './components/Navigation';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Dashboard } from './components/Dashboard';
import { PrivateRoute } from './components/PrivateRoute';
import { Profile } from './components/Profile';
import MonitoringDashboard from './components/monitoring/Dashboard';
import CryptoMetrics from './components/monitoring/CryptoMetrics';

function App() {
  return (
    <ChakraProvider>
      <AuthProvider>
        <Router>
          <Box minH="100vh">
            <Navigation />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route 
                path="/monitoring" 
                element={
                  <PrivateRoute>
                    <MonitoringDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/crypto-metrics" 
                element={
                  <PrivateRoute>
                    <CryptoMetrics />
                  </PrivateRoute>
                } 
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Login />} />
            </Routes>
          </Box>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;