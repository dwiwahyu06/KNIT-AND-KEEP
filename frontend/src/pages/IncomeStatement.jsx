import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  Galat, Input, Isian, JudulHalaman, Kartu, KartuAngka, Memuat, Pilihan, Tombol,
} from "../components/ui";
import { laporanApi } from "../lib/api";
import { rupiah } from "../lib/format";
import { angkaCsv, unduhCsv } from "../lib/csv";

export default function IncomeStatement() {
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [filter, setFilter] = useState({ channel: "", dari: "", sampai: "" });

  const ambil = useCallback(async () => {
    setMemuat(true);
    setGalat("");
    try {
      const q = new URLSearchParams();
      if (filter.channel) q.set("channel", filter.channel);
      if (filter.dari) q.set("dari", filter.dari);
      if (filter.sampai) q.set("sampai", filter.sampai);
      const s = q.toString();
      setData(await laporanApi.labaRugi(s ? `?${s}` : ""));
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
  }, [filter]);

  useEffect(() => {
    ambil();
  }, [ambil]);

  const marginPersen = data?.revenue ? Math.round((data.profit / data.revenue) * 100) : 0;

  return (
    <AdminLayout>
      <JudulHalaman
        judul="Laba Rugi"
        keterangan="Omzet dihitung dari pesanan yang sudah dibayar. HPP dijumlah dari harga modal tiap barang yang benar-benar terjual."
        aksi={
          <>
            <Tombol variant="garis" size="sm" disabled={!data}
              onClick={() =>
                unduhCsv(
                  "laba-rugi",
                  [
                    { judul: "Pos", ambil: (b) => b.pos },
                    { judul: "Nilai", ambil: (b) => angkaCsv(b.nilai) },
                  ],
                  [
                    { pos: "Pendapatan penjualan", nilai: data.revenue },
                    { pos: "Harga pokok penjualan", nilai: -data.hpp },
                    { pos: "Laba kotor", nilai: data.revenue - data.hpp },
                    { pos: "Beban usaha dan kerugian", nilai: -data.expense },
                    { pos: "Laba bersih", nilai: data.profit },
                  ]
                )
              }>
              Unduh CSV
            </Tombol>
            <Link to="/IncomeStatementDetailed"><Tombol variant="halus" size="sm">Versi rinci</Tombol></Link>
          </>
        }
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
            <Tombol
              variant="halus"
              className="w-full"
              onClick={() => setFilter({ channel: "", dari: "", sampai: "" })}
            >
              Reset filter
            </Tombol>
          </div>
        </div>
      </Kartu>

      {galat && <Galat pesan={galat} onCoba={ambil} />}

      {memuat ? (
        <Memuat />
      ) : data ? (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KartuAngka label="Pendapatan" nilai={rupiah(data.revenue)} nada="brand" />
            <KartuAngka label="HPP" nilai={rupiah(data.hpp)} catatan="Modal barang terjual" />
            <KartuAngka label="Beban" nilai={rupiah(data.expense)} catatan="Pengeluaran + kerugian retur" nada="bahaya" />
            <KartuAngka
              label="Laba bersih"
              nilai={rupiah(data.profit)}
              catatan={`Margin ${marginPersen}% dari pendapatan`}
              nada={data.profit >= 0 ? "baik" : "bahaya"}
            />
          </div>

          <Kartu>
            <h2 className="display mb-4 text-base font-bold text-sand-800">Perhitungan</h2>
            <dl className="divide-y divide-sand-100 text-sm">
              <Baris k="Pendapatan penjualan" v={data.revenue} />
              <Baris k="Harga pokok penjualan" v={-data.hpp} />
              <Baris k="Laba kotor" v={data.revenue - data.hpp} tebal />
              <Baris k="Beban usaha dan kerugian" v={-data.expense} />
              <Baris k="Laba bersih" v={data.profit} tebal besar />
            </dl>
          </Kartu>
        </>
      ) : null}
    </AdminLayout>
  );
}

function Baris({ k, v, tebal = false, besar = false }) {
  const negatif = v < 0;
  return (
    <div className={`flex items-center justify-between gap-4 py-3 ${tebal ? "font-bold text-sand-800" : "text-sand-600"}`}>
      <dt className={besar ? "text-base" : ""}>{k}</dt>
      <dd className={`tabular ${besar ? "text-lg" : ""} ${negatif && !tebal ? "text-rust-500" : ""}`}>
        {negatif ? `(${rupiah(Math.abs(v))})` : rupiah(v)}
      </dd>
    </div>
  );
}
