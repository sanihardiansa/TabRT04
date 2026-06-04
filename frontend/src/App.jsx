import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Anggota from './pages/Anggota';
import Setoran from './pages/Setoran';
import Penarikan from './pages/Penarikan';
import Laporan from './pages/Laporan';
import AuditLogs from './pages/AuditLogs';
import Transaksi from './pages/Transaksi';

import './styles/App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="app-container">
                  <Sidebar />
                  <div className="app-content">
                    <Navbar />
                    <main className="main-content">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/anggota" element={<Anggota />} />
                        <Route path="/setoran" element={<Setoran />} />
                        <Route path="/penarikan" element={<Penarikan />} />
                        <Route path="/transaksi/setoran" element={<Transaksi initialTab="setoran" />} />
                        <Route path="/transaksi/penarikan" element={<Transaksi initialTab="penarikan" />} />
                        <Route path="/laporan" element={<Laporan />} />
                        <Route path="/audit" element={<AuditLogs />} />
                        <Route path="*" element={<Navigate to="/" />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
