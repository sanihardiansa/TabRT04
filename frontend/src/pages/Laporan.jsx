import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import '../styles/Laporan.css';

const Laporan = () => {
    const { token } = useAuth();
    
    // Filters state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [jenis, setJenis] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [members, setMembers] = useState([]);

    // Data states
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({ total_setoran: 0, total_penarikan: 0, net_savings: 0 });
    const [loading, setLoading] = useState(false);

    // Fetch members list for filter dropdown
    useEffect(() => {
        const fetchMembersList = async () => {
            try {
                const res = await fetch('/api/anggota', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.success) {
                    setMembers(json.data);
                }
            } catch (err) {
                console.error('Error loading report members list:', err);
            }
        };
        fetchMembersList();
    }, [token]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            let url = '/api/laporan/transaksi?';
            const params = [];
            
            if (startDate) params.push(`start_date=${startDate}`);
            if (endDate) params.push(`end_date=${endDate}`);
            if (jenis) params.push(`jenis=${jenis}`);
            if (selectedMemberId) params.push(`anggota_id=${selectedMemberId}`);
            
            url += params.join('&');

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();

            if (json.success) {
                setData(json.data);
                setSummary(json.summary);
            }
        } catch (err) {
            console.error('Error generating report data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Load reports automatically on mount and filter changes
    useEffect(() => {
        fetchReportData();
    }, [token, startDate, endDate, jenis, selectedMemberId]);

    const handleResetFilters = () => {
        setStartDate('');
        setEndDate('');
        setJenis('');
        setSelectedMemberId('');
    };

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (val) => {
        return 'Rp ' + parseFloat(val).toLocaleString('id-ID', { minimumFractionDigits: 2 });
    };

    const getSelectedMemberName = () => {
        if (!selectedMemberId) return 'Semua Anggota';
        const found = members.find(m => m.id === selectedMemberId);
        return found ? `${found.no_anggota} - ${found.nama}` : 'Semua Anggota';
    };

    return (
        <div className="laporan-page-container">
            
            {/* 1. FILTER CONTROLS BOX */}
            <div className="search-filter-box glass-panel report-filter-layout no-print">
                <div className="filter-grid">
                    <div className="form-group">
                        <label className="form-label">Tanggal Mulai</label>
                        <input
                            type="date"
                            className="form-control"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tanggal Akhir</label>
                        <input
                            type="date"
                            className="form-control"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Jenis Mutasi</label>
                        <select 
                            className="form-control"
                            value={jenis}
                            onChange={(e) => setJenis(e.target.value)}
                        >
                            <option value="">Semua Transaksi</option>
                            <option value="setoran">Setoran Tabungan</option>
                            <option value="penarikan">Penarikan Tabungan</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nama Anggota Warga</label>
                        <select
                            className="form-control"
                            value={selectedMemberId}
                            onChange={(e) => setSelectedMemberId(e.target.value)}
                        >
                            <option value="">Semua Anggota</option>
                            {members.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.no_anggota} - {m.nama}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="filter-action-buttons">
                    <button className="btn btn-secondary" onClick={handleResetFilters}>
                        🔄 Reset Filter
                    </button>
                    <button className="btn btn-primary" onClick={handlePrint} disabled={data.length === 0}>
                        🖨️ Cetak Laporan PDF / Printer
                    </button>
                </div>
            </div>

            {/* 2. REPORT METRIC CARDS SUMMARY */}
            <div className="stats-grid report-summary-grid">
                <div className="stat-card glass-panel emerald">
                    <div className="stat-info">
                        <h3>Akumulasi Setoran</h3>
                        <p>{formatCurrency(summary.total_setoran)}</p>
                    </div>
                    <div className="stat-icon">📥</div>
                </div>
                <div className="stat-card glass-panel rose">
                    <div className="stat-info">
                        <h3>Akumulasi Penarikan</h3>
                        <p>{formatCurrency(summary.total_penarikan)}</p>
                    </div>
                    <div className="stat-icon">📤</div>
                </div>
                <div className="stat-card glass-panel">
                    <div className="stat-info">
                        <h3>Selisih Bersih (Net)</h3>
                        <p>{formatCurrency(summary.net_savings)}</p>
                    </div>
                    <div className="stat-icon">⚖️</div>
                </div>
            </div>

            {/* 3. REPORT DATA TABLE */}
            <div className="glass-panel main-panel-padding">
                <h3 className="section-title no-print">📋 Rincian Mutasi Rekening</h3>
                
                {/* Print Only Header Kop Surat */}
                <div className="print-header">
                    <h2 style={{ fontSize: '22px', fontWeight: 'bold' }}>LAPORAN MUTASI TABUNGAN WARGA RT 04</h2>
                    <h3 style={{ fontSize: '14px', fontWeight: 'normal' }}>Lingkungan RT 04 RW 02 Kebon Jeruk, Jakarta Barat</h3>
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                        Periode: {startDate ? startDate : 'Awal'} s.d {endDate ? endDate : 'Sekarang'} | Filter Anggota: {getSelectedMemberName()}
                    </p>
                    <hr style={{ borderTop: '2px solid #000', marginTop: '10px' }} />
                </div>

                {loading ? (
                    <div className="table-loading-spinner">
                        <div className="spinner"></div>
                        <p>Mengumpulkan data laporan keuangan...</p>
                    </div>
                ) : data.length === 0 ? (
                    <div className="no-data-alert">
                        Tidak ada catatan transaksi yang memenuhi kriteria filter Anda.
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Tanggal Transaksi</th>
                                        <th>No. Anggota</th>
                                        <th>Nama Anggota</th>
                                        <th>Jenis</th>
                                        <th>Jumlah (Nominal)</th>
                                        <th>Keterangan Catatan</th>
                                        <th>Petugas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((trx) => (
                                        <tr key={trx.id}>
                                            <td>
                                                {new Date(trx.tanggal).toLocaleDateString('id-ID', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td><strong>{trx.no_anggota}</strong></td>
                                            <td><strong>{trx.nama_anggota}</strong></td>
                                            <td>
                                                <span className={`badge ${trx.jenis === 'setoran' ? 'badge-emerald' : 'badge-rose'}`}>
                                                    {trx.jenis}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: '700' }} className={trx.jenis === 'setoran' ? 'text-emerald' : 'text-rose'}>
                                                {parseFloat(trx.jumlah).toLocaleString('id-ID')}
                                            </td>
                                            <td>{trx.keterangan}</td>
                                            <td>{trx.nama_petugas}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Print Only Summary Table */}
                        <div className="print-header" style={{ borderBottom: 'none', marginTop: '30px' }}>
                            <table style={{ width: '300px', marginLeft: 'auto', borderCollapse: 'collapse', fontSize: '11pt' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '6px 0' }}>Total Setoran (+)</td>
                                        <td style={{ padding: '6px 0', textAlign: 'right' }}><strong>{formatCurrency(summary.total_setoran)}</strong></td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '6px 0' }}>Total Penarikan (-)</td>
                                        <td style={{ padding: '6px 0', textAlign: 'right' }}><strong>{formatCurrency(summary.total_penarikan)}</strong></td>
                                    </tr>
                                    <tr style={{ borderTop: '1px solid #000' }}>
                                        <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Net Selisih Kas</td>
                                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}><strong>{formatCurrency(summary.net_savings)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Print Only Signature Section */}
                        <div className="print-signature">
                            <div className="print-signature-box">
                                <p>Mengetahui,</p>
                                <p>Ketua RT 04 Kebon Jeruk,</p>
                                <br /><br /><br />
                                <p style={{ borderBottom: '1px solid #000', display: 'inline-block', width: '180px' }}></p>
                                <p style={{ fontSize: '10px' }}>Tanda Tangan & Stempel Resmi</p>
                            </div>
                            <div className="print-signature-box">
                                <p>Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                <p>Bendahara Tabungan RT 04,</p>
                                <br /><br /><br />
                                <p style={{ borderBottom: '1px solid #000', display: 'inline-block', width: '180px' }}></p>
                                <p style={{ fontSize: '10px' }}>Tanda Tangan & Nama Terang</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Laporan;
