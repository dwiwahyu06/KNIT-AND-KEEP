import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  AreaTeks, Baris, Chip, Dialog, Galat, Input, Isian, JudulHalaman, Kartu,
  Kosong, Memuat, Pilihan, Sel, Tabel, Tombol,
} from "../components/ui";
import { returApi, urlBerkas } from "../lib/api";
import { labelKendala, labelStatus, rupiah, tanggal, warnaStatus } from "../lib/format";
import { angkaCsv, tanggalCsv, unduhCsv } from "../lib/csv";

const TAB = [
  { nilai: "DIAJUKAN", label: "Menunggu ditinjau" },
  { nilai: "DISETUJUI", label: "Disetujui" },
  { nilai: "DITOLAK", label: "Ditolak" },
  { nilai: "", label: "Semua" },
];

export default function AdminRetur() {
  const [tab, setTab] = useState("DIAJUKAN");
  const [daftar, setDaftar] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [pesan, setPesan] = useState("");

  const [dipilih, setDipilih] = useState(null);
  const [mode, setMode] = useState("setujui");
  const [menyimpan, setMenyimpan] = useState(false);
  const [form, setForm] = useState({
    bentukPenyelesaian: "REFUND",
    nominalRefund: "",
    barangKembali: true,
    layakJual: true,
    catatanAdmin: "",
  });

  const ambil = useCallback(async () => {
    setMemuat(true);
    setGalat("");
    try {
      setDaftar(await returApi.semua(tab));
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
  }, [tab]);

  useEffect(() => {
    ambil();
  }, [ambil]);

  const buka = (r, m) => {
    setDipilih(r);
    setMode(m);
    setForm({
      bentukPenyelesaian: "REFUND",
      nominalRefund: String(r.nominalTransaksi || ""),
      barangKembali: true,
      layakJual: true,
      catatanAdmin: "",
    });
  };

  const kirim = async () => {
    setMenyimpan(true);
    setGalat("");
    try {
      if (mode === "setujui") {
        await returApi.setujui(dipilih.id, {
          bentukPenyelesaian: form.bentukPenyelesaian,
          nominalRefund: Number(form.nominalRefund || 0),
          barangKembali: form.barangKembali,
          layakJual: form.barangKembali && form.layakJual,
          catatanAdmin: form.catatanAdmin,
        });
        setPesan("Pengajuan disetujui. Stok dan pembukuan sudah disesuaikan.");
      } else {
        await returApi.tolak(dipilih.id, { catatanAdmin: form.catatanAdmin });
        setPesan("Pengajuan ditolak.");
      }
      setDipilih(null);
      await ambil();
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMenyimpan(false);
    }
  };

  const tutupPesanan = async (r) => {
    try {
      await returApi.tutupPesanan(r.transactionId, "Kendala telah diselesaikan");
      setPesan("Pesanan ditutup sebagai selesai.");
      await ambil();
    } catch (e) {
      setGalat(e.message);
    }
  };

  return (
    <AdminLayout>
      <JudulHalaman
        judul="Komplain & Retur"
        keterangan="Menangani kendala di lapangan: barang rusak, salah kirim, barang hilang, dan pengembalian dana. Keputusan di sini otomatis menyesuaikan stok dan pembukuan."
        aksi={
          <>
            <Tombol variant="garis" size="sm" disabled={daftar.length === 0}
              onClick={() =>
                unduhCsv(
                  "komplain-retur",
                  [
                    { judul: "Tanggal", ambil: (r) => tanggalCsv(r.createdAt, true) },
                    { judul: "Nomor pesanan", ambil: (r) => r.orderId },
                    { judul: "Pelanggan", ambil: (r) => r.namaPelanggan },
                    { judul: "Jenis kendala", ambil: (r) => labelKendala(r.jenisKendala) },
                    { judul: "Alasan", ambil: (r) => r.alasan || "" },
                    { judul: "Status", ambil: (r) => labelStatus(r.status) },
                    { judul: "Penyelesaian", ambil: (r) => r.bentukPenyelesaian || "" },
                    { judul: "Nilai transaksi", ambil: (r) => angkaCsv(r.nominalTransaksi) },
                    { judul: "Nominal dikembalikan", ambil: (r) => angkaCsv(r.nominalRefund) },
                    { judul: "Catatan admin", ambil: (r) => r.catatanAdmin || "" },
                  ],
                  daftar
                )
              }>
              Unduh CSV
            </Tombol>
            <Tombol variant="halus" size="sm" onClick={ambil}>Muat ulang</Tombol>
          </>
        }
      />

      {pesan && (
        <div className="mb-4 rounded-lg border border-leaf-100 bg-leaf-100/60 px-4 py-3 text-sm font-medium text-leaf-500">
          {pesan}
        </div>
      )}
      {galat && <div className="mb-4"><Galat pesan={galat} onCoba={ambil} /></div>}

      <div className="mb-5 flex flex-wrap gap-2">
        {TAB.map((t) => (
          <button
            key={t.nilai}
            onClick={() => setTab(t.nilai)}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              tab === t.nilai
                ? "bg-brand-600 text-white"
                : "border border-sand-300 bg-white text-sand-600 hover:border-brand-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {memuat ? (
        <Memuat />
      ) : daftar.length === 0 ? (
        <Kosong
          judul="Tidak ada pengajuan"
          keterangan="Komplain yang diajukan pelanggan dari halaman Pesanan mereka akan muncul di sini."
        />
      ) : (
        <Tabel
          kepala={["Pesanan", "Kendala", "Nilai transaksi", "Status", "Diajukan", "Tindakan"]}
          min="min-w-[880px]"
        >
          {daftar.map((r) => (
            <Baris key={r.id}>
              <Sel>
                <Link
                  to={`/AdminOrderDetailPage/${r.transactionId}`}
                  className="font-mono text-xs font-semibold text-brand-600 hover:underline"
                >
                  {r.orderId}
                </Link>
                <div className="text-xs text-sand-400">{r.namaPelanggan}</div>
              </Sel>
              <Sel>
                <span className="font-medium text-sand-800">{labelKendala(r.jenisKendala)}</span>
                {r.alasan && <div className="max-w-xs text-xs text-sand-500">{r.alasan}</div>}
              </Sel>
              <Sel className="tabular">{rupiah(r.nominalTransaksi)}</Sel>
              <Sel>
                <Chip className={warnaStatus(r.status)}>{labelStatus(r.status)}</Chip>
                {r.status === "DISETUJUI" && (
                  <div className="mt-1 text-xs text-sand-500">
                    {labelStatus(r.bentukPenyelesaian)} {rupiah(r.nominalRefund)}
                  </div>
                )}
              </Sel>
              <Sel className="text-xs text-sand-500">{tanggal(r.createdAt, true)}</Sel>
              <Sel>
                {r.status === "DIAJUKAN" ? (
                  <div className="flex gap-2">
                    <Tombol size="sm" onClick={() => buka(r, "setujui")}>Setujui</Tombol>
                    <Tombol size="sm" variant="garis" onClick={() => buka(r, "tolak")}>Tolak</Tombol>
                  </div>
                ) : r.statusPesanan !== "SELESAI" ? (
                  <Tombol size="sm" variant="halus" onClick={() => tutupPesanan(r)}>
                    Tutup pesanan
                  </Tombol>
                ) : (
                  <span className="text-xs text-sand-400">Selesai</span>
                )}
              </Sel>
            </Baris>
          ))}
        </Tabel>
      )}

      <Dialog
        terbuka={!!dipilih}
        onTutup={() => setDipilih(null)}
        judul={mode === "setujui" ? "Setujui pengajuan" : "Tolak pengajuan"}
        keterangan={
          dipilih
            ? `${dipilih.orderId} · ${labelKendala(dipilih.jenisKendala)} · ${dipilih.namaPelanggan}`
            : ""
        }
      >
        {dipilih && (
          <div className="space-y-4">
            {dipilih.alasan && (
              <div className="rounded-lg bg-sand-100 px-3 py-2.5 text-sm text-sand-600">
                “{dipilih.alasan}”
              </div>
            )}
            {dipilih.fotoBukti && (
              <img
                src={urlBerkas(dipilih.fotoBukti)}
                alt="Bukti dari pelanggan"
                className="max-h-56 w-full rounded-lg object-contain"
              />
            )}

            {mode === "setujui" && (
              <>
                <Isian label="Bentuk penyelesaian">
                  <Pilihan
                    value={form.bentukPenyelesaian}
                    onChange={(e) => setForm({ ...form, bentukPenyelesaian: e.target.value })}
                  >
                    <option value="REFUND">Refund — dana dikembalikan</option>
                    <option value="GANTI_RUGI">Ganti rugi — kompensasi</option>
                  </Pilihan>
                </Isian>

                <Isian
                  label="Nominal yang dikembalikan"
                  hint={`Nilai transaksi ${rupiah(dipilih.nominalTransaksi)}. Isi lebih kecil untuk refund sebagian.`}
                >
                  <Input
                    type="number"
                    min="0"
                    value={form.nominalRefund}
                    onChange={(e) => setForm({ ...form, nominalRefund: e.target.value })}
                  />
                </Isian>

                <div className="space-y-2 rounded-lg border border-sand-200 p-3">
                  <label className="flex items-center gap-2.5 text-sm text-sand-700">
                    <input
                      type="checkbox"
                      checked={form.barangKembali}
                      onChange={(e) => setForm({ ...form, barangKembali: e.target.checked })}
                      className="h-4 w-4 accent-brand-600"
                    />
                    Barang dikirim balik ke toko
                  </label>
                  {form.barangKembali && (
                    <label className="flex items-center gap-2.5 pl-6 text-sm text-sand-700">
                      <input
                        type="checkbox"
                        checked={form.layakJual}
                        onChange={(e) => setForm({ ...form, layakJual: e.target.checked })}
                        className="h-4 w-4 accent-brand-600"
                      />
                      Masih layak dijual lagi
                    </label>
                  )}
                  <p className="pl-6 text-xs text-sand-400">
                    {form.barangKembali && form.layakJual
                      ? "Stok akan bertambah kembali."
                      : "Stok tidak dikembalikan — barang dianggap hilang atau rusak."}
                  </p>
                </div>
              </>
            )}

            <Isian label="Catatan admin" hint="Tersimpan di riwayat pesanan dan terlihat pelanggan.">
              <AreaTeks
                value={form.catatanAdmin}
                onChange={(e) => setForm({ ...form, catatanAdmin: e.target.value })}
                placeholder={mode === "setujui" ? "Alasan persetujuan" : "Alasan penolakan"}
              />
            </Isian>

            <div className="flex gap-2">
              <Tombol
                variant={mode === "setujui" ? "utama" : "bahaya"}
                className="flex-1"
                onClick={kirim}
                disabled={menyimpan}
              >
                {menyimpan ? "Menyimpan…" : mode === "setujui" ? "Setujui pengajuan" : "Tolak pengajuan"}
              </Tombol>
              <Tombol variant="halus" onClick={() => setDipilih(null)}>Batal</Tombol>
            </div>
          </div>
        )}
      </Dialog>
    </AdminLayout>
  );
}
