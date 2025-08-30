import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const RegisterPelanggan = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    fetch("http://localhost:8080/api/pelanggan/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Register gagal! Email/username mungkin sudah dipakai.");
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          // ✅ langsung redirect ke halaman LoginPelanggan
          navigate("/LoginPelanggan");
        } else {
          alert(data.message || "Register gagal!");
        }
      })
      .catch((err) => {
        console.error("Error register:", err);
        alert(err.message);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-emerald-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-700">
          Register Pelanggan
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? "Loading..." : "Register"}
          </button>
        </form>
        <p className="text-center text-sm mt-4">
          Sudah punya akun?{" "}
          <span
            className="text-green-600 cursor-pointer"
            onClick={() => navigate("/LoginPelanggan")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default RegisterPelanggan;
