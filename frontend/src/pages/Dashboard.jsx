import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || '';

const Dashboard = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState(null);
    const [recentTrx, setRecentTrx] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/laporan/dashboard`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.success) {
                    setMetrics(json.data.metrics);
                    setRecentTrx(json.data.recent_transactions);
                    setChartData(json.data.chart_data);
                }
            } catch (err) {
                console.error('Error fetching dashboard:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [token]);

    const formatCurrency = (val) => {
        return 'Rp ' + parseFloat(val).toLocaleString('id-ID', { minimumFractionDigits: 2 });
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Memuat Ringkasan Tabungan RT 04...</p>
            </div>
        );
    }

    // Hitung max value untuk skala grafik batang SVG
    const maxVal = Math.max(
        ...chartData.map(d => Math.max(parseFloat(d.total_setoran), parseFloat(d.total_penarikan))),
        1000000 // default minimum scale 1 juta
    );

    return (
        <div className="dashboard-container">
            {/* 1. METRICS GRID */}
            <div className="stats-grid">
                <div className="stat-card glass-panel">
                    <div className="stat-info">
                        <h3>Total Saldo Tabungan</h3>
                        <p>{metrics ? formatCurrency(metrics.total_saldo) : 'Rp 0'}</p>
                    </div>
                    <div className="stat-icon">💰</div>
                </div>

                <div className="stat-card glass-panel emerald">
                    <div className="stat-info">
                        <h3>Setoran Bulan Ini</h3>
                        <p>{metrics ? formatCurrency(metrics.setoran_bulan_ini) : 'Rp 0'}</p>
                    </div>
                    <div className="stat-icon">📥</div>
                </div>

                <div className="stat-card glass-panel rose">
                    <div className="stat-info">
                        <h3>Penarikan Bulan Ini</h3>
                        <p>{metrics ? formatCurrency(metrics.penarikan_bulan_ini) : 'Rp 0'}</p>
                    </div>
                    <div className="stat-icon">📤</div>
                </div>

                <div className="stat-card glass-panel amber">
                    <div className="stat-info">
                        <h3>Anggota Terdaftar</h3>
                        <p>{metrics ? `${metrics.anggota_aktif} / ${metrics.total_anggota}` : '0'}</p>
                    </div>
                    <div className="stat-icon">👥</div>
                </div>
            </div>

            {/* 2. CHARTS & RECENT ACTIVITY */}
            <div className="dashboard-main-grid">
                
                {/* Grafik Tren Bulanan Custom SVG (Sangat Premium) */}
                <div className="dashboard-chart-box glass-panel">
                    <h3>📈 Tren Setoran & Penarikan</h3>
                    <p className="chart-subtitle">Statistik perbandingan mutasi dana tabungan beberapa bulan terakhir</p>
                    
                    {chartData.length === 0 ? (
                        <div className="no-chart-data">Belum ada riwayat transaksi mutasi.</div>
                    ) : (
                        <div className="svg-chart-wrapper">
                            <div className="chart-legend">
                                <span className="legend-item"><span className="legend-dot green"></span> Setoran</span>
                                <span className="legend-item"><span className="legend-dot red"></span> Penarikan</span>
                            </div>
                            
                            <div className="chart-svg-container">
                                <svg className="custom-chart-svg" viewBox="0 0 600 240">
                                    {/* Grid Lines */}
                                    <line x1="40" y1="20" x2="580" y2="20" stroke="rgba(255,255,255,0.05)" />
                                    <line x1="40" y1="70" x2="580" y2="70" stroke="rgba(255,255,255,0.05)" />
                                    <line x1="40" y1="120" x2="580" y2="120" stroke="rgba(255,255,255,0.05)" />
                                    <line x1="40" y1="170" x2="580" y2="170" stroke="rgba(255,255,255,0.05)" />
                                    <line x1="40" y1="200" x2="580" y2="200" stroke="rgba(255,255,255,0.15)" />
                                    
                                    {/* Render Bars */}
                                    {chartData.map((d, index) => {
                                        const colWidth = 540 / chartData.length;
                                        const colX = 40 + index * colWidth + colWidth / 4;
                                        
                                        // Hitung tinggi batang
                                        const setoranHeight = (parseFloat(d.total_setoran) / maxVal) * 160;
                                        const penarikanHeight = (parseFloat(d.total_penarikan) / maxVal) * 160;

                                        // Pastikan min height 3px untuk data yang > 0 agar terlihat
                                        const hSetoran = setoranHeight > 0 ? Math.max(setoranHeight, 4) : 0;
                                        const hPenarikan = penarikanHeight > 0 ? Math.max(penarikanHeight, 4) : 0;
                                        
                                        return (
                                            <g key={d.bulan}>
                                                {/* Batang Setoran (Hijau) */}
                                                {hSetoran > 0 && (
                                                    <rect
                                                        x={colX}
                                                        y={200 - hSetoran}
                                                        width={14}
                                                        height={hSetoran}
                                                        rx="3"
                                                        fill="var(--accent-emerald)"
                                                        className="chart-bar-hover"
                                                    >
                                                        <title>{`Setoran: ${formatCurrency(d.total_setoran)}`}</title>
                                                    </rect>
                                                )}
                                                
                                                {/* Batang Penarikan (Merah) */}
                                                {hPenarikan > 0 && (
                                                    <rect
                                                        x={colX + 18}
                                                        y={200 - hPenarikan}
                                                        width={14}
                                                        height={hPenarikan}
                                                        rx="3"
                                                        fill="var(--accent-rose)"
                                                        className="chart-bar-hover"
                                                    >
                                                        <title>{`Penarikan: ${formatCurrency(d.total_penarikan)}`}</title>
                                                    </rect>
                                                )}
                                                
                                                {/* Label Bulan */}
                                                <text
                                                    x={colX + 16}
                                                    y="220"
                                                    textAnchor="middle"
                                                    fill="var(--text-secondary)"
                                                    fontSize="10"
                                                    fontWeight="600"
                                                >
                                                    {d.bulan}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                {/* 5 Transaksi Terbaru */}
                <div className="dashboard-activity-box glass-panel">
                    <div className="activity-header">
                        <h3>📝 Transaksi Terbaru</h3>
                        <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate('/laporan')}
                        >
                            Lihat Semua
                        </button>
                    </div>

                    {recentTrx.length === 0 ? (
                        <div className="no-activity">Belum ada riwayat transaksi terdaftar.</div>
                    ) : (
                        <div className="activity-list">
                            {recentTrx.map((trx) => (
                                <div key={trx.id} className="activity-item">
                                    <div className="activity-icon-box">
                                        <span className={`activity-badge ${trx.jenis}`}>
                                            {trx.jenis === 'setoran' ? '📥' : '📤'}
                                        </span>
                                    </div>
                                    <div className="activity-details">
                                        <div className="activity-title-line">
                                            <strong>{trx.nama_anggota}</strong>
                                            <span className="activity-time">
                                                {new Date(trx.tanggal).toLocaleDateString('id-ID', {
                                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <p className="activity-sub">{trx.no_anggota} • {trx.keterangan}</p>
                                        <p className="activity-officer">Petugas: {trx.nama_petugas}</p>
                                    </div>
                                    <div className={`activity-amount ${trx.jenis}`}>
                                        {trx.jenis === 'setoran' ? '+' : '-'} {parseFloat(trx.jumlah).toLocaleString('id-ID')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Quick Actions Panel */}
            <div className="quick-actions-box glass-panel no-print">
                <h3>⚡ Aksi Cepat Petugas</h3>
                <div className="quick-actions-grid">
                    <button className="btn btn-emerald" onClick={() => navigate('/transaksi/setoran')}>
                        📥 Input Setoran Baru
                    </button>
                    <button className="btn btn-rose" onClick={() => navigate('/transaksi/penarikan')}>
                        📤 Input Penarikan Baru
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/anggota')}>
                        👥 Tambah Anggota Baru
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
