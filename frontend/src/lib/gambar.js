/**
 * Membaca foto dari perangkat lalu mengecilkannya sebelum dikirim ke server.
 *
 * Foto ponsel sekarang biasanya 4-8 MB. Kalau dikirim apa adanya, server
 * menolaknya (batasnya 3 MB) dan katalog pelanggan jadi berat dibuka lewat
 * data seluler — padahal yang ditampilkan cuma kotak kecil.
 *
 * Pengecilan dikerjakan di peramban supaya yang dikirim ke server sudah
 * seukuran pakai, bukan foto mentah.
 */

/** Sisi terpanjang gambar setelah dikecilkan, dalam piksel. */
const SISI_MAKSIMUM = 1200;

/** Mutu JPEG. 0,82 masih tajam di layar tetapi ukurannya jauh lebih kecil. */
const MUTU = 0.82;

export function bacaGambarKecil(file, sisiMaksimum = SISI_MAKSIMUM) {
  return new Promise((selesai, gagal) => {
    if (!file) {
      gagal(new Error("Tidak ada berkas yang dipilih."));
      return;
    }
    if (!file.type.startsWith("image/")) {
      gagal(new Error("Berkas yang dipilih harus berupa gambar."));
      return;
    }

    const pembaca = new FileReader();
    pembaca.onerror = () => gagal(new Error("Berkas tidak bisa dibaca."));
    pembaca.onload = () => {
      const gambar = new Image();
      gambar.onerror = () => gagal(new Error("Gambar tidak bisa dibuka. Coba berkas lain."));
      gambar.onload = () => {
        const skala = Math.min(1, sisiMaksimum / Math.max(gambar.width, gambar.height));
        const lebar = Math.round(gambar.width * skala);
        const tinggi = Math.round(gambar.height * skala);

        const kanvas = document.createElement("canvas");
        kanvas.width = lebar;
        kanvas.height = tinggi;

        const kuas = kanvas.getContext("2d");
        // Foto produk tidak butuh latar tembus pandang, dan JPEG tanpa latar
        // putih akan memunculkan bidang hitam saat PNG transparan diubah.
        kuas.fillStyle = "#ffffff";
        kuas.fillRect(0, 0, lebar, tinggi);
        kuas.drawImage(gambar, 0, 0, lebar, tinggi);

        selesai(kanvas.toDataURL("image/jpeg", MUTU));
      };
      gambar.src = pembaca.result;
    };
    pembaca.readAsDataURL(file);
  });
}

/** Perkiraan ukuran data URI dalam KB, untuk ditampilkan ke pengguna. */
export function ukuranKb(dataUri) {
  if (!dataUri || !dataUri.startsWith("data:")) return 0;
  const isi = dataUri.slice(dataUri.indexOf(",") + 1);
  return Math.round((isi.length * 3) / 4 / 1024);
}
