import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

// OPSI STATIS UNTUK FILTER
const CATEGORY_OPTIONS = ["T-shirt", "Kaos", "Celana", "Jaket", "Kemeja", "Sweater"];
const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL", "All Size"];
const COLOR_OPTIONS = ["Hitam", "Putih", "Merah", "Biru", "Hijau", "Kuning", "Abu-abu", "Coklat", "Navy"];

const API_URL = "http://localhost:8080/api/products";

const initialProductState = {
  sku: "", name: "", category: "", size: "", color: "",
  costPrice: 0, sellPrice: 0, stock: 0, supplier: "", image: "",
};

export default function InventoryTable() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState(() => localStorage.getItem("inventorySearch") || "");
  const [filterCategory, setFilterCategory] = useState(() => localStorage.getItem("inventoryFilterCategory") || "");
  const [filterSize, setFilterSize] = useState(() => localStorage.getItem("inventoryFilterSize") || "");
  const [filterColor, setFilterColor] = useState(() => localStorage.getItem("inventoryFilterColor") || "");
  const [page, setPage] = useState(() => parseInt(localStorage.getItem("inventoryPage")) || 1);
  const pageSize = 5;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [formData, setFormData] = useState(initialProductState);

  const [displayCostPrice, setDisplayCostPrice] = useState("Rp 0");
  const [displaySellPrice, setDisplaySellPrice] = useState("Rp 0");

  useEffect(() => { localStorage.setItem("inventorySearch", search); }, [search]);
  useEffect(() => { localStorage.setItem("inventoryFilterCategory", filterCategory); }, [filterCategory]);
  useEffect(() => { localStorage.setItem("inventoryFilterSize", filterSize); }, [filterSize]);
  useEffect(() => { localStorage.setItem("inventoryFilterColor", filterColor); }, [filterColor]);
  useEffect(() => { localStorage.setItem("inventoryPage", page); }, [page]);

  const fetchProducts = useCallback(async () => {
    try {
      const baseUrl = search ? `${API_URL}?search=${search}` : API_URL;
      const url = new URL(baseUrl);
      url.searchParams.append('_', new Date().getTime());
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data && Array.isArray(data.content)) {
        setProducts(data.content);
      } else if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Gagal mengambil data produk:", err);
      setProducts([]);
    }
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleResetFilters = useCallback(() => {
    localStorage.removeItem("inventorySearch");
    localStorage.removeItem("inventoryFilterCategory");
    localStorage.removeItem("inventoryFilterSize");
    localStorage.removeItem("inventoryFilterColor");
    localStorage.removeItem("inventoryPage");
    setSearch("");
    setFilterCategory("");
    setFilterSize("");
    setFilterColor("");
    setPage(1);
    const fetchAllProducts = async () => {
        try {
            const url = new URL(API_URL);
            url.searchParams.append('_', new Date().getTime());
            const res = await fetch(url);
            const data = await res.json();
            if (data && Array.isArray(data.content)) {
                setProducts(data.content);
            } else if (Array.isArray(data)) {
                setProducts(data);
            }
        } catch (error) {
            console.error("Gagal mereset produk:", error);
        }
    };
    fetchAllProducts();
  }, []);

  const openAddModal = () => {
    setProductToEdit(null);
    setFormData(initialProductState);
    setDisplayCostPrice(formatIDR(0));
    setDisplaySellPrice(formatIDR(0));
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setProductToEdit(product);
    setFormData(product);
    setDisplayCostPrice(formatIDR(product.costPrice));
    setDisplaySellPrice(formatIDR(product.sellPrice));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setProductToEdit(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
    setFormData(prev => ({ ...prev, [name]: numericValue }));
    if (name === 'costPrice') {
      setDisplayCostPrice(formatIDR(numericValue));
    } else if (name === 'sellPrice') {
      setDisplaySellPrice(formatIDR(numericValue));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const url = productToEdit ? `${API_URL}/${productToEdit.id}` : API_URL;
    const method = productToEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(`Produk berhasil ${productToEdit ? 'diupdate' : 'ditambahkan'}!`);
        closeModal();
        fetchProducts();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Gagal: ${errorData.message || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      console.error("Error saat menyimpan produk:", err);
    }
  };

  const handleAddStock = async (product) => {
    const amount = prompt(`Tambah stok untuk ${product.name}:`, "10");
    const addedStock = parseInt(amount, 10);
    if (isNaN(addedStock) || addedStock <= 0) return;
    const updatedProduct = { ...product, stock: product.stock + addedStock };
    try {
      const res = await fetch(`${API_URL}/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct),
      });
      if (res.ok) {
        alert("Stok berhasil ditambahkan!");
        fetchProducts();
      } else {
        alert("Gagal menambah stok.");
      }
    } catch (err) {
      console.error("Error menambah stok:", err);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus "${productName}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/${productId}`, { method: "DELETE" });
      if (res.ok) {
        alert("Produk berhasil dihapus!");
        fetchProducts();
      } else {
        alert("Gagal menghapus produk.");
      }
    } catch (err) {
      console.error("Error menghapus produk:", err);
    }
  };

  const filtered = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter((p) => {
      const matchCategory = filterCategory ? p.category === filterCategory : true;
      const matchSize = filterSize ? p.size === filterSize : true;
      const matchColor = filterColor ? p.color === filterColor : true;
      return matchCategory && matchSize && matchColor;
    });
  }, [products, filterCategory, filterSize, filterColor]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <div className="min-h-screen bg-[#183D4B] p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Inventory — Tabel Data Produk
            </h1>
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    className="rounded-2xl bg-white/10 px-4 py-2 text-white backdrop-blur transition hover:bg-white/20"
                    onClick={openAddModal}
                >
                    + Tambah Produk
                </button>
                {/* --- TOMBOL KEMBALI DITAMBAHKAN DI SINI --- */}
                <button
                    type="button"
                    onClick={() => navigate('/Dashboard')}
                    className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-white backdrop-blur transition hover:bg-white/20"
                >
                    <FaArrowLeft /> Kembali ke Dashboard
                </button>
            </div>
          </div>
          
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-white/10 p-4">
            <input type="text" placeholder="Cari SKU atau Nama..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            
            <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Semua Kategori</option>
                {CATEGORY_OPTIONS.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
            <select value={filterSize} onChange={(e) => { setFilterSize(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Semua Ukuran</option>
                {SIZE_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
            <select value={filterColor} onChange={(e) => { setFilterColor(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Semua Warna</option>
                {COLOR_OPTIONS.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
            
            <button type="button" onClick={handleResetFilters} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
                Reset Filter
            </button>
          </div>

          <div className="rounded-2xl bg-white shadow-xl">
            <div className="w-full overflow-x-auto">
              <table className="min-w-[1100px] w-full text-left">
                  <thead className="sticky top-0 z-10 bg-white">
                      <tr className="text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Gambar</th>
                      <th className="px-4 py-3">Kode / SKU</th>
                      <th className="px-4 py-3">Nama Produk</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Ukuran</th>
                      <th className="px-4 py-3">Warna</th>
                      <th className="px-4 py-3">Harga Modal</th>
                      <th className="px-4 py-3">Harga Jual</th>
                      <th className="px-4 py-3">Stok</th>
                      <th className="px-4 py-3">Supplier</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                      {paginated.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3"><div className="h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"><img src={p.image || ""} alt={p.name || p.sku} className="h-full w-full object-cover" /></div></td>
                          <td className="px-4 py-3 font-medium text-slate-700">{p.sku}</td>
                          <td className="px-4 py-3 text-slate-800">{p.name}</td>
                          <td className="px-4 py-3 text-slate-700">{p.category}</td>
                          <td className="px-4 py-3 text-slate-700">{p.size}</td>
                          <td className="px-4 py-3 text-slate-700">{p.color}</td>
                          <td className="px-4 py-3 text-slate-700">{formatIDR(p.costPrice)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{formatIDR(p.sellPrice)}</td>
                          <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-2 rounded-xl px-3 py-1 text-xs font-semibold ${p.stock === 0 ? "bg-red-50 text-red-600 border border-red-200" : p.stock <= 5 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${p.stock === 0 ? "bg-red-500" : p.stock <= 5 ? "bg-amber-500" : "bg-emerald-500"}`} />
                                  {p.stock} pcs
                              </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{p.supplier}</td>
                          <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                              <button onClick={() => openEditModal(p)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">Edit</button>
                              <button onClick={() => handleAddStock(p)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">+ Stok</button>
                              <button onClick={() => handleDeleteProduct(p.id, p.name)} className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100">Hapus</button>
                              </div>
                          </td>
                      </tr>
                      ))}
                  </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-2 border-t border-slate-100 p-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
                <span>Total produk: {filtered.length}</span>
                <div className="flex items-center gap-2">
                <button type="button" className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-50" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
                <span>Halaman {currentPage} / {totalPages}</span>
                <button type="button" className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-50" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
                </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-fade-in-up">
            <h2 className="text-xl font-bold mb-4">{productToEdit ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="col-span-2">
                    <label className="text-sm font-medium text-slate-600">Nama Produk</label>
                    <input name="name" value={formData.name} onChange={handleFormChange} className="mt-1 w-full rounded-lg border p-2" required />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-600">SKU</label>
                    <input name="sku" value={formData.sku} onChange={handleFormChange} className="mt-1 w-full rounded-lg border p-2" />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-600">Kategori</label>
                    <input name="category" value={formData.category} onChange={handleFormChange} className="mt-1 w-full rounded-lg border p-2" />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-600">Ukuran</label>
                    <input name="size" value={formData.size} onChange={handleFormChange} className="mt-1 w-full rounded-lg border p-2" />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-600">Warna</label>
                    <input name="color" value={formData.color} onChange={handleFormChange} className="mt-1 w-full rounded-lg border p-2" />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-600">Harga Modal</label>
                    <input 
                      name="costPrice" 
                      value={displayCostPrice} 
                      onChange={handlePriceChange} 
                      className="mt-1 w-full rounded-lg border p-2" 
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-600">Harga Jual</label>
                    <input 
                      name="sellPrice" 
                      value={displaySellPrice} 
                      onChange={handlePriceChange} 
                      className="mt-1 w-full rounded-lg border p-2" 
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-600">Stok</label>
                    <input name="stock" value={formData.stock} onChange={handleFormChange} type="number" className="mt-1 w-full rounded-lg border p-2" />
                </div>
                 <div>
                    <label className="text-sm font-medium text-slate-600">Supplier</label>
                    <input name="supplier" value={formData.supplier} onChange={handleFormChange} className="mt-1 w-full rounded-lg border p-2" />
                </div>
                <div className="col-span-2">
                    <label className="text-sm font-medium text-slate-600">URL Gambar</label>
                    <input name="image" value={formData.image} onChange={handleFormChange} className="mt-1 w-full rounded-lg border p-2" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="rounded-lg bg-slate-100 px-4 py-2 font-medium transition hover:bg-slate-200">
                  Batal
                </button>
                <button type="submit" className="rounded-lg bg-[#183D4B] px-4 py-2 font-medium text-white transition hover:opacity-90">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
