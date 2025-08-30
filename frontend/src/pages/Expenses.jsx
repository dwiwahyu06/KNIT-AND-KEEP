import React, { useEffect, useState } from "react";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ description: "", amount: "", category: "" });

  // Ambil data dari backend
  const fetchExpenses = () => {
    fetch("http://localhost:8080/api/expenses")
      .then((res) => res.json())
      .then((data) => setExpenses(data))
      .catch((err) => console.error("Error:", err));
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Tambah pengeluaran
  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://localhost:8080/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then(() => {
      setForm({ description: "", amount: "", category: "" });
      fetchExpenses();
    });
  };

  // Hapus pengeluaran
  const handleDelete = (id) => {
    fetch(`http://localhost:8080/api/expenses/${id}`, { method: "DELETE" })
      .then(() => fetchExpenses());
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manajemen Pengeluaran</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Deskripsi"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="number"
          placeholder="Jumlah"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="text"
          placeholder="Kategori"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded">
          Tambah Pengeluaran
        </button>
      </form>

      {/* Tabel */}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Deskripsi</th>
            <th className="border p-2">Jumlah</th>
            <th className="border p-2">Kategori</th>
            <th className="border p-2">Tanggal</th>
            <th className="border p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp) => (
            <tr key={exp.id}>
              <td className="border p-2">{exp.description}</td>
              <td className="border p-2">Rp {exp.amount.toLocaleString()}</td>
              <td className="border p-2">{exp.category}</td>
              <td className="border p-2">{exp.date}</td>
              <td className="border p-2">
                <button
                  onClick={() => handleDelete(exp.id)}
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

export default Expenses;
