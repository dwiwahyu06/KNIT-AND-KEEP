/**
 * Nomor CS toko dan pembuat tautan WhatsApp.
 *
 * Nomornya ditulis sekali di sini supaya berganti nomor cukup satu perubahan,
 * bukan berburu ke setiap halaman yang memasang tombolnya. Di server nomornya
 * bisa diganti tanpa mengubah kode lewat VITE_WA_CS.
 */
export const NOMOR_CS = import.meta.env.VITE_WA_CS || "085187238701";

/**
 * Mengubah 08xx… menjadi 628xx….
 *
 * wa.me menolak nomor berawalan 0 — dibacanya sebagai nomor yang tidak sah
 * dan pelanggan mendarat di halaman galat WhatsApp, bukan di percakapan.
 */
export function nomorInternasional(nomor = NOMOR_CS) {
  const angka = String(nomor).replace(/\D/g, "");
  if (angka.startsWith("62")) return angka;
  if (angka.startsWith("0")) return `62${angka.slice(1)}`;
  return `62${angka}`;
}

/** Bentuk yang enak dibaca di layar, misalnya 0851-8723-8701. */
export function nomorTampil(nomor = NOMOR_CS) {
  const angka = String(nomor).replace(/\D/g, "");
  const lokal = angka.startsWith("62") ? `0${angka.slice(2)}` : angka;
  return lokal.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3");
}

/** Tautan percakapan WhatsApp, boleh dengan pesan yang sudah terisi. */
export function tautanWa(pesan = "") {
  const dasar = `https://wa.me/${nomorInternasional()}`;
  return pesan ? `${dasar}?text=${encodeURIComponent(pesan)}` : dasar;
}

/**
 * Pesan pembuka yang terisi sendiri.
 *
 * Yang membuat CS lewat WhatsApp berguna bukan nomornya, melainkan konteksnya:
 * tanpa nomor pesanan atau nama barang, percakapan selalu dimulai dengan dua
 * tiga pertanyaan balik sebelum admin bisa menolong apa pun.
 */
export const PESAN_CS = {
  umum: () => "Halo Knit & Keep, saya mau bertanya.",

  produk: (produk, habis = false) =>
    `Halo Knit & Keep, saya mau tanya ${habis ? "barang serupa dengan" : "barang"} ini:\n\n` +
    `${produk?.name || "-"}${produk?.sku ? ` (${produk.sku})` : ""}\n` +
    `${window.location.origin}/produk/${produk?.id}`,

  pesanan: (pesanan) =>
    `Halo Knit & Keep, saya mau tanya pesanan saya:\n\n` +
    `Nomor pesanan: ${pesanan?.orderId || "-"}\n` +
    `Status: ${pesanan?.statusLabel || pesanan?.status || "-"}`,
};
