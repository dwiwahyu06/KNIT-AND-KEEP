import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPelanggan = () => {
  const [formData, setFormData] = useState({
    username: "",
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

    fetch("http://localhost:8080/api/pelanggan/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Login gagal! Username atau password salah.");
        }
        return res.json();
      })
      .then((data) => {
  if (data.success) {
    alert("Login berhasil!");
    console.log("User login:", data.user);

    // ✅ simpan id user di localStorage
    localStorage.setItem("userId", data.user.id);
    localStorage.setItem("loggedInUserId", data.user.id);

    navigate("/Dashboard_pelanggan");
  } else {
    alert(data.message || "Login gagal!");
  }
})
      .catch((err) => {
        console.error("Error login:", err);
        alert(err.message);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-emerald-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-700">
          Login Pelanggan
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
            {loading ? "Loading..." : "Login"}
          </button>
        </form>
        <p className="text-center text-sm mt-4">
          Belum punya akun?{" "}
          <span
            className="text-green-600 cursor-pointer"
            onClick={() => navigate("/RegisterPelanggan")}
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPelanggan;
