/** Pemformatan angka, tanggal, dan status — dipakai seluruh halaman. */

export function rupiah(nilai) {
  const angka = Number(nilai) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
}

export function angka(nilai) {
  return new Intl.NumberFormat("id-ID").format(Number(nilai) || 0);
}

export function tanggal(nilai, denganJam = false) {
  if (!nilai) return "-";
  const d = new Date(nilai);
  if (Number.isNaN(d.getTime())) return "-";
  const opsi = { day: "numeric", month: "short", year: "numeric" };
  if (denganJam) {
    opsi.hour = "2-digit";
    opsi.minute = "2-digit";
  }
  return d.toLocaleDateString("id-ID", opsi);
}

export function namaBulan(kode) {
  if (!kode) return "-";
  const [tahun, bulan] = kode.split("-");
  const d = new Date(Number(tahun), Number(bulan) - 1, 1);
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

/** Alur status utama, dipakai untuk menggambar linimasa pelacakan. */
export const ALUR_UTAMA = [
  "MENUNGGU_PEMBAYARAN",
  "DIPROSES",
  "DIKIRIM",
  "SELESAI",
];

const LABEL_STATUS = {
  MENUNGGU_PEMBAYARAN: "Menunggu Pembayaran",
  DIPROSES: "Diproses",
  DIKIRIM: "Dikirim",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
  KOMPLAIN: "Komplain",
  RETUR_DIPROSES: "Retur Diproses",
  RETUR_DISETUJUI: "Retur Disetujui",
  RETUR_DITOLAK: "Retur Ditolak",
  REFUND: "Dana Dikembalikan",
  GANTI_RUGI: "Ganti Rugi",
  DIAJUKAN: "Diajukan",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
};

export function labelStatus(status) {
  if (!status) return "-";
  return LABEL_STATUS[status] || status.replaceAll("_", " ");
}

/** Warna chip per status. Nada warnanya sama di seluruh aplikasi. */
export function warnaStatus(status) {
  switch (status) {
    case "SELESAI":
    case "DISETUJUI":
      return "bg-leaf-100 text-leaf-500";
    case "DIKIRIM":
      return "bg-brand-100 text-brand-600";
    case "DIPROSES":
      return "bg-wool-100 text-wool-600";
    case "MENUNGGU_PEMBAYARAN":
    case "DIAJUKAN":
      return "bg-amber-100 text-amber-ui";
    case "DIBATALKAN":
    case "DITOLAK":
    case "RETUR_DITOLAK":
      return "bg-sand-200 text-sand-600";
    case "KOMPLAIN":
    case "RETUR_DIPROSES":
    case "RETUR_DISETUJUI":
    case "REFUND":
    case "GANTI_RUGI":
      return "bg-rust-100 text-rust-500";
    default:
      return "bg-sand-200 text-sand-600";
  }
}

export function labelKendala(kode) {
  if (!kode) return "-";
  return kode
    .split("_")
    .map((k) => k.charAt(0) + k.slice(1).toLowerCase())
    .join(" ");
}

/** Bulan berjalan dalam format 2026-08, untuk nilai awal input bulan. */
export function bulanIni() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
