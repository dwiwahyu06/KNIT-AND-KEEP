import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  Baris, Chip, Galat, Input, JudulHalaman, Kartu, Kosong, Memuat, Pilihan, Sel, Tabel, Tombol,
} from "../components/ui";
import { pesananApi } from "../lib/api";
import { labelStatus, rupiah, tanggal, warnaStatus } from "../lib/format";

const STATUS = [
  "", "MENUNGGU_PEMBAYARAN", "DIPROSES", "DIKIRIM", "SELESAI",
  "DIBATALKAN", "KOMPLAIN", "RETUR_DIPROSES", "REFUND", "GANTI_RUGI",
];

export default function AdminOrdersPage() {
  const [params, setParams] = useSearchParams();
  const [pesanan, setPesanan] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [cari, setCari] = useState("");

  const channel = params.get("channel") || "";
  const status = params.get("status") || "";

  const ambil = useCallback(async () => {
    setMemuat(true);
    setGalat("");
    try {
      setPesanan(await pesananApi.semua(channel, status));
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
  }, [channel, status]);

  useEffect(() => {
    ambil();
  }, [ambil]);

  const ubahFilter = (kunci, nilai) => {
    const baru = new URLSearchParams(params);
    if (nilai) baru.set(kunci, nilai);
    else baru.delete(kunci);
    setParams(baru);
  };

  const terlihat = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return pesanan;
    return pesanan.filter(
      (p) =>
        p.orderId?.toLowerCase().includes(q) ||
        p.namaPelanggan?.toLowerCase().includes(q) ||
        p.nomorResi?.toLowerCase().includes(q)
    );
  }, [pesanan, cari]);

  return (
    <AdminLayout>
      <JudulHalaman
        judul="Pesanan"
        keterangan="Semua pesanan dari web maupun dari kasir toko. Klik satu baris untuk memajukan statusnya."
        aksi={
          <>
            <Link to="/Kasir"><Tombol variant="aksen" size="sm">Penjualan offline</Tombol></Link>
            <Tombol variant="garis" size="sm" onClick={ambil}>Muat ulang</Tombol>
          </>
        }
      />

      <Kartu className="mb-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            placeholder="Cari nomor pesanan, pelanggan, atau resi…"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
          <Pilihan value={channel} onChange={(e) => ubahFilter("channel", e.target.value)}>
            <option value="">Semua kanal</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
          </Pilihan>
          <Pilihan value={status} onChange={(e) => ubahFilter("status", e.target.value)}>
            {STATUS.map((s) => (
              <option key={s} value={s}>{s ? labelStatus(s) : "Semua status"}</option>
            ))}
          </Pilihan>
        </div>
      </Kartu>

      {galat && <Galat pesan={galat} onCoba={ambil} />}

      {memuat ? (
        <Memuat />
      ) : terlihat.length === 0 ? (
        <Kosong
          judul="Tidak ada pesanan"
          keterangan={
            cari || channel || status
              ? "Tidak ada pesanan yang cocok dengan filter ini."
              : "Pesanan akan muncul di sini setelah ada pembelian atau penjualan di kasir."
          }
          aksi={<Link to="/Kasir"><Tombol variant="aksen" size="sm">Catat penjualan offline</Tombol></Link>}
        />
      ) : (
        <Tabel
          kepala={["Pesanan", "Pelanggan", "Kanal", "Barang", "Total", "Status", "Resi"]}
          min="min-w-[900px]"
        >
          {terlihat.map((p) => (
            <Baris key={p.id}>
              <Sel>
                <Link
                  to={`/AdminOrderDetailPage/${p.id}`}
                  className="font-mono text-xs font-semibold text-brand-600 hover:underline"
                >
                  {p.orderId}
                </Link>
                <div className="text-xs text-sand-400">{tanggal(p.createdAt, true)}</div>
              </Sel>
              <Sel>
                <span className="font-medium text-sand-800">{p.namaPelanggan}</span>
                {p.metodeBayar && (
                  <div className="text-xs text-sand-400">{p.metodeBayar}</div>
                )}
              </Sel>
              <Sel>
                <Chip className={p.channel === "OFFLINE" ? "bg-wool-100 text-wool-600" : "bg-brand-100 text-brand-600"}>
                  {p.channel}
                </Chip>
              </Sel>
              <Sel className="tabular text-sand-500">{p.totalQty} item</Sel>
              <Sel className="tabular font-semibold text-sand-800">{rupiah(p.amount)}</Sel>
              <Sel><Chip className={warnaStatus(p.status)}>{labelStatus(p.status)}</Chip></Sel>
              <Sel className="font-mono text-xs text-sand-500">{p.nomorResi || "—"}</Sel>
            </Baris>
          ))}
        </Tabel>
      )}
    </AdminLayout>
  );
}
