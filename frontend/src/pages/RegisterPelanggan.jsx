import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { Galat, Input, Isian, Tombol } from "../components/ui";
import { akunApi } from "../lib/api";

export default function RegisterPelanggan() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  const kirim = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setGalat("Password minimal 6 karakter.");
      return;
    }
    setProses(true);
    setGalat("");
    try {
      await akunApi.daftarPelanggan(form);
      navigate("/LoginPelanggan");
    } catch (err) {
      setGalat(err.message);
    } finally {
      setProses(false);
    }
  };

  return (
    <AuthShell
      judul="Buat akun"
      keterangan="Daftar untuk mulai belanja dan menyimpan alamat pengiriman."
      sisi={{
        judul: "Barang bagus tidak menunggu.",
        teks: "Simpan alamat sekali, lalu checkout berikutnya tinggal beberapa ketukan.",
      }}
      bawah={
        <>
          Sudah punya akun?{" "}
          <Link to="/LoginPelanggan" className="font-semibold text-brand-600 hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={kirim} className="space-y-4">
        {galat && <Galat pesan={galat} />}
        <Isian label="Nama pengguna" wajib>
          <Input required autoFocus value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </Isian>
        <Isian label="Email" wajib>
          <Input type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Isian>
        <Isian label="Password" wajib hint="Minimal 6 karakter.">
          <Input type="password" required minLength={6} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Isian>
        <Tombol type="submit" className="w-full" disabled={proses}>
          {proses ? "Mendaftarkan…" : "Daftar"}
        </Tombol>
      </form>
    </AuthShell>
  );
}
