import React, { useEffect, useState } from "react";
import axios from "axios";

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ productName: "", stock: "", price: "", category: "" });

  const fetchData = async () => {
    const res = await axios.get("http://localhost:8080/api/inventory");
    setItems(res.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("http://localhost:8080/api/inventory", form);
    fetchData();
    setForm({ productName: "", stock: "", price: "", category: "" });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Inventory Management</h2>

      {/* Form Tambah Produk */}
      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input type="text" name="productName" placeholder="Product Name" value={form.productName} onChange={handleChange} className="border p-2" />
        <input type="number" name="stock" placeholder="Stock" value={form.stock} onChange={handleChange} className="border p-2" />
        <input type="number" name="price" placeholder="Price" value={form.price} onChange={handleChange} className="border p-2" />
        <input type="text" name="category" placeholder="Category" value={form.category} onChange={handleChange} className="border p-2" />
        <button type="submit" className="bg-blue-500 text-white px-4">Add</button>
      </form>

      {/* Tabel Inventory */}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Product</th>
            <th className="border p-2">Stock</th>
            <th className="border p-2">Price</th>
            <th className="border p-2">Category</th>
          </tr>
        </thead>
        <tbody>
          {items.map((inv) => (
            <tr key={inv.id}>
              <td className="border p-2">{inv.id}</td>
              <td className="border p-2">{inv.productName}</td>
              <td className="border p-2">{inv.stock}</td>
              <td className="border p-2">{inv.price}</td>
              <td className="border p-2">{inv.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Inventory;
