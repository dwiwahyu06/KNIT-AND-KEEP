import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Baris, Chip, Dialog, Galat, Input, Isian, JudulHalaman, Kartu, KartuAngka,
  Kosong, Memuat, Pilihan, Sel, Tabel, Tombol,
} from "../components/ui";
import { keuanganApi } from "../lib/api";
import { rupiah, tanggal } from "../lib/format";
import { angkaCsv, tanggalCsv, unduhCsv } from "../lib/csv";

const WARNA_KATEGORI = {
  PENJUALAN: "bg-leaf-100 text-leaf-500",
  PENGELUARAN: "bg-rust-100 text-rust-500",
  REFUND: "bg-amber-100 text-amber-ui",
  GANTI_RUGI: "bg-amber-100 text-amber-ui",
  MANUAL: "bg-sand-200 text-sand-600",
};

export default function CashFlow() {
  const [daftar, setDaftar] = useState([]);
  const [ringkasan, setRingkasan] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [filter, setFilter] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [buka, setBuka] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [form, setForm] = useState({ type: "IN", amount: "", description: "" });

  const ambil = useCallback(async () => {
    setMemuat(true);
    try {
      const q = new URLSearchParams();
      if (dari) q.set("dari", dari);
      if (sampai) q.set("sampai", sampai);
      const s = q.toString();

      const [d, r] = await Promise.all([
        keuanganApi.arusKas(s),
        keuanganApi.ringkasanArusKas(s),
      ]);
      setDaftar(d);
      setRingkasan(r);
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
    () => (filter ? daftar.filter((d) => d.type === filter) : daftar),
    [daftar, filter]
  );

  const ekspor = () =>
    unduhCsv(
      "arus-kas",
      [
        { judul: "Tanggal", ambil: (d) => tanggalCsv(d.date, true) },
        { judul: "Keterangan", ambil: (d) => d.description || "" },
        { judul: "Kategori", ambil: (d) => d.category || "MANUAL" },
        { judul: "Acuan", ambil: (d) => d.referensi || "" },
        { judul: "Kanal", ambil: (d) => d.channel || "" },
        { judul: "Masuk", ambil: (d) => (d.type === "IN" ? angkaCsv(d.amount) : "0") },
        { judul: "Keluar", ambil: (d) => (d.type === "OUT" ? angkaCsv(d.amount) : "0") },
      ],
      terlihat
    );

  const simpan = async (e) => {
    e.preventDefault();
    setMenyimpan(true);
    setGalat("");
    try {
      await keuanganApi.tambahArusKas({
        ...form,
        amount: Number(form.amount) || 0,
        category: "MANUAL",
      });
      setBuka(false);
      setForm({ type: "IN", amount: "", description: "" });
      await ambil();
    } catch (err) {
      setGalat(err.message);
    } finally {
      setMenyimpan(false);
    }
  };

  const hapus = async (d) => {
    if (d.category !== "MANUAL") {
      window.alert("Catatan ini dibuat otomatis dari penjualan atau pengeluaran. Hapus sumbernya, bukan catatan kasnya.");
      return;
    }
    if (!window.confirm("Hapus catatan kas ini?")) return;
    try {
      await keuanganApi.hapusArusKas(d.id);
      await ambil();
    } catch (e) {
      setGalat(e.message);
    }
  };

  return (
    <AdminLayout>
      <JudulHalaman
        judul="Arus Kas"
        keterangan="Terisi otomatis: penjualan jadi kas masuk, pengeluaran dan refund jadi kas keluar. Catatan manual hanya untuk hal di luar keduanya."
        aksi={
          <>
            <Tombol variant="garis" size="sm" onClick={ekspor} disabled={terlihat.length === 0}>
              Unduh CSV
            </Tombol>
            <Tombol onClick={() => setBuka(true)}>Catat manual</Tombol>
          </>
        }
      />

      {galat && <div className="mb-4"><Galat pesan={galat} onCoba={ambil} /></div>}

      {ringkasan && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <KartuAngka label="Kas masuk" nilai={rupiah(ringkasan.kasMasuk)} nada="baik" />
          <KartuAngka label="Kas keluar" nilai={rupiah(ringkasan.kasKeluar)} nada="bahaya" />
          <KartuAngka
            label="Saldo kas"
            nilai={rupiah(ringkasan.saldo)}
            catatan={`${ringkasan.jumlahCatatan} catatan`}
            nada={ringkasan.saldo >= 0 ? "brand" : "bahaya"}
          />
        </div>
      )}

      <Kartu className="mb-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <Isian label="Jenis arus">
            <Pilihan value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Semua arus</option>
              <option value="IN">Kas masuk</option>
              <option value="OUT">Kas keluar</option>
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
              onClick={() => { setFilter(""); setDari(""); setSampai(""); }}>
              Reset filter
            </Tombol>
          </div>
        </div>
      </Kartu>

      {memuat ? (
        <Memuat />
      ) : terlihat.length === 0 ? (
        <Kosong
          judul="Belum ada catatan kas"
          keterangan="Catatan muncul otomatis begitu ada penjualan atau pengeluaran."
        />
      ) : (
        <Tabel kepala={["Tanggal", "Keterangan", "Kategori", "Acuan", "Masuk", "Keluar", ""]} min="min-w-[880px]">
          {terlihat.map((d) => (
            <Baris key={d.id}>
              <Sel className="whitespace-nowrap text-sand-500">{tanggal(d.date, true)}</Sel>
              <Sel className="font-medium text-sand-800">{d.description || "—"}</Sel>
              <Sel>
                <Chip className={WARNA_KATEGORI[d.category] || "bg-sand-200 text-sand-600"}>
                  {d.category || "MANUAL"}
                </Chip>
              </Sel>
              <Sel className="font-mono text-xs text-sand-400">{d.referensi || "—"}</Sel>
              <Sel className="tabular font-semibold text-leaf-500">
                {d.type === "IN" ? rupiah(d.amount) : "—"}
              </Sel>
              <Sel className="tabular font-semibold text-rust-500">
                {d.type === "OUT" ? rupiah(d.amount) : "—"}
              </Sel>
              <Sel>
                {d.category === "MANUAL" && (
                  <div className="flex justify-end">
                    <Tombol size="sm" variant="garis" onClick={() => hapus(d)}>Hapus</Tombol>
                  </div>
                )}
              </Sel>
            </Baris>
          ))}
        </Tabel>
      )}

      <Dialog terbuka={buka} onTutup={() => setBuka(false)} judul="Catat arus kas manual">
        <form onSubmit={simpan} className="space-y-4">
          <Isian label="Jenis" wajib>
            <Pilihan value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="IN">Kas masuk</option>
              <option value="OUT">Kas keluar</option>
            </Pilihan>
          </Isian>
          <Isian label="Jumlah" wajib>
            <Input type="number" min="0" required value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </Isian>
          <Isian label="Keterangan" wajib>
            <Input required value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Contoh: Setoran modal pemilik" />
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
