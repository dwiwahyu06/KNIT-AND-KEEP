/**
 * Satu pintu untuk semua panggilan ke backend.
 *
 * Sebelumnya alamat "http://localhost:8080" ditulis ulang di 56 tempat.
 * Sekarang cukup diubah di sini.
 */
/**
 * Alamat backend.
 *
 * Diambil dari variabel lingkungan supaya hasil build yang sama bisa dipakai
 * di komputer sendiri maupun di server, tanpa mengubah kode. Setel
 * VITE_API_BASE saat build untuk produksi.
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

/**
 * Melengkapi alamat berkas yang disimpan backend.
 *
 * Foto produk dan foto bukti komplain disimpan sebagai berkas, dan yang
 * tercatat di database hanya jalurnya — misalnya "/unggahan/produk-a1b2.jpg".
 * Jalur seperti itu dicari peramban ke alamat frontend, padahal berkasnya
 * disajikan backend di alamat lain, sehingga gambarnya gagal muncul.
 *
 * Tautan gambar dari luar dan data URI dibiarkan apa adanya.
 */
export function urlBerkas(jalur) {
  if (!jalur) return "";
  if (/^(https?:|data:|blob:)/i.test(jalur)) return jalur;
  if (!jalur.startsWith("/")) return jalur;
  return API_BASE.replace(/\/api\/?$/, "") + jalur;
}

const KUNCI_TOKEN = "knk_token";

export function simpanToken(token) {
  if (token) localStorage.setItem(KUNCI_TOKEN, token);
}

export function ambilToken() {
  return localStorage.getItem(KUNCI_TOKEN);
}

export function hapusToken() {
  localStorage.removeItem(KUNCI_TOKEN);
}

/** Dipanggil saat server menyatakan sesi sudah berakhir. */
let saatSesiBerakhir = null;
export function pasangPenangkapSesi(fn) {
  saatSesiBerakhir = fn;
}

async function request(path, { method = "GET", body, ...rest } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";

  // Token dikirim di setiap permintaan. Server yang menentukan boleh atau
  // tidaknya — peran yang tersimpan di peramban tidak lagi dipercaya.
  const token = ambilToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (res.status === 204) return null;

  const teks = await res.text();
  let data = null;
  if (teks) {
    try {
      data = JSON.parse(teks);
    } catch {
      data = teks;
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      hapusToken();
      if (saatSesiBerakhir) saatSesiBerakhir();
    }
    const pesan =
      (data && (data.message || data.error)) ||
      (typeof data === "string" && data) ||
      `Permintaan gagal (${res.status})`;
    const galat = new Error(pesan);
    galat.status = res.status;
    throw galat;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path, body) => request(path, { method: "DELETE", body }),
};

// ============ Produk & stok ============
export const produkApi = {
  semua: (params = "") => api.get(`/products${params}`),
  detail: (id) => api.get(`/products/${id}`),
  kategori: () => api.get("/products/kategori"),
  stokMenipis: () => api.get("/products/stok-menipis"),
  kartuStok: ({ productId = "", jenis = "", dari = "", sampai = "" } = {}) => {
    const q = new URLSearchParams();
    if (productId) q.set("productId", productId);
    if (jenis) q.set("jenis", jenis);
    if (dari) q.set("dari", dari);
    if (sampai) q.set("sampai", sampai);
    const s = q.toString();
    return api.get(`/products/mutasi${s ? `?${s}` : ""}`);
  },
  buat: (data) => api.post("/products", data),
  ubah: (id, data) => api.put(`/products/${id}`, data),
  hapus: (id) => api.del(`/products/${id}`),
  tambahStok: (id, qty, hargaBeli) =>
    api.post(`/products/${id}/stok/tambah`, { qty, hargaBeli }),
  kurangiStok: (id, qty, alasan) =>
    api.post(`/products/${id}/stok/kurangi`, { qty, alasan }),
};

// ============ Pesanan ============
export const pesananApi = {
  semua: (channel = "", status = "") => {
    const q = new URLSearchParams();
    if (channel) q.set("channel", channel);
    if (status) q.set("status", status);
    const s = q.toString();
    return api.get(`/orders/admin/all${s ? `?${s}` : ""}`);
  },
  milikSaya: (pelangganId) => api.get(`/orders/user/${pelangganId}`),
  detail: (id) => api.get(`/orders/${id}`),
  statusLanjutan: (id) => api.get(`/orders/${id}/status-lanjutan`),
  checkout: (data) => api.post("/orders/checkout", data),
  riwayatPembayaran: (id) => api.get(`/orders/${id}`),
  ubahStatus: (id, data) => api.put(`/orders/admin/update/${id}`, data),
  konfirmasiPembayaran: (id, data) =>
    api.post(`/orders/admin/${id}/konfirmasi-pembayaran`, data),
  penjualanOffline: (data) => api.post("/orders/admin/offline", data),
  terimaBarang: (id, pelangganId) =>
    api.post(`/orders/${id}/terima`, { pelangganId }),
  hapus: (id) => api.del(`/orders/admin/${id}`),
};

