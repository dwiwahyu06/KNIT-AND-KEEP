import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // untuk navigasi ke halaman login

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await fetch("http://localhost:8080/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const text = await res.text();
    console.log("Response dari server:", text);
    setMessage(text);

    // kalau response mengandung kata berhasil
    if (text.toLowerCase().includes("berhasil")) {
      setTimeout(() => {
        navigate("/login"); // pastikan sama dengan path di Routes
      }, 1500);
    }
  } catch (error) {
    setMessage("Terjadi kesalahan: " + error.message);
  }
};


  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-indigo-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-semibold tracking-wide">👕 Knit & Keep</div>
        </div>
      </header>

      {/* Form Registrasi */}
      <main className="flex flex-1 items-center justify-center">
        <div className="bg-indigo-700 text-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Registrasi</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded text-gray-900"
                placeholder="Masukkan username"
                required
              />
            </div>

            <div>
              <label className="block mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded text-gray-900"
                placeholder="Masukkan email"
                required
              />
            </div>

            <div>
              <label className="block mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded text-gray-900"
                placeholder="Masukkan password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-400 text-gray-900 font-semibold py-2 rounded hover:bg-yellow-300 transition"
            >
              Daftar
            </button>
          </form>

          <p className="mt-4 text-center">{message}</p>
        </div>
      </main>
    </div>
  );
}

export default Register;
