/**
 * Mengunduh data tabel sebagai berkas CSV yang langsung rapi berkolom di Excel.
 *
 * Tiga hal yang diurus di sini, dan ketiganya perlu:
 *
 * 1. Pemisah titik koma, karena Excel berbahasa Indonesia membaca koma sebagai
 *    tanda desimal.
 * 2. Baris `sep=;` di paling atas. Tanpa ini Excel tetap mencoba memecah
 *    dengan koma, sehingga seluruh baris menumpuk di kolom A dan berkasnya
 *    tidak bisa dibaca. Excel membaca baris ini sebagai petunjuk, bukan data,
 *    jadi ia tidak ikut muncul sebagai isi tabel.
 * 3. Tanda BOM di awal berkas, supaya huruf beraksen dan tanda mata uang tidak
 *    berubah menjadi karakter aneh.
 */
export function unduhCsv(namaBerkas, kolom, baris) {
  const pemisah = ";";

  const bersihkan = (nilai) => {
    if (nilai === null || nilai === undefined) return "";
    const teks = String(nilai);
    // Tanda kutip di dalam sel digandakan, sesuai aturan CSV.
    if (teks.includes(pemisah) || teks.includes('"') || teks.includes("\n")) {
      return `"${teks.replaceAll('"', '""')}"`;
    }
    return teks;
  };

  const isi = [
    `sep=${pemisah}`,
    kolom.map((k) => bersihkan(k.judul)).join(pemisah),
    ...baris.map((b) => kolom.map((k) => bersihkan(k.ambil(b))).join(pemisah)),
  ].join("\r\n");

  const blob = new Blob(["﻿" + isi], { type: "text/csv;charset=utf-8;" });
  const tautan = document.createElement("a");
  tautan.href = URL.createObjectURL(blob);
  tautan.download = `${namaBerkas}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(tautan);
  tautan.click();
  document.body.removeChild(tautan);
  URL.revokeObjectURL(tautan.href);
}

/** Angka untuk CSV: tanpa pemisah ribuan, koma sebagai desimal. */
export function angkaCsv(nilai) {
  const n = Number(nilai) || 0;
  return String(n).replace(".", ",");
}

/**
 * Tanggal untuk CSV, ditulis hari/bulan/tahun.
 *
 * Bentuk tampilan seperti "16 Agu 2026" terbaca manusia tetapi dianggap teks
 * biasa oleh Excel, sehingga kolomnya tidak bisa diurutkan menurut waktu
 * maupun dipakai dalam rumus. Bentuk ini dikenali Excel berbahasa Indonesia
 * sebagai tanggal sungguhan.
 */
export function tanggalCsv(nilai, denganJam = false) {
  if (!nilai) return "";
  const d = new Date(nilai);
  if (Number.isNaN(d.getTime())) return String(nilai);

  const dua = (n) => String(n).padStart(2, "0");
  const tanggal = `${dua(d.getDate())}/${dua(d.getMonth() + 1)}/${d.getFullYear()}`;
  if (!denganJam) return tanggal;
  return `${tanggal} ${dua(d.getHours())}:${dua(d.getMinutes())}`;
}
