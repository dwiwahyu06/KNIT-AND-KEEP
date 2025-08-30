import React, { useEffect, useState } from "react";
import axios from "axios";

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "", imageUrl: "" });
  const [editingId, setEditingId] = useState(null);

  const fetchProducts = async () => {
    const res = await axios.get("http://localhost:8080/api/products");
    setProducts(res.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`http://localhost:8080/api/products/${editingId}`, form);
      setEditingId(null);
    } else {
      await axios.post("http://localhost:8080/api/products", form);
    }
    setForm({ name: "", description: "", price: "", stock: "", imageUrl: "" });
    fetchProducts();
  };

  const handleEdit = (product) => {
    setForm(product);
    setEditingId(product.id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:8080/api/products/${id}`);
    fetchProducts();
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Manajemen Produk</h1>

      <form onSubmit={handleSubmit} className="space-y-2 mb-6">
        <input className="border p-2 w-full" placeholder="Nama Produk" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border p-2 w-full" placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="border p-2 w-full" type="number" placeholder="Harga" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input className="border p-2 w-full" type="number" placeholder="Stok" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <input className="border p-2 w-full" placeholder="URL Gambar" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <button className="bg-green-600 text-white px-4 py-2 rounded">{editingId ? "Update" : "Tambah"} Produk</button>
      </form>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Nama</th>
            <th className="p-2 border">Harga</th>
            <th className="p-2 border">Stok</th>
            <th className="p-2 border">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border">
              <td className="p-2">{p.name}</td>
              <td className="p-2">Rp {p.price}</td>
              <td className="p-2">{p.stock}</td>
              <td className="p-2 flex gap-2">
                <button className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => handleEdit(p)}>Edit</button>
                <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => handleDelete(p.id)}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductPage;
