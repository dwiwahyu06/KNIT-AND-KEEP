import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  Galat, Input, Isian, JudulHalaman, Kartu, Memuat, Pilihan, Tombol,
} from "../components/ui";
import { laporanApi } from "../lib/api";
import { rupiah, tanggal } from "../lib/format";
import { unduhPdf } from "../lib/cetak";

export default function IncomeStatementDetailed() {
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [filter, setFilter] = useState({ channel: "", dari: "", sampai: "" });
  const [mencetak, setMencetak] = useState(false);
  const areaCetak = useRef(null);

  const ambil = useCallback(async () => {
    setMemuat(true);
    setGalat("");
    try {
      const q = new URLSearchParams();
      if (filter.channel) q.set("channel", filter.channel);
      if (filter.dari) q.set("dari", filter.dari);
      if (filter.sampai) q.set("sampai", filter.sampai);
      const s = q.toString();
      setData(await laporanApi.labaRugiRinci(s ? `?${s}` : ""));
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
  }, [filter]);

  useEffect(() => {
    ambil();
  }, [ambil]);

  const cetak = async () => {
    setMencetak(true);
    try {
      await unduhPdf(areaCetak.current, "laba-rugi-rinci");
    } catch (e) {
      setGalat("Gagal membuat PDF: " + e.message);
    } finally {
      setMencetak(false);
    }
  };

  return (
    <AdminLayout>
      <JudulHalaman
        judul="Laba Rugi Rinci"
        keterangan="Disusun mengikuti urutan laporan laba rugi yang lazim, dari pendapatan sampai laba bersih."
        aksi={
          <>
            <Link to="/IncomeStatement"><Tombol variant="garis" size="sm">Versi ringkas</Tombol></Link>
            <Tombol size="sm" onClick={cetak} disabled={mencetak || !data}>
              {mencetak ? "Menyiapkan…" : "Unduh PDF"}
            </Tombol>
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
            <Tombol variant="halus" className="w-full" onClick={() => setFilter({ channel: "", dari: "", sampai: "" })}>
              Reset filter
            </Tombol>
          </div>
        </div>
      </Kartu>

      {galat && <div className="mb-4"><Galat pesan={galat} onCoba={ambil} /></div>}

      {memuat ? (
        <Memuat />
      ) : data ? (
        <div ref={areaCetak} className="rounded-xl border border-sand-200 bg-white p-8">
          <div className="mb-6 border-b border-sand-200 pb-5">
            <h2 className="display text-xl font-bold text-sand-800">Knit &amp; Keep</h2>
            <p className="text-sm text-sand-500">Laporan Laba Rugi</p>
            <p className="mt-1 text-xs text-sand-400">
              {filter.dari || filter.sampai
                ? `Periode ${filter.dari ? tanggal(filter.dari) : "awal"} – ${filter.sampai ? tanggal(filter.sampai) : "sekarang"}`
                : "Seluruh periode"}
              {filter.channel && ` · kanal ${filter.channel}`}
            </p>
          </div>

          <dl className="text-sm">
            <Bagian judul="Pendapatan" />
            <Baris k="Penjualan bersih" v={data.revenue} />
            <Baris k="Harga pokok penjualan" v={-data.hpp} />
            <Total k="Laba kotor" v={data.grossProfit} />

            <Bagian judul="Beban usaha" />
            <Baris k="Beban operasional" v={-data.operatingExpense} />
            <Total k="Laba usaha" v={data.operatingProfit} />

            <Bagian judul="Lain-lain" />
            <Baris
              k="Kerugian retur, ganti rugi, dan barang hilang"
              v={data.otherIncomeExpense}
            />
            <Baris k="Pajak" v={-data.tax} />
            <Total k="Laba bersih" v={data.netProfit} besar />
          </dl>

          <p className="mt-6 border-t border-sand-200 pt-4 text-xs text-sand-400">
            Dicetak {tanggal(new Date(), true)}. Angka HPP dihitung dari harga modal
            yang tersimpan pada tiap barang di setiap pesanan.
          </p>
        </div>
      ) : null}
    </AdminLayout>
  );
}

function Bagian({ judul }) {
  return (
    <div className="label-mono mt-5 border-b border-sand-200 pb-2 text-sand-400 first:mt-0">
      {judul}
    </div>
  );
}

function Baris({ k, v }) {
  const negatif = v < 0;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-sand-100 py-2.5 text-sand-600">
      <dt>{k}</dt>
      <dd className={`tabular ${negatif ? "text-rust-500" : ""}`}>
        {negatif ? `(${rupiah(Math.abs(v))})` : rupiah(v)}
      </dd>
    </div>
  );
}

function Total({ k, v, besar = false }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 border-b-2 border-sand-300 py-3 font-bold text-sand-800 ${
        besar ? "text-base" : ""
      }`}
    >
      <dt>{k}</dt>
      <dd className={`tabular ${besar ? "text-lg" : ""} ${v < 0 ? "text-rust-500" : "text-leaf-500"}`}>
        {v < 0 ? `(${rupiah(Math.abs(v))})` : rupiah(v)}
      </dd>
    </div>
  );
}
