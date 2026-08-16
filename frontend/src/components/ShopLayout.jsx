import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { keranjangApi } from "../lib/api";
import { keluar, pelangganId, pelangganNama } from "../lib/session";
import Pemberitahuan from "./Pemberitahuan";

const MENU = [
  { ke: "/products", label: "Katalog" },
  { ke: "/CartPage", label: "Keranjang" },
  { ke: "/Transaksi", label: "Pesanan Saya" },
  { ke: "/AddressListPage", label: "Alamat" },
];

/** Rangka halaman sisi pelanggan: navigasi atas, isi di tengah, footer ringkas. */
export default function ShopLayout({ children, lebar = "max-w-6xl" }) {
  const navigate = useNavigate();
  const id = pelangganId();
  const [jumlahKeranjang, setJumlahKeranjang] = useState(0);
  const [buka, setBuka] = useState(false);

  useEffect(() => {
    if (!id) return;
    keranjangApi
      .isi(id)
      .then((isi) => setJumlahKeranjang(isi.reduce((t, i) => t + i.quantity, 0)))
      .catch(() => setJumlahKeranjang(0));
  }, [id]);

  const handleKeluar = () => {
    keluar();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <header className="sticky top-0 z-30 border-b border-sand-200 bg-white/95 backdrop-blur">
        <nav className={`mx-auto flex ${lebar} items-center justify-between gap-4 px-4 py-3.5 sm:px-6`}>
          <Link to="/Dashboard_pelanggan" className="display text-lg font-bold text-brand-600">
            Knit &amp; Keep
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {MENU.map((m) => (
              <NavLink
                key={m.ke}
                to={m.ke}
                className={({ isActive }) =>
                  `relative rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? "bg-brand-50 text-brand-600" : "text-sand-600 hover:text-brand-600"
                  }`
                }
              >
                {m.label}
                {m.ke === "/CartPage" && jumlahKeranjang > 0 && (
                  <span className="ml-1.5 rounded-full bg-wool-400 px-1.5 py-0.5 text-[10px] font-bold text-brand-800">
                    {jumlahKeranjang}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {id ? (
              <>
                <Pemberitahuan />
                <Link
                  to="/Profile"
                  className="hidden text-sm font-medium text-sand-600 transition hover:text-brand-600 sm:block"
                >
                  {pelangganNama()}
                </Link>
                <button
                  onClick={handleKeluar}
                  className="rounded-lg border border-sand-300 px-3 py-1.5 text-sm font-semibold text-sand-600 transition hover:border-brand-400 hover:text-brand-600"
                >
                  Keluar
                </button>
              </>
            ) : (
              <Link
                to="/LoginPelanggan"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Masuk
              </Link>
            )}
            <button
              onClick={() => setBuka((b) => !b)}
              aria-label="Menu"
              className="rounded-lg border border-sand-300 px-3 py-1.5 text-sand-600 md:hidden"
            >
              ☰
            </button>
          </div>
        </nav>

        {buka && (
          <div className="border-t border-sand-200 bg-white px-4 py-2 md:hidden">
            {MENU.map((m) => (
              <NavLink
                key={m.ke}
                to={m.ke}
                onClick={() => setBuka(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-sand-700 hover:bg-sand-50"
              >
                {m.label}
                {m.ke === "/CartPage" && jumlahKeranjang > 0 && ` (${jumlahKeranjang})`}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      <main className={`mx-auto w-full ${lebar} flex-1 px-4 py-8 sm:px-6`}>{children}</main>

      <footer className="border-t border-sand-200 bg-white">
        <div className={`mx-auto ${lebar} flex flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-sand-400 sm:px-6`}>
          <span>Knit &amp; Keep — thrifting rajut dan pakaian bekas layak pakai.</span>
          <span>Butuh bantuan? Ajukan komplain lewat halaman Pesanan Saya.</span>
        </div>
      </footer>
    </div>
  );
}
