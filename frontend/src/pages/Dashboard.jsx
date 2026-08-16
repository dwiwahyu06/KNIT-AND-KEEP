import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import AdminLayout from "../components/AdminLayout";
import {
  Chip, Galat, Kartu, KartuAngka, KartuJudul, Kosong, Memuat, Sel, Baris, Tabel, Tombol,
} from "../components/ui";
import { dashboardApi } from "../lib/api";
import { angka, labelStatus, namaBulan, rupiah, tanggal, warnaStatus } from "../lib/format";

export default function DashboardAdmin() {
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  const ambil = useCallback(async () => {
    setMemuat(true);
    setGalat("");
    try {
      const q = new URLSearchParams();
      if (dari) q.set("dari", dari);
      if (sampai) q.set("sampai", sampai);
      setData(await dashboardApi.ringkasan(q.toString()));
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
  }, [dari, sampai]);

  useEffect(() => {
    ambil();
  }, [ambil]);

  if (memuat) return <AdminLayout><Memuat /></AdminLayout>;
  if (galat) return <AdminLayout><Galat pesan={galat} onCoba={ambil} /></AdminLayout>;

  const status = data.pesananPerStatus || {};
  const totalOmzet = (data.omzetOnline || 0) + (data.omzetOffline || 0);
  const persenOnline = totalOmzet ? Math.round((data.omzetOnline / totalOmzet) * 100) : 0;

  const tren = (data.tren || []).map((t) => ({
    ...t,
    label: namaBulan(t.bulan).split(" ")[0].slice(0, 3),
  }));

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-2xl font-bold text-sand-800">Dashboard</h1>
          <p className="mt-1 text-sm text-sand-500">
            Ringkasan penjualan, stok, dan pesanan yang perlu ditindak hari ini.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-sand-600">Dari</span>
            <input type="date" value={dari} onChange={(e) => setDari(e.target.value)}
              className="rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-sand-600">Sampai</span>
            <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)}
              className="rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400" />
          </label>
          {(dari || sampai) && (
            <Tombol variant="halus" size="sm" onClick={() => { setDari(""); setSampai(""); }}>
              Semua periode
            </Tombol>
          )}
          <Tombol variant="garis" size="sm" onClick={ambil}>Muat ulang</Tombol>
        </div>
      </div>

      {/* Angka utama */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KartuAngka
          label="Omzet hari ini"
          nilai={rupiah(data.omzetHariIni)}
          catatan={`${data.transaksiHariIni} transaksi hari ini`}
          nada="brand"
        />
        <KartuAngka
          label="Omzet keseluruhan"
          nilai={rupiah(data.omzetTotal)}
          catatan={`Laba kotor ${rupiah(data.labaKotor)}`}
          nada="baik"
        />
        <KartuAngka
          label="Perlu ditindak"
          nilai={angka(data.perluDitindak)}
          catatan="Belum bayar, diproses, atau komplain"
          nada={data.perluDitindak > 0 ? "perhatian" : "netral"}
        />
        <KartuAngka
          label="Stok menipis"
          nilai={angka(data.stokMenipis?.length || 0)}
          catatan={`${data.stokHabis} produk habis · ${angka(data.totalStok)} unit total`}
          nada={data.stokMenipis?.length ? "bahaya" : "netral"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kolom kiri */}
        <div className="space-y-6 lg:col-span-2">
          <Kartu>
            <KartuJudul
              judul="Tren enam bulan terakhir"
              keterangan="Omzet dibandingkan dengan modal barang dan pengeluaran toko."
            />
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tren} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dfe1dd" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6f746e" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ba09a" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${v / 1000}rb` : v)}
                  />
                  <Tooltip
                    formatter={(v, n) => [rupiah(v), n]}
                    contentStyle={{ borderRadius: 10, border: "1px solid #dfe1dd", fontSize: 13 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="omzet" name="Omzet" fill="#183d4b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hpp" name="Modal" fill="#dda54c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#c6c9c4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Kartu>

          <Kartu padat>
            <div className="p-5 pb-0">
              <KartuJudul
                judul="Pesanan terbaru"
                aksi={
                  <Link to="/AdminOrdersPage">
                    <Tombol variant="halus" size="sm">Lihat semua</Tombol>
                  </Link>
                }
              />
            </div>
            <div className="px-2 pb-2">
              <Tabel
                kepala={["Pesanan", "Pelanggan", "Kanal", "Total", "Status"]}
                kosong="Belum ada pesanan masuk."
                min="min-w-[620px]"
              >
                {(data.pesananTerbaru || []).map((p) => (
                  <Baris key={p.id}>
                    <Sel>
                      <Link to={`/AdminOrderDetailPage/${p.id}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline">
                        {p.orderId}
                      </Link>
                      <div className="text-xs text-sand-400">{tanggal(p.createdAt, true)}</div>
                    </Sel>
                    <Sel>{p.namaPelanggan}</Sel>
                    <Sel>
                      <Chip className={p.channel === "OFFLINE" ? "bg-wool-100 text-wool-600" : "bg-brand-100 text-brand-600"}>
                        {p.channel}
                      </Chip>
                    </Sel>
                    <Sel className="tabular font-semibold">{rupiah(p.amount)}</Sel>
                    <Sel>
                      <Chip className={warnaStatus(p.status)}>{labelStatus(p.status)}</Chip>
                    </Sel>
                  </Baris>
                ))}
              </Tabel>
            </div>
          </Kartu>
        </div>

        {/* Kolom kanan */}
        <div className="space-y-6">
          <Kartu>
            <KartuJudul judul="Online vs offline" keterangan="Kontribusi tiap kanal ke omzet." />
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
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sand-600">
                  <span className="h-2.5 w-2.5 rounded-sm bg-wool-400" /> Offline
                </span>
                <span className="tabular font-semibold">{rupiah(data.omzetOffline)}</span>
              </div>
            </div>
            <Link to="/Kasir" className="mt-4 block">
              <Tombol variant="aksen" size="sm" className="w-full">Catat penjualan offline</Tombol>
            </Link>
          </Kartu>

          <Kartu>
            <KartuJudul judul="Pesanan per status" />
            <div className="space-y-1.5">
              {Object.entries(status).map(([s, jumlah]) => (
                <Link
                  key={s}
                  to={`/AdminOrdersPage?status=${s}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 transition hover:bg-sand-50"
                >
                  <Chip className={warnaStatus(s)}>{labelStatus(s)}</Chip>
                  <span className="tabular text-sm font-semibold text-sand-700">{jumlah}</span>
                </Link>
              ))}
            </div>
            {data.returMenunggu > 0 && (
              <Link to="/AdminRetur" className="mt-4 block rounded-lg bg-rust-100 px-3 py-2.5 text-sm text-rust-500 transition hover:opacity-90">
                <b>{data.returMenunggu}</b> pengajuan retur menunggu ditinjau →
              </Link>
            )}
          </Kartu>

          <Kartu>
            <KartuJudul
              judul="Stok menipis"
              keterangan="Sisa 3 unit atau kurang."
              aksi={<Link to="/Stock"><Tombol variant="halus" size="sm">Kelola</Tombol></Link>}
            />
            {data.stokMenipis?.length ? (
              <ul className="space-y-2">
                {data.stokMenipis.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-sand-700">{p.name}</span>
                    <Chip className={p.stock === 0 ? "bg-rust-100 text-rust-500" : "bg-amber-100 text-amber-ui"}>
                      {p.stock === 0 ? "Habis" : `${p.stock} sisa`}
                    </Chip>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-sand-400">Semua stok aman.</p>
            )}
          </Kartu>

          <Kartu>
            <KartuJudul judul="Barang terlaris" />
            {data.barangTerlaris?.length ? (
              <ul className="space-y-2.5">
                {data.barangTerlaris.map((b, i) => (
                  <li key={b.nama} className="flex items-start gap-3 text-sm">
                    <span className="label-mono mt-1 text-sand-400">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1">
                      <span className="block text-sand-700">{b.nama}</span>
                      <span className="text-xs text-sand-400">
                        {b.qty} terjual · laba {rupiah(b.laba)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Kosong judul="Belum ada penjualan" keterangan="Barang terlaris muncul setelah ada transaksi." />
            )}
          </Kartu>
        </div>
      </div>
    </AdminLayout>
  );
}
