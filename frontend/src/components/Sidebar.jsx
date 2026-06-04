import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', path: '/', icon: '📊' },
    { label: 'Anggota Penabung', path: '/anggota', icon: '👥' },
    { label: 'Setoran Tabungan', path: '/setoran', icon: '📥' },
    { label: 'Penarikan Tabungan', path: '/penarikan', icon: '📤' },
    { label: 'Laporan Mutasi', path: '/laporan', icon: '📋' },
    { label: 'Audit Log Keamanan', path: '/audit', icon: '🔍' },
  ];

  return (
    <aside className="sidebar glass-panel open">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <span className="brand-logo">💰</span>
        <div className="brand-title">
          <h2>TABUNGAN RT 04</h2>
          <p>Sistem Keuangan Digital</p>
        </div>
      </div>

      {/* Logged in User Card */}
      {user && (
        <div className="sidebar-user">
          <div className="user-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <h4>{user.name}</h4>
            <span className={`role-badge ${user.role}`}>
              {user.role === 'admin' ? '🛡️ Administrator' : '🔑 Bendahara'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Menu Links */}
      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`menu-link ${isActive ? 'active' : ''}`}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Logout Button */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logout}>
          <span className="menu-icon">🚪</span>
          <span className="menu-label">Keluar Sistem</span>
        </button>
      </div>
    </aside>
  );
}
