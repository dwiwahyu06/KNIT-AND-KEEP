import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { notifikasiApi } from "../lib/api";
import { tanggal } from "../lib/format";

const WARNA = {
  PESANAN: "bg-brand-100 text-brand-600",
  RETUR: "bg-amber-100 text-amber-ui",
  PEMBAYARAN: "bg-leaf-100 text-leaf-500",
};

/**
 * Lonceng pemberitahuan di navigasi toko.
 *
 * Kabar dibuat otomatis oleh backend setiap status pesanan berubah, sehingga
 * pelanggan tahu ada perkembangan tanpa harus membuka halaman pesanan
 * berulang kali untuk memeriksa sendiri.
 */
export default function Pemberitahuan() {
  const [buka, setBuka] = useState(false);
  const [isi, setIsi] = useState([]);
  const [belumDibaca, setBelumDibaca] = useState(0);
  const [memuat, setMemuat] = useState(false);
  const wadah = useRef(null);

  const hitungBelumDibaca = useCallback(async () => {
    try {
      const r = await notifikasiApi.jumlahBelumDibaca();
      setBelumDibaca(r.belumDibaca || 0);
    } catch {
      /* sesi mungkin sudah berakhir; lonceng cukup diam */
    }
  }, []);

  useEffect(() => {
    hitungBelumDibaca();
    // Diperiksa berkala supaya kabar dari admin muncul tanpa memuat ulang halaman.
    const timer = setInterval(hitungBelumDibaca, 60000);
    return () => clearInterval(timer);
  }, [hitungBelumDibaca]);

  // Menutup daftar saat pengguna mengklik di luar area lonceng.
  useEffect(() => {
    if (!buka) return;
    const tutup = (e) => {
      if (wadah.current && !wadah.current.contains(e.target)) setBuka(false);
    };
    document.addEventListener("mousedown", tutup);
    return () => document.removeEventListener("mousedown", tutup);
  }, [buka]);

  const bukaDaftar = async () => {
    const baru = !buka;
    setBuka(baru);
    if (!baru) return;

    setMemuat(true);
    try {
      const r = await notifikasiApi.milikSaya(0, 15);
      setIsi(r.isi || []);
      setBelumDibaca(r.belumDibaca || 0);
    } catch {
      setIsi([]);
    } finally {
      setMemuat(false);
    }
  };

  const bacaSemua = async () => {
    await notifikasiApi.bacaSemua();
    setIsi((lama) => lama.map((n) => ({ ...n, dibaca: true })));
    setBelumDibaca(0);
  };

  const bacaSatu = async (n) => {
    if (n.dibaca) return;
    await notifikasiApi.baca(n.id);
    setIsi((lama) => lama.map((x) => (x.id === n.id ? { ...x, dibaca: true } : x)));
    setBelumDibaca((j) => Math.max(0, j - 1));
  };

  return (
    <div className="relative" ref={wadah}>
      <button
        onClick={bukaDaftar}
        aria-label={`Pemberitahuan${belumDibaca ? `, ${belumDibaca} belum dibaca` : ""}`}
        className="relative rounded-lg border border-sand-300 px-3 py-1.5 text-sand-600 transition hover:border-brand-400 hover:text-brand-600"
      >
        <span aria-hidden="true">🔔</span>
        {belumDibaca > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rust-500 px-1 text-[10px] font-bold text-white">
            {belumDibaca > 9 ? "9+" : belumDibaca}
          </span>
        )}
      </button>

      {buka && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-sand-200 bg-white shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b border-sand-200 bg-sand-100 px-4 py-2.5">
            <span className="text-sm font-semibold text-sand-800">Pemberitahuan</span>
            {belumDibaca > 0 && (
              <button onClick={bacaSemua} className="text-xs font-semibold text-brand-600 hover:underline">
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {memuat ? (
              <p className="px-4 py-8 text-center text-sm text-sand-400">Memuat…</p>
            ) : isi.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-sand-400">
                Belum ada kabar. Perkembangan pesanan akan muncul di sini.
              </p>
            ) : (
              isi.map((n) => (
                <Link
                  key={n.id}
                  to="/Transaksi"
                  onClick={() => { bacaSatu(n); setBuka(false); }}
                  className={`block border-b border-sand-100 px-4 py-3 transition last:border-0 hover:bg-sand-50 ${
                    n.dibaca ? "" : "bg-brand-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-sand-800">{n.judul}</span>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        WARNA[n.jenis] || "bg-sand-200 text-sand-600"
                      }`}
                    >
                      {n.jenis}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-sand-600">{n.pesan}</p>
                  <p className="mt-1 text-xs text-sand-400">{tanggal(n.waktu, true)}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
