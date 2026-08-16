import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Baris, Chip, Galat, Input, Isian, JudulHalaman, Kartu, KartuAngka,
  Kosong, Memuat, Pilihan, Sel, Tabel, Tombol,
} from "../components/ui";
import { produkApi } from "../lib/api";
import { angka, tanggal } from "../lib/format";
import { angkaCsv, tanggalCsv, unduhCsv } from "../lib/csv";

const JENIS = [
  { nilai: "", label: "Semua jenis" },
  { nilai: "PEMBELIAN", label: "Barang masuk" },
  { nilai: "PENJUALAN", label: "Terjual" },
  { nilai: "PEMBATALAN", label: "Pesanan batal" },
  { nilai: "RETUR", label: "Retur kembali" },
  { nilai: "PENYESUAIAN", label: "Penyesuaian" },
];

const WARNA = {
  PEMBELIAN: "bg-leaf-100 text-leaf-500",
  PENJUALAN: "bg-brand-100 text-brand-600",
  PEMBATALAN: "bg-amber-100 text-amber-ui",
  RETUR: "bg-wool-100 text-wool-600",
  PENYESUAIAN: "bg-sand-200 text-sand-600",
};

const LABEL = Object.fromEntries(JENIS.filter((j) => j.nilai).map((j) => [j.nilai, j.label]));

/**
 * Kartu stok — riwayat setiap perubahan jumlah barang beserta penyebabnya.
 *
 * Ini yang membuat selisih antara stok fisik dan stok sistem bisa ditelusuri:
 * setiap baris menunjukkan stok sebelum dan sesudahnya, siapa yang mengubah,
 * dan pesanan mana yang menjadi acuannya.
 */
export default function KartuStok() {
  const [mutasi, setMutasi] = useState([]);
  const [produk, setProduk] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [filter, setFilter] = useState({ productId: "", jenis: "", dari: "", sampai: "" });

  const ambil = useCallback(async () => {
    setMemuat(true);
    setGalat("");
    try {
      const [m, p] = await Promise.all([
        produkApi.kartuStok(filter),
        produk.length ? Promise.resolve(produk) : produkApi.semua("?sort=nama"),
      ]);
      setMutasi(m);
      setProduk(p);
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
    // produk sengaja tidak masuk daftar ketergantungan: ia hanya diambil sekali
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    ambil();
  }, [ambil]);

  const ringkas = useMemo(() => {
    const masuk = mutasi.filter((m) => m.perubahan > 0).reduce((t, m) => t + m.perubahan, 0);
    const keluar = mutasi.filter((m) => m.perubahan < 0).reduce((t, m) => t - m.perubahan, 0);
    const terjual = mutasi
      .filter((m) => m.jenis === "PENJUALAN")
      .reduce((t, m) => t - m.perubahan, 0);
    return { masuk, keluar, terjual };
  }, [mutasi]);

  const ekspor = () =>
    unduhCsv(
      "kartu-stok",
      [
        { judul: "Waktu", ambil: (m) => tanggalCsv(m.waktu, true) },
        { judul: "SKU", ambil: (m) => m.sku },
        { judul: "Produk", ambil: (m) => m.namaProduk },
        { judul: "Jenis", ambil: (m) => LABEL[m.jenis] || m.jenis },
        { judul: "Perubahan", ambil: (m) => angkaCsv(m.perubahan) },
        { judul: "Stok sebelum", ambil: (m) => angkaCsv(m.stokSebelum) },
        { judul: "Stok sesudah", ambil: (m) => angkaCsv(m.stokSesudah) },
        { judul: "Acuan", ambil: (m) => m.referensi || "" },
        { judul: "Oleh", ambil: (m) => m.oleh },
        { judul: "Catatan", ambil: (m) => m.catatan || "" },
      ],
      mutasi
    );

  return (
    <AdminLayout>
      <JudulHalaman
        judul="Kartu Stok"
        keterangan="Setiap perubahan jumlah barang tercatat di sini — terjual, masuk dari pemasok, kembali karena retur, atau disesuaikan manual."
        aksi={
          <>
            <Tombol variant="garis" size="sm" onClick={ekspor} disabled={mutasi.length === 0}>
              Unduh CSV
            </Tombol>
            <Tombol variant="halus" size="sm" onClick={ambil}>Muat ulang</Tombol>
          </>
        }
      />

      {galat && <div className="mb-4"><Galat pesan={galat} onCoba={ambil} /></div>}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <KartuAngka label="Barang masuk" nilai={angka(ringkas.masuk)} catatan="unit bertambah" nada="baik" />
        <KartuAngka label="Barang keluar" nilai={angka(ringkas.keluar)} catatan="unit berkurang" nada="bahaya" />
        <KartuAngka label="Terjual" nilai={angka(ringkas.terjual)} catatan="unit lewat penjualan" nada="brand" />
      </div>

      <Kartu className="mb-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <Isian label="Produk">
            <Pilihan
              value={filter.productId}
              onChange={(e) => setFilter({ ...filter, productId: e.target.value })}
            >
              <option value="">Semua produk</option>
              {produk.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Pilihan>
          </Isian>
          <Isian label="Jenis mutasi">
            <Pilihan value={filter.jenis} onChange={(e) => setFilter({ ...filter, jenis: e.target.value })}>
              {JENIS.map((j) => (
                <option key={j.nilai} value={j.nilai}>{j.label}</option>
              ))}
            </Pilihan>
          </Isian>
          <Isian label="Dari tanggal">
            <Input type="date" value={filter.dari} onChange={(e) => setFilter({ ...filter, dari: e.target.value })} />
          </Isian>
          <Isian label="Sampai tanggal">
            <Input type="date" value={filter.sampai} onChange={(e) => setFilter({ ...filter, sampai: e.target.value })} />
          </Isian>
        </div>
      </Kartu>

      {memuat ? (
        <Memuat />
      ) : mutasi.length === 0 ? (
        <Kosong
          judul="Belum ada pergerakan stok"
          keterangan="Catatan muncul otomatis begitu ada penjualan, barang masuk, atau penyesuaian."
        />
      ) : (
        <Tabel
          kepala={["Waktu", "Produk", "Jenis", "Perubahan", "Stok", "Acuan", "Catatan"]}
          min="min-w-[940px]"
        >
          {mutasi.map((m) => (
            <Baris key={m.id}>
              <Sel className="whitespace-nowrap text-xs text-sand-500">{tanggal(m.waktu, true)}</Sel>
              <Sel>
                <span className="font-medium text-sand-800">{m.namaProduk}</span>
                <div className="font-mono text-xs text-sand-400">{m.sku}</div>
              </Sel>
              <Sel>
                <Chip className={WARNA[m.jenis] || "bg-sand-200 text-sand-600"}>
                  {LABEL[m.jenis] || m.jenis}
                </Chip>
              </Sel>
              <Sel className={`tabular font-bold ${m.perubahan > 0 ? "text-leaf-500" : "text-rust-500"}`}>
                {m.perubahan > 0 ? `+${m.perubahan}` : m.perubahan}
              </Sel>
              <Sel className="tabular whitespace-nowrap text-sand-500">
                {m.stokSebelum} → <b className="text-sand-800">{m.stokSesudah}</b>
              </Sel>
              <Sel className="font-mono text-xs text-sand-400">{m.referensi || "—"}</Sel>
              <Sel className="max-w-xs text-xs text-sand-500">
                {m.catatan || "—"}
                <div className="text-sand-400">oleh {m.oleh}</div>
              </Sel>
            </Baris>
          ))}
        </Tabel>
      )}
    </AdminLayout>
  );
}
