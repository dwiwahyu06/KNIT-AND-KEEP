import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { Galat, Input, Isian, Tombol } from "../components/ui";
import { akunApi } from "../lib/api";
import { simpanPelanggan } from "../lib/session";

export default function LoginPelanggan() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  const kirim = async (e) => {
    e.preventDefault();
    setProses(true);
    setGalat("");
    try {
      const hasil = await akunApi.loginPelanggan(form.username, form.password);
      simpanPelanggan(hasil.user, hasil.token);
      navigate("/Dashboard_pelanggan");
    } catch (err) {
      setGalat(err.message);
    } finally {
      setProses(false);
    }
  };

  return (
    <AuthShell
      judul="Masuk"
      keterangan="Lanjutkan belanja dan pantau pesanan Anda."
      bawah={
        <>
          Belum punya akun?{" "}
          <Link to="/RegisterPelanggan" className="font-semibold text-brand-600 hover:underline">
            Daftar sekarang
          </Link>
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
