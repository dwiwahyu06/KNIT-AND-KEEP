import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bintang } from "../components/Bintang";
import KartuTestimoni from "../components/KartuTestimoni";
import TombolWa, { WaMelayang } from "../components/TombolWa";
import { produkApi, testimoniApi, urlBerkas } from "../lib/api";
import { nomorTampil } from "../lib/cs";
import { rupiah } from "../lib/format";
import { adminSaatIni, pelangganId } from "../lib/session";

export default function Home() {
  const [produk, setProduk] = useState([]);
  const [testimoni, setTestimoni] = useState([]);
  const [nilaiToko, setNilaiToko] = useState(null);
  const sudahMasuk = pelangganId();
  const admin = adminSaatIni();

  useEffect(() => {
    produkApi
      .semua("?sort=newest")
      .then((p) => setProduk(p.filter((x) => (x.stock || 0) > 0).slice(0, 6)))
      .catch(() => setProduk([]));

    // Halaman depan tetap utuh walau belum ada satu pun testimoni, atau kalau
    // permintaannya gagal — bagiannya sekadar tidak digambar.
    testimoniApi.publik(6).then(setTestimoni).catch(() => setTestimoni([]));
    testimoniApi.ringkasan().then(setNilaiToko).catch(() => setNilaiToko(null));
  }, []);

  return (
    <div className="min-h-screen bg-sand-50">
      <header className="border-b border-sand-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="display text-lg font-bold text-brand-600">Knit &amp; Keep</span>
          <div className="flex items-center gap-2">
            {sudahMasuk ? (
              <Link to="/Dashboard_pelanggan" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Lanjut belanja
              </Link>
            ) : admin ? (
              <Link to="/Dashboard" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Buka panel admin
              </Link>
            ) : (
              <>
                <Link to="/LoginPelanggan" className="rounded-lg px-4 py-2 text-sm font-semibold text-sand-600 hover:text-brand-600">
                  Masuk
                </Link>
                <Link to="/SelectRole" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                  Mulai
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="label-mono text-wool-600">Thrifting rajut &amp; pakaian bekas layak pakai</p>
          <h1 className="display mt-3 text-4xl font-bold leading-tight text-sand-800 sm:text-5xl">
            Barang bagus punya kesempatan kedua.
          </h1>
          <p className="mt-5 text-lg text-sand-600">
            Sweater rajut, cardigan vintage, dan flanel pilihan — dikurasi satu per
            satu. Tiap barang biasanya hanya ada satu, jadi yang cocok sebaiknya
            langsung diambil.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products" className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
              Lihat katalog
            </Link>
            <Link to="/SelectRole" className="rounded-lg border border-sand-300 bg-white px-6 py-3 text-sm font-semibold text-sand-700 transition hover:border-brand-400 hover:text-brand-600">
              Daftar akun
            </Link>
          </div>

          {nilaiToko?.jumlah > 0 && (
            <a href="#testimoni" className="mt-8 inline-flex items-center gap-3">
              <Bintang nilai={nilaiToko.rataRata} />
              <span className="text-sm text-sand-600">
                <b className="tabular text-sand-800">
                  {nilaiToko.rataRata.toString().replace(".", ",")}
                </b>{" "}
                dari {nilaiToko.jumlah} penilaian pembeli
              </span>
            </a>
          )}
        </div>
      </section>

      {produk.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="display text-2xl font-bold text-sand-800">Baru masuk</h2>
            <Link to="/products" className="text-sm font-semibold text-brand-600 hover:underline">
              Semua barang →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {produk.map((p) => (
              <Link
                key={p.id}
                to={`/produk/${p.id}`}
                className="overflow-hidden rounded-xl border border-sand-200 bg-white transition hover:border-brand-300"
              >
                <div className="aspect-4/5 bg-sand-100">
                  {p.image ? (
                    <img src={urlBerkas(p.image)} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sand-300">
                      <span className="display text-5xl">◻</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <span className="label-mono text-sand-400">{p.category || "Umum"}</span>
                  <h3 className="text-sm font-semibold text-sand-800">{p.name}</h3>
                  <p className="tabular mt-1 font-bold text-brand-600">{rupiah(p.sellPrice)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {testimoni.length > 0 && (
        <section id="testimoni" className="border-t border-sand-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="display text-2xl font-bold text-sand-800">Kata pembeli</h2>
                <p className="mt-1 text-sm text-sand-500">
                  Ditulis pembeli setelah barangnya sampai — hanya pesanan yang
                  benar-benar selesai yang bisa dinilai.
                </p>
              </div>
              {nilaiToko?.jumlah > 0 && (
                <div className="flex items-center gap-2">
                  <Bintang nilai={nilaiToko.rataRata} />
                  <span className="tabular text-sm font-semibold text-sand-700">
                    {nilaiToko.rataRata.toString().replace(".", ",")}/5
                  </span>
                </div>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testimoni.map((t) => (
                <KartuTestimoni key={t.id} testimoni={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-sand-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-3 sm:px-6">
          <Fitur
            judul="Pelacakan pesanan"
            teks="Pantau perjalanan pesanan dari pembayaran, diproses, dikirim, sampai diterima — lengkap dengan nomor resi."
          />
          <Fitur
            judul="Ada kendala? Tinggal lapor"
            teks="Barang rusak, salah kirim, atau tidak sampai bisa diajukan langsung dari halaman pesanan, lengkap dengan foto bukti."
          />
          <Fitur
            judul="Stok yang jujur"
            teks="Angka stok di katalog sama dengan yang ada di toko, karena penjualan online dan offline tercatat di sistem yang sama."
          />
        </div>
      </section>

      <footer className="border-t border-sand-200 bg-sand-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6">
          <p className="max-w-md text-xs text-sand-400">
            Knit &amp; Keep — aplikasi e-commerce thrifting dengan manajemen stok dan
            pembukuan toko dalam satu tempat.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-sand-500">
              Tanya stok, ukuran, atau pesanan: {nomorTampil()}
            </span>
            <TombolWa size="sm" variant="garis" />
          </div>
        </div>
      </footer>

      <WaMelayang />
    </div>
  );
}

function Fitur({ judul, teks }) {
  return (
    <div>
      <h3 className="display text-base font-bold text-sand-800">{judul}</h3>
      <p className="mt-2 text-sm text-sand-500">{teks}</p>
    </div>
  );
}
