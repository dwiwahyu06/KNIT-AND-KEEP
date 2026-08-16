/**
 * Penyimpanan sesi login.
 *
 * Data di sini hanya untuk menampilkan nama dan mengarahkan halaman. Hak akses
 * yang sebenarnya ditentukan server dari token, jadi mengutak-atik isi
 * localStorage tidak membuka apa pun.
 */
import { hapusToken, simpanToken } from "./api";

const KUNCI_ADMIN = "user";
const KUNCI_PELANGGAN = "loggedInUserId";
const KUNCI_PELANGGAN_NAMA = "loggedInUserName";

export function simpanAdmin(user, token) {
  localStorage.setItem(KUNCI_ADMIN, JSON.stringify(user));
  simpanToken(token);
}

export function adminSaatIni() {
  const mentah = localStorage.getItem(KUNCI_ADMIN);
  if (!mentah) return null;
  try {
    return JSON.parse(mentah);
  } catch {
    return null;
  }
}

export function simpanPelanggan(user, token) {
  localStorage.setItem(KUNCI_PELANGGAN, user.id);
  localStorage.setItem("userId", user.id);
  localStorage.setItem(KUNCI_PELANGGAN_NAMA, user.username || "");
  if (token) simpanToken(token);
}

export function pelangganId() {
  const id = localStorage.getItem(KUNCI_PELANGGAN);
  return id ? Number(id) : null;
}

export function pelangganNama() {
  return localStorage.getItem(KUNCI_PELANGGAN_NAMA) || "Pelanggan";
}

export function keluar() {
  [KUNCI_ADMIN, KUNCI_PELANGGAN, KUNCI_PELANGGAN_NAMA, "userId"].forEach((k) =>
    localStorage.removeItem(k)
  );
  hapusToken();
}