// ============ Retur & kendala ============
export const returApi = {
  jenisKendala: () => api.get("/retur/jenis-kendala"),
  semua: (status = "") => api.get(`/retur${status ? `?status=${status}` : ""}`),
  milikSaya: (pelangganId) => api.get(`/retur/user/${pelangganId}`),
  ajukan: (data) => api.post("/retur", data),
  setujui: (id, data) => api.put(`/retur/${id}/setujui`, data),
  tolak: (id, data) => api.put(`/retur/${id}/tolak`, data),
  tutupPesanan: (transactionId, catatan) =>
    api.put(`/retur/pesanan/${transactionId}/tutup`, { catatan }),
};

// ============ Testimoni & penilaian ============
export const testimoniApi = {
  /** Untuk halaman depan — boleh dipanggil tanpa masuk. */
  publik: (batas = 6) => api.get(`/testimoni/publik?batas=${batas}`),
  ringkasan: () => api.get("/testimoni/ringkasan"),
  produk: (productId) => api.get(`/testimoni/produk/${productId}`),

  milikSaya: (pelangganId) => api.get(`/testimoni/user/${pelangganId}`),
  kirim: (data) => api.post("/testimoni", data),
  ubah: (id, data) => api.put(`/testimoni/${id}`, data),

  semua: (tampil = "") => api.get(`/testimoni${tampil ? `?tampil=${tampil}` : ""}`),
  aturTampil: (id, tampil) => api.put(`/testimoni/${id}/tampilkan`, { tampil }),
  balas: (id, balasanAdmin) => api.put(`/testimoni/${id}/balas`, { balasanAdmin }),
  hapus: (id) => api.del(`/testimoni/${id}`),
};

// ============ Keranjang ============
export const keranjangApi = {
  isi: (pelangganId) => api.get(`/cart/${pelangganId}`),
  tambah: (pelangganId, productId, quantity) =>
    api.post("/cart/add", { pelangganId, productId, quantity }),
  ubah: (pelangganId, productId, quantity) =>
    api.put("/cart/update", { pelangganId, productId, quantity }),
  hapus: (pelangganId, productId) =>
    api.del("/cart/remove", { pelangganId, productId }),
};

// ============ Keuangan ============
export const keuanganApi = {
  transaksi: (params = "") => api.get(`/transactions${params}`),
  ringkasanTransaksi: (query = "") =>
    api.get(`/transactions/ringkasan${query ? `?${query}` : ""}`),
  hapusTransaksi: (id) => api.del(`/transactions/${id}`),

  pengeluaran: (query = "") => api.get(`/expenses${query ? `?${query}` : ""}`),
  tambahPengeluaran: (data) => api.post("/expenses", data),
  ubahPengeluaran: (id, data) => api.put(`/expenses/${id}`, data),
  hapusPengeluaran: (id) => api.del(`/expenses/${id}`),

  arusKas: (query = "") => api.get(`/cashflow${query ? `?${query}` : ""}`),
  ringkasanArusKas: (query = "") =>
    api.get(`/cashflow/ringkasan${query ? `?${query}` : ""}`),
  tambahArusKas: (data) => api.post("/cashflow", data),
  hapusArusKas: (id) => api.del(`/cashflow/${id}`),
};

// ============ Laporan ============
export const laporanApi = {
  labaRugi: (q = "") => api.get(`/reports/income-statement${q}`),
  labaRugiRinci: (q = "") => api.get(`/reports/income-statement/detailed${q}`),
  bulanan: (bulan, channel = "") => {
    const q = new URLSearchParams();
    if (bulan) q.set("bulan", bulan);
    if (channel) q.set("channel", channel);
    return api.get(`/reports/monthly?${q.toString()}`);
  },
  tren: (channel = "") =>
    api.get(`/reports/tren${channel ? `?channel=${channel}` : ""}`),
  rekapRetur: (q = "") => api.get(`/reports/retur${q}`),
  perKategori: (q = "") => api.get(`/reports/kategori${q}`),
  perPelanggan: (q = "") => api.get(`/reports/pelanggan${q}`),
};

