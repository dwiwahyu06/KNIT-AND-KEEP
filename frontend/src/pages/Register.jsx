import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { Galat, Input, Isian, Memuat, Tombol } from "../components/ui";
import { akunApi } from "../lib/api";

/**
 * Pendaftaran pengelola pertama.
 *
 * Halaman ini hanya berguna sekali, saat toko benar-benar belum punya
 * pengelola. Sesudah itu penambahan pengelola dilakukan dari halaman Akun di
 * dalam panel admin — sebelumnya halaman ini terbuka untuk umum, sehingga
 * siapa pun bisa mengangkat dirinya sendiri menjadi pengelola toko.
 */
export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);
  const [kosong, setKosong] = useState(null);

  useEffect(() => {
    akunApi
      .perluPengelolaPertama()
      .then((r) => setKosong(r.kosong))
      .catch(() => setKosong(false));
  }, []);

  const kirim = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setGalat("Password minimal 6 karakter.");
      return;
    }
    setProses(true);
    setGalat("");
    try {
      await akunApi.daftarAdmin(form);
      navigate("/login");
    } catch (err) {
      setGalat(err.message);
    } finally {
      setProses(false);
    }
  };

  if (kosong === null) {
    return <AuthShell judul="Menyiapkan…"><Memuat /></AuthShell>;
  }

  if (!kosong) {
    return (
      <AuthShell
        judul="Toko ini sudah punya pengelola"
        keterangan="Penambahan akun pengelola dilakukan dari dalam panel admin, bukan dari halaman terbuka."
        sisi={{
          judul: "Akses toko dijaga.",
          teks: "Hanya pengelola yang sudah masuk yang bisa menambah pengelola baru.",
        }}
      >
        <div className="space-y-4">
          <p className="rounded-lg bg-sand-100 px-4 py-3 text-sm text-sand-600">
            Kalau Anda memang pengelola toko ini, masuk dulu, lalu buka
            halaman <b>Akun</b> dan tekan <b>Tambah pengelola</b>.
          </p>
          <Link to="/login">
            <Tombol className="w-full">Masuk sebagai pengelola</Tombol>
          </Link>
          <Link to="/" className="block text-center text-sm text-sand-500 hover:text-brand-600">
            Kembali ke beranda
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      judul="Buat pengelola pertama"
      keterangan="Toko ini belum punya pengelola. Akun pertama ini akan punya akses penuh."
      sisi={{
        judul: "Kelola toko dari satu tempat.",
        teks: "Katalog, kasir, pelacakan pesanan, komplain, sampai laporan laba rugi.",
      }}
      bawah={
        <>
          Sudah punya akun?{" "}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">Masuk</Link>
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
          {proses ? "Mendaftarkan…" : "Buat pengelola pertama"}
        </Tombol>
      </form>
    </AuthShell>
  );
}
