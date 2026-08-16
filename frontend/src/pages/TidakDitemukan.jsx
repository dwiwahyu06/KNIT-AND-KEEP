import React from "react";
import { Link, useLocation } from "react-router-dom";

/**
 * Halaman untuk alamat yang tidak dikenal.
 * Sebelumnya alamat salah dilempar diam-diam ke beranda, sehingga pengguna
 * mengira tautannya benar tapi isinya kosong.
 */
export default function TidakDitemukan() {
  const lokasi = useLocation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-50 px-6">
      <div className="w-full max-w-md text-center">
        <p className="display text-6xl font-bold text-sand-300">404</p>
        <h1 className="display mt-3 text-xl font-bold text-sand-800">
          Halaman ini tidak ada
        </h1>
        <p className="mt-2 text-sm text-sand-500">
          Alamat <code className="font-mono text-sand-600">{lokasi.pathname}</code> tidak
          dikenali. Mungkin tautannya salah ketik, atau halamannya sudah dipindah.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Ke beranda
          </Link>
          <Link
            to="/products"
            className="rounded-lg border border-sand-300 px-4 py-2 text-sm font-semibold text-sand-700 transition hover:border-brand-400"
          >
            Lihat katalog
          </Link>
        </div>
      </div>
    </div>
  );
}
