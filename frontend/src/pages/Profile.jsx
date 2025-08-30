import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ alamat: "", nomorHp: "", tanggalLahir: "" });
  const [formUser, setFormUser] = useState({ username: "", email: "" });
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  // 🔹 ambil data user + profile
  useEffect(() => {
    if (userId) {
      fetch(`http://localhost:8080/api/pelanggan/${userId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Gagal ambil data user");
          return res.json();
        })
        .then((data) => {
          setUser(data);
          setFormUser({ username: data.username || "", email: data.email || "" });
        })
        .catch(() => setUser({}));

      fetch(`http://localhost:8080/api/profile/${userId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Gagal ambil data profile");
          return res.json();
        })
        .then((data) => {
          setProfile({
            alamat: data.alamat || "",
            nomorHp: data.nomorHp || "",
            tanggalLahir: data.tanggalLahir || "",
          });
        })
        .catch(() => {});
    }
  }, [userId]);

  const handleUserChange = (e) => setFormUser({ ...formUser, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleUpdateUser = (e) => {
    e.preventDefault();
    setLoading(true);
    fetch(`http://localhost:8080/api/pelanggan/update/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formUser),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message || "Berhasil update user");
        if (data.success) setUser(data.user);
      })
      .finally(() => setLoading(false));
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    setLoading(true);
    fetch(`http://localhost:8080/api/pelanggan/update-password/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwordData),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message || "Password berhasil diperbarui");
        if (data.success) setPasswordData({ oldPassword: "", newPassword: "" });
      })
      .finally(() => setLoading(false));
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setLoading(true);
    fetch(`http://localhost:8080/api/profile/update/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    })
      .then((res) => res.json())
      .then(() => {
        alert("Profil berhasil diperbarui!");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-emerald-100">
      {/* 🔹 Navbar */}
      <nav className="bg-green-600 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-4">
          
          <h1 className="text-xl font-bold">Knit & Keep</h1>
        </div>
        <button
          className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold"
          onClick={() => {
            localStorage.removeItem("userId");
            navigate("/Dashboard_pelanggan");
          }}
        >
          Back
        </button>
      </nav>

      {/* 🔹 Loading animasi kalau user masih null */}
      {user === null ? (
        <div className="flex items-center justify-center h-[80vh]">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"></div>
            <div className="absolute inset-0 h-16 w-16 rounded-full bg-emerald-400/20 animate-ping"></div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-6">
          <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-2xl space-y-10">
            <h2 className="text-2xl font-bold text-center text-gray-700">Profil Saya</h2>

            {/* FORM USER */}
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Informasi Akun</h3>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formUser.username}
                onChange={handleUserChange}
                className="w-full p-3 border rounded-lg"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formUser.email}
                onChange={handleUserChange}
                className="w-full p-3 border rounded-lg"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>

            {/* FORM PASSWORD */}
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Ubah Password</h3>
              <input
                type="password"
                name="oldPassword"
                placeholder="Password Lama"
                value={passwordData.oldPassword}
                onChange={handlePasswordChange}
                className="w-full p-3 border rounded-lg"
                required
              />
              <input
                type="password"
                name="newPassword"
                placeholder="Password Baru"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full p-3 border rounded-lg"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
              >
                {loading ? "Mengubah..." : "Ubah Password"}
              </button>
            </form>

            {/* FORM PROFILE */}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Data Pribadi</h3>
              <input
                type="text"
                name="alamat"
                placeholder="Alamat"
                value={profile.alamat}
                onChange={handleProfileChange}
                className="w-full p-3 border rounded-lg"
              />
              <input
                type="text"
                name="nomorHp"
                placeholder="Nomor HP"
                value={profile.nomorHp}
                onChange={handleProfileChange}
                className="w-full p-3 border rounded-lg"
              />
              <input
                type="date"
                name="tanggalLahir"
                value={profile.tanggalLahir}
                onChange={handleProfileChange}
                className="w-full p-3 border rounded-lg"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan Data Pribadi"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
