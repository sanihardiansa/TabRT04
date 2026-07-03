import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import '../styles/GantiPassword.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || '';

const GantiPassword = () => {
    const { token } = useAuth();
    const [passwordLama, setPasswordLama] = useState('');
    const [passwordBaru, setPasswordBaru] = useState('');
    const [konfirmasi, setKonfirmasi] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!passwordLama || !passwordBaru || !konfirmasi) {
            setErrorMsg('Semua field wajib diisi.');
            return;
        }

        if (passwordBaru.length < 6) {
            setErrorMsg('Password baru minimal 6 karakter.');
            return;
        }

        if (passwordBaru !== konfirmasi) {
            setErrorMsg('Password baru dan konfirmasi tidak sama.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/ganti-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    password_lama: passwordLama,
                    password_baru: passwordBaru,
                    konfirmasi_password: konfirmasi
                })
            });

            const json = await res.json();

            if (json.success) {
                setSuccessMsg('Password berhasil diubah. Gunakan password baru saat login berikutnya.');
                setPasswordLama('');
                setPasswordBaru('');
                setKonfirmasi('');
            } else {
                setErrorMsg(json.message || 'Gagal mengganti password.');
            }
        } catch (err) {
            console.error('Change password error:', err);
            setErrorMsg('Kesalahan server saat menghubungi API.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ganti-password-container">
            <div className="glass-panel main-panel-padding ganti-password-card">
                <h3 className="section-title">🔐 Ganti Password</h3>
                <p className="ganti-password-desc">
                    Pastikan password baru mudah diingat tapi sulit ditebak orang lain. Minimal 6 karakter.
                </p>

                <form onSubmit={handleSubmit} className="ganti-password-form">
                    {errorMsg && <div className="login-error-alert">⚠️ {errorMsg}</div>}
                    {successMsg && <div className="success-alert">✅ {successMsg}</div>}

                    <div className="form-group">
                        <label className="form-label">Password Lama</label>
                        <input
                            type={showPasswords ? 'text' : 'password'}
                            className="form-control"
                            placeholder="Masukkan password saat ini..."
                            value={passwordLama}
                            onChange={(e) => setPasswordLama(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password Baru</label>
                        <input
                            type={showPasswords ? 'text' : 'password'}
                            className="form-control"
                            placeholder="Masukkan password baru (min. 6 karakter)..."
                            value={passwordBaru}
                            onChange={(e) => setPasswordBaru(e.target.value)}
                            disabled={loading}
                            minLength={6}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Konfirmasi Password Baru</label>
                        <input
                            type={showPasswords ? 'text' : 'password'}
                            className="form-control"
                            placeholder="Ketik ulang password baru..."
                            value={konfirmasi}
                            onChange={(e) => setKonfirmasi(e.target.value)}
                            disabled={loading}
                            required
                        />
                        {konfirmasi && passwordBaru && konfirmasi !== passwordBaru && (
                            <span className="error-note">⚠️ Password tidak sama</span>
                        )}
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={showPasswords}
                                onChange={(e) => setShowPasswords(e.target.checked)}
                            />
                            <span>Tampilkan password</span>
                        </label>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn-primary submit-trx-btn"
                            disabled={loading || !passwordLama || !passwordBaru || !konfirmasi || passwordBaru !== konfirmasi}
                        >
                            {loading ? '🔄 Memproses...' : '💾 Simpan Password Baru'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GantiPassword;
