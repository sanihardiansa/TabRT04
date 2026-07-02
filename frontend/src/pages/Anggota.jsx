import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import '../styles/Anggota.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || '';

const Anggota = () => {
    const { token, user } = useAuth();
    const [anggota, setAnggota] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formNama, setFormNama] = useState('');
    const [formAlamat, setFormAlamat] = useState('');
    const [formNoHp, setFormNoHp] = useState('');
    const [formActive, setFormActive] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const fetchAnggota = async () => {
        setLoading(true);
        try {
            const url = search ? `${API_BASE}/api/anggota?search=${encodeURIComponent(search)}` : `${API_BASE}/api/anggota`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setAnggota(json.data);
            }
        } catch (err) {
            console.error('Error fetching members:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnggota();
    }, [token, search]);

    const openAddModal = () => {
        setEditMode(false);
        setSelectedId(null);
        setFormNama('');
        setFormAlamat('');
        setFormNoHp('');
        setFormActive(true);
        setErrorMsg('');
        setModalOpen(true);
    };

    const openEditModal = (a) => {
        setEditMode(true);
        setSelectedId(a.id);
        setFormNama(a.nama);
        setFormAlamat(a.alamat || '');
        setFormNoHp(a.no_hp || '');
        setFormActive(a.is_active);
        setErrorMsg('');
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!formNama.trim()) {
            setErrorMsg('Nama lengkap wajib diisi.');
            return;
        }

        try {
            const method = editMode ? 'PUT' : 'POST';
            const endpoint = editMode ? `${API_BASE}/api/anggota/${selectedId}` : `${API_BASE}/api/anggota`;
            
            const res = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nama: formNama,
                    alamat: formAlamat,
                    no_hp: formNoHp,
                    is_active: formActive
                })
            });
            
            const json = await res.json();
            
            if (json.success) {
                setSuccessMsg(editMode ? 'Data anggota berhasil diperbarui.' : 'Anggota baru berhasil ditambahkan.');
                setTimeout(() => {
                    setModalOpen(false);
                    fetchAnggota();
                    setSuccessMsg('');
                }, 1000);
            } else {
                setErrorMsg(json.message || 'Gagal menyimpan data.');
            }
        } catch (err) {
            console.error('Save error:', err);
            setErrorMsg('Kesalahan server saat menghubungi API.');
        }
    };

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus data anggota "${nama}"? Tindakan ini dicatat pada log audit.`)) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/anggota/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            
            if (json.success) {
                alert('Anggota berhasil dihapus.');
                fetchAnggota();
            } else {
                alert(json.message || 'Gagal menghapus anggota.');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Kesalahan server saat menghapus data.');
        }
    };

    const formatCurrency = (val) => {
        return 'Rp ' + parseFloat(val).toLocaleString('id-ID');
    };

    return (
        <div className="anggota-page-container">
            {/* Header pencarian & tambah */}
            <div className="search-filter-box glass-panel no-print">
                <input
                    type="text"
                    className="form-control search-input"
                    placeholder="🔍 Cari anggota berdasarkan No. Anggota, Nama, atau Alamat..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button className="btn btn-primary" onClick={openAddModal}>
                    ➕ Tambah Anggota Baru
                </button>
            </div>

            {/* List Table */}
            <div className="glass-panel main-panel-padding">
                <h3 className="section-title">👥 Daftar Anggota RT 04</h3>
                
                {loading ? (
                    <div className="table-loading-spinner">
                        <div className="spinner"></div>
                        <p>Memuat data warga penabung...</p>
                    </div>
                ) : anggota.length === 0 ? (
                    <div className="no-data-alert">
                        Tidak ditemukan data anggota yang cocok dengan kata kunci Anda.
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>No. Anggota</th>
                                    <th>Nama Lengkap</th>
                                    <th>Nomor Telepon</th>
                                    <th>Alamat Rumah</th>
                                    <th>Saldo Tabungan</th>
                                    <th>Status</th>
                                    <th className="no-print">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {anggota.map((a) => (
                                    <tr key={a.id} className={!a.is_active ? 'inactive-row' : ''}>
                                        <td><strong>{a.no_anggota}</strong></td>
                                        <td><strong>{a.nama}</strong></td>
                                        <td>{a.no_hp || '-'}</td>
                                        <td>{a.alamat || '-'}</td>
                                        <td className="saldo-column">{formatCurrency(a.saldo)}</td>
                                        <td>
                                            <span className={`badge ${a.is_active ? 'badge-emerald' : 'badge-rose'}`}>
                                                {a.is_active ? 'Aktif' : 'Non-Aktif'}
                                            </span>
                                        </td>
                                        <td className="action-buttons-cell no-print">
                                            <button 
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => openEditModal(a)}
                                            >
                                                ✏️ Edit
                                            </button>
                                            
                                            {/* Delete hanya untuk Admin */}
                                            {user && user.role === 'admin' && (
                                                <button 
                                                    className="btn btn-rose btn-sm"
                                                    onClick={() => handleDelete(a.id, a.nama)}
                                                >
                                                    🗑️ Hapus
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL TAMBAH/EDIT (Glassmorphic) */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel">
                        <h2>{editMode ? '✏️ Edit Data Anggota' : '➕ Tambah Anggota Baru'}</h2>
                        
                        <form onSubmit={handleSave} className="modal-form">
                            {errorMsg && <div className="login-error-alert">{errorMsg}</div>}
                            {successMsg && <div className="success-alert">✅ {successMsg}</div>}

                            <div className="form-group">
                                <label className="form-label">Nama Lengkap</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Masukkan nama lengkap penabung..."
                                    value={formNama}
                                    onChange={(e) => setFormNama(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Nomor Telepon / WhatsApp</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Contoh: 0812345678..."
                                    value={formNoHp}
                                    onChange={(e) => setFormNoHp(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Alamat Rumah di Lingkungan RT 04</label>
                                <textarea
                                    className="form-control text-area-alamat"
                                    placeholder="Masukkan alamat rumah warga..."
                                    value={formAlamat}
                                    onChange={(e) => setFormAlamat(e.target.value)}
                                    rows="3"
                                />
                            </div>

                            {editMode && (
                                <div className="form-group checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formActive}
                                            onChange={(e) => setFormActive(e.target.checked)}
                                        />
                                        <span>Status Tabungan Warga Aktif</span>
                                    </label>
                                </div>
                            )}

                            <div className="modal-action-buttons">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    💾 Simpan Data
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Anggota;
