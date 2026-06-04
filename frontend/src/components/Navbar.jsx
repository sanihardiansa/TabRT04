import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="mobile-navbar glass-panel">
      <div className="navbar-left">
        <div className="navbar-title">
          Sistem Tabungan RT 04
        </div>
      </div>
      
      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme} 
          title="Ganti Tema Visual"
        >
          {theme === 'dark' ? '☀️ Mode Terang' : '🌙 Mode Gelap'}
        </button>

        {user && (
          <div className="navbar-user" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="user-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <strong>{user.name}</strong>
              <small style={{ opacity: 0.7, fontSize: '0.75rem' }}>{user.role}</small>
            </span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
