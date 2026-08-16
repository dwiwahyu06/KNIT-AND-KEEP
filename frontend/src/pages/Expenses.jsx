import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Baris, Chip, Dialog, Galat, Input, Isian, JudulHalaman, Kartu, KartuAngka,
  Kosong, Memuat, Pilihan, Sel, Tabel, Tombol,
} from "../components/ui";
import { keuanganApi } from "../lib/api";
import { rupiah, tanggal } from "../lib/format";
import { angkaCsv, tanggalCsv, unduhCsv } from "../lib/csv";

const KATEGORI = ["Operasional", "Sewa", "Gaji", "Pembelian Barang", "Transportasi", "Pemasaran", "Lainnya"];

export default function Expenses() {
  const [daftar, setDaftar] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [buka, setBuka] = useState(false);
  const [sedangEdit, setSedangEdit] = useState(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [filterKategori, setFilterKategori] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  const [form, setForm] = useState({
    description: "", amount: "", category: "Operasional",
    date: new Date().toISOString().slice(0, 10),
  });

  const ambil = useCallback(async () => {
    setMemuat(true);
    try {
      const q = new URLSearchParams();
      if (dari) q.set("dari", dari);
      if (sampai) q.set("sampai", sampai);
      setDaftar(await keuanganApi.pengeluaran(q.toString()));
      setGalat("");
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
  }, [dari, sampai]);

  useEffect(() => {
    ambil();
  }, [ambil]);

  const terlihat = useMemo(
    () => (filterKategori ? daftar.filter((d) => d.category === filterKategori) : daftar),
    [daftar, filterKategori]
  );

  const total = terlihat.reduce((t, d) => t + (d.amount || 0), 0);
  const bulanIni = daftar
    .filter((d) => d.date?.slice(0, 7) === new Date().toISOString().slice(0, 7))
    .reduce((t, d) => t + (d.amount || 0), 0);

  const ekspor = () =>
    unduhCsv(
      "pengeluaran",
      [
        { judul: "Tanggal", ambil: (d) => tanggalCsv(d.date) },
        { judul: "Keterangan", ambil: (d) => d.description },
        { judul: "Kategori", ambil: (d) => d.category || "Lainnya" },
        { judul: "Jumlah", ambil: (d) => angkaCsv(d.amount) },
      ],
      terlihat
    );

  const bukaBaru = () => {
    setSedangEdit(null);
    setForm({
      description: "", amount: "", category: "Operasional",
      date: new Date().toISOString().slice(0, 10),
    });
    setBuka(true);
  };

  const bukaEdit = (d) => {
    setSedangEdit(d.id);
    setForm({
      description: d.description || "",
      amount: d.amount ?? "",
      category: d.category || "Operasional",
      date: d.date || new Date().toISOString().slice(0, 10),
    });
    setBuka(true);
  };

  const simpan = async (e) => {
    e.preventDefault();
    setMenyimpan(true);
    setGalat("");
    try {
      const data = { ...form, amount: Number(form.amount) || 0 };
      if (sedangEdit) await keuanganApi.ubahPengeluaran(sedangEdit, data);
      else await keuanganApi.tambahPengeluaran(data);
      setBuka(false);
      await ambil();
    } catch (err) {
      setGalat(err.message);
    } finally {
      setMenyimpan(false);
    }
  };

  const hapus = async (d) => {
    if (!window.confirm(`Hapus pengeluaran "${d.description}"?`)) return;
    try {
      await keuanganApi.hapusPengeluaran(d.id);
      await ambil();
    } catch (e) {
      setGalat(e.message);
    }
  };

  return (
    <AdminLayout>
      <JudulHalaman
        judul="Pengeluaran"
        keterangan="Biaya operasional toko. Setiap catatan di sini otomatis masuk arus kas sebagai kas keluar dan mengurangi laba di laporan."
        aksi={
          <>
            <Tombol variant="garis" size="sm" onClick={ekspor} disabled={terlihat.length === 0}>
              Unduh CSV
            </Tombol>
            <Tombol onClick={bukaBaru}>Catat pengeluaran</Tombol>
          </>
        }
      />

      {galat && <div className="mb-4"><Galat pesan={galat} onCoba={ambil} /></div>}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <KartuAngka label="Total tercatat" nilai={rupiah(total)} catatan={`${terlihat.length} catatan`} nada="bahaya" />
        <KartuAngka label="Bulan ini" nilai={rupiah(bulanIni)} catatan="Pengeluaran bulan berjalan" />
        <KartuAngka
          label="Rata-rata per catatan"
          nilai={rupiah(terlihat.length ? total / terlihat.length : 0)}
        />
      </div>

      <Kartu className="mb-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <Isian label="Kategori">
            <Pilihan value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}>
              <option value="">Semua kategori</option>
              {KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
            </Pilihan>
          </Isian>
          <Isian label="Dari tanggal">
            <Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} />
          </Isian>
          <Isian label="Sampai tanggal">
            <Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} />
          </Isian>
          <div className="flex items-end">
            <Tombol variant="halus" className="w-full"
              onClick={() => { setFilterKategori(""); setDari(""); setSampai(""); }}>
              Reset filter
            </Tombol>
          </div>
        </div>
      </Kartu>

      {memuat ? (
        <Memuat />
      ) : terlihat.length === 0 ? (
        <Kosong
          judul="Belum ada pengeluaran"
          keterangan="Catat biaya sewa, gaji, atau operasional lain supaya laba bersih terhitung benar."
          aksi={<Tombol onClick={bukaBaru}>Catat pengeluaran</Tombol>}
        />
      ) : (
        <Tabel kepala={["Tanggal", "Keterangan", "Kategori", "Jumlah", ""]} min="min-w-[680px]">
          {terlihat.map((d) => (
            <Baris key={d.id}>
              <Sel className="whitespace-nowrap text-sand-500">{tanggal(d.date)}</Sel>
              <Sel className="font-medium text-sand-800">{d.description}</Sel>
              <Sel><Chip className="bg-sand-200 text-sand-600">{d.category || "Lainnya"}</Chip></Sel>
              <Sel className="tabular font-semibold text-rust-500">{rupiah(d.amount)}</Sel>
              <Sel>
                <div className="flex justify-end gap-2">
                  <Tombol size="sm" variant="halus" onClick={() => bukaEdit(d)}>Ubah</Tombol>
                  <Tombol size="sm" variant="garis" onClick={() => hapus(d)}>Hapus</Tombol>
                </div>
              </Sel>
            </Baris>
          ))}
        </Tabel>
      )}

      <Dialog
        terbuka={buka}
        onTutup={() => setBuka(false)}
        judul={sedangEdit ? "Ubah pengeluaran" : "Catat pengeluaran"}
      >
        <form onSubmit={simpan} className="space-y-4">
          <Isian label="Keterangan" wajib>
            <Input
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Contoh: Sewa toko bulan Agustus"
            />
          </Isian>
          <div className="grid gap-3 sm:grid-cols-2">
            <Isian label="Jumlah" wajib>
              <Input
                type="number"
                min="0"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Isian>
            <Isian label="Tanggal" wajib>
              <Input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Isian>
          </div>
          <Isian label="Kategori">
            <Pilihan value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
            </Pilihan>
          </Isian>
          <div className="flex gap-2">
            <Tombol type="submit" className="flex-1" disabled={menyimpan}>
              {menyimpan ? "Menyimpan…" : "Simpan"}
            </Tombol>
            <Tombol type="button" variant="halus" onClick={() => setBuka(false)}>Batal</Tombol>
          </div>
        </form>
      </Dialog>
    </AdminLayout>
  );
}
