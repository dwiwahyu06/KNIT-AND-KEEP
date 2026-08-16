import React from "react";
import { Link } from "react-router-dom";

/**
 * Rangka halaman masuk dan daftar.
 * Sisi kiri menjelaskan aplikasinya, sisi kanan formulirnya.
 */
export default function AuthShell({ judul, keterangan, children, bawah, sisi }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-brand-600 p-12 lg:flex">
        <Link to="/" className="display text-xl font-bold text-white">
          Knit &amp; Keep
        </Link>

        <div className="max-w-md">
          <h2 className="display text-3xl font-bold leading-tight text-white">
            {sisi?.judul || "Thrifting rajut, dari lemari lama ke lemari baru."}
          </h2>
          <p className="mt-4 text-brand-100">
            {sisi?.teks ||
              "Setiap barang di sini hanya ada satu atau dua. Sekali habis, biasanya tidak kembali lagi."}
          </p>
        </div>

        <p className="text-xs text-brand-300">
          Stok, pesanan, dan pembukuan toko dikelola dalam satu aplikasi.
        </p>
      </div>

      <div className="flex items-center justify-center bg-sand-50 p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="display mb-8 block text-lg font-bold text-brand-600 lg:hidden">
            Knit &amp; Keep
          </Link>

          <h1 className="display text-2xl font-bold text-sand-800">{judul}</h1>
          {keterangan && <p className="mt-1 mb-6 text-sm text-sand-500">{keterangan}</p>}

          {children}

          {bawah && <div className="mt-6 text-center text-sm text-sand-500">{bawah}</div>}
        </div>
      </div>
    </div>
  );
}
