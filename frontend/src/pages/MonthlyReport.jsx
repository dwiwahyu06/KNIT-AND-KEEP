import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  Baris, Chip, Galat, Input, Isian, JudulHalaman, Kartu, KartuAngka, KartuJudul,
  Kosong, Memuat, Pilihan, Sel, Tabel, Tombol,
} from "../components/ui";
import { laporanApi } from "../lib/api";
import { angka, bulanIni, labelStatus, namaBulan, rupiah, tanggal, warnaStatus } from "../lib/format";
import { angkaCsv, tanggalCsv, unduhCsv } from "../lib/csv";
import { unduhPdf } from "../lib/cetak";

export default function MonthlyReport() {
  const [bulan, setBulan] = useState(bulanIni());
  const [channel, setChannel] = useState("");
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");

  const ambil = useCallback(async () => {
    setMemuat(true);
    setGalat("");
    try {
      setData(await laporanApi.bulanan(bulan, channel));
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
  }, [bulan, channel]);

  useEffect(() => {
    ambil();
  }, [ambil]);

  const areaCetak = useRef(null);
  const [mencetak, setMencetak] = useState(false);

  const cetak = async () => {
    setMencetak(true);
    try {
      await unduhPdf(areaCetak.current, `laporan-${bulan}`);
    } catch (e) {
      setGalat("Gagal membuat PDF: " + e.message);
    } finally {
      setMencetak(false);
    }
  };

  const eksporCsv = () =>
    unduhCsv(
      `transaksi-${bulan}`,
      [
        { judul: "Tanggal", ambil: (t) => tanggalCsv(t.createdAt, true) },
        { judul: "Nomor pesanan", ambil: (t) => t.orderId },
        { judul: "Pelanggan", ambil: (t) => t.namaPelanggan },
        { judul: "Kanal", ambil: (t) => t.channel },
        { judul: "Status", ambil: (t) => labelStatus(t.status) },
        { judul: "Barang", ambil: (t) => angkaCsv(t.totalQty) },
        { judul: "Subtotal", ambil: (t) => angkaCsv(t.subtotal) },
        { judul: "Ongkir", ambil: (t) => angkaCsv(t.ongkir) },
        { judul: "Total", ambil: (t) => angkaCsv(t.amount) },
        { judul: "Modal", ambil: (t) => angkaCsv(t.totalModal) },
        { judul: "Laba", ambil: (t) => angkaCsv((t.subtotal || 0) - (t.totalModal || 0)) },
      ],
      data?.transaksi || []
    );

  const persenOnline = data && (data.omzetOnline + data.omzetOffline)
    ? Math.round((data.omzetOnline / (data.omzetOnline + data.omzetOffline)) * 100)
    : 0;

  return (
    <AdminLayout>
      <JudulHalaman
        judul="Laporan Bulanan"
        keterangan="Rekap satu bulan lengkap dengan rincian barang terjual dan pemisahan penjualan online dan offline."
        aksi={
          <>
            <Tombol variant="garis" size="sm" onClick={eksporCsv}
              disabled={!data || (data.transaksi || []).length === 0}>
              Unduh CSV
            </Tombol>
            <Tombol size="sm" onClick={cetak} disabled={mencetak || !data}>
              {mencetak ? "Menyiapkan…" : "Unduh PDF"}
            </Tombol>
            <Link to="/IncomeStatementDetailed"><Tombol variant="halus" size="sm">Laba rugi rinci</Tombol></Link>
          </>
        }
      />

      <Kartu className="mb-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Isian label="Bulan">
            <Input type="month" value={bulan} onChange={(e) => setBulan(e.target.value)} />
          </Isian>
          <Isian label="Kanal">
            <Pilihan value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="">Semua</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
            </Pilihan>
          </Isian>
          <div className="flex items-end">
            <Tombol variant="halus" className="w-full" onClick={ambil}>Muat ulang</Tombol>
          </div>
        </div>
      </Kartu>

      {galat && <div className="mb-4"><Galat pesan={galat} onCoba={ambil} /></div>}

      {memuat ? (
        <Memuat />
      ) : !data ? null : (
        <div ref={areaCetak} className="rounded-xl bg-sand-50 p-1">
          <div className="mb-4 border-b border-sand-200 pb-3">
            <h2 className="display text-lg font-bold text-sand-800">Knit &amp; Keep</h2>
            <p className="text-sm text-sand-500">
              Laporan penjualan <b className="text-sand-700">{namaBulan(data.bulan)}</b>
              {channel && ` · kanal ${channel}`}
            </p>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KartuAngka label="Omzet" nilai={rupiah(data.omzet)} catatan={`${data.jumlahTransaksi} transaksi`} nada="brand" />
            <KartuAngka label="Laba kotor" nilai={rupiah(data.labaKotor)} catatan={`HPP ${rupiah(data.hpp)}`} nada="baik" />
            <KartuAngka label="Pengeluaran" nilai={rupiah(data.pengeluaran)} catatan={`Kerugian ${rupiah(data.kerugian)}`} nada="bahaya" />
            <KartuAngka
              label="Laba bersih"
              nilai={rupiah(data.labaBersih)}
              catatan={`${angka(data.totalBarangTerjual)} barang terjual`}
              nada={data.labaBersih >= 0 ? "baik" : "bahaya"}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Kartu padat>
                <div className="p-5 pb-0">
                  <KartuJudul judul="Barang terlaris bulan ini" />
                </div>
                <div className="px-2 pb-2">
                  <Tabel kepala={["Produk", "Terjual", "Omzet", "Laba"]} kosong="Belum ada penjualan bulan ini." min="min-w-[520px]">
                    {(data.barangTerlaris || []).map((b) => (
                      <Baris key={b.nama}>
                        <Sel className="font-medium text-sand-800">{b.nama}</Sel>
                        <Sel className="tabular">{b.qty}</Sel>
                        <Sel className="tabular">{rupiah(b.omzet)}</Sel>
                        <Sel className="tabular font-semibold text-leaf-500">{rupiah(b.laba)}</Sel>
                      </Baris>
                    ))}
                  </Tabel>
                </div>
              </Kartu>

              <Kartu padat>
                <div className="p-5 pb-0">
                  <KartuJudul judul="Transaksi bulan ini" />
                </div>
                <div className="px-2 pb-2">
                  <Tabel kepala={["Pesanan", "Pelanggan", "Kanal", "Total", "Status"]} kosong="Tidak ada transaksi." min="min-w-[640px]">
                    {(data.transaksi || []).map((t) => (
                      <Baris key={t.id}>
                        <Sel>
                          <Link to={`/AdminOrderDetailPage/${t.id}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline">
                            {t.orderId}
                          </Link>
                          <div className="text-xs text-sand-400">{tanggal(t.createdAt)}</div>
                        </Sel>
                        <Sel>{t.namaPelanggan}</Sel>
                        <Sel>
                          <Chip className={t.channel === "OFFLINE" ? "bg-wool-100 text-wool-600" : "bg-brand-100 text-brand-600"}>
                            {t.channel}
                          </Chip>
                        </Sel>
                        <Sel className="tabular font-semibold">{rupiah(t.amount)}</Sel>
                        <Sel><Chip className={warnaStatus(t.status)}>{labelStatus(t.status)}</Chip></Sel>
                      </Baris>
                    ))}
                  </Tabel>
                </div>
              </Kartu>
            </div>

            <div className="space-y-6">
              <Kartu>
                <KartuJudul judul="Online vs offline" />
                <div className="mb-3 flex h-2.5 overflow-hidden rounded-full bg-sand-200">
                  <div className="bg-brand-600" style={{ width: `${persenOnline}%` }} />
                  <div className="bg-wool-400" style={{ width: `${100 - persenOnline}%` }} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sand-600">
                      <span className="h-2.5 w-2.5 rounded-sm bg-brand-600" /> Online
                    </span>
                    <span className="tabular font-semibold">{rupiah(data.omzetOnline)}</span>
                  </div>
                  <p className="pl-5 text-xs text-sand-400">{data.transaksiOnline} transaksi</p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sand-600">
                      <span className="h-2.5 w-2.5 rounded-sm bg-wool-400" /> Offline
                    </span>
                    <span className="tabular font-semibold">{rupiah(data.omzetOffline)}</span>
                  </div>
                  <p className="pl-5 text-xs text-sand-400">{data.transaksiOffline} transaksi</p>
                </div>
              </Kartu>

              <Kartu padat>
                <div className="p-5 pb-0">
                  <KartuJudul judul="Pengeluaran bulan ini" />
                </div>
                {data.pengeluaranRinci?.length ? (
                  <ul className="divide-y divide-sand-100 px-5 pb-5">
                    {data.pengeluaranRinci.map((p) => (
                      <li key={p.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                        <span>
                          <span className="block text-sand-700">{p.description}</span>
                          <span className="text-xs text-sand-400">{tanggal(p.date)} · {p.category}</span>
                        </span>
                        <span className="tabular shrink-0 font-semibold text-rust-500">{rupiah(p.amount)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-5 pb-5">
                    <Kosong judul="Tidak ada pengeluaran" keterangan="Belum ada biaya tercatat bulan ini." />
                  </div>
                )}
              </Kartu>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
