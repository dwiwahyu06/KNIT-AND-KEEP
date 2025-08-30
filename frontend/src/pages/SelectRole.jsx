import React from "react";
import { useNavigate } from "react-router-dom";

const SelectRole = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100">
      {/* Card */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 drop-shadow-sm">
            Pilih Peran
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Silakan pilih untuk registrasi sebagai <br /> Admin atau Pelanggan
          </p>
        </div>

        {/* Pilihan Role */}
        <div className="grid grid-cols-1 gap-6">
          {/* Admin */}
          <div
            onClick={() => navigate("/Login")}
            className="cursor-pointer group border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-indigo-50 hover:border-indigo-400 transition transform hover:scale-105 shadow-sm hover:shadow-lg"
          >
            <div className="bg-indigo-100 text-indigo-600 p-4 rounded-full mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
              {/* Ikon admin (pakai emoji biar simple) */}
              <span className="text-3xl">👨‍💼</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-700 group-hover:text-indigo-600">
              Admin
            </h2>
            <p className="text-sm text-gray-500 mt-1 text-center">
              Kelola sistem, data, dan pengguna.
            </p>
          </div>

          {/* Pelanggan */}
          <div
            onClick={() => navigate("/RegisterPelanggan")}
            className="cursor-pointer group border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-purple-50 hover:border-purple-400 transition transform hover:scale-105 shadow-sm hover:shadow-lg"
          >
            <div className="bg-purple-100 text-purple-600 p-4 rounded-full mb-4 group-hover:bg-purple-600 group-hover:text-white transition">
              {/* Ikon user */}
              <span className="text-3xl">🧑‍🤝‍🧑</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-700 group-hover:text-purple-600">
              Pelanggan
            </h2>
            <p className="text-sm text-gray-500 mt-1 text-center">
              Daftar sebagai pelanggan dan nikmati layanan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
