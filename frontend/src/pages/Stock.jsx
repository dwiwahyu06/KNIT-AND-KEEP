import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Baris, Chip, Dialog, Galat, Input, Isian, JudulHalaman, Kartu, KartuAngka,
  Kosong, Memuat, Sel, Tabel, Tombol, AreaTeks,
} from "../components/ui";
import { produkApi } from "../lib/api";
import { angka, rupiah } from "../lib/format";

/**
 * Manajemen stok. Bekerja langsung di atas produk, bukan tabel terpisah,
 * supaya angka stok di katalog dan di kasir selalu sama.
 */
export default function Stock() {
  const [produk, setProduk] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [pesan, setPesan] = useState("");
  const [cari, setCari] = useState("");
  const [hanyaMenipis, setHanyaMenipis] = useState(false);

  const [dialog, setDialog] = useState(null); // { produk, mode }
  const [form, setForm] = useState({ qty: "1", hargaBeli: "", alasan: "" });
  const [menyimpan, setMenyimpan] = useState(false);

  const ambil = useCallback(async () => {
    setMemuat(true);
    try {
      setProduk(await produkApi.semua("?sort=stok"));
      setGalat("");
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    ambil();
  }, [ambil]);

  const terlihat = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return produk.filter((p) => {
      const cocok = !q || p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
      const menipis = !hanyaMenipis || (p.stock || 0) <= 3;
      return cocok && menipis;
    });
  }, [produk, cari, hanyaMenipis]);

  const totalUnit = produk.reduce((t, p) => t + (p.stock || 0), 0);
  const nilai = produk.reduce((t, p) => t + (p.costPrice || 0) * (p.stock || 0), 0);
  const habis = produk.filter((p) => (p.stock || 0) === 0).length;
  const menipis = produk.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 3).length;

  const buka = (p, mode) => {
    setDialog({ produk: p, mode });
    setForm({ qty: "1", hargaBeli: mode === "tambah" ? String(p.costPrice ?? "") : "", alasan: "" });
    setPesan("");
  };

  const kirim = async (e) => {
    e.preventDefault();
    setMenyimpan(true);
    setGalat("");
    try {
      const qty = Number(form.qty);
      if (dialog.mode === "tambah") {
        await produkApi.tambahStok(dialog.produk.id, qty, Number(form.hargaBeli) || null);
        setPesan(`${qty} unit ${dialog.produk.name} ditambahkan.`);
      } else {
        await produkApi.kurangiStok(dialog.produk.id, qty, form.alasan);
        setPesan(`${qty} unit ${dialog.produk.name} dikeluarkan.`);
      }
      setDialog(null);
      await ambil();
    } catch (err) {
      setGalat(err.message);
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <AdminLayout>
      <JudulHalaman
        judul="Stok"
        keterangan="Barang masuk dan keluar di luar penjualan. Penjualan sendiri sudah otomatis memotong stok."
        aksi={<Tombol variant="garis" size="sm" onClick={ambil}>Muat ulang</Tombol>}
      />

      {pesan && (
        <div className="mb-4 rounded-lg border border-leaf-100 bg-leaf-100/60 px-4 py-3 text-sm font-medium text-leaf-500">
          {pesan}
        </div>
      )}
      {galat && <div className="mb-4"><Galat pesan={galat} onCoba={ambil} /></div>}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KartuAngka label="Total unit" nilai={angka(totalUnit)} catatan={`${produk.length} jenis produk`} />
        <KartuAngka label="Nilai persediaan" nilai={rupiah(nilai)} catatan="Dihitung dari harga modal" nada="brand" />
        <KartuAngka label="Stok menipis" nilai={angka(menipis)} catatan="Sisa 1–3 unit" nada={menipis ? "perhatian" : "netral"} />
        <KartuAngka label="Stok habis" nilai={angka(habis)} catatan="Tidak muncul di katalog" nada={habis ? "bahaya" : "netral"} />
      </div>

      <Kartu className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="flex-1"
            placeholder="Cari nama atau SKU…"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-sand-600">
            <input
              type="checkbox"
              checked={hanyaMenipis}
              onChange={(e) => setHanyaMenipis(e.target.checked)}
              className="h-4 w-4 accent-brand-600"
            />
            Hanya yang menipis
          </label>
        </div>
      </Kartu>

      {memuat ? (
        <Memuat />
      ) : terlihat.length === 0 ? (
        <Kosong judul="Tidak ada produk" keterangan="Tambahkan produk dulu di halaman Katalog Produk." />
      ) : (
        <Tabel kepala={["Produk", "Harga modal", "Nilai stok", "Stok", "Aksi"]} min="min-w-[760px]">
          {terlihat.map((p) => (
            <Baris key={p.id}>
              <Sel>
                <span className="font-medium text-sand-800">{p.name}</span>
                <div className="font-mono text-xs text-sand-400">{p.sku}</div>
              </Sel>
              <Sel className="tabular text-sand-500">{rupiah(p.costPrice)}</Sel>
              <Sel className="tabular">{rupiah((p.costPrice || 0) * (p.stock || 0))}</Sel>
              <Sel>
                <Chip className={
                  (p.stock || 0) === 0 ? "bg-rust-100 text-rust-500"
                    : (p.stock || 0) <= 3 ? "bg-amber-100 text-amber-ui"
                    : "bg-leaf-100 text-leaf-500"
                }>
                  {p.stock ?? 0} unit
                </Chip>
              </Sel>
              <Sel>
                <div className="flex justify-end gap-2">
                  <Tombol size="sm" onClick={() => buka(p, "tambah")}>Barang masuk</Tombol>
                  <Tombol size="sm" variant="garis" disabled={(p.stock || 0) === 0} onClick={() => buka(p, "kurangi")}>
                    Barang keluar
                  </Tombol>
                </div>
              </Sel>
            </Baris>
          ))}
        </Tabel>
      )}

      <Dialog
        terbuka={!!dialog}
        onTutup={() => setDialog(null)}
        judul={dialog?.mode === "tambah" ? "Barang masuk" : "Barang keluar"}
        keterangan={dialog ? `${dialog.produk.name} · stok sekarang ${dialog.produk.stock ?? 0}` : ""}
      >
        {dialog && (
          <form onSubmit={kirim} className="space-y-4">
            <Isian label="Jumlah" wajib>
              <Input
                type="number"
                min="1"
                max={dialog.mode === "kurangi" ? dialog.produk.stock : undefined}
                required
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
              />
            </Isian>

            {dialog.mode === "tambah" ? (
              <Isian
                label="Harga beli per unit"
                hint="Harga modal akan dihitung ulang sebagai rata-rata tertimbang, supaya HPP tetap masuk akal saat harga beli berubah."
              >
                <Input
                  type="number"
                  min="0"
                  value={form.hargaBeli}
                  onChange={(e) => setForm({ ...form, hargaBeli: e.target.value })}
                />
              </Isian>
            ) : (
              <Isian label="Alasan" hint="Misalnya barang rusak, hilang, atau dipakai sendiri.">
                <AreaTeks value={form.alasan} onChange={(e) => setForm({ ...form, alasan: e.target.value })} />
              </Isian>
            )}

            <div className="rounded-lg bg-sand-100 px-3 py-2.5 text-sm text-sand-600">
              Stok setelah perubahan:{" "}
              <b className="tabular text-sand-800">
                {dialog.mode === "tambah"
                  ? (dialog.produk.stock || 0) + Number(form.qty || 0)
                  : Math.max((dialog.produk.stock || 0) - Number(form.qty || 0), 0)}{" "}
                unit
              </b>
            </div>

            <div className="flex gap-2">
              <Tombol type="submit" className="flex-1" disabled={menyimpan}>
                {menyimpan ? "Menyimpan…" : "Simpan"}
              </Tombol>
              <Tombol type="button" variant="halus" onClick={() => setDialog(null)}>Batal</Tombol>
            </div>
          </form>
        )}
      </Dialog>
    </AdminLayout>
  );
}
