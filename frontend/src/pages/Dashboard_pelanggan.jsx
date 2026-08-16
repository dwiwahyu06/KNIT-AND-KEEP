import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ShopLayout from "../components/ShopLayout";
import { Chip, Kartu, KartuJudul, Kosong, Memuat, Tombol } from "../components/ui";
import { pesananApi, produkApi, urlBerkas } from "../lib/api";
import { labelStatus, rupiah, tanggal, warnaStatus } from "../lib/format";
import { pelangganId, pelangganNama } from "../lib/session";

export default function DashboardPelanggan() {
  const id = pelangganId();
  const [produk, setProduk] = useState([]);
  const [pesanan, setPesanan] = useState([]);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, o] = await Promise.all([
          produkApi.semua("?sort=newest"),
          id ? pesananApi.milikSaya(id) : Promise.resolve([]),
        ]);
        setProduk(p.filter((x) => (x.stock || 0) > 0).slice(0, 8));
        setPesanan(o);
      } catch {
        /* halaman tetap tampil walau salah satu gagal */
      } finally {
        setMemuat(false);
      }
    })();
  }, [id]);

  const berjalan = pesanan.filter(
    (p) => !["SELESAI", "DIBATALKAN"].includes(p.status)
  );

  if (memuat) return <ShopLayout><Memuat /></ShopLayout>;

  return (
    <ShopLayout>
      <div className="mb-8 rounded-2xl bg-brand-600 px-6 py-10 sm:px-10">
        <p className="label-mono text-brand-300">Selamat datang kembali</p>
        <h1 className="display mt-1 text-3xl font-bold text-white">{pelangganNama()}</h1>
        <p className="mt-2 max-w-lg text-brand-100">
          Barang thrifting datang dan pergi cepat. Cek katalog hari ini sebelum
          keduluan orang lain.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/products"><Tombol variant="aksen">Lihat katalog</Tombol></Link>
          <Link to="/Transaksi">
            <Tombol variant="garis" className="border-white/30 bg-white/10 text-white hover:border-white hover:text-white">
              Pesanan saya
            </Tombol>
          </Link>
        </div>
      </div>

      {berjalan.length > 0 && (
        <Kartu className="mb-8">
          <KartuJudul
            judul="Pesanan yang sedang berjalan"
            aksi={<Link to="/Transaksi"><Tombol variant="halus" size="sm">Lihat semua</Tombol></Link>}
          />
          <ul className="divide-y divide-sand-100">
            {berjalan.slice(0, 3).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-mono text-xs font-semibold text-brand-600">{p.orderId}</p>
                  <p className="text-xs text-sand-400">
                    {tanggal(p.createdAt)} · {p.totalQty} barang
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Chip className={warnaStatus(p.status)}>{labelStatus(p.status)}</Chip>
                  <span className="tabular font-semibold text-sand-800">{rupiah(p.amount)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Kartu>
      )}

      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="display text-xl font-bold text-sand-800">Baru masuk</h2>
          <p className="text-sm text-sand-500">Koleksi terbaru yang stoknya masih ada.</p>
        </div>
        <Link to="/products" className="text-sm font-semibold text-brand-600 hover:underline">
          Semua barang →
        </Link>
      </div>

      {produk.length === 0 ? (
        <Kosong judul="Belum ada barang" keterangan="Katalog sedang kosong, coba lagi nanti." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {produk.map((p) => (
            <Link
              key={p.id}
              to={`/produk/${p.id}`}
              className="overflow-hidden rounded-xl border border-sand-200 bg-white transition hover:border-brand-300"
            >
              <div className="aspect-4/5 bg-sand-100">
                {p.image ? (
                  <img src={urlBerkas(p.image)} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sand-300">
                    <span className="display text-4xl">◻</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <span className="label-mono text-sand-400">{p.category || "Umum"}</span>
                <h3 className="line-clamp-2 text-sm font-semibold text-sand-800">{p.name}</h3>
                <p className="tabular mt-1 font-bold text-brand-600">{rupiah(p.sellPrice)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </ShopLayout>
  );
}
