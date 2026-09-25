import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ShopLayout from "../components/ShopLayout";
import { Bintang } from "../components/Bintang";
import KartuTestimoni from "../components/KartuTestimoni";
import TombolWa from "../components/TombolWa";
import { Chip, Galat, Kartu, Kosong, Memuat, Tombol } from "../components/ui";
import { keranjangApi, produkApi, testimoniApi, urlBerkas } from "../lib/api";
import { PESAN_CS } from "../lib/cs";
import { rupiah } from "../lib/format";
import { pelangganId } from "../lib/session";

/**
 * Halaman satu barang.
 *
 * Untuk barang bekas ini penting: pembeli tidak bisa memegang barangnya, jadi
 * foto besar, kondisi, dan keterangan lengkap adalah satu-satunya cara menilai
 * sebelum membeli.
 */
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pelanggan = pelangganId();

  const [produk, setProduk] = useState(null);
  const [serupa, setSerupa] = useState([]);
  const [ulasan, setUlasan] = useState({ ringkasan: null, daftar: [] });
  const [jumlah, setJumlah] = useState(1);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [pesan, setPesan] = useState("");
  const [sibuk, setSibuk] = useState(false);

  const ambil = useCallback(async () => {
    setMemuat(true);
    setGalat("");
    setJumlah(1);
    try {
      const p = await produkApi.detail(id);
      setProduk(p);

      // Ulasan menyusul sendiri: katalog tetap terbaca meski tabelnya kosong
      // atau permintaannya gagal.
      testimoniApi
        .produk(p.id)
        .then((u) => setUlasan({ ringkasan: u.ringkasan, daftar: u.daftar || [] }))
        .catch(() => setUlasan({ ringkasan: null, daftar: [] }));

      const semua = await produkApi.semua("?sort=newest");
      setSerupa(
        semua
          .filter((x) => x.id !== p.id && (x.stock || 0) > 0 && x.category === p.category)
          .slice(0, 4)
      );
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
  }, [id]);

  useEffect(() => {
    ambil();
  }, [ambil]);

  const tambah = async (langsung = false) => {
    if (!pelanggan) {
      navigate("/LoginPelanggan");
      return;
    }
    setSibuk(true);
    setGalat("");
    try {
      await keranjangApi.tambah(pelanggan, produk.id, jumlah);
      if (langsung) navigate("/CartPage");
      else {
        setPesan(`${jumlah} ${produk.name} masuk keranjang.`);
        setTimeout(() => setPesan(""), 2500);
      }
    } catch (e) {
      setGalat(e.message);
    } finally {
      setSibuk(false);
    }
  };

  if (memuat) return <ShopLayout><Memuat /></ShopLayout>;

  if (!produk) {
    return (
      <ShopLayout>
        <Kosong
          judul="Barang tidak ditemukan"
          keterangan="Barang ini mungkin sudah terjual dan dihapus dari katalog."
          aksi={<Link to="/products"><Tombol>Kembali ke katalog</Tombol></Link>}
        />
      </ShopLayout>
    );
  }

  const stok = produk.stock || 0;
  const habis = stok === 0;

  return (
    <ShopLayout>
      <Link to="/products" className="mb-4 inline-block text-sm text-sand-500 hover:text-brand-600">
        ← Kembali ke katalog
      </Link>

      {pesan && (
        <div className="mb-4 rounded-lg border border-leaf-100 bg-leaf-100/60 px-4 py-3 text-sm font-medium text-leaf-500">
          {pesan}
        </div>
      )}
      {galat && <div className="mb-4"><Galat pesan={galat} /></div>}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-sand-200 bg-sand-100">
          <div className="aspect-4/5">
            {produk.image ? (
              <img src={urlBerkas(produk.image)} alt={produk.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sand-300">
                <span className="display text-6xl">◻</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <span className="label-mono text-sand-400">{produk.category || "Umum"}</span>
            <h1 className="display mt-1 text-2xl font-bold text-sand-800">{produk.name}</h1>
            <p className="font-mono text-xs text-sand-400">{produk.sku}</p>
          </div>

          <p className="tabular text-3xl font-bold text-brand-600">{rupiah(produk.sellPrice)}</p>

          {ulasan.ringkasan?.jumlah > 0 && (
            <a href="#ulasan" className="flex items-center gap-2 text-sm text-sand-500 hover:text-brand-600">
              <Bintang nilai={ulasan.ringkasan.rataRata} ukuran="sm" />
              <span className="tabular font-semibold text-sand-700">
                {ulasan.ringkasan.rataRata.toString().replace(".", ",")}
              </span>
              <span>· {ulasan.ringkasan.jumlah} ulasan</span>
            </a>
          )}

          <div className="flex flex-wrap gap-2">
            {produk.size && <Chip className="bg-sand-200 text-sand-600">Ukuran {produk.size}</Chip>}
            {produk.color && <Chip className="bg-sand-200 text-sand-600">{produk.color}</Chip>}
            {produk.kondisi && <Chip className="bg-wool-100 text-wool-600">{produk.kondisi}</Chip>}
            <Chip
              className={
                habis ? "bg-rust-100 text-rust-500"
                  : stok <= 3 ? "bg-amber-100 text-amber-ui"
                  : "bg-leaf-100 text-leaf-500"
              }
            >
              {habis ? "Stok habis" : `Sisa ${stok} unit`}
            </Chip>
          </div>

          {produk.deskripsi ? (
            <Kartu>
              <h2 className="display mb-2 text-sm font-bold text-sand-800">Keterangan barang</h2>
              <p className="whitespace-pre-line text-sm text-sand-600">{produk.deskripsi}</p>
            </Kartu>
          ) : (
            <p className="rounded-lg bg-sand-100 px-4 py-3 text-sm text-sand-500">
              Belum ada keterangan tambahan untuk barang ini.
            </p>
          )}

          <dl className="grid grid-cols-2 gap-y-2 rounded-lg border border-sand-200 p-4 text-sm">
            <dt className="text-sand-400">Berat</dt>
            <dd className="text-right text-sand-700">{produk.weight ? `${produk.weight} gram` : "—"}</dd>
            <dt className="text-sand-400">Kategori</dt>
            <dd className="text-right text-sand-700">{produk.category || "—"}</dd>
          </dl>

          {!habis && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setJumlah((j) => Math.max(1, j - 1))}
                  className="h-9 w-9 rounded-md border border-sand-300 text-sand-600 transition hover:bg-sand-100"
                  aria-label="Kurangi"
                >−</button>
                <span className="tabular w-10 text-center font-semibold">{jumlah}</span>
                <button
                  onClick={() => setJumlah((j) => Math.min(stok, j + 1))}
                  disabled={jumlah >= stok}
                  className="h-9 w-9 rounded-md border border-sand-300 text-sand-600 transition hover:bg-sand-100 disabled:opacity-40"
                  aria-label="Tambah"
                >+</button>
              </div>
              <Tombol onClick={() => tambah(false)} disabled={sibuk}>Masukkan keranjang</Tombol>
              <Tombol variant="aksen" onClick={() => tambah(true)} disabled={sibuk}>Beli sekarang</Tombol>
            </div>
          )}

          {habis && (
            <p className="rounded-lg bg-rust-100/60 px-4 py-3 text-sm text-rust-500">
              Barang ini sudah terjual. Barang thrifting biasanya hanya ada satu.
            </p>
          )}

          {/* Foto dan keterangan tidak selalu menjawab semuanya — apalagi untuk
              barang bekas, yang tiap helainya punya cacat dan bekas pakai
              sendiri. Pertanyaan yang tak terjawab berujung keranjang
              ditinggalkan, bukan pesanan. */}
          <div className="flex items-center gap-3 rounded-lg border border-leaf-100 bg-leaf-100/40 px-4 py-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-sand-700">
                {habis ? "Ketinggalan barang ini?" : "Masih ragu dengan kondisinya?"}
              </p>
              <p className="text-xs text-sand-500">
                {habis
                  ? "Tanya CS kalau mau dicarikan barang serupa di stok berikutnya."
                  : "Minta foto tambahan atau ukuran detail langsung ke CS toko."}
              </p>
            </div>
            <TombolWa size="sm" pesan={PESAN_CS.produk(produk, habis)}>
              Tanya CS
            </TombolWa>
          </div>
        </div>
      </div>

      {ulasan.daftar.length > 0 && (
        <section id="ulasan" className="mt-12 scroll-mt-20">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="display text-xl font-bold text-sand-800">Kata pembelinya</h2>
            {ulasan.ringkasan?.jumlah > 0 && (
              <span className="flex items-center gap-2 text-sm text-sand-500">
                <Bintang nilai={ulasan.ringkasan.rataRata} ukuran="sm" />
                {ulasan.ringkasan.rataRata.toString().replace(".", ",")} dari{" "}
                {ulasan.ringkasan.jumlah} penilaian
              </span>
            )}
          </div>
          {/* Penilaian menempel ke pesanan, bukan ke barang. Yang muncul di sini
              adalah penilaian dari pesanan yang memuat barang ini. */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ulasan.daftar.map((t) => (
              <KartuTestimoni key={t.id} testimoni={t} denganBarang={false} />
            ))}
          </div>
        </section>
      )}

      {serupa.length > 0 && (
        <section className="mt-12">
          <h2 className="display mb-4 text-xl font-bold text-sand-800">Serupa di kategori ini</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {serupa.map((p) => (
              <Link
                key={p.id}
                to={`/produk/${p.id}`}
                className="overflow-hidden rounded-xl border border-sand-200 bg-white transition hover:border-brand-300"
              >
                <div className="aspect-4/5 bg-sand-100">
                  {p.image ? (
                    <img src={urlBerkas(p.image)} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sand-300">◻</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold text-sand-800">{p.name}</h3>
                  <p className="tabular mt-1 font-bold text-brand-600">{rupiah(p.sellPrice)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </ShopLayout>
  );
}
