import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

function formatIDR(value) {
    const n = Number(value || 0);
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(isNaN(n) ? 0 : n);
}

const API_URL = "http://localhost:8080/api/orders";

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchAllOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/all`);
            if (!res.ok) throw new Error("Gagal mengambil data pesanan");
            const data = await res.json();
            setOrders(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllOrders();
    }, [fetchAllOrders]);
    
    if (loading) {
        return <div className="p-10 text-center">Memuat Pesanan...</div>;
    }

    return (
        <div className="min-h-screen bg-[#183D4B] p-6 md:p-10 text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manajemen Pesanan</h1>
                 <button onClick={() => navigate('/Dashboard')} className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-semibold transition hover:bg-white/20">
                    <FaArrowLeft /> Kembali
                </button>
            </div>
            <div className="rounded-2xl bg-white shadow-xl text-black">
                <div className="w-full overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-slate-100">
                            <tr className="text-sm uppercase text-slate-600">
                                <th className="px-4 py-3">Order ID</th>
                                <th className="px-4 py-3">Tanggal Dibuat</th>
                                <th className="px-4 py-3">Total</th>
                                <th className="px-4 py-3 text-center">Status Pembayaran</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.map(order => (
                                <tr key={order.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono text-xs">{order.orderId}</td>
                                    <td className="px-4 py-3 text-sm">{new Date(order.createdAt).toLocaleString()}</td>
                                    <td className="px-4 py-3 font-semibold">{formatIDR(order.amount)}</td>
                                    <td className="px-4 py-3 text-center">
                                         <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                            order.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                                            order.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}