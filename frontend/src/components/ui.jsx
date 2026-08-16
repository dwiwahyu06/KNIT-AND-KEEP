import React from "react";

/**
 * Komponen dasar yang dipakai ulang di seluruh aplikasi.
 * Semua halaman memakai ini supaya jarak, sudut, dan warna tetap seragam.
 */

// ---------- Tombol ----------
const GAYA_TOMBOL = {
  utama:
    "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-sand-300 disabled:text-sand-500",
  aksen:
    "bg-wool-400 text-brand-800 hover:bg-wool-300 disabled:bg-sand-300 disabled:text-sand-500",
  garis:
    "border border-sand-300 bg-white text-sand-700 hover:border-brand-400 hover:text-brand-600",
  halus: "bg-sand-100 text-sand-700 hover:bg-sand-200",
  bahaya: "bg-rust-500 text-white hover:opacity-90",
};

const UKURAN_TOMBOL = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export function Tombol({
  children,
  variant = "utama",
  size = "md",
  className = "",
  ...rest
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed ${GAYA_TOMBOL[variant]} ${UKURAN_TOMBOL[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// ---------- Kartu ----------
export function Kartu({ children, className = "", padat = false }) {
  return (
    <div
      className={`rounded-xl border border-sand-200 bg-white shadow-[0_1px_2px_rgba(35,38,34,.04),0_8px_24px_-16px_rgba(35,38,34,.18)] ${
        padat ? "" : "p-5"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function KartuJudul({ judul, keterangan, aksi }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="display text-base font-bold text-sand-800">{judul}</h2>
        {keterangan && (
          <p className="mt-0.5 text-sm text-sand-500">{keterangan}</p>
        )}
      </div>
      {aksi}
    </div>
  );
}

// ---------- Kartu angka ----------
export function KartuAngka({ label, nilai, catatan, nada = "netral", ikon }) {
  const warna = {
    netral: "text-sand-800",
    baik: "text-leaf-500",
    perhatian: "text-amber-ui",
    bahaya: "text-rust-500",
    brand: "text-brand-600",
  }[nada];

  return (
    <Kartu className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="label-mono text-sand-400">{label}</span>
        {ikon && <span className="text-sand-300">{ikon}</span>}
      </div>
      <span className={`display tabular text-2xl font-bold ${warna}`}>
        {nilai}
      </span>
      {catatan && <span className="text-xs text-sand-500">{catatan}</span>}
    </Kartu>
  );
}

// ---------- Chip status ----------
export function Chip({ children, className = "" }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

// ---------- Kolom isian ----------
export function Isian({ label, hint, children, wajib = false }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-sand-600">
        {label} {wajib && <span className="text-rust-500">*</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-sand-400">{hint}</span>}
    </label>
  );
}

export const kelasInput =
  "w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm text-sand-800 outline-none transition placeholder:text-sand-400 focus:border-brand-400";

export function Input(props) {
  return <input className={kelasInput} {...props} />;
}

export function Pilihan({ children, ...rest }) {
  return (
    <select className={kelasInput} {...rest}>
      {children}
    </select>
  );
}

export function AreaTeks(props) {
  return <textarea className={`${kelasInput} min-h-20 resize-y`} {...props} />;
}

// ---------- Tabel ----------
export function Tabel({ kepala, children, kosong, min = "min-w-[720px]" }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-sand-200 bg-white">
      <table className={`w-full border-collapse text-sm ${min}`}>
        <thead>
          <tr className="border-b border-sand-200 bg-sand-100">
            {kepala.map((k) => (
              <th
                key={k}
                className="label-mono whitespace-nowrap px-4 py-3 text-left font-semibold text-sand-500"
              >
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {React.Children.count(children) === 0 ? (
            <tr>
              <td
                colSpan={kepala.length}
                className="px-4 py-12 text-center text-sm text-sand-400"
              >
                {kosong || "Belum ada data."}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Baris({ children, onClick, className = "" }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-sand-100 last:border-0 ${
        onClick ? "cursor-pointer hover:bg-sand-50" : ""
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function Sel({ children, className = "" }) {
  return (
    <td className={`px-4 py-3 align-middle text-sand-700 ${className}`}>
      {children}
    </td>
  );
}

// ---------- Keadaan kosong & memuat ----------
export function Kosong({ judul, keterangan, aksi }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-sand-300 bg-white px-6 py-14 text-center">
      <h3 className="display text-base font-bold text-sand-700">{judul}</h3>
      {keterangan && (
        <p className="max-w-sm text-sm text-sand-500">{keterangan}</p>
      )}
      {aksi}
    </div>
  );
}

export function Memuat({ pesan = "Memuat data…" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-sand-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-sand-300 border-t-brand-500" />
      {pesan}
    </div>
  );
}

export function Galat({ pesan, onCoba }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-rust-100 bg-rust-100/50 px-5 py-4">
      <p className="text-sm font-semibold text-rust-500">{pesan}</p>
      {onCoba && (
        <Tombol variant="garis" size="sm" onClick={onCoba}>
          Coba lagi
        </Tombol>
      )}
    </div>
  );
}

// ---------- Dialog ----------
export function Dialog({ terbuka, onTutup, judul, keterangan, children, lebar = "max-w-lg" }) {
  if (!terbuka) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-900/40 p-4 backdrop-blur-sm sm:items-center">
      <div
        className={`w-full ${lebar} max-h-[90vh] overflow-y-auto rounded-2xl border border-sand-200 bg-white p-6 shadow-2xl`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="display text-lg font-bold text-sand-800">{judul}</h2>
            {keterangan && (
              <p className="mt-1 text-sm text-sand-500">{keterangan}</p>
            )}
          </div>
          <button
            onClick={onTutup}
            aria-label="Tutup"
            className="rounded-lg px-2 py-1 text-lg leading-none text-sand-400 transition hover:bg-sand-100 hover:text-sand-700"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------- Judul halaman ----------
export function JudulHalaman({ judul, keterangan, aksi }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-2xl font-bold text-sand-800">{judul}</h1>
        {keterangan && (
          <p className="mt-1 max-w-2xl text-sm text-sand-500">{keterangan}</p>
        )}
      </div>
      {aksi && <div className="flex flex-wrap gap-2">{aksi}</div>}
    </div>
  );
}
