import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  AreaTeks, Chip, Galat, Input, Isian, JudulHalaman, Kartu, KartuJudul,
  Kosong, Memuat, Pilihan, Tombol,
} from "../components/ui";
import { pesananApi, produkApi } from "../lib/api";
import { rupiah } from "../lib/format";

/**
 * Kasir toko.
 *
 * Alurnya sengaja dibuat sama dengan checkout online — pilih barang, hitung
 * total, simpan — supaya stok dan pembukuan memakai jalur yang sama persis.
 * Bedanya hanya pelanggan ditulis sebagai keterangan, dan tidak ada Midtrans,
 * alamat, maupun ongkir.
 */
export default function Kasir() {
  const navigate = useNavigate();

  const [produk, setProduk] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [cari, setCari] = useState("");
  const [keranjang, setKeranjang] = useState([]);
  const [menyimpan, setMenyimpan] = useState(false);
  const [struk, setStruk] = useState(null);

  const [form, setForm] = useState({
    namaPelanggan: "Offline",
    metodeBayar: "TUNAI",
    catatan: "",
    dibayar: "",
  });

  useEffect(() => {
    (async () => {
      try {
        setProduk(await produkApi.semua());
      } catch (e) {
        setGalat(e.message);
      } finally {
        setMemuat(false);
      }
    })();
  }, []);

  const hasilCari = useMemo(() => {
    const q = cari.trim().toLowerCase();
    const tersedia = produk.filter((p) => (p.stock || 0) > 0);
    if (!q) return tersedia.slice(0, 8);
    return tersedia
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [produk, cari]);

  const total = keranjang.reduce((t, i) => t + i.sellPrice * i.qty, 0);
  const modal = keranjang.reduce((t, i) => t + (i.costPrice || 0) * i.qty, 0);
  const kembalian = Number(form.dibayar || 0) - total;

  const tambah = (p) => {
    setGalat("");
    setKeranjang((k) => {
      const ada = k.find((i) => i.id === p.id);
      if (ada) {
        if (ada.qty >= p.stock) {
          setGalat(`Stok ${p.name} hanya ${p.stock}.`);
          return k;
        }
        return k.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...k, { ...p, qty: 1 }];
    });
  };

  const ubahQty = (id, qty) => {
    setKeranjang((k) =>
      k
        .map((i) => {
          if (i.id !== id) return i;
          const batas = Math.min(Math.max(qty, 0), i.stock);
          return { ...i, qty: batas };
        })
        .filter((i) => i.qty > 0)
    );
  };

  const simpan = async () => {
    if (keranjang.length === 0) {
      setGalat("Belum ada barang yang dipilih.");
      return;
    }
    setMenyimpan(true);
    setGalat("");
    try {
      const hasil = await pesananApi.penjualanOffline({
        items: keranjang.map((i) => ({ productId: i.id, quantity: i.qty })),
        namaPelanggan: form.namaPelanggan.trim() || "Offline",
        metodeBayar: form.metodeBayar,
        catatan: form.catatan,
      });
      setStruk({ ...hasil, dibayar: Number(form.dibayar || 0) });
      setKeranjang([]);
      setForm((f) => ({ ...f, catatan: "", dibayar: "" }));
      setProduk(await produkApi.semua());
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMenyimpan(false);
    }
  };

  if (memuat) return <AdminLayout><Memuat /></AdminLayout>;

  return (
    <AdminLayout>
      <JudulHalaman
        judul="Kasir Offline"
        keterangan="Penjualan langsung di toko. Tersimpan sebagai pesanan biasa dengan keterangan pelanggan Offline, sehingga stok dan laporan keuangan ikut terbarui."
        aksi={<Tombol variant="garis" size="sm" onClick={() => navigate("/AdminOrdersPage?channel=OFFLINE")}>Riwayat penjualan offline</Tombol>}
      />

      {struk && (
        <Kartu className="mb-5 border-leaf-100 bg-leaf-100/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-leaf-500">Penjualan tersimpan</p>
              <p className="mt-0.5 text-sm text-sand-600">
                <span className="font-mono">{struk.orderId}</span> · {rupiah(struk.amount)}
                {struk.dibayar > struk.amount && ` · kembalian ${rupiah(struk.dibayar - struk.amount)}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Tombol variant="garis" size="sm" onClick={() => navigate(`/AdminOrderDetailPage/${struk.id}`)}>
                Lihat pesanan
              </Tombol>
              <Tombol variant="halus" size="sm" onClick={() => setStruk(null)}>Tutup</Tombol>
            </div>
          </div>
        </Kartu>
      )}

      {galat && <div className="mb-4"><Galat pesan={galat} /></div>}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Pilih barang */}
        <div className="space-y-4 lg:col-span-3">
          <Kartu>
            <KartuJudul judul="Pilih barang" keterangan="Hanya barang yang stoknya masih ada yang muncul di sini." />
            <Input
              autoFocus
              placeholder="Ketik nama, SKU, atau kategori…"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
            />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {hasilCari.length === 0 ? (
                <p className="col-span-full py-6 text-center text-sm text-sand-400">
                  Tidak ada barang yang cocok.
                </p>
              ) : (
                hasilCari.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => tambah(p)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-left transition hover:border-brand-400 hover:bg-sand-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-sand-800">{p.name}</span>
                      <span className="font-mono text-xs text-sand-400">{p.sku} · sisa {p.stock}</span>
                    </span>
                    <span className="tabular shrink-0 text-sm font-semibold text-brand-600">
                      {rupiah(p.sellPrice)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </Kartu>
        </div>

        {/* Struk */}
        <div className="space-y-4 lg:col-span-2">
          <Kartu>
            <KartuJudul judul="Keranjang kasir" />
            {keranjang.length === 0 ? (
              <Kosong judul="Belum ada barang" keterangan="Klik barang di sebelah kiri untuk menambahkannya." />
            ) : (
              <ul className="divide-y divide-sand-100">
                {keranjang.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-sand-800">{i.name}</p>
                      <p className="tabular text-xs text-sand-400">{rupiah(i.sellPrice)} × {i.qty}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => ubahQty(i.id, i.qty - 1)}
                        className="h-7 w-7 rounded-md border border-sand-300 text-sand-600 transition hover:bg-sand-100"
                        aria-label="Kurangi"
                      >−</button>
                      <span className="tabular w-7 text-center text-sm font-semibold">{i.qty}</span>
                      <button
                        onClick={() => ubahQty(i.id, i.qty + 1)}
                        className="h-7 w-7 rounded-md border border-sand-300 text-sand-600 transition hover:bg-sand-100"
                        aria-label="Tambah"
                      >+</button>
                    </div>
                    <span className="tabular w-24 shrink-0 text-right text-sm font-semibold text-sand-800">
                      {rupiah(i.sellPrice * i.qty)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {keranjang.length > 0 && (
              <div className="mt-4 space-y-1.5 border-t border-sand-200 pt-4 text-sm">
                <div className="flex justify-between text-sand-500">
                  <span>Modal barang</span><span className="tabular">{rupiah(modal)}</span>
                </div>
                <div className="flex justify-between text-leaf-500">
                  <span>Perkiraan laba</span><span className="tabular font-semibold">{rupiah(total - modal)}</span>
                </div>
                <div className="flex justify-between border-t border-sand-200 pt-2 text-base font-bold text-sand-800">
                  <span>Total</span><span className="tabular">{rupiah(total)}</span>
                </div>
              </div>
            )}
          </Kartu>

          <Kartu>
            <KartuJudul judul="Data penjualan" />
            <div className="space-y-3">
              <Isian
                label="Keterangan pelanggan"
                hint="Biarkan Offline kalau pembelinya tidak dicatat namanya."
              >
                <Input
                  value={form.namaPelanggan}
                  onChange={(e) => setForm({ ...form, namaPelanggan: e.target.value })}
                  placeholder="Offline"
                />
              </Isian>
              <Isian label="Metode bayar">
                <Pilihan value={form.metodeBayar} onChange={(e) => setForm({ ...form, metodeBayar: e.target.value })}>
                  <option value="TUNAI">Tunai</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="QRIS">QRIS</option>
                </Pilihan>
              </Isian>
              {form.metodeBayar === "TUNAI" && keranjang.length > 0 && (
                <Isian label="Uang diterima" hint={
                  form.dibayar && kembalian >= 0
                    ? `Kembalian ${rupiah(kembalian)}`
                    : form.dibayar
                    ? "Uang belum cukup."
                    : undefined
                }>
                  <Input
                    type="number"
                    min="0"
                    value={form.dibayar}
                    onChange={(e) => setForm({ ...form, dibayar: e.target.value })}
                    placeholder={String(total)}
                  />
                </Isian>
              )}
              <Isian label="Catatan">
                <AreaTeks
                  value={form.catatan}
                  onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                  placeholder="Opsional"
                />
              </Isian>

              <Tombol
                variant="aksen"
                className="w-full"
                onClick={simpan}
                disabled={menyimpan || keranjang.length === 0}
              >
                {menyimpan ? "Menyimpan…" : `Simpan penjualan · ${rupiah(total)}`}
              </Tombol>
              <p className="text-xs text-sand-400">
                Stok langsung berkurang dan kas masuk otomatis tercatat. Status pesanan
                langsung <Chip className="bg-leaf-100 text-leaf-500">Selesai</Chip>
              </p>
            </div>
          </Kartu>
        </div>
      </div>
    </AdminLayout>
  );
}
