import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import '../styles/Transaksi.css';

const Transaksi = ({ initialTab = 'setoran' }) => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState(initialTab); // 'setoran' | 'penarikan'
    const [members, setMembers] = useState([]);
    
    // Autocomplete Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    // Form inputs
    const [jumlahInput, setJumlahInput] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Printable Receipt Popup
    const [receiptData, setReceiptData] = useState(null);

    // Fetch all active members for autocompletion
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await fetch('/api/anggota', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.success) {
                    // Hanya angggota yang AKTIF yang boleh melakukan transaksi
                    setMembers(json.data.filter(m => m.is_active));
                }
            } catch (err) {
                console.error('Error fetching autocomplete members:', err);
            }
        };
        fetchMembers();
    }, [token]);

    // Handle search auto-completion filtering
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredMembers([]);
            return;
        }

        const filtered = members.filter(m => 
            m.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
            m.no_anggota.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredMembers(filtered);
    }, [searchQuery, members]);

    const selectMember = (m) => {
        setSelectedMember(m);
        setSearchQuery(`${m.no_anggota} - ${m.nama}`);
        setShowDropdown(false);
        setErrorMsg('');
    };

    const handleReset = () => {
        setSelectedMember(null);
        setSearchQuery('');
        setJumlahInput('');
        setKeterangan('');
        setErrorMsg('');
        setSuccessMsg('');
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!selectedMember) {
            setErrorMsg('Silakan pilih anggota penabung terlebih dahulu.');
            return;
        }

        const amount = parseFloat(jumlahInput);
        if (!amount || amount <= 0) {
            setErrorMsg('Jumlah transaksi harus lebih besar dari Rp 0.');
            return;
        }

        // Validasi kecukupan saldo untuk penarikan
        if (activeTab === 'penarikan') {
            const currentBalance = parseFloat(selectedMember.saldo);
            if (currentBalance < amount) {
                setErrorMsg(`Batas penarikan terlampaui. Saldo saat ini hanya: Rp ${currentBalance.toLocaleString('id-ID')}`);
                return;
            }
        }

        setLoading(true);

        try {
            const endpoint = activeTab === 'setoran' ? '/api/transaksi/setoran' : '/api/transaksi/penarikan';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    anggota_id: selectedMember.id,
                    jumlah: amount,
                    keterangan: keterangan.trim() || `${activeTab === 'setoran' ? 'Setoran' : 'Penarikan'} Tabungan`
                })
            });

            const json = await res.json();

            if (json.success) {
                setSuccessMsg(`Transaksi ${activeTab} berhasil diposting.`);
                
                // Siapkan data struk/receipt untuk dicetak
                setReceiptData({
                    no_struk: json.data.transaksi.id.substring(0, 8).toUpperCase(),
                    no_anggota: selectedMember.no_anggota,
                    nama_anggota: selectedMember.nama,
                    jenis: activeTab,
                    jumlah: amount,
                    saldo_baru: json.data.anggota.saldo_baru,
                    keterangan: json.data.transaksi.keterangan,
                    tanggal: json.data.transaksi.tanggal,
                });

                // Reset form
                handleReset();
            } else {
                setErrorMsg(json.message || 'Transaksi gagal diproses.');
            }
        } catch (err) {
            console.error('Trx error:', err);
            setErrorMsg('Kesalahan server saat memposting transaksi.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        return 'Rp ' + parseFloat(val).toLocaleString('id-ID', { minimumFractionDigits: 2 });
    };

    // Kalkulasi saldo masa depan real-time
    const getProspectiveBalance = () => {
        if (!selectedMember || !jumlahInput) return null;
        const current = parseFloat(selectedMember.saldo);
        const input = parseFloat(jumlahInput) || 0;
        return activeTab === 'setoran' ? current + input : current - input;
    };

    const isWithdrawalBlocked = () => {
        if (activeTab !== 'penarikan' || !selectedMember || !jumlahInput) return false;
        return parseFloat(selectedMember.saldo) < (parseFloat(jumlahInput) || 0);
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    return (
        <div className="transaksi-page-container">
            {/* 1. TAB MENU SELECTOR */}
            <div className="transaksi-tab-box glass-panel no-print">
                <button
                    className={`tab-btn ${activeTab === 'setoran' ? 'active emerald' : ''}`}
                    onClick={() => { setActiveTab('setoran'); handleReset(); }}
                >
                    📥 Input Setoran Baru
                </button>
                <button
                    className={`tab-btn ${activeTab === 'penarikan' ? 'active rose' : ''}`}
                    onClick={() => { setActiveTab('penarikan'); handleReset(); }}
                >
                    📤 Input Penarikan Baru
                </button>
            </div>

            {/* 2. TRANSACTION FORM PANEL */}
            <div className="glass-panel main-panel-padding no-print">
                <h3 className="section-title">
                    {activeTab === 'setoran' ? '📥 Formulir Setoran Tabungan' : '📤 Formulir Penarikan Tabungan'}
                </h3>
                
                <form onSubmit={handleFormSubmit} className="transaksi-form">
                    {errorMsg && <div className="login-error-alert">{errorMsg}</div>}
                    {successMsg && <div className="success-alert">✅ {successMsg}</div>}

                    {/* Member Auto-complete Search input */}
                    <div className="form-group member-search-group">
                        <label className="form-label">Cari Anggota Penabung (No. Anggota / Nama)</label>
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Ketik nomor anggota atau nama warga..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowDropdown(true);
                                    if (selectedMember) setSelectedMember(null);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                required
                            />
                            {selectedMember && (
                                <button type="button" className="clear-member-btn" onClick={handleReset}>
                                    ✕ Ganti
                                </button>
                            )}
                        </div>

                        {/* Search Dropdown list */}
                        {showDropdown && filteredMembers.length > 0 && (
                            <ul className="autocomplete-dropdown glass-panel">
                                {filteredMembers.map(m => (
                                    <li key={m.id} onClick={() => selectMember(m)}>
                                        <strong>{m.no_anggota}</strong> - {m.nama} <span className="drop-saldo">(Saldo: {formatCurrency(m.saldo)})</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {showDropdown && searchQuery.trim() && filteredMembers.length === 0 && !selectedMember && (
                            <div className="autocomplete-no-res glass-panel">
                                Anggota aktif tidak ditemukan.
                            </div>
                        )}
                    </div>

                    {/* Selected Member Detail Profile Card */}
                    {selectedMember && (
                        <div className="member-detail-card glass-panel fade-in">
                            <div className="member-detail-row">
                                <span className="detail-label">No. Anggota:</span>
                                <strong>{selectedMember.no_anggota}</strong>
                            </div>
                            <div className="member-detail-row">
                                <span className="detail-label">Nama Lengkap:</span>
                                <strong>{selectedMember.nama}</strong>
                            </div>
                            <div className="member-detail-row">
                                <span className="detail-label">Alamat Rumah:</span>
                                <span>{selectedMember.alamat || '-'}</span>
                            </div>
                            <div className="member-detail-row balance-row">
                                <span className="detail-label">Saldo Saat Ini:</span>
                                <strong className="current-balance">{formatCurrency(selectedMember.saldo)}</strong>
                            </div>
                        </div>
                    )}

                    {/* Jumlah Setoran/Penarikan */}
                    <div className="form-group">
                        <label className="form-label">Nominal Uang (Rp)</label>
                        <input
                            type="number"
                            className={`form-control amount-field ${isWithdrawalBlocked() ? 'input-error-border' : ''}`}
                            placeholder="Contoh: 100000"
                            value={jumlahInput}
                            onChange={(e) => setJumlahInput(e.target.value)}
                            required
                            disabled={!selectedMember}
                            min="1"
                        />
                        {isWithdrawalBlocked() && (
                            <span className="error-note">⚠️ Nominal penarikan melebihi saldo tabungan warga!</span>
                        )}
                    </div>

                    {/* Keterangan */}
                    <div className="form-group">
                        <label className="form-label">Keterangan / Catatan Tambahan (Opsional)</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Masukkan catatan jika diperlukan..."
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            disabled={!selectedMember}
                        />
                    </div>

                    {/* Real-time Math Balance Preview */}
                    {selectedMember && jumlahInput && (
                        <div className="balance-preview-box glass-panel fade-in">
                            <div className="preview-row">
                                <span>Saldo Saat Ini:</span>
                                <span>{formatCurrency(selectedMember.saldo)}</span>
                            </div>
                            <div className="preview-row">
                                <span>{activeTab === 'setoran' ? 'Setoran Tambahan (+):' : 'Penarikan Uang (-):'}</span>
                                <span className={activeTab === 'setoran' ? 'text-emerald' : 'text-rose'}>
                                    {formatCurrency(jumlahInput)}
                                </span>
                            </div>
                            <div className="preview-row total-row">
                                <span>Estimasi Saldo Baru:</span>
                                <strong className={isWithdrawalBlocked() ? 'text-rose' : 'text-emerald'}>
                                    {formatCurrency(getProspectiveBalance())}
                                </strong>
                            </div>
                        </div>
                    )}

                    <div className="form-actions">
                        <button
                            type="submit"
                            className={`btn ${activeTab === 'setoran' ? 'btn-emerald' : 'btn-rose'} submit-trx-btn`}
                            disabled={loading || !selectedMember || !jumlahInput || isWithdrawalBlocked()}
                        >
                            {loading ? '🔄 Sedang Diproses...' : `💾 Konfirmasi & Posting ${activeTab === 'setoran' ? 'Setoran' : 'Penarikan'}`}
                        </button>
                    </div>
                </form>
            </div>

            {/* 3. RECEIPT OVERLAY CARD (VISIBLE IN SCREEN AND PRINTED LAYOUT) */}
            {receiptData && (
                <div className="modal-overlay receipt-modal-overlay no-print">
                    <div className="modal-content receipt-card glass-panel print-receipt-view">
                        <div className="receipt-brand-header">
                            <h2>TABUNGAN WARGA RT 04 RW 02</h2>
                            <p>Bukti Struk Transaksi Keuangan Resmi</p>
                            <span className="divider-line"></span>
                        </div>

                        <div className="receipt-details-list">
                            <div className="receipt-row">
                                <span className="rec-lbl">No. Transaksi / Struk:</span>
                                <strong>#{receiptData.no_struk}</strong>
                            </div>
                            <div className="receipt-row">
                                <span className="rec-lbl">Tanggal & Waktu:</span>
                                <span>{new Date(receiptData.tanggal).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="receipt-row">
                                <span className="rec-lbl">No. Anggota Warga:</span>
                                <strong>{receiptData.no_anggota}</strong>
                            </div>
                            <div className="receipt-row">
                                <span className="rec-lbl">Nama Lengkap:</span>
                                <strong>{receiptData.nama_anggota}</strong>
                            </div>
                            <div className="receipt-row">
                                <span className="rec-lbl">Jenis Transaksi:</span>
                                <span className={`badge ${receiptData.jenis === 'setoran' ? 'badge-emerald' : 'badge-rose'}`}>
                                    {receiptData.jenis.toUpperCase()}
                                </span>
                            </div>
                            <div className="receipt-row">
                                <span className="rec-lbl">Keterangan:</span>
                                <span>{receiptData.keterangan}</span>
                            </div>
                            <span className="divider-line"></span>
                            
                            <div className="receipt-row highlight-amount-row">
                                <span className="rec-lbl">NOMINAL TRANSAKSI:</span>
                                <strong className={receiptData.jenis === 'setoran' ? 'text-emerald' : 'text-rose'}>
                                    {formatCurrency(receiptData.jumlah)}
                                </strong>
                            </div>
                            
                            <div className="receipt-row highlight-balance-row">
                                <span className="rec-lbl">SALDO TABUNGAN AKHIR:</span>
                                <strong>{formatCurrency(receiptData.saldo_baru)}</strong>
                            </div>
                        </div>

                        <div className="receipt-footer-notes">
                            <p>Terima kasih atas partisipasi Anda.</p>
                            <p>Simpan bukti struk ini secara digital / cetak.</p>
                        </div>

                        <div className="receipt-action-buttons no-print">
                            <button className="btn btn-secondary" onClick={() => setReceiptData(null)}>
                                Tutup Struk
                            </button>
                            <button className="btn btn-primary" onClick={handlePrintReceipt}>
                                🖨️ Cetak Struk (PDF / Printer)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRINT-ONLY FORMAL LAYOUT FOR BUKTI TRANSAKSI (Sangat presisi ketika window.print() berjalan) */}
            {receiptData && (
                <div className="print-header print-receipt-layout">
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>STRUK BUKTI TRANSAKSI RESMI</h2>
                        <h3 style={{ fontSize: '16px' }}>TABUNGAN WARGA RT 04 RW 02</h3>
                        <p style={{ fontSize: '10px' }}>Kecamatan Kebon Jeruk, Jakarta Barat</p>
                        <hr style={{ borderTop: '2px solid #000', marginTop: '10px' }} />
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '12pt' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '8px 0', width: '200px' }}>No. Referensi Struk</td>
                                <td style={{ padding: '8px 0' }}>: <strong>#{receiptData.no_struk}</strong></td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 0' }}>Tanggal Cetak</td>
                                <td style={{ padding: '8px 0' }}>: {new Date(receiptData.tanggal).toLocaleString('id-ID')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 0' }}>No. Anggota / Nama</td>
                                <td style={{ padding: '8px 0' }}>: <strong>{receiptData.no_anggota} - {receiptData.nama_anggota}</strong></td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 0' }}>Jenis Transaksi</td>
                                <td style={{ padding: '8px 0' }}>: <strong>{receiptData.jenis === 'setoran' ? 'SETORAN TABUNGAN' : 'PENARIKAN TABUNGAN'}</strong></td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 0' }}>Keterangan Catatan</td>
                                <td style={{ padding: '8px 0' }}>: {receiptData.keterangan}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '15px 0', fontSize: '14pt', borderTop: '1px dashed #000' }}><strong>NOMINAL TRANSAKSI</strong></td>
                                <td style={{ padding: '15px 0', fontSize: '14pt', borderTop: '1px dashed #000' }}>: <strong>{formatCurrency(receiptData.jumlah)}</strong></td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 0', fontSize: '14pt', borderBottom: '1px dashed #000' }}><strong>SALDO AKHIR TABUNGAN</strong></td>
                                <td style={{ padding: '10px 0', fontSize: '14pt', borderBottom: '1px dashed #000' }}>: <strong>{formatCurrency(receiptData.saldo_baru)}</strong></td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="print-signature">
                        <div className="print-signature-box">
                            <p>Petugas Operator RT 04,</p>
                            <br /><br /><br />
                            <p style={{ borderBottom: '1px solid #000', display: 'inline-block', width: '150px' }}></p>
                            <p style={{ fontSize: '10px' }}>Tanda Tangan & Nama Terang</p>
                        </div>
                        <div className="print-signature-box">
                            <p>Warga Penabung,</p>
                            <br /><br /><br />
                            <p style={{ borderBottom: '1px solid #000', display: 'inline-block', width: '150px' }}>{receiptData.nama_anggota}</p>
                            <p style={{ fontSize: '10px' }}>Tanda Tangan & Nama Terang</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transaksi;
