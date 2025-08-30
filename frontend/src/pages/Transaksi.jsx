import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

function formatIDR(value) {
    const n = Number(value || 0);
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(isNaN(n) ? 0 : n);
}

const API_URL = "http://localhost:8080/api/orders";

export default function TransaksiPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const loggedInUserId = localStorage.getItem('loggedInUserId');

    const fetchUserOrders = useCallback(async () => {
        if (!loggedInUserId) {
            alert("Silakan login untuk melihat riwayat pesanan.");
            navigate('/');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/user/${loggedInUserId}`);
            if (!res.ok) throw new Error("Gagal mengambil data pesanan");
            const data = await res.json();
            setOrders(data);
        } catch (error) {
            console.error("Gagal mengambil data order:", error);
        } finally {
            setLoading(false);
        }
    }, [loggedInUserId, navigate]);

    useEffect(() => {
        fetchUserOrders();
    }, [fetchUserOrders]);

    if (loading) {
        return <div className="min-h-screen bg-[#183D4B] text-white flex justify-center items-center">Memuat Riwayat Pesanan...</div>;
    }

    return (
        <div className="min-h-screen bg-[#183D4B] p-6 md:p-10 text-white">
            <div className="mx-auto max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Riwayat Pesanan Saya</h1>
                    <button onClick={() => navigate('/Dashboard_Pelanggan')} className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-semibold transition hover:bg-white/20">
                        <FaArrowLeft /> Kembali ke Dashboard
                    </button>
                </div>
                
                <div className="bg-white/10 p-8 rounded-2xl shadow-lg">
                    {orders.length === 0 ? (
                        <p className="text-slate-300 text-center">Anda belum memiliki riwayat pesanan.</p>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div key={order.id} className="bg-white/5 p-4 rounded-xl flex justify-between items-center">
                                    <div>
                                        <p className="font-mono text-sm text-slate-400">{order.orderId}</p>
                                        <p className="text-lg font-bold">{formatIDR(order.amount)}</p>
                                        <p className="text-xs text-slate-400">Dibuat pada: {new Date(order.createdAt).toLocaleString('id-ID')}</p>
                                    </div>
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                        order.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' :
                                        order.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300' :
                                        'bg-red-500/20 text-red-300'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};