import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaArrowLeft } from 'react-icons/fa'; // Import ikon panah kiri

function formatIDR(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(isNaN(n) ? 0 : n);
}

const API_PRODUCTS_URL = "http://localhost:8080/api/products";
const API_CART_URL = "http://localhost:8080/api/cart";

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loggedInUserId = localStorage.getItem('loggedInUserId');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL(API_PRODUCTS_URL);
      url.searchParams.append('_', new Date().getTime());
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal mengambil data produk");
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = async (productId) => {
    if (!loggedInUserId) {
        alert("Anda harus login untuk menambahkan item ke keranjang!");
        navigate('/');
        return;
    }
    
    try {
        const payload = {
            pelangganId: loggedInUserId,
            productId: productId,
            quantity: 1
        };

        const res = await fetch(`${API_CART_URL}/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Produk berhasil ditambahkan ke keranjang!");
        } else {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || "Gagal menambahkan ke keranjang.");
        }
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
  };

  if (loading) {
    return <div className="text-center text-white p-10 min-h-screen bg-[#183D4B]">Loading produk...</div>;
  }

  return (
    <div className="bg-[#183D4B] min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-7xl">

        {/* ✅ TOMBOL KEMBALI DITAMBAHKAN DI SINI */}
        <div className="mb-8">
            <button 
                onClick={() => navigate('/Dashboard_pelanggan')}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition"
            >
                <FaArrowLeft />
                Kembali ke Dashboard
            </button>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white tracking-tight">Selamat Datang di KNIT-AND-KEEP</h1>
          <p className="text-lg text-slate-300 mt-2">Temukan pakaian favoritmu di sini</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden shadow-lg group flex flex-col">
              <div className="w-full h-64 bg-slate-200">
                <img src={product.image || 'https://via.placeholder.com/300'} alt={product.name} className="w-full h-full object-cover"/>
              </div>
              <div className="p-5 text-white flex-grow flex flex-col">
                <h2 className="text-lg font-bold truncate">{product.name}</h2>
                <p className="text-slate-300 text-sm">{product.category}</p>
                <p className="text-xl font-semibold mt-2 flex-grow">{formatIDR(product.sellPrice)}</p>
                
                <div className="flex gap-2 mt-4">
                    <button 
                      type="button" 
                      className="w-full bg-white text-[#183D4B] font-bold py-2 px-4 rounded-lg transition hover:bg-slate-200"
                      onClick={() => alert(`Detail untuk ${product.name}`)}
                    >
                      Lihat Detail
                    </button>
                    <button 
                      type="button" 
                      className="p-3 bg-emerald-500 text-white rounded-lg transition hover:bg-emerald-600"
                      title="Tambah ke Keranjang"
                      onClick={() => handleAddToCart(product.id)}
                    >
                      <FaShoppingCart />
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}