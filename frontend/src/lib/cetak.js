/**
 * Mencetak sebuah bagian halaman menjadi PDF.
 *
 * Pustaka pembuat PDF dimuat saat dibutuhkan saja — ukurannya ratusan kilobyte
 * dan hanya dipakai ketika tombol unduh ditekan, jadi tidak perlu ikut termuat
 * di setiap halaman.
 */
export async function unduhPdf(elemen, namaBerkas) {
  if (!elemen) throw new Error("Bagian yang akan dicetak tidak ditemukan.");

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const kanvas = await html2canvas(elemen, { scale: 2, backgroundColor: "#ffffff" });
  const gambar = kanvas.toDataURL("image/png");

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const lebarHalaman = pdf.internal.pageSize.getWidth();
  const tinggiHalaman = pdf.internal.pageSize.getHeight();
  const tepi = 30;

  const lebar = lebarHalaman - tepi * 2;
  const tinggi = (kanvas.height * lebar) / kanvas.width;

  // Laporan yang panjang dipotong menjadi beberapa halaman, bukan dipaksa
  // muat dalam satu halaman sampai tulisannya tidak terbaca.
  let sisa = tinggi;
  let posisi = tepi;

  pdf.addImage(gambar, "PNG", tepi, posisi, lebar, tinggi);
  sisa -= tinggiHalaman - tepi * 2;

  while (sisa > 0) {
    posisi = posisi - (tinggiHalaman - tepi * 2);
    pdf.addPage();
    pdf.addImage(gambar, "PNG", tepi, posisi, lebar, tinggi);
    sisa -= tinggiHalaman - tepi * 2;
  }

  pdf.save(`${namaBerkas}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
