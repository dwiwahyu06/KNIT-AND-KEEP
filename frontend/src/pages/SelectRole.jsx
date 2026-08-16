import React from "react";
import { Link } from "react-router-dom";

export default function SelectRole() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sand-50 px-6 py-12">
      <Link to="/" className="display mb-2 text-xl font-bold text-brand-600">
        Knit &amp; Keep
      </Link>
      <h1 className="display mb-1 text-2xl font-bold text-sand-800">Masuk sebagai apa?</h1>
      <p className="mb-8 text-sm text-sand-500">Pilih peran yang sesuai.</p>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <Pilihan
          judul="Pelanggan"
          teks="Belanja barang thrifting, lacak pesanan, dan ajukan komplain kalau ada kendala."
          ke="/LoginPelanggan"
          daftar="/RegisterPelanggan"
          utama
        />
        <Pilihan
          judul="Pengelola toko"
          teks="Kelola stok, layani pesanan, catat penjualan kasir, dan lihat laporan keuangan."
          ke="/login"
          catatan="Akun pengelola dibuatkan oleh pengelola lain"
        />
      </div>

      <Link to="/" className="mt-8 text-sm text-sand-500 hover:text-brand-600">
        ← Kembali ke beranda
      </Link>
    </div>
  );
}

function Pilihan({ judul, teks, ke, daftar, catatan, utama = false }) {
  return (
    <div
      className={`flex flex-col rounded-xl border p-6 ${
        utama ? "border-brand-300 bg-white" : "border-sand-200 bg-white"
      }`}
    >
      <h2 className="display text-lg font-bold text-sand-800">{judul}</h2>
      <p className="mt-2 flex-1 text-sm text-sand-500">{teks}</p>
      <Link
        to={ke}
        className={`mt-5 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
          utama
            ? "bg-brand-600 text-white hover:bg-brand-700"
            : "border border-sand-300 text-sand-700 hover:border-brand-400 hover:text-brand-600"
        }`}
      >
        Masuk
      </Link>
      {daftar ? (
        <Link to={daftar} className="mt-2 text-center text-xs text-sand-400 hover:text-brand-600">
          Belum punya akun? Daftar
        </Link>
      ) : (
        <span className="mt-2 text-center text-xs text-sand-400">{catatan}</span>
      )}
    </div>
  );
}
