import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { adminSaatIni, keluar } from "../lib/session";

/**
 * Rangka halaman admin: sidebar tetap di kiri, isi halaman di kanan.
 *
 * Menunya dikelompokkan mengikuti cara kerja toko — penjualan dulu, lalu
 * barang, lalu pembukuan — bukan mengikuti urutan file di kode.
 */

const MENU = [
  {
    kelompok: "Ringkasan",
    item: [{ ke: "/Dashboard", label: "Dashboard", ikon: "◧" }],
  },
  {
    kelompok: "Penjualan",
    item: [
      { ke: "/AdminOrdersPage", label: "Pesanan", ikon: "▤" },
      { ke: "/Kasir", label: "Kasir Offline", ikon: "◨" },
      { ke: "/AdminRetur", label: "Komplain & Retur", ikon: "⟲" },
      { ke: "/AdminTestimoni", label: "Testimoni", ikon: "★" },
    ],
  },
  {
    kelompok: "Barang",
    item: [
      { ke: "/Barang", label: "Katalog Produk", ikon: "▦" },
      { ke: "/Stock", label: "Stok", ikon: "▥" },
      { ke: "/KartuStok", label: "Kartu Stok", ikon: "⇄" },
    ],
  },
  {
    kelompok: "Pembukuan",
    item: [
      { ke: "/Keuangan", label: "Transaksi", ikon: "⌗" },
      { ke: "/CashFlow", label: "Arus Kas", ikon: "⇅" },
      { ke: "/Expenses", label: "Pengeluaran", ikon: "−" },
      { ke: "/IncomeStatement", label: "Laba Rugi", ikon: "≡" },
      { ke: "/MonthlyReport", label: "Laporan Bulanan", ikon: "▭" },
      { ke: "/Analisis", label: "Analisis Penjualan", ikon: "◈" },
    ],
  },
  {
    kelompok: "Pengguna",
    item: [{ ke: "/User", label: "Akun", ikon: "◯" }],
  },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const admin = adminSaatIni();
  const [bukaMenu, setBukaMenu] = useState(false);

  const handleKeluar = () => {
    keluar();
    navigate("/login");
  };

  const isiSidebar = (
    <>
      <div className="px-5 py-6">
        <NavLink to="/Dashboard" className="display block text-lg font-bold text-white">
          Knit &amp; Keep
        </NavLink>
        <p className="label-mono mt-1 text-brand-300">Panel Admin</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {MENU.map((k) => (
          <div key={k.kelompok}>
            <p className="label-mono px-2 pb-2 text-brand-300">{k.kelompok}</p>
            <div className="space-y-0.5">
              {k.item.map((m) => (
                <NavLink
                  key={m.ke}
                  to={m.ke}
                  onClick={() => setBukaMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-wool-400 text-brand-800"
                        : "text-brand-100 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <span className="w-4 text-center opacity-70">{m.ikon}</span>
                  {m.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-sm font-semibold text-white">
          {admin?.username || "Admin"}
        </p>
        <p className="mb-3 text-xs text-brand-300">{admin?.email || "—"}</p>
        <button
          onClick={handleKeluar}
          className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          Keluar
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Sidebar layar besar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-brand-600 lg:flex">
        {isiSidebar}
      </aside>

      {/* Sidebar layar kecil */}
      {bukaMenu && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-brand-900/50"
            onClick={() => setBukaMenu(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-brand-600">
            {isiSidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-sand-200 bg-sand-50/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setBukaMenu(true)}
            aria-label="Buka menu"
            className="rounded-lg border border-sand-300 px-3 py-1.5 text-sand-700"
          >
            ☰
          </button>
          <span className="display font-bold text-sand-800">Knit &amp; Keep</span>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
