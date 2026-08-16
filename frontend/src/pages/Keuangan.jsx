import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  Baris, Chip, Galat, Input, JudulHalaman, Kartu, KartuAngka, Kosong,
  Memuat, Pilihan, Sel, Tabel, Tombol,
} from "../components/ui";
import { keuanganApi } from "../lib/api";
import { angka, labelStatus, rupiah, tanggal, warnaStatus } from "../lib/format";
import { angkaCsv, tanggalCsv, unduhCsv } from "../lib/csv";
import { Isian } from "../components/ui";

export default function Keuangan() {
  const [transaksi, setTransaksi] = useState([]);
  const [ringkasan, setRingkasan] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [channel, setChannel] = useState("");
  const [cari, setCari] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  const ambil = useCallback(async () => {
    setMemuat(true);
    setGalat("");
    try {
      const q = new URLSearchParams({ hanyaOmzet: "true" });
      if (channel) q.set("channel", channel);
      if (dari) q.set("dari", dari);
      if (sampai) q.set("sampai", sampai);

      const qr = new URLSearchParams();
      if (channel) qr.set("channel", channel);
      if (dari) qr.set("dari", dari);
      if (sampai) qr.set("sampai", sampai);

      const [t, r] = await Promise.all([
        keuanganApi.transaksi(`?${q.toString()}`),
        keuanganApi.ringkasanTransaksi(qr.toString()),
      ]);
      setTransaksi(t);
      setRingkasan(r);
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
  }, [channel, dari, sampai]);

  useEffect(() => {
    ambil();
  }, [ambil]);

  const hapus = async (t) => {
    if (!window.confirm(`Hapus transaksi ${t.orderId}? Stok dikembalikan dan catatan kasnya dibatalkan.`)) return;
    try {
      await keuanganApi.hapusTransaksi(t.id);
      await ambil();
    } catch (e) {
      setGalat(e.message);
    }
  };

  const q = cari.trim().toLowerCase();
  const terlihat = q
    ? transaksi.filter(
        (t) => t.orderId?.toLowerCase().includes(q) || t.namaPelanggan?.toLowerCase().includes(q)
      )
    : transaksi;

  const ekspor = () =>
    unduhCsv(
      "transaksi",
      [
        { judul: "Tanggal", ambil: (t) => tanggalCsv(t.createdAt, true) },
        { judul: "Nomor pesanan", ambil: (t) => t.orderId },
        { judul: "Pelanggan", ambil: (t) => t.namaPelanggan },
        { judul: "Kanal", ambil: (t) => t.channel },
        { judul: "Status", ambil: (t) => labelStatus(t.status) },
        { judul: "Barang", ambil: (t) => angkaCsv(t.totalQty) },
        { judul: "Subtotal", ambil: (t) => angkaCsv(t.subtotal) },
        { judul: "Ongkir", ambil: (t) => angkaCsv(t.ongkir) },
        { judul: "Dibayar", ambil: (t) => angkaCsv(t.amount) },
        { judul: "Modal", ambil: (t) => angkaCsv(t.totalModal) },
        { judul: "Laba", ambil: (t) => angkaCsv((t.subtotal || 0) - (t.totalModal || 0)) },
      ],
      terlihat
    );

  return (
    <AdminLayout>
      <JudulHalaman
        judul="Transaksi"
        keterangan="Semua penjualan yang dihitung sebagai omzet, dari web maupun dari kasir toko."
        aksi={
          <>
            <Tombol variant="garis" size="sm" onClick={ekspor} disabled={terlihat.length === 0}>
              Unduh CSV
            </Tombol>
            <Link to="/IncomeStatement"><Tombol variant="garis" size="sm">Laba rugi</Tombol></Link>
            <Tombol variant="halus" size="sm" onClick={ambil}>Muat ulang</Tombol>
          </>
        }
      />

      {galat && <div className="mb-4"><Galat pesan={galat} onCoba={ambil} /></div>}

      {ringkasan && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KartuAngka label="Omzet" nilai={rupiah(ringkasan.totalOmzet)} catatan={`${ringkasan.jumlahTransaksiOmzet} transaksi`} nada="brand" />
          <KartuAngka label="Modal barang" nilai={rupiah(ringkasan.totalModal)} catatan="HPP dari harga modal tiap item" />
          <KartuAngka label="Laba kotor" nilai={rupiah(ringkasan.labaKotor)} catatan="Omzet dikurangi modal" nada="baik" />
          <KartuAngka label="Barang terjual" nilai={angka(ringkasan.totalBarangTerjual)} catatan="Total unit keluar" />
        </div>
      )}

      <Kartu className="mb-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <Isian label="Cari">
            <Input
              placeholder="Nomor pesanan atau pelanggan…"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
            />
          </Isian>
          <Isian label="Kanal">
            <Pilihan value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="">Semua kanal</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
            </Pilihan>
          </Isian>
          <Isian label="Dari tanggal">
            <Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} />
          </Isian>
          <Isian label="Sampai tanggal">
            <Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} />
          </Isian>
        </div>
      </Kartu>

      {memuat ? (
        <Memuat />
      ) : terlihat.length === 0 ? (
        <Kosong
          judul="Belum ada transaksi"
          keterangan="Transaksi muncul setelah ada pembayaran yang dikonfirmasi atau penjualan di kasir."
          aksi={<Link to="/Kasir"><Tombol variant="aksen" size="sm">Catat penjualan offline</Tombol></Link>}
        />
      ) : (
        <Tabel
          kepala={["Pesanan", "Pelanggan", "Kanal", "Bayar", "Modal", "Laba", "Status", ""]}
          min="min-w-[960px]"
        >
          {terlihat.map((t) => (
            <Baris key={t.id}>
              <Sel>
                <Link to={`/AdminOrderDetailPage/${t.id}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline">
                  {t.orderId}
                </Link>
                <div className="text-xs text-sand-400">{tanggal(t.createdAt, true)}</div>
              </Sel>
              <Sel>{t.namaPelanggan}</Sel>
              <Sel>
                <Chip className={t.channel === "OFFLINE" ? "bg-wool-100 text-wool-600" : "bg-brand-100 text-brand-600"}>
                  {t.channel}
                </Chip>
              </Sel>
              <Sel className="tabular font-semibold">{rupiah(t.amount)}</Sel>
              <Sel className="tabular text-sand-400">{rupiah(t.totalModal)}</Sel>
              <Sel className="tabular font-semibold text-leaf-500">
                {rupiah((t.subtotal || 0) - (t.totalModal || 0))}
              </Sel>
              <Sel><Chip className={warnaStatus(t.status)}>{labelStatus(t.status)}</Chip></Sel>
              <Sel>
                <div className="flex justify-end">
                  <Tombol size="sm" variant="garis" onClick={() => hapus(t)}>Hapus</Tombol>
                </div>
              </Sel>
            </Baris>
          ))}
        </Tabel>
      )}
    </AdminLayout>
  );
}