/** Menyusun parameter periode dan kanal yang dipakai berulang di laporan. */
export function paramLaporan({ channel = "", dari = "", sampai = "" } = {}) {
  const q = new URLSearchParams();
  if (channel) q.set("channel", channel);
  if (dari) q.set("dari", dari);
  if (sampai) q.set("sampai", sampai);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const dashboardApi = {
  ringkasan: (query = "") =>
    api.get(`/dashboard/summary${query ? `?${query}` : ""}`),
};

// ============ Pemberitahuan pelanggan ============
export const notifikasiApi = {
  milikSaya: (halaman = 0, ukuran = 20) =>
    api.get(`/notifikasi?halaman=${halaman}&ukuran=${ukuran}`),
  jumlahBelumDibaca: () => api.get("/notifikasi/jumlah-belum-dibaca"),
  baca: (id) => api.put(`/notifikasi/${id}/baca`),
  bacaSemua: () => api.put("/notifikasi/baca-semua"),
};

// ============ Akun ============
export const akunApi = {
  loginAdmin: (username, password) =>
    api.post("/auth/login", { username, password }),
  /** Hanya berhasil bila toko masih kosong, atau dipanggil oleh admin. */
  daftarAdmin: (data) => api.post("/auth/register", data),
  perluPengelolaPertama: () => api.get("/auth/perlu-pengelola-pertama"),
  semuaAdmin: () => api.get("/auth/admins"),
  hapusAdmin: (id) => api.del(`/auth/admins/${id}`),
  aturUlangPasswordAdmin: (id, passwordBaru) =>
    api.put(`/auth/admins/${id}/password`, { passwordBaru }),

  loginPelanggan: (username, password) =>
    api.post("/pelanggan/login", { username, password }),
  daftarPelanggan: (data) => api.post("/pelanggan/register", data),
  semuaPelanggan: () => api.get("/pelanggan/all"),
  ubahStatusPelanggan: (id, aktif) =>
    api.put(`/pelanggan/${id}/status`, { aktif }),
  profil: (id) => api.get(`/pelanggan/${id}`),
  ubahProfil: (id, data) => api.put(`/pelanggan/update/${id}`, data),
  ubahPassword: (id, data) => api.put(`/pelanggan/update-password/${id}`, data),
};

// ============ Alamat ============
export const alamatApi = {
  milik: (pelangganId) => api.get(`/pelanggan/${pelangganId}/addresses`),
  buat: (pelangganId, data) =>
    api.post(`/pelanggan/${pelangganId}/addresses`, data),
  detail: (id) => api.get(`/addresses/${id}`),
  ubah: (id, data) => api.put(`/addresses/${id}`, data),
  hapus: (id) => api.del(`/addresses/${id}`),
};

// ============ Pengiriman (RajaOngkir) ============
export const pengirimanApi = {
  info: () => api.get("/shipping/info"),
  cariTujuan: (q, limit = 15) =>
    api.get(`/shipping/cari-tujuan?q=${encodeURIComponent(q)}&limit=${limit}`),
  ongkir: (destinationId, berat, kurir = "") => {
    const q = new URLSearchParams({ destinationId, berat: String(berat) });
    if (kurir) q.set("kurir", kurir);
    return api.get(`/shipping/ongkir?${q.toString()}`);
  },
  lacak: (resi, kurir, telepon = "") => {
    const q = new URLSearchParams({ resi, kurir });
    if (telepon) q.set("telepon", telepon);
    return api.get(`/shipping/lacak?${q.toString()}`);
  },
  lacakPesanan: (transactionId) =>
    api.get(`/shipping/lacak-pesanan/${transactionId}`),
};

// ============ Pembayaran (Midtrans) ============
export const pembayaranApi = {
  config: () => api.get("/payments/config"),
  buatTransaksi: (transactionId) =>
    api.post("/payments/create-transaction", { transactionId }),
  /** Menanyakan status sebenarnya ke Midtrans lewat backend. */
  sinkron: (transactionId) => api.post(`/payments/${transactionId}/sinkron`),
};

let snapDimuat = null;

/**
 * Memuat skrip Snap sesuai lingkungan yang aktif di backend.
 *
 * Sebelumnya skrip dan client key ditulis tetap di index.html, jadi berpindah
 * dari sandbox ke produksi berarti mengubah HTML. Sekarang cukup ubah
 * midtrans.is-production di backend.
 */
export function muatSnap() {
  if (snapDimuat) return snapDimuat;

  snapDimuat = (async () => {
    if (window.snap) return window.snap;
    const config = await pembayaranApi.config();

    await new Promise((selesai, gagal) => {
      const adaSkrip = document.querySelector("script[data-midtrans]");
      if (adaSkrip) {
        adaSkrip.addEventListener("load", selesai);
        adaSkrip.addEventListener("error", gagal);
        return;
      }
      const skrip = document.createElement("script");
      skrip.src = config.snapUrl;
      skrip.setAttribute("data-client-key", config.clientKey);
      skrip.setAttribute("data-midtrans", "true");
      skrip.onload = selesai;
      skrip.onerror = () => gagal(new Error("Skrip pembayaran Midtrans gagal dimuat"));
      document.head.appendChild(skrip);
    });

    return window.snap;
  })();

  return snapDimuat;
}
