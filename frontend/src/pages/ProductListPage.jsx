import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ShopLayout from "../components/ShopLayout";
import {
  Chip, Galat, Input, JudulHalaman, Kartu, Kosong, Memuat, Pilihan, Tombol,
} from "../components/ui";
import { keranjangApi, produkApi, urlBerkas } from "../lib/api";
import { rupiah } from "../lib/format";
import { pelangganId } from "../lib/session";

export default function ProductListPage() {
  const navigate = useNavigate();
  const id = pelangganId();

  const [produk, setProduk] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [pesan, setPesan] = useState("");
  const [cari, setCari] = useState("");
  const [kategori, setKategori] = useState("");
  const [urut, setUrut] = useState("newest");

  const ambil = useCallback(async () => {
    setMemuat(true);
    try {
      setProduk(await produkApi.semua(`?sort=${urut}`));
      setGalat("");
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
  }, [urut]);

  useEffect(() => {
    ambil();
  }, [ambil]);

  const kategoriTersedia = useMemo(
    () => [...new Set(produk.map((p) => p.category).filter(Boolean))].sort(),
    [produk]
  );

  const terlihat = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return produk.filter((p) => {
      const cocok = !q || p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
      return cocok && (!kategori || p.category === kategori);
    });
  }, [produk, cari, kategori]);

  const tambah = async (p) => {
    if (!id) {
      navigate("/LoginPelanggan");
      return;
    }
    setGalat("");
    try {
      await keranjangApi.tambah(id, p.id, 1);
      setPesan(`${p.name} masuk keranjang.`);
      setTimeout(() => setPesan(""), 2500);
    } catch (e) {
      setGalat(e.message);
    }
  };

  return (
    <ShopLayout>
      <JudulHalaman
        judul="Katalog"
        keterangan="Pakaian thrifting pilihan — tiap barang hanya ada beberapa, jadi stoknya terbatas."
      />

      {pesan && (
        <div className="mb-4 rounded-lg border border-leaf-100 bg-leaf-100/60 px-4 py-3 text-sm font-medium text-leaf-500">
          {pesan}
        </div>
      )}
      {galat && <div className="mb-4"><Galat pesan={galat} onCoba={ambil} /></div>}

      <Kartu className="mb-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input placeholder="Cari barang…" value={cari} onChange={(e) => setCari(e.target.value)} />
          <Pilihan value={kategori} onChange={(e) => setKategori(e.target.value)}>
            <option value="">Semua kategori</option>
            {kategoriTersedia.map((k) => <option key={k} value={k}>{k}</option>)}
          </Pilihan>
          <Pilihan value={urut} onChange={(e) => setUrut(e.target.value)}>
            <option value="newest">Terbaru</option>
            <option value="termurah">Harga termurah</option>
            <option value="termahal">Harga termahal</option>
            <option value="nama">Nama A–Z</option>
          </Pilihan>
        </div>
      </Kartu>

      {memuat ? (
        <Memuat />
      ) : terlihat.length === 0 ? (
        <Kosong
          judul="Tidak ada barang"
          keterangan="Coba ubah kata kunci atau pilih kategori lain."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {terlihat.map((p) => {
            const habis = (p.stock || 0) === 0;
            return (
              <div
                key={p.id}
                className="flex flex-col overflow-hidden rounded-xl border border-sand-200 bg-white transition hover:border-brand-300"
              >
                <Link to={`/produk/${p.id}`} className="relative block aspect-4/5 bg-sand-100">
                  {p.image ? (
                    <img src={urlBerkas(p.image)} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sand-300">
                      <span className="display text-4xl">◻</span>
                    </div>
                  )}
                  {habis && (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-bold text-sand-500">
                      Stok habis
                    </span>
                  )}
                  {!habis && (p.stock || 0) <= 3 && (
                    <span className="absolute left-2 top-2">
                      <Chip className="bg-amber-100 text-amber-ui">Sisa {p.stock}</Chip>
                    </span>
                  )}
                </Link>

                <div className="flex flex-1 flex-col gap-1 p-4">
                  <span className="label-mono text-sand-400">{p.category || "Umum"}</span>
                  <Link
                    to={`/produk/${p.id}`}
                    className="line-clamp-2 text-sm font-semibold text-sand-800 transition hover:text-brand-600"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-sand-400">
                    {[p.size, p.color].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="tabular mt-1 text-base font-bold text-brand-600">{rupiah(p.sellPrice)}</p>
                  <Tombol
                    className="mt-3 w-full"
                    size="sm"
                    disabled={habis}
                    onClick={() => tambah(p)}
                  >
                    {habis ? "Habis" : "Tambah ke keranjang"}
                  </Tombol>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ShopLayout>
  );
}
