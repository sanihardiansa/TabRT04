import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      // Pada backend menggunakan field 'email', jadi kita teruskan 'username' sebagai email
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal masuk. Periksa username dan password Anda.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-bg-glow">
        <div className="glow-circle circle-1"></div>
        <div className="glow-circle circle-2"></div>
      </div>

      <div className="login-card glass-panel">
        <div className="login-header">
          <span className="login-icon">💰</span>
          <h1>TABUNGAN RT 04</h1>
          <p>Sistem Informasi & Manajemen Tabungan Warga</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error-alert">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="username">Email / Username Petugas</label>
            <input
              type="text"
              id="username"
              className="form-control"
              placeholder="Contoh: admin@rt04.local..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Kata Sandi</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="form-control"
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                autoComplete="current-password"
                style={{ paddingRight: '2.5rem' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary login-btn"
            disabled={submitting}
          >
            {submitting ? '🔄 Memproses Masuk...' : '🔑 Masuk ke Sistem'}
          </button>
        </form>

        <div className="login-footer">
          <p>Lingkungan RT 04 RW 02 - Aman, Transparan & Akuntabel</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.8 }}>
            <span style={{ display: 'block' }}>Demo Admin: admin@rt04.local / Admin@123</span>
            <span style={{ display: 'block' }}>Demo Bendahara: treasurer@rt04.local / Treasurer@123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
