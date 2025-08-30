import React, { useEffect, useState } from "react";

const Stock = () => {
  const [stocks, setStocks] = useState([]);
  const [form, setForm] = useState({ name: "", quantity: "", purchasePrice: "" });

  const fetchStocks = () => {
    fetch("http://localhost:8080/api/stocks")
      .then((res) => res.json())
      .then((data) => setStocks(data));
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://localhost:8080/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then(() => {
      setForm({ name: "", quantity: "", purchasePrice: "" });
      fetchStocks();
    });
  };

  const handleAddStock = (id) => {
    const qty = prompt("Tambah berapa unit?");
    const price = prompt("Harga beli per unit?");
    if (!qty || !price) return;
    fetch(`http://localhost:8080/api/stocks/${id}/add?qty=${qty}&price=${price}`, {
      method: "POST",
    }).then(() => fetchStocks());
  };

  const handleReduceStock = (id) => {
    const qty = prompt("Kurangi berapa unit?");
    if (!qty) return;
    fetch(`http://localhost:8080/api/stocks/${id}/reduce?qty=${qty}`, {
      method: "POST",
    }).then(() => fetchStocks());
  };

  const handleDeleteStock = (id) => {
    if (window.confirm("Yakin mau hapus barang ini?")) {
      fetch(`http://localhost:8080/api/stocks/${id}`, {
        method: "DELETE",
      }).then(() => fetchStocks());
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manajemen Stok & HPP</h1>

      {/* Form Tambah Barang */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Nama Barang"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="number"
          placeholder="Jumlah Awal"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="number"
          placeholder="Harga Beli"
          value={form.purchasePrice}
          onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          Tambah Barang
        </button>
      </form>

      {/* Tabel Stok */}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Nama</th>
            <th className="border p-2">Stok</th>
            <th className="border p-2">Harga Beli Terakhir</th>
            <th className="border p-2">HPP (Rata-rata)</th>
            <th className="border p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((item) => (
            <tr key={item.id}>
              <td className="border p-2">{item.name}</td>
              <td className="border p-2">{item.quantity}</td>
              <td className="border p-2">
                Rp {item.purchasePrice?.toLocaleString()}
              </td>
              <td className="border p-2">
                Rp {item.averagePrice?.toLocaleString()}
              </td>
              <td className="border p-2 space-x-2">
                <button
                  onClick={() => handleAddStock(item.id)}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Tambah
                </button>
                <button
                  onClick={() => handleReduceStock(item.id)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Kurangi
                </button>
                <button
                  onClick={() => handleDeleteStock(item.id)}
                  className="bg-red-600 text-white px-2 py-1 rounded"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Stock;
