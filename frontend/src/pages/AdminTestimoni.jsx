import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { Bintang } from "../components/Bintang";
import {
  AreaTeks, Chip, Dialog, Galat, JudulHalaman, Kartu, KartuAngka, Kosong,
  Memuat, Tombol,
} from "../components/ui";
import { testimoniApi } from "../lib/api";
import { tanggal } from "../lib/format";
import { tanggalCsv, unduhCsv } from "../lib/csv";

const TAB = [
  { nilai: "", label: "Semua" },
  { nilai: "true", label: "Tampil di toko" },
  { nilai: "false", label: "Disembunyikan" },
];

/**
 * Moderasi penilaian pelanggan.
 *
 * Testimoni tampil di halaman depan begitu terkirim. Menahan semuanya sampai
 * disetujui membuat pembeli merasa dinilai lebih dulu sebelum didengar, dan
 * pada toko sekecil ini antreannya pasti menumpuk. Yang disediakan di sini
 * adalah remnya: menurunkan testimoni yang tidak pantas, dan menjawabnya.
 */
export default function AdminTestimoni() {
  const [tab, setTab] = useState("");
  const [daftar, setDaftar] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [pesan, setPesan] = useState("");
  const [sibuk, setSibuk] = useState(false);

  const [dibalas, setDibalas] = useState(null);
  const [balasan, setBalasan] = useState("");

  const ambil = useCallback(async () => {
    setMemuat(true);
    setGalat("");
    try {
      setDaftar(await testimoniApi.semua(tab));
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
  }, [tab]);

  useEffect(() => {
    ambil();
  }, [ambil]);

  /* Dihitung dari yang tampil saja — itu yang dibaca calon pembeli. */
  const ringkas = useMemo(() => {
    const tampil = daftar.filter((t) => t.ditampilkan);
    const jumlah = tampil.length;
    const rata = jumlah
      ? Math.round((tampil.reduce((n, t) => n + (t.rating || 0), 0) / jumlah) * 10) / 10
      : 0;
    return {
      jumlah,
      rata,
      rendah: tampil.filter((t) => (t.rating || 0) <= 2).length,
      belumDibalas: tampil.filter((t) => !t.balasanAdmin).length,
    };
  }, [daftar]);

  const aturTampil = async (t, tampil) => {
    setSibuk(true);
    setGalat("");
    try {
      await testimoniApi.aturTampil(t.id, tampil);
      setPesan(
        tampil
          ? `Testimoni ${t.orderId} tampil kembali di toko.`
          : `Testimoni ${t.orderId} disembunyikan dari toko.`
      );
      await ambil();
    } catch (e) {
      setGalat(e.message);
    } finally {
      setSibuk(false);
    }
  };

  const kirimBalasan = async () => {
    setSibuk(true);
    setGalat("");
    try {
      await testimoniApi.balas(dibalas.id, balasan);
      setDibalas(null);
      setPesan("Balasan tersimpan dan ikut tampil di bawah testimoninya.");
      await ambil();
    } catch (e) {
      setGalat(e.message);
    } finally {
      setSibuk(false);
    }
  };

  const hapus = async (t) => {
    const yakin = window.confirm(
      `Hapus testimoni untuk pesanan ${t.orderId}? Penilaian pelanggan ini hilang permanen. ` +
        `Untuk sekadar menurunkannya dari toko, pakai tombol Sembunyikan.`
    );
    if (!yakin) return;

    setSibuk(true);
    setGalat("");
    try {
      await testimoniApi.hapus(t.id);
      setPesan("Testimoni dihapus.");
      await ambil();
    } catch (e) {
      setGalat(e.message);
    } finally {
      setSibuk(false);
    }
  };

  return (
    <AdminLayout>
      <JudulHalaman
        judul="Testimoni"
        keterangan="Penilaian bintang dan ulasan pelanggan atas pesanan yang sudah selesai. Yang tampil di sini juga yang dibaca calon pembeli di halaman depan."
        aksi={
          <>
            <Tombol
              variant="garis"
              size="sm"
              disabled={daftar.length === 0}
              onClick={() =>
                unduhCsv(
                  "testimoni",
                  [
                    { judul: "Tanggal", ambil: (t) => tanggalCsv(t.createdAt, true) },
                    { judul: "Nomor pesanan", ambil: (t) => t.orderId },
                    { judul: "Pelanggan", ambil: (t) => t.namaPelanggan },
                    { judul: "Bintang", ambil: (t) => t.rating },
                    { judul: "Ulasan", ambil: (t) => t.ulasan || "" },
                    { judul: "Barang", ambil: (t) => (t.barang || []).join(", ") },
                    { judul: "Tampil di toko", ambil: (t) => (t.ditampilkan ? "Ya" : "Tidak") },
                    { judul: "Balasan toko", ambil: (t) => t.balasanAdmin || "" },
                  ],
                  daftar
                )
              }
            >
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

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KartuAngka
          label="Rata-rata bintang"
          nilai={ringkas.jumlah ? `${String(ringkas.rata).replace(".", ",")} / 5` : "—"}
          catatan="Dari testimoni yang tampil di toko"
          nada="brand"
        />
        <KartuAngka label="Testimoni tampil" nilai={ringkas.jumlah} />
        <KartuAngka
          label="Bintang 1–2"
          nilai={ringkas.rendah}
          catatan="Paling layak dijawab lebih dulu"
          nada={ringkas.rendah > 0 ? "bahaya" : "netral"}
        />
        <KartuAngka
          label="Belum dibalas"
          nilai={ringkas.belumDibalas}
          nada={ringkas.belumDibalas > 0 ? "perhatian" : "baik"}
        />
      </div>

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
          judul="Belum ada testimoni"
          keterangan="Penilaian muncul di sini setelah pelanggan menekan Beri Penilaian pada pesanan yang sudah selesai."
        />
      ) : (
        <div className="space-y-4">
          {daftar.map((t) => (
            <Kartu key={t.id}>
              <div className="flex flex-wrap items-center gap-2">
                <Bintang nilai={t.rating} ukuran="sm" />
                <span className="text-sm font-semibold text-sand-700">{t.namaPelanggan}</span>
                {!t.ditampilkan && (
                  <Chip className="bg-sand-200 text-sand-600">Disembunyikan</Chip>
                )}
              </div>
              <p className="mt-1 text-xs text-sand-400">
                <Link
                  to={`/AdminOrderDetailPage/${t.transactionId}`}
                  className="font-mono font-semibold text-brand-600 hover:underline"
                >
                  {t.orderId}
                </Link>
                {" · "}
                {tanggal(t.createdAt, true)}
              </p>

              {t.ulasan ? (
                <p className="mt-3 whitespace-pre-line text-sm text-sand-700">{t.ulasan}</p>
              ) : (
                <p className="mt-3 text-sm italic text-sand-400">
                  Hanya memberi bintang, tanpa ulasan tertulis.
                </p>
              )}

              {(t.barang || []).length > 0 && (
                <p className="mt-2 text-xs text-sand-400">Barang: {t.barang.join(", ")}</p>
              )}

              {t.balasanAdmin && (
                <div className="mt-3 rounded-lg bg-sand-100 px-3 py-2.5">
                  <p className="label-mono text-sand-400">Balasan toko</p>
                  <p className="mt-1 text-sm text-sand-600">{t.balasanAdmin}</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Tombol
                  size="sm"
                  variant="garis"
                  disabled={sibuk}
                  onClick={() => {
                    setDibalas(t);
                    setBalasan(t.balasanAdmin || "");
                  }}
                >
                  {t.balasanAdmin ? "Ubah balasan" : "Balas"}
                </Tombol>
                <Tombol
                  size="sm"
                  variant="halus"
                  disabled={sibuk}
                  onClick={() => aturTampil(t, !t.ditampilkan)}
                >
                  {t.ditampilkan ? "Sembunyikan" : "Tampilkan"}
                </Tombol>
                <Tombol size="sm" variant="bahaya" disabled={sibuk} onClick={() => hapus(t)}>
                  Hapus
                </Tombol>
              </div>
            </Kartu>
          ))}
        </div>
      )}

      <Dialog
        terbuka={!!dibalas}
        onTutup={() => setDibalas(null)}
        judul="Balas testimoni"
        keterangan={dibalas ? `Pesanan ${dibalas.orderId}` : ""}
      >
        <div className="space-y-4">
          {dibalas && (
            <div className="rounded-lg bg-sand-100 px-3 py-2.5">
              <Bintang nilai={dibalas.rating} ukuran="sm" />
              <p className="mt-1 text-sm text-sand-600">
                {dibalas.ulasan || "Tanpa ulasan tertulis."}
              </p>
            </div>
          )}

          <AreaTeks
            value={balasan}
            onChange={(e) => setBalasan(e.target.value)}
            maxLength={1024}
            placeholder="Contoh: Terima kasih sudah belanja di Knit & Keep. Maaf kirimnya sempat terlambat, minggu ini sudah kami perbaiki."
          />
          <p className="text-xs text-sand-400">
            Balasan ikut tampil di halaman depan. Mengosongkannya menghapus balasan.
          </p>

          <div className="flex gap-2">
            <Tombol className="flex-1" onClick={kirimBalasan} disabled={sibuk}>
              {sibuk ? "Menyimpan…" : "Simpan balasan"}
            </Tombol>
            <Tombol variant="halus" onClick={() => setDibalas(null)}>Batal</Tombol>
          </div>
        </div>
      </Dialog>
    </AdminLayout>
  );
}
