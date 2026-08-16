import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ShopLayout from "../components/ShopLayout";
import { Galat, JudulHalaman, Kartu, Kosong, Memuat, Tombol } from "../components/ui";
import { keranjangApi, urlBerkas } from "../lib/api";
import { rupiah } from "../lib/format";
import { pelangganId } from "../lib/session";

export default function CartPage() {
  const navigate = useNavigate();
  const id = pelangganId();

  const [isi, setIsi] = useState([]);
  const [dipilih, setDipilih] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);

  const ambil = useCallback(async () => {
    if (!id) return;
    setMemuat(true);
    try {
      const data = await keranjangApi.isi(id);
      setIsi(data);
      setDipilih(data.map((i) => i.product.id));
      setGalat("");
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
  }, [id]);

  useEffect(() => {
    ambil();
  }, [ambil]);

  const ubahQty = async (item, qty) => {
    const batas = Math.min(Math.max(qty, 0), item.product.stock || 0);
    setSibuk(true);
    try {
      if (batas === 0) await keranjangApi.hapus(id, item.product.id);
      else await keranjangApi.ubah(id, item.product.id, batas);
      await ambil();
    } catch (e) {
      setGalat(e.message);
    } finally {
      setSibuk(false);
    }
  };

  const hapus = async (item) => {
    setSibuk(true);
    try {
      await keranjangApi.hapus(id, item.product.id);
      await ambil();
    } catch (e) {
      setGalat(e.message);
    } finally {
      setSibuk(false);
    }
  };

  const toggle = (productId) =>
    setDipilih((d) =>
      d.includes(productId) ? d.filter((x) => x !== productId) : [...d, productId]
    );

  const terpilih = isi.filter((i) => dipilih.includes(i.product.id));
  const subtotal = terpilih.reduce((t, i) => t + i.product.sellPrice * i.quantity, 0);

  const lanjut = () => {
    if (terpilih.length === 0) {
      setGalat("Pilih dulu barang yang mau dibeli.");
      return;
    }
    localStorage.setItem(
      `itemsToCheckout_${id}`,
      JSON.stringify(
        terpilih.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          sellPrice: i.product.sellPrice,
          image: i.product.image,
          weight: i.product.weight,
          quantity: i.quantity,
        }))
      )
    );
    navigate("/CheckoutPage");
  };

  if (!id) {
    return (
      <ShopLayout>
        <Kosong
          judul="Belum masuk"
          keterangan="Masuk dulu untuk melihat keranjang belanja Anda."
          aksi={<Link to="/LoginPelanggan"><Tombol>Masuk</Tombol></Link>}
        />
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <JudulHalaman
        judul="Keranjang"
        keterangan="Centang barang yang mau dibayar sekarang. Yang tidak dicentang tetap tersimpan di sini."
      />

      {galat && <div className="mb-4"><Galat pesan={galat} /></div>}

      {memuat ? (
        <Memuat />
      ) : isi.length === 0 ? (
        <Kosong
          judul="Keranjang masih kosong"
          keterangan="Barang thrifting cepat habis — cek katalog sebelum keduluan orang lain."
          aksi={<Link to="/products"><Tombol>Lihat katalog</Tombol></Link>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {isi.map((i) => {
              const p = i.product;
              const stokKurang = i.quantity > (p.stock || 0);
              return (
                <Kartu key={i.id} className="flex gap-4">
                  <input
                    type="checkbox"
                    checked={dipilih.includes(p.id)}
                    onChange={() => toggle(p.id)}
                    className="mt-1 h-4 w-4 shrink-0 accent-brand-600"
                    aria-label={`Pilih ${p.name}`}
                  />
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-sand-100">
                    {p.image ? (
                      <img src={urlBerkas(p.image)} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sand-300">◻</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-sand-800">{p.name}</h3>
                    <p className="text-xs text-sand-400">
                      {[p.size, p.color].filter(Boolean).join(" · ")} · sisa {p.stock}
                    </p>
                    <p className="tabular mt-1 font-bold text-brand-600">{rupiah(p.sellPrice)}</p>
                    {stokKurang && (
                      <p className="mt-1 text-xs font-semibold text-rust-500">
                        Stok tinggal {p.stock}, kurangi jumlahnya.
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => ubahQty(i, i.quantity - 1)}
                        disabled={sibuk}
                        className="h-8 w-8 rounded-md border border-sand-300 text-sand-600 transition hover:bg-sand-100 disabled:opacity-40"
                        aria-label="Kurangi"
                      >−</button>
                      <span className="tabular w-8 text-center text-sm font-semibold">{i.quantity}</span>
                      <button
                        onClick={() => ubahQty(i, i.quantity + 1)}
                        disabled={sibuk || i.quantity >= (p.stock || 0)}
                        className="h-8 w-8 rounded-md border border-sand-300 text-sand-600 transition hover:bg-sand-100 disabled:opacity-40"
                        aria-label="Tambah"
                      >+</button>
                      <button
                        onClick={() => hapus(i)}
                        disabled={sibuk}
                        className="ml-2 text-xs font-semibold text-sand-400 transition hover:text-rust-500"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>

                  <span className="tabular hidden shrink-0 self-center font-bold text-sand-800 sm:block">
                    {rupiah(p.sellPrice * i.quantity)}
                  </span>
                </Kartu>
              );
            })}
          </div>

          <div>
            <Kartu className="sticky top-24">
              <h2 className="display mb-4 text-base font-bold text-sand-800">Ringkasan</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-sand-600">
                  <span>{terpilih.length} barang dipilih</span>
                  <span className="tabular">{rupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sand-400">
                  <span>Ongkos kirim</span>
                  <span>Dihitung di checkout</span>
                </div>
                <div className="flex justify-between border-t border-sand-200 pt-3 text-base font-bold text-sand-800">
                  <span>Subtotal</span>
                  <span className="tabular">{rupiah(subtotal)}</span>
                </div>
              </div>
              <Tombol className="mt-4 w-full" onClick={lanjut} disabled={terpilih.length === 0}>
                Lanjut ke checkout
              </Tombol>
              <Link to="/products" className="mt-2 block text-center text-sm text-sand-500 hover:text-brand-600">
                Lanjut belanja
              </Link>
            </Kartu>
          </div>
        </div>
      )}
    </ShopLayout>
  );
}
