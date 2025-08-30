import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

// Helper function untuk format mata uang Rupiah
function formatIDR(value) {
    const n = Number(value || 0);
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(isNaN(n) ? 0 : n);
}

const API_URL = "http://localhost:8080/api/orders";

export default function AdminOrderDetailPage() {
    const { orderId } = useParams(); // Mengambil ID transaksi dari URL
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    // State untuk form update
    const [status, setStatus] = useState('');
    const [nomorResi, setNomorResi] = useState('');

    const fetchOrderDetail = useCallback(async () => {
        setLoading(true);
        try {
            // Mengambil detail SATU pesanan spesifik berdasarkan ID-nya
            const res = await fetch(`${API_URL}/${orderId}`); 
            if (!res.ok) {
                throw new Error("Pesanan tidak ditemukan");
            }
            const data = await res.json();
            setOrder(data);
            // Mengisi form dengan data yang ada saat ini
            setStatus(data.status);
            setNomorResi(data.nomorResi || '');
        } catch (err) {
            console.error(err);
            alert(err.message);
            navigate('/admin/pesanan'); // Kembali ke daftar jika pesanan tidak ditemukan
        } finally {
            setLoading(false);
        }
    }, [orderId, navigate]);

    useEffect(() => {
        fetchOrderDetail();
    }, [fetchOrderDetail]);
    
    const handleUpdateOrder = async () => {
        try {
            const payload = {
                status: status,
                nomorResi: nomorResi
            };
            const res = await fetch(`${API_URL}/admin/update/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error("Gagal memperbarui pesanan");
            }

            alert("Pesanan berhasil diperbarui!");
            fetchOrderDetail(); // Refresh data untuk melihat perubahan
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#183D4B] text-white flex justify-center items-center">Memuat Detail Pesanan...</div>;
    }
    
    if (!order) {
        return <div className="min-h-screen bg-[#183D4B] text-white flex justify-center items-center">Pesanan tidak ditemukan.</div>;
    }

    return (
        <div className="min-h-screen bg-[#183D4B] p-6 md:p-10 text-white">
            <div className="mx-auto max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Detail Pesanan</h1>
                    <button onClick={() => navigate('/admin/pesanan')} className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-semibold transition hover:bg-white/20">
                        <FaArrowLeft /> Kembali ke Daftar Pesanan
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Kolom Detail Pesanan */}
                    <div className="md:col-span-2 bg-white/10 p-8 rounded-2xl shadow-lg space-y-4">
                        <div>
                            <p className="text-sm text-slate-400">Order ID</p>
                            <p className="font-mono">{order.orderId}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Tanggal Pesanan</p>
                            <p>{new Date(order.createdAt).toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Deskripsi</p>
                            <p>{order.description}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Total Pembayaran</p>
                            <p className="text-2xl font-bold">{formatIDR(order.amount)}</p>
                        </div>
                         <div>
                            <p className="text-sm text-slate-400">Status Saat Ini</p>
                            <p className="font-bold text-lg">{order.status}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Nomor Resi Saat Ini</p>
                            <p className="font-mono">{order.nomorResi || "-"}</p>
                        </div>
                    </div>

                    {/* Kolom Form Update */}
                    <div className="bg-white/10 p-8 rounded-2xl shadow-lg space-y-4">
                        <h2 className="text-xl font-bold">Update Pesanan</h2>
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Ubah Status</label>
                            <select 
                                value={status} 
                                onChange={(e) => setStatus(e.target.value)} 
                                className="w-full mt-1 bg-white/20 p-2 rounded-lg border border-white/30 text-white"
                            >
                                <option value="PENDING" className="text-black">PENDING</option>
                                <option value="SUCCESS" className="text-black">SUCCESS (LUNAS)</option>
                                <option value="SHIPPED" className="text-black">SHIPPED (DIKIRIM)</option>
                                <option value="DELIVERED" className="text-black">DELIVERED (SELESAI)</option>
                                <option value="FAILED" className="text-black">FAILED (GAGAL)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Masukkan Nomor Resi</label>
                            <input 
                                type="text" 
                                value={nomorResi} 
                                onChange={(e) => setNomorResi(e.target.value)} 
                                className="w-full mt-1 bg-white/20 p-2 rounded-lg border border-white/30 text-white" 
                                placeholder="Contoh: JNE123456789"
                            />
                        </div>
                        <button 
                            onClick={handleUpdateOrder} 
                            className="w-full bg-white text-[#183D4B] font-bold py-2 rounded-lg transition hover:bg-slate-200"
                        >
                            Simpan Perubahan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}