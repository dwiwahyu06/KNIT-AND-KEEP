import React, { useCallback, useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Baris, Galat, Input, Isian, JudulHalaman, Kartu, KartuAngka, KartuJudul,
  Kosong, Memuat, Pilihan, Sel, Tabel, Tombol,
} from "../components/ui";
import { laporanApi, paramLaporan } from "../lib/api";
import { angka, labelKendala, rupiah } from "../lib/format";
import { angkaCsv, unduhCsv } from "../lib/csv";

/**
 * Analisis penjualan.
 *
 * Menjawab tiga pertanyaan yang selama ini datanya sudah tersimpan tapi belum
 * pernah ditampilkan: kategori mana yang paling menguntungkan, siapa pembeli
 * yang paling sering kembali, dan kendala apa yang paling banyak merugikan.
 */
export default function Analisis() {
  const [filter, setFilter] = useState({ channel: "", dari: "", sampai: "" });
  const [kategori, setKategori] = useState([]);
  const [pelanggan, setPelanggan] = useState([]);
  const [retur, setRetur] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");

  const ambil = useCallback(async () => {
    setMemuat(true);
    setGalat("");
    try {
      const q = paramLaporan(filter);
      const qTanpaKanal = paramLaporan({ dari: filter.dari, sampai: filter.sampai });
      const [k, p, r] = await Promise.all([
        laporanApi.perKategori(q),
        laporanApi.perPelanggan(qTanpaKanal),
        laporanApi.rekapRetur(qTanpaKanal),
      ]);
      setKategori(k);
      setPelanggan(p);
      setRetur(r);
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
  }, [filter]);

  useEffect(() => {
    ambil();
  }, [ambil]);

  const totalOmzetKategori = kategori.reduce((t, k) => t + k.omzet, 0);

  const eksporKategori = () =>
    unduhCsv(
      "penjualan-per-kategori",
      [
        { judul: "Kategori", ambil: (k) => k.kategori },
        { judul: "Barang terjual", ambil: (k) => angkaCsv(k.qty) },
        { judul: "Omzet", ambil: (k) => angkaCsv(k.omzet) },
        { judul: "Modal", ambil: (k) => angkaCsv(k.modal) },
        { judul: "Laba", ambil: (k) => angkaCsv(k.laba) },
      ],
      kategori
    );

  const eksporPelanggan = () =>
    unduhCsv(
      "pelanggan-teratas",
      [
        { judul: "Pelanggan", ambil: (p) => p.nama },
        { judul: "Jumlah pesanan", ambil: (p) => angkaCsv(p.jumlahPesanan) },
        { judul: "Total barang", ambil: (p) => angkaCsv(p.totalBarang) },
        { judul: "Total belanja", ambil: (p) => angkaCsv(p.totalBelanja) },
        { judul: "Rata-rata per pesanan", ambil: (p) => angkaCsv(p.rataRata) },
      ],
      pelanggan
    );

  return (
    <AdminLayout>
      <JudulHalaman
        judul="Analisis Penjualan"
        keterangan="Kategori mana yang paling menguntungkan, siapa pembeli paling loyal, dan kendala apa yang paling sering terjadi."
        aksi={<Tombol variant="garis" size="sm" onClick={ambil}>Muat ulang</Tombol>}
      />

      <Kartu className="mb-6">
        <div className="grid gap-3 sm:grid-cols-4">
          <Isian label="Kanal">
            <Pilihan value={filter.channel} onChange={(e) => setFilter({ ...filter, channel: e.target.value })}>
              <option value="">Semua</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
            </Pilihan>
          </Isian>
          <Isian label="Dari tanggal">
            <Input type="date" value={filter.dari} onChange={(e) => setFilter({ ...filter, dari: e.target.value })} />
          </Isian>
          <Isian label="Sampai tanggal">
            <Input type="date" value={filter.sampai} onChange={(e) => setFilter({ ...filter, sampai: e.target.value })} />
          </Isian>
          <div className="flex items-end">
            <Tombol variant="halus" className="w-full"
              onClick={() => setFilter({ channel: "", dari: "", sampai: "" })}>
              Reset filter
            </Tombol>
          </div>
        </div>
      </Kartu>

      {galat && <div className="mb-4"><Galat pesan={galat} onCoba={ambil} /></div>}

      {memuat ? (
        <Memuat />
      ) : (
        <div className="space-y-6">
          {/* ---------- Kategori ---------- */}
          <Kartu padat>
            <div className="p-5 pb-0">
              <KartuJudul
                judul="Penjualan per kategori"
                keterangan="Diurutkan dari omzet terbesar. Kolom laba sudah dikurangi harga modal."
                aksi={
                  <Tombol variant="garis" size="sm" onClick={eksporKategori} disabled={kategori.length === 0}>
                    Unduh CSV
                  </Tombol>
                }
              />
            </div>
            <div className="px-2 pb-2">
              <Tabel
                kepala={["Kategori", "Terjual", "Omzet", "Porsi", "Modal", "Laba", "Margin"]}
                kosong="Belum ada penjualan pada periode ini."
                min="min-w-[760px]"
              >
                {kategori.map((k) => {
                  const porsi = totalOmzetKategori ? Math.round((k.omzet / totalOmzetKategori) * 100) : 0;
                  const margin = k.omzet ? Math.round((k.laba / k.omzet) * 100) : 0;
                  return (
                    <Baris key={k.kategori}>
                      <Sel className="font-medium text-sand-800">{k.kategori}</Sel>
                      <Sel className="tabular">{angka(k.qty)}</Sel>
                      <Sel className="tabular font-semibold">{rupiah(k.omzet)}</Sel>
                      <Sel>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-sand-200">
                            <div className="h-full bg-brand-500" style={{ width: `${porsi}%` }} />
                          </div>
                          <span className="tabular text-xs text-sand-500">{porsi}%</span>
                        </div>
                      </Sel>
                      <Sel className="tabular text-sand-400">{rupiah(k.modal)}</Sel>
                      <Sel className="tabular font-semibold text-leaf-500">{rupiah(k.laba)}</Sel>
                      <Sel className="tabular text-sand-500">{margin}%</Sel>
                    </Baris>
                  );
                })}
              </Tabel>
            </div>
          </Kartu>

          {/* ---------- Pelanggan ---------- */}
          <Kartu padat>
            <div className="p-5 pb-0">
              <KartuJudul
                judul="Pelanggan teratas"
                keterangan="Penjualan offline dikelompokkan sebagai satu nama, karena pembelinya tidak dicatat."
                aksi={
                  <Tombol variant="garis" size="sm" onClick={eksporPelanggan} disabled={pelanggan.length === 0}>
                    Unduh CSV
                  </Tombol>
                }
              />
            </div>
            <div className="px-2 pb-2">
              <Tabel
                kepala={["#", "Pelanggan", "Pesanan", "Barang", "Total belanja", "Rata-rata"]}
                kosong="Belum ada pembelian pada periode ini."
                min="min-w-[680px]"
              >
                {pelanggan.map((p, i) => (
                  <Baris key={p.nama}>
                    <Sel className="tabular text-sand-400">{i + 1}</Sel>
                    <Sel className="font-medium text-sand-800">{p.nama}</Sel>
                    <Sel className="tabular">{angka(p.jumlahPesanan)}</Sel>
                    <Sel className="tabular">{angka(p.totalBarang)}</Sel>
                    <Sel className="tabular font-semibold">{rupiah(p.totalBelanja)}</Sel>
                    <Sel className="tabular text-sand-500">{rupiah(p.rataRata)}</Sel>
                  </Baris>
                ))}
              </Tabel>
            </div>
          </Kartu>

          {/* ---------- Retur ---------- */}
          {retur && (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <KartuAngka label="Total komplain" nilai={angka(retur.total)} />
                <KartuAngka label="Menunggu ditinjau" nilai={angka(retur.menunggu)}
                  nada={retur.menunggu > 0 ? "perhatian" : "netral"} />
                <KartuAngka label="Disetujui" nilai={angka(retur.disetujui)} nada="baik" />
                <KartuAngka label="Total kerugian" nilai={rupiah(retur.totalKerugian)} nada="bahaya" />
              </div>

              <Kartu padat>
                <div className="p-5 pb-0">
                  <KartuJudul
                    judul="Kendala per jenis"
                    keterangan="Jenis yang paling sering muncul biasanya menandakan masalah yang berulang, bukan kejadian sekali."
                  />
                </div>
                <div className="px-2 pb-2">
                  <Tabel
                    kepala={["Jenis kendala", "Jumlah kejadian", "Kerugian"]}
                    kosong="Belum ada komplain pada periode ini."
                    min="min-w-[480px]"
                  >
                    {(retur.perJenis || []).map((j) => (
                      <Baris key={j.jenis}>
                        <Sel className="font-medium text-sand-800">{labelKendala(j.jenis)}</Sel>
                        <Sel className="tabular">{angka(j.jumlah)}</Sel>
                        <Sel className="tabular font-semibold text-rust-500">{rupiah(j.kerugian)}</Sel>
                      </Baris>
                    ))}
                  </Tabel>
                </div>
              </Kartu>
            </>
          )}

          {kategori.length === 0 && pelanggan.length === 0 && (
            <Kosong
              judul="Belum ada data untuk dianalisis"
              keterangan="Analisis muncul setelah ada penjualan yang sudah dibayar pada periode yang dipilih."
            />
          )}
        </div>
      )}
    </AdminLayout>
  );
}
