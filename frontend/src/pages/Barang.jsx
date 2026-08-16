import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Baris, Chip, Dialog, Galat, Input, Isian, JudulHalaman, Kartu, Kosong,
  Memuat, Pilihan, Sel, Tabel, Tombol,
} from "../components/ui";
import { produkApi, urlBerkas } from "../lib/api";
import { rupiah } from "../lib/format";
import { bacaGambarKecil, ukuranKb } from "../lib/gambar";

const KOSONG = {
  sku: "", name: "", category: "", size: "", color: "",
  costPrice: "", sellPrice: "", stock: "", supplier: "", image: "", weight: "",
};

export default function Barang() {
  const [produk, setProduk] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [cari, setCari] = useState("");
  const [kategori, setKategori] = useState("");
  const [urut, setUrut] = useState("newest");

  const [form, setForm] = useState(KOSONG);
  const [sedangEdit, setSedangEdit] = useState(null);
  const [buka, setBuka] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [galatFoto, setGalatFoto] = useState("");

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
      const cocokCari =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.supplier?.toLowerCase().includes(q);
      const cocokKategori = !kategori || p.category === kategori;
      return cocokCari && cocokKategori;
    });
  }, [produk, cari, kategori]);

  const nilaiPersediaan = terlihat.reduce(
    (t, p) => t + (p.costPrice || 0) * (p.stock || 0),
    0
  );

  const pilihFoto = async (file) => {
    if (!file) return;
    setGalatFoto("");
    try {
      setForm((f) => ({ ...f, image: "" }));
      const kecil = await bacaGambarKecil(file);
      setForm((f) => ({ ...f, image: kecil }));
    } catch (e) {
      setGalatFoto(e.message);
    }
  };

  const bukaBaru = () => {
    setSedangEdit(null);
    setForm(KOSONG);
    setGalatFoto("");
    setBuka(true);
  };

  const bukaEdit = (p) => {
    setSedangEdit(p.id);
    setGalatFoto("");
    setForm({
      sku: p.sku || "", name: p.name || "", category: p.category || "",
      size: p.size || "", color: p.color || "",
      costPrice: p.costPrice ?? "", sellPrice: p.sellPrice ?? "",
      stock: p.stock ?? "", supplier: p.supplier || "",
      image: p.image || "", weight: p.weight ?? "",
    });
    setBuka(true);
  };

  const simpan = async (e) => {
    e.preventDefault();
    setMenyimpan(true);
    setGalat("");
    try {
      const data = {
        ...form,
        costPrice: Number(form.costPrice) || 0,
        sellPrice: Number(form.sellPrice) || 0,
        stock: Number(form.stock) || 0,
        weight: Number(form.weight) || 0,
      };
      if (sedangEdit) await produkApi.ubah(sedangEdit, data);
      else await produkApi.buat(data);
      setBuka(false);
      await ambil();
    } catch (err) {
      setGalat(err.message);
    } finally {
      setMenyimpan(false);
    }
  };

  const hapus = async (p) => {
    if (!window.confirm(`Hapus ${p.name} dari katalog?`)) return;
    try {
      await produkApi.hapus(p.id);
      await ambil();
    } catch (e) {
      setGalat(e.message);
    }
  };

  return (
    <AdminLayout>
      <JudulHalaman
        judul="Katalog Produk"
        keterangan="Sumber tunggal data barang. Halaman Stok, Kasir, dan katalog pelanggan semuanya membaca dari sini."
        aksi={<Tombol onClick={bukaBaru}>Tambah produk</Tombol>}
      />

      {galat && <div className="mb-4"><Galat pesan={galat} onCoba={ambil} /></div>}

      <Kartu className="mb-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <Input
            className="sm:col-span-2"
            placeholder="Cari nama, SKU, atau pemasok…"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
          <Pilihan value={kategori} onChange={(e) => setKategori(e.target.value)}>
            <option value="">Semua kategori</option>
            {kategoriTersedia.map((k) => <option key={k} value={k}>{k}</option>)}
          </Pilihan>
          <Pilihan value={urut} onChange={(e) => setUrut(e.target.value)}>
            <option value="newest">Terbaru</option>
            <option value="nama">Nama A–Z</option>
            <option value="termurah">Harga termurah</option>
            <option value="termahal">Harga termahal</option>
            <option value="stok">Stok paling sedikit</option>
          </Pilihan>
        </div>
        <p className="mt-3 text-xs text-sand-500">
          {terlihat.length} produk ditampilkan · nilai persediaan{" "}
          <b className="tabular text-sand-700">{rupiah(nilaiPersediaan)}</b>
        </p>
      </Kartu>

      {memuat ? (
        <Memuat />
      ) : terlihat.length === 0 ? (
        <Kosong
          judul="Belum ada produk"
          keterangan="Tambahkan produk thrifting supaya katalog pelanggan ada isinya."
          aksi={<Tombol onClick={bukaBaru}>Tambah produk</Tombol>}
        />
      ) : (
        <Tabel
          kepala={["Foto", "Produk", "Kategori", "Modal", "Jual", "Margin", "Stok", ""]}
          min="min-w-[960px]"
        >
          {terlihat.map((p) => {
            const margin = (p.sellPrice || 0) - (p.costPrice || 0);
            const persen = p.sellPrice ? Math.round((margin / p.sellPrice) * 100) : 0;
            return (
              <Baris key={p.id}>
                <Sel>
                  <div className="h-14 w-12 overflow-hidden rounded-md border border-sand-200 bg-sand-100">
                    {p.image ? (
                      <img src={urlBerkas(p.image)} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div
                        className="flex h-full items-center justify-center text-xs text-sand-400"
                        title="Belum ada foto — produk ini tampil sebagai kotak kosong di katalog"
                      >
                        ◻
                      </div>
                    )}
                  </div>
                </Sel>
                <Sel>
                  <span className="font-medium text-sand-800">{p.name}</span>
                  <div className="font-mono text-xs text-sand-400">
                    {p.sku}{p.size && ` · ${p.size}`}{p.color && ` · ${p.color}`}
                  </div>
                </Sel>
                <Sel className="text-sand-500">{p.category || "—"}</Sel>
                <Sel className="tabular text-sand-500">{rupiah(p.costPrice)}</Sel>
                <Sel className="tabular font-semibold">{rupiah(p.sellPrice)}</Sel>
                <Sel className="tabular text-leaf-500">
                  {rupiah(margin)} <span className="text-xs text-sand-400">({persen}%)</span>
                </Sel>
                <Sel>
                  <Chip className={
                    (p.stock || 0) === 0 ? "bg-rust-100 text-rust-500"
                      : (p.stock || 0) <= 3 ? "bg-amber-100 text-amber-ui"
                      : "bg-leaf-100 text-leaf-500"
                  }>
                    {p.stock ?? 0}
                  </Chip>
                </Sel>
                <Sel>
                  <div className="flex justify-end gap-2">
                    <Tombol size="sm" variant="halus" onClick={() => bukaEdit(p)}>Ubah</Tombol>
                    <Tombol size="sm" variant="garis" onClick={() => hapus(p)}>Hapus</Tombol>
                  </div>
                </Sel>
              </Baris>
            );
          })}
        </Tabel>
      )}

      <Dialog
        terbuka={buka}
        onTutup={() => setBuka(false)}
        judul={sedangEdit ? "Ubah produk" : "Tambah produk"}
        keterangan="Harga modal dipakai untuk menghitung HPP di laporan laba rugi."
        lebar="max-w-2xl"
      >
        <form onSubmit={simpan} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Isian label="Nama produk" wajib>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Isian>
            <Isian label="SKU" hint="Dibuat otomatis kalau dikosongkan.">
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </Isian>
            <Isian label="Kategori">
              <Input list="daftar-kategori" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <datalist id="daftar-kategori">
                {kategoriTersedia.map((k) => <option key={k} value={k} />)}
              </datalist>
            </Isian>
            <Isian label="Pemasok">
              <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            </Isian>
            <Isian label="Ukuran">
              <Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
            </Isian>
            <Isian label="Warna">
              <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </Isian>
            <Isian label="Harga modal" wajib>
              <Input type="number" min="0" required value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
            </Isian>
            <Isian label="Harga jual" wajib>
              <Input type="number" min="0" required value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} />
            </Isian>
            <Isian label="Stok" wajib>
              <Input type="number" min="0" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </Isian>
            <Isian label="Berat (gram)">
              <Input type="number" min="0" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </Isian>
          </div>
          <Isian
            label="Foto produk"
            hint="Foto dikecilkan otomatis ke sisi 1200 piksel, jadi foto langsung dari ponsel boleh dipakai."
          >
            <div className="flex gap-4">
              <div className="h-28 w-24 shrink-0 overflow-hidden rounded-lg border border-sand-300 bg-sand-100">
                {form.image ? (
                  <img
                    src={urlBerkas(form.image)}
                    alt="Pratinjau foto produk"
                    className="h-full w-full object-cover"
                    onError={() => setGalatFoto("Tautan gambar tidak bisa dibuka.")}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl text-sand-300">◻</div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    pilihFoto(e.target.files?.[0]);
                    // Dikosongkan supaya memilih berkas yang sama sekali lagi
                    // tetap terbaca - misalnya setelah fotonya dihapus.
                    e.target.value = "";
                  }}
                  className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-sand-200 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-sand-700"
                />
                <Input
                  value={form.image.startsWith("data:") ? "" : form.image}
                  onChange={(e) => { setGalatFoto(""); setForm({ ...form, image: e.target.value }); }}
                  placeholder="…atau tempel tautan gambar https://…"
                  disabled={form.image.startsWith("data:")}
                />
                <div className="flex items-center gap-3 text-xs text-sand-500">
                  {form.image.startsWith("data:") && <span>Foto baru · {ukuranKb(form.image)} KB</span>}
                  {form.image && (
                    <button
                      type="button"
                      onClick={() => { setGalatFoto(""); setForm({ ...form, image: "" }); }}
                      className="font-semibold text-rust-500 hover:underline"
                    >
                      Hapus foto
                    </button>
                  )}
                </div>
                {galatFoto && <p className="text-xs font-medium text-rust-500">{galatFoto}</p>}
              </div>
            </div>
          </Isian>

          {form.costPrice && form.sellPrice && (
            <p className="rounded-lg bg-sand-100 px-3 py-2 text-sm text-sand-600">
              Margin per unit{" "}
              <b className="tabular text-leaf-500">
                {rupiah(Number(form.sellPrice) - Number(form.costPrice))}
              </b>
            </p>
          )}

          <div className="flex gap-2">
            <Tombol type="submit" className="flex-1" disabled={menyimpan}>
              {menyimpan ? "Menyimpan…" : sedangEdit ? "Simpan perubahan" : "Tambah produk"}
            </Tombol>
            <Tombol type="button" variant="halus" onClick={() => setBuka(false)}>Batal</Tombol>
          </div>
        </form>
      </Dialog>
    </AdminLayout>
  );
}
