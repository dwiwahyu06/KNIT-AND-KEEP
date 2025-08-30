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

const API_CART_URL = "http://localhost:8080/api/cart";

export default function CartPage() {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState([]);
    const navigate = useNavigate();
    const loggedInUserId = localStorage.getItem('loggedInUserId');

    const fetchCartItems = useCallback(async () => {
        if (!loggedInUserId) {
            alert("Silakan login untuk melihat keranjang Anda.");
            navigate('/');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_CART_URL}/${loggedInUserId}`);
            if (!res.ok) throw new Error("Gagal mengambil data keranjang");
            if (res.status === 204) {
                setCartItems([]);
                return;
            }
            const data = await res.json();
            setCartItems(data);
            // Secara default, centang semua item saat pertama kali dimuat
            setSelectedItems(data.map(item => item.id));
        } catch (err) {
            console.error(err);
            setCartItems([]); // Pastikan tetap array jika error
        } finally {
            setLoading(false);
        }
    }, [loggedInUserId, navigate]);

    useEffect(() => {
        fetchCartItems();
    }, [fetchCartItems]);

    const handleUpdateQuantity = async (productId, newQuantity) => {
        try {
            const payload = {
                pelangganId: loggedInUserId,
                productId: productId,
                quantity: newQuantity,
            };
            const res = await fetch(`${API_CART_URL}/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                fetchCartItems();
            } else {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Gagal memperbarui jumlah item.");
            }
        } catch (error) {
            alert(error.message);
            console.error(error);
        }
    };

    const handleSelectItem = (itemId) => {
        setSelectedItems(prev => 
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };
    
    const handleProceedToCheckout = () => {
        if (selectedItems.length === 0) {
            alert("Silakan pilih minimal satu produk untuk di-checkout.");
            return;
        }
        
        const itemsToCheckout = cartItems.filter(item => selectedItems.includes(item.id));
        
        // ✅ PERBAIKAN: Gunakan kunci localStorage yang unik untuk setiap pengguna
        const cartKey = `itemsToCheckout_${loggedInUserId}`;
        localStorage.setItem(cartKey, JSON.stringify(itemsToCheckout));
        
        // Arahkan ke halaman pilih alamat
        navigate('/AddressListpage');
    };

    const calculateSubtotal = () => {
        const itemsToCalculate = cartItems.filter(item => selectedItems.includes(item.id));
        return itemsToCalculate.reduce((total, item) => total + (item.product.sellPrice * item.quantity), 0);
    };

    if (loading) return <div className="min-h-screen bg-[#183D4B] text-white flex justify-center items-center">Memuat Keranjang...</div>;

    return (
        <div className="min-h-screen bg-[#183D4B] p-6 md:p-10 text-white">
            <div className="mx-auto max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Keranjang Belanja Anda</h1>
                    <button 
                        onClick={() => navigate('/Dashboard_pelanggan')}
                        className="flex items-center gap-2 bg-white/۱۰ text-white px-4 py-2 rounded-lg font-semibold transition hover:bg-white/20"
                    >
                        <FaArrowLeft /> Lanjut Belanja
                    </button>
                </div>
                
                {cartItems.length > 0 ? (
                    <div className="bg-white/10 p-8 rounded-2xl shadow-lg">
                        <div className="space-y-4">
                            {cartItems.map(item => (
                                <div key={item.id} className="flex items-center gap-4 border-b border-white/20 pb-4">
                                    <input 
                                        type="checkbox"
                                        checked={selectedItems.includes(item.id)}
                                        onChange={() => handleSelectItem(item.id)}
                                        className="h-5 w-5 rounded bg-white/20 border-white/30 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <img src={item.product.image || 'https://via.placeholder.com/150'} alt={item.product.name} className="w-20 h-20 rounded-lg object-cover" />
                                    <div className="flex-grow">
                                        <h2 className="font-bold">{item.product.name}</h2>
                                        <p className="text-sm text-slate-300">{formatIDR(item.product.sellPrice)}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)} 
                                            className="bg-white/20 w-8 h-8 rounded-full font-bold text-lg hover:bg-white/30"
                                        >-</button>
                                        <span className="w-10 text-center font-bold">{item.quantity}</span>
                                        <button 
                                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)} 
                                            className="bg-white/20 w-8 h-8 rounded-full font-bold text-lg hover:bg-white/30"
                                        >+</button>
                                    </div>
                                    <p className="font-bold w-32 text-right">{formatIDR(item.product.sellPrice * item.quantity)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 text-right">
                            <h2 className="text-xl font-bold">Subtotal: {formatIDR(calculateSubtotal())}</h2>
                            <button onClick={handleProceedToCheckout} className="mt-4 bg-white text-[#183D4B] font-bold py-2 px-6 rounded-lg transition hover:bg-slate-200">
                                Lanjut ke Pembayaran
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center bg-white/10 p-10 rounded-xl">
                        <p className="text-slate-300">Keranjang belanja Anda masih kosong.</p>
                        <button onClick={() => navigate('/products')} className="mt-4 bg-white text-[#183D4B] font-bold py-2 px-4 rounded-lg transition hover:bg-slate-200">
                            Mulai Belanja
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}