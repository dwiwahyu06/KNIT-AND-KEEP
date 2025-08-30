import React, { useEffect, useState } from "react";
import axios from "axios";

const CashFlow = () => {
  const [cashFlows, setCashFlows] = useState([]);
  const [form, setForm] = useState({ type: "IN", amount: "", description: "" });

  useEffect(() => {
    axios.get("http://localhost:8080/api/cashflow").then((res) => {
      setCashFlows(res.data);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("http://localhost:8080/api/cashflow", form);
    setForm({ type: "IN", amount: "", description: "" });
    const res = await axios.get("http://localhost:8080/api/cashflow");
    setCashFlows(res.data);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Arus Kas (Cash Flow)</h1>

      <form onSubmit={handleSubmit} className="space-y-3 mb-6">
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="IN">Pemasukan</option>
          <option value="OUT">Pengeluaran</option>
        </select>

        <input
          type="number"
          placeholder="Jumlah"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="border p-2 rounded"
          required
        />

        <input
          type="text"
          placeholder="Deskripsi"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border p-2 rounded w-64"
          required
        />

        <button className="bg-blue-500 text-white px-4 py-2 rounded">Tambah</button>
      </form>

      <table className="table-auto w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-2 py-1">Tanggal</th>
            <th className="border px-2 py-1">Tipe</th>
            <th className="border px-2 py-1">Jumlah</th>
            <th className="border px-2 py-1">Deskripsi</th>
          </tr>
        </thead>
        <tbody>
          {cashFlows.map((cf) => (
            <tr key={cf.id}>
              <td className="border px-2 py-1">{cf.date}</td>
              <td className="border px-2 py-1">{cf.type}</td>
              <td className="border px-2 py-1">{cf.amount}</td>
              <td className="border px-2 py-1">{cf.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CashFlow;
