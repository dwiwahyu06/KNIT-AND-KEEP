import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { Galat, Input, Isian, Tombol } from "../components/ui";
import { akunApi } from "../lib/api";
import { simpanAdmin } from "../lib/session";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  const kirim = async (e) => {
    e.preventDefault();
    setProses(true);
    setGalat("");
    try {
      const hasil = await akunApi.loginAdmin(form.username, form.password);
      simpanAdmin(hasil.user, hasil.token);
      navigate("/Dashboard");
    } catch (err) {
      setGalat(err.message);
    } finally {
      setProses(false);
    }
  };

  return (
    <AuthShell
      judul="Masuk sebagai pengelola"
      keterangan="Panel admin untuk mengelola stok, pesanan, dan pembukuan toko."
      sisi={{
        judul: "Satu panel untuk seluruh toko.",
        teks: "Penjualan online dan penjualan di kasir tercatat di tempat yang sama, jadi stok dan laporan keuangan tidak pernah berbeda.",
      }}
      bawah={
        <>
          Bukan pengelola?{" "}
          <Link to="/LoginPelanggan" className="font-semibold text-brand-600 hover:underline">
            Masuk sebagai pelanggan
          </Link>
          <span className="mt-2 block text-xs text-sand-400">
            Akun pengelola baru ditambahkan dari halaman Akun di dalam panel admin.
          </span>
        </>
      }
    >
      <form onSubmit={kirim} className="space-y-4">
        {galat && <Galat pesan={galat} />}
        <Isian label="Nama pengguna" wajib>
          <Input
            required
            autoFocus
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="admin"
          />
        </Isian>
        <Isian label="Password" wajib>
          <Input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Isian>
        <Tombol type="submit" className="w-full" disabled={proses}>
          {proses ? "Memeriksa…" : "Masuk"}
        </Tombol>
      </form>
    </AuthShell>
  );
}
