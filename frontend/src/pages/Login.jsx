// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setMessage(data.message);

        // simpan user ke localStorage
        localStorage.setItem("user", JSON.stringify(data.user));

        // pindah ke dashboard
        navigate("/Dashboard");
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kesalahan server!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 🔹 Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold text-center">Login Page</h1>
      </header>

      {/* 🔹 Box Form */}
      <div className="flex flex-1 items-center justify-center">
        <div className="bg-blue-50 shadow-lg rounded-xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">
            Silakan Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-blue-700 font-medium mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Masukkan username"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            <div>
              <label className="block text-blue-700 font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Masukkan password"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>

          {message && (
            <p className="mt-4 text-center text-red-500 font-medium">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
