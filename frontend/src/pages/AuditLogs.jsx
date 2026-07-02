import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import '../styles/AuditLogs.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || '';

const AuditLogs = () => {
    const { token } = useAuth();
    
    // Filters & Pagination states
    const [actionFilter, setActionFilter] = useState('');
    const [tableFilter, setTableFilter] = useState('');
    const [limit, setLimit] = useState(25);
    const [offset, setOffset] = useState(0);
    
    // Data states
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    // Expand state for seeing JSON details
    const [expandedLogId, setExpandedLogId] = useState(null);

    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            let url = `${API_BASE}/api/audit?limit=${limit}&offset=${offset}`;
            if (actionFilter) url += `&action=${actionFilter}`;
            if (tableFilter) url += `&table_name=${tableFilter}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setLogs(json.data);
                setTotal(json.pagination.total);
            }
        } catch (err) {
            console.error('Error fetching audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs();
    }, [token, actionFilter, tableFilter, limit, offset]);

    // Reset page offset when filters change
    useEffect(() => {
        setOffset(0);
    }, [actionFilter, tableFilter, limit]);

    const toggleExpandLog = (id) => {
        setExpandedLogId(prev => prev === id ? null : id);
    };

    const handlePrevPage = () => {
        setOffset(prev => Math.max(prev - limit, 0));
    };

    const handleNextPage = () => {
        setOffset(prev => (prev + limit < total) ? prev + limit : prev);
    };

    // Helper rendering of state details
    const renderJSONDiff = (before, after) => {
        if (!before && !after) return <span>Tidak ada detail data.</span>;

        return (
            <div className="json-diff-container">
                {before && (
                    <div className="json-state-box before">
                        <h5>🔴 Sebelum Perubahan (Before State)</h5>
                        <pre>{JSON.stringify(before, null, 2)}</pre>
                    </div>
                )}
                {after && (
                    <div className="json-state-box after">
                        <h5>🟢 Sesudah Perubahan (After State)</h5>
                        <pre>{JSON.stringify(after, null, 2)}</pre>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="audit-logs-page-container">
            
            {/* 1. FILTER CONTROLS BOX */}
            <div className="search-filter-box glass-panel audit-filter-layout no-print">
                <div className="filter-grid">
                    <div className="form-group">
                        <label className="form-label">Filter Aksi (Action)</label>
                        <select
                            className="form-control"
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                        >
                            <option value="">Semua Aksi</option>
                            <option value="CREATE">CREATE (Tambah Baru)</option>
                            <option value="UPDATE">UPDATE (Perubahan Data)</option>
                            <option value="DELETE">DELETE (Penghapusan)</option>
                            <option value="UPDATE_BALANCE">UPDATE_BALANCE (Update Saldo)</option>
                            <option value="REVERSAL_BALANCE">REVERSAL_BALANCE (Reversal Saldo)</option>
                            <option value="LOGIN">LOGIN (Masuk Petugas)</option>
                            <option value="CHANGE_PASSWORD">CHANGE_PASSWORD (Ubah Sandi)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Filter Tabel Objek</label>
                        <select
                            className="form-control"
                            value={tableFilter}
                            onChange={(e) => setTableFilter(e.target.value)}
                        >
                            <option value="">Semua Tabel</option>
                            <option value="anggota">anggota (Data Penabung)</option>
                            <option value="transaksi">transaksi (Mutasi Dana)</option>
                            <option value="users">users (Akun Petugas)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Jumlah Tampilan</label>
                        <select
                            className="form-control"
                            value={limit}
                            onChange={(e) => setLimit(parseInt(e.target.value))}
                        >
                            <option value="10">10 Baris</option>
                            <option value="25">25 Baris</option>
                            <option value="50">50 Baris</option>
                            <option value="100">100 Baris</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. MAIN LOGS TABLE LIST */}
            <div className="glass-panel main-panel-padding">
                <h3 className="section-title">🛡️ Log Audit Keuangan & Sistem</h3>
                <p className="chart-subtitle">Seluruh tindakan penambahan, pengubahan, penghapusan, dan login dicatat otomatis secara permanen.</p>

                {loading ? (
                    <div className="table-loading-spinner">
                        <div className="spinner"></div>
                        <p>Mengambil log keamanan audit...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="no-data-alert">
                        Tidak ada log audit keamanan yang cocok dengan kriteria filter Anda.
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="custom-table audit-logs-table">
                                <thead>
                                    <tr>
                                        <th>Waktu Aktivitas</th>
                                        <th>Petugas</th>
                                        <th>Aksi</th>
                                        <th>Nama Tabel</th>
                                        <th>Record ID</th>
                                        <th>Alamat IP Warga</th>
                                        <th>Aksi Detail</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => {
                                        const isExpanded = expandedLogId === log.id;
                                        
                                        return (
                                            <React.Fragment key={log.id}>
                                                <tr>
                                                    <td>
                                                        {new Date(log.created_at).toLocaleString('id-ID', {
                                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                                                        })}
                                                    </td>
                                                    <td>
                                                        <strong>{log.nama_petugas || 'System Seeder'}</strong>
                                                        <span className="audit-sub-user">({log.username || 'system'})</span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${
                                                            log.action === 'CREATE' ? 'badge-emerald' : 
                                                            log.action === 'DELETE' ? 'badge-rose' : 
                                                            log.action === 'LOGIN' ? 'badge-indigo' : 'badge-amber'
                                                        }`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td><code>{log.table_name}</code></td>
                                                    <td className="record-id-cell" title={log.record_id}>
                                                        <code>{log.record_id.substring(0, 8)}...</code>
                                                    </td>
                                                    <td><code>{log.ip_address}</code></td>
                                                    <td>
                                                        <button 
                                                            className={`btn btn-sm ${isExpanded ? 'btn-secondary' : 'btn-primary'}`}
                                                            onClick={() => toggleExpandLog(log.id)}
                                                        >
                                                            {isExpanded ? '✕ Tutup' : '👁️ Lihat Data'}
                                                        </button>
                                                    </td>
                                                </tr>
                                                
                                                {/* Expanded Details row rendering before/after JSON */}
                                                {isExpanded && (
                                                    <tr className="expanded-details-row">
                                                        <td colSpan="7">
                                                            <div className="expanded-details-panel glass-panel">
                                                                <div className="expanded-agent-info">
                                                                    <strong>Browser User Agent:</strong> <code>{log.user_agent}</code>
                                                                </div>
                                                                {renderJSONDiff(log.before_state, log.after_state)}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination footer */}
                        <div className="table-pagination-footer no-print">
                            <div className="pagination-info">
                                Menampilkan <strong>{offset + 1}</strong> - <strong>{Math.min(offset + limit, total)}</strong> dari <strong>{total}</strong> log audit
                            </div>
                            <div className="pagination-buttons">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={handlePrevPage}
                                    disabled={offset === 0}
                                >
                                    ◀️ Sebelumnya
                                </button>
                                <button 
                                    className="btn btn-secondary"
                                    onClick={handleNextPage}
                                    disabled={offset + limit >= total}
                                >
                                    Berikutnya ▶️
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
