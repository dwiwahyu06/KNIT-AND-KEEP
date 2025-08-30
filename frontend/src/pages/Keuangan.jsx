import React, { useEffect, useState } from "react";

const Keuangan = () => {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    type: "income",
    amount: "",
    category: "Penjualan",
    description: "",
    source: "Website",
  });

  // Fetch data
  const fetchTransactions = () => {
    fetch("http://localhost:8080/api/transactions")
      .then((res) => res.json())
      .then((res) => {
        // Jika backend kirim { data: [...] } gunakan res.data
        if (Array.isArray(res)) {
          setTransactions(res);
        } else if (Array.isArray(res.data)) {
          setTransactions(res.data);
        } else {
          setTransactions([]); // fallback biar ga error
        }
      })
      .catch((err) => {
        console.error("Error fetching transactions:", err);
        setTransactions([]);
      });
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Handle input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Save income
  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://localhost:8080/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then(() => {
      setForm({
        type: "income",
        amount: "",
        category: "Penjualan",
        description: "",
        source: "Website",
      });
      fetchTransactions();
    });
  };

  // Delete
  const handleDelete = (id) => {
    fetch(`http://localhost:8080/api/transactions/${id}`, {
      method: "DELETE",
    }).then(() => fetchTransactions());
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manajemen Pemasukan</h1>

      {/* Form Tambah Pemasukan */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-2xl shadow mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            name="amount"
            placeholder="Nominal"
            value={form.amount}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            name="category"
            placeholder="Kategori"
            value={form.category}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="source"
            placeholder="Sumber (Shopee, IG, Website)"
            value={form.source}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="description"
            placeholder="Deskripsi"
            value={form.description}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>
        <button
          type="submit"
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
        >
          Tambah Pemasukan
        </button>
      </form>

      {/* Daftar Transaksi Income */}
      <table className="w-full border-collapse bg-white shadow rounded-2xl overflow-hidden">
        <thead className="bg-green-200">
          <tr>
            <th className="p-2">Tanggal</th>
            <th className="p-2">Nominal</th>
            <th className="p-2">Kategori</th>
            <th className="p-2">Sumber</th>
            <th className="p-2">Deskripsi</th>
            <th className="p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {transactions
            .filter((trx) => trx.type === "income")
            .map((trx) => (
              <tr key={trx.id} className="text-center border-t">
                <td className="p-2">
                  {trx.createdAt
                    ? new Date(trx.createdAt).toLocaleDateString()
                    : "-"}
                </td>
                <td className="p-2">
                  Rp {Number(trx.amount).toLocaleString()}
                </td>
                <td className="p-2">{trx.category}</td>
                <td className="p-2">{trx.source}</td>
                <td className="p-2">{trx.description}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleDelete(trx.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
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

export default Keuangan;
