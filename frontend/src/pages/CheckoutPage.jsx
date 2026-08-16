import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ShopLayout from "../components/ShopLayout";
import {
  AreaTeks, Chip, Galat, Isian, JudulHalaman, Kartu, KartuJudul, Kosong,
  Memuat, Pilihan, Tombol,
} from "../components/ui";
import { alamatApi, muatSnap, pembayaranApi, pengirimanApi, pesananApi, urlBerkas } from "../lib/api";
import { rupiah } from "../lib/format";
import { pelangganId } from "../lib/session";

/**
 * Checkout.
 *
 * Ongkos kirim di sini bukan angka tetap, melainkan tarif nyata dari kurir
 * lewat RajaOngkir, dihitung dari alamat toko ke alamat pelanggan berdasarkan
 * berat total barangnya.
 *
 * Urutannya: hitung ongkir, simpan pesanan lengkap, baru minta token
 * pembayaran. Status lunas tidak pernah ditentukan browser — setelah popup
 * ditutup, backend yang menanyakan hasilnya ke Midtrans.
 */
export default function CheckoutPage() {
  const navigate = useNavigate();
  const id = pelangganId();

  const [items, setItems] = useState([]);
  const [alamat, setAlamat] = useState([]);
  const [alamatDipilih, setAlamatDipilih] = useState("");
  const [infoToko, setInfoToko] = useState(null);

  const [opsiKirim, setOpsiKirim] = useState([]);
  const [kirimDipilih, setKirimDipilih] = useState(null);
  const [memuatOngkir, setMemuatOngkir] = useState(false);
  const [galatOngkir, setGalatOngkir] = useState("");

  const [catatan, setCatatan] = useState("");
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);
  const [langkah, setLangkah] = useState("");

  const beratTotal = items.reduce(
    (t, i) => t + (Number(i.weight) || 0) * i.quantity,
    0
  );
  const subtotal = items.reduce((t, i) => t + i.sellPrice * i.quantity, 0);
  const ongkir = kirimDipilih ? kirimDipilih.ongkir : 0;
  const total = subtotal + ongkir;

  const alamatAktif = alamat.find((a) => String(a.id) === String(alamatDipilih));

  useEffect(() => {
    if (!id) {
      navigate("/LoginPelanggan");
      return;
    }
    const mentah = localStorage.getItem(`itemsToCheckout_${id}`);
    const dipilih = mentah ? JSON.parse(mentah) : [];
    setItems(dipilih);

    Promise.all([alamatApi.milik(id), pengirimanApi.info().catch(() => null)])
      .then(([a, info]) => {
        setAlamat(a);
        setInfoToko(info);
        const utama = a.find((x) => x.destinationId) || a[0];
        if (utama) setAlamatDipilih(String(utama.id));
      })
      .catch((e) => setGalat(e.message))
      .finally(() => setMemuat(false));
  }, [id, navigate]);

  // Setiap kali alamat berubah, tarif dihitung ulang ke kurir.
  const hitungOngkir = useCallback(async () => {
    if (!alamatAktif) return;
    // Alamat tanpa titik kirim kurir tetap dikirim ke backend. Backend
    // menjawabnya dengan tarif perkiraan toko, jadi pembeli tidak terjebak
    // tanpa satu pun pilihan pengiriman.
    setMemuatOngkir(true);
    setGalatOngkir("");
    setKirimDipilih(null);
    try {
      const hasil = await pengirimanApi.ongkir(alamatAktif.destinationId || "", beratTotal);
      setOpsiKirim(hasil);
      if (hasil.length > 0) setKirimDipilih(hasil[0]);
      else setGalatOngkir("Kurir tidak melayani pengiriman ke wilayah ini.");
    } catch (e) {
      setOpsiKirim([]);
      setGalatOngkir(e.message);
    } finally {
      setMemuatOngkir(false);
    }
  }, [alamatAktif, beratTotal]);

  // Tarif cadangan dipakai saat layanan kurir sedang tidak bisa dihubungi.
  const pakaiTarifCadangan = opsiKirim.length > 0 && opsiKirim[0].cadangan;

  useEffect(() => {
    hitungOngkir();
  }, [hitungOngkir]);

  const bayar = async () => {
    if (items.length === 0) {
      setGalat("Tidak ada barang untuk dibayar.");
      return;
    }
    if (!alamatAktif) {
      setGalat("Pilih alamat pengiriman lebih dulu.");
      return;
    }
    if (!kirimDipilih) {
      setGalat("Pilih layanan pengiriman lebih dulu.");
      return;
    }

    setProses(true);
    setGalat("");
    try {
      setLangkah("Menyimpan pesanan…");
      const pesanan = await pesananApi.checkout({
        pelangganId: id,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        addressId: Number(alamatDipilih),
        pengiriman: {
          ongkir: kirimDipilih.ongkir,
          kurir: kirimDipilih.kurir,
          layanan: kirimDipilih.layanan,
          estimasi: kirimDipilih.estimasi,
        },
        catatan,
      });

      localStorage.removeItem(`itemsToCheckout_${id}`);

      setLangkah("Menyiapkan pembayaran…");
      const { token } = await pembayaranApi.buatTransaksi(pesanan.id);

      // Apa pun yang terjadi di popup, backend yang memastikan hasilnya ke
      // Midtrans. Browser hanya memberi tahu kapan waktunya bertanya.
      const selesaikan = async () => {
        try {
          await pembayaranApi.sinkron(pesanan.id);
        } catch {
          /* status tetap akan tersinkron oleh pemeriksaan berkala di backend */
        }
        navigate("/Transaksi", { state: { baruBayar: pesanan.orderId } });
      };

      let snap;
      try {
        snap = await muatSnap();
      } catch {
        snap = null;
      }

      if (!snap) {
        navigate("/Transaksi", { state: { menunggu: pesanan.orderId } });
        return;
      }

      snap.pay(token, {
        onSuccess: selesaikan,
        onPending: selesaikan,
        onClose: selesaikan,
        onError: () =>
          navigate("/Transaksi", { state: { menunggu: pesanan.orderId } }),
      });
    } catch (e) {
      setGalat(e.message);
    } finally {
      setProses(false);
      setLangkah("");
    }
  };

  if (memuat) return <ShopLayout><Memuat /></ShopLayout>;

  if (items.length === 0) {
    return (
      <ShopLayout>
        <Kosong
          judul="Tidak ada barang untuk dibayar"
          keterangan="Pilih dulu barang di keranjang, lalu tekan lanjut ke checkout."
          aksi={<Link to="/CartPage"><Tombol>Ke keranjang</Tombol></Link>}
        />
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <JudulHalaman judul="Checkout" keterangan="Periksa kembali pesanan sebelum membayar." />

      {galat && <div className="mb-4"><Galat pesan={galat} /></div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Kartu>
            <KartuJudul
              judul="Barang yang dibeli"
              keterangan={`Total berat ${beratTotal || 0} gram${
                infoToko && beratTotal < infoToko.beratMinimum
                  ? ` — dibulatkan ke ${infoToko.beratMinimum} gram sesuai ketentuan kurir`
                  : ""
              }`}
            />
            <ul className="divide-y divide-sand-100">
              {items.map((i) => (
                <li key={i.productId} className="flex items-center gap-4 py-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-sand-100">
                    {i.image ? (
                      <img src={urlBerkas(i.image)} alt={i.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sand-300">◻</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-sand-800">{i.name}</p>
                    <p className="tabular text-xs text-sand-400">
                      {rupiah(i.sellPrice)} × {i.quantity}
                      {i.weight ? ` · ${i.weight} gr` : ""}
                    </p>
                  </div>
                  <span className="tabular font-semibold text-sand-800">
                    {rupiah(i.sellPrice * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </Kartu>

          <Kartu>
            <KartuJudul
              judul="Alamat pengiriman"
              aksi={
                <Link to="/AddressForm">
                  <Tombol variant="halus" size="sm">Tambah alamat</Tombol>
                </Link>
              }
            />
            {alamat.length === 0 ? (
              <div className="rounded-lg border border-dashed border-sand-300 px-4 py-6 text-center">
                <p className="mb-3 text-sm text-sand-500">Belum ada alamat tersimpan.</p>
                <Link to="/AddressForm"><Tombol size="sm">Tambah alamat sekarang</Tombol></Link>
              </div>
            ) : (
              <>
                <Pilihan
                  value={alamatDipilih}
                  onChange={(e) => setAlamatDipilih(e.target.value)}
                >
                  {alamat.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.namaPenerima ? `${a.namaPenerima} — ` : ""}
                      {a.detailAlamat}, {a.kecamatan}, {a.kabupaten}
                      {a.destinationId ? "" : " (tanpa titik kirim)"}
                    </option>
                  ))}
                </Pilihan>
                {alamatAktif && (
                  <p className="mt-2 text-sm text-sand-500">
                    {alamatAktif.namaPenerima} · {alamatAktif.teleponPenerima || "tanpa nomor telepon"}
                  </p>
                )}
              </>
            )}
          </Kartu>

          <Kartu>
            <KartuJudul
              judul="Layanan pengiriman"
              keterangan={
                infoToko
                  ? `Tarif nyata dari kurir, dihitung dari ${infoToko.originLabel}.`
                  : "Tarif nyata dari kurir."
              }
              aksi={
                <Tombol variant="halus" size="sm" onClick={hitungOngkir} disabled={memuatOngkir}>
                  Hitung ulang
                </Tombol>
              }
            />

            {pakaiTarifCadangan && (
              <div className="mb-3 rounded-lg border border-amber-100 bg-amber-100/50 px-4 py-3 text-sm text-amber-ui">
                Tarif resmi kurir sedang tidak bisa diambil, jadi yang ditampilkan
                adalah perkiraan dari toko. Pesanan tetap bisa diproses, dan kami
                menghubungi Anda bila ongkir sebenarnya berbeda jauh.
              </div>
            )}

            {memuatOngkir ? (
              <Memuat pesan="Menanyakan tarif ke kurir…" />
            ) : galatOngkir ? (
              <div className="rounded-lg border border-amber-100 bg-amber-100/50 px-4 py-3 text-sm text-amber-ui">
                {galatOngkir}
              </div>
            ) : opsiKirim.length === 0 ? (
              <p className="py-4 text-center text-sm text-sand-400">
                Pilih alamat lebih dulu untuk melihat pilihan pengiriman.
              </p>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {opsiKirim.map((o) => {
                  const dipilih =
                    kirimDipilih &&
                    kirimDipilih.kurir === o.kurir &&
                    kirimDipilih.layanan === o.layanan;
                  return (
                    <button
                      key={`${o.kurir}-${o.layanan}`}
                      type="button"
                      onClick={() => setKirimDipilih(o)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition ${
                        dipilih
                          ? "border-brand-500 bg-brand-50"
                          : "border-sand-200 bg-white hover:border-brand-300"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-sand-800">
                            {o.namaKurir}
                          </span>
                          <Chip className="bg-sand-200 text-sand-600">{o.layanan}</Chip>
                        </span>
                        <span className="mt-0.5 block text-xs text-sand-400">
                          {o.keterangan} · estimasi {o.estimasi}
                          {o.cadangan && " · perkiraan"}
                        </span>
                      </span>
                      <span className="tabular shrink-0 font-bold text-brand-600">
                        {rupiah(o.ongkir)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Kartu>

          <Kartu>
            <KartuJudul judul="Catatan untuk penjual" />
            <AreaTeks
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Opsional — misalnya minta dibungkus rapi"
            />
          </Kartu>
        </div>

        <div>
          <Kartu className="sticky top-24">
            <KartuJudul judul="Ringkasan pembayaran" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-sand-600">
                <span>Subtotal ({items.length} barang)</span>
                <span className="tabular">{rupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sand-600">
                <span>
                  {kirimDipilih
                    ? `${kirimDipilih.namaKurir} ${kirimDipilih.layanan}`
                    : "Ongkos kirim"}
                </span>
                <span className="tabular">
                  {kirimDipilih ? rupiah(ongkir) : "—"}
                </span>
              </div>
              {kirimDipilih && (
                <p className="text-xs text-sand-400">Estimasi tiba {kirimDipilih.estimasi}</p>
              )}
              <div className="flex justify-between border-t border-sand-200 pt-3 text-base font-bold text-sand-800">
                <span>Total</span>
                <span className="tabular">{rupiah(total)}</span>
              </div>
            </div>

            <Tombol
              className="mt-4 w-full"
              onClick={bayar}
              disabled={proses || !kirimDipilih || !alamatAktif}
            >
              {proses ? langkah || "Memproses…" : `Bayar ${rupiah(total)}`}
            </Tombol>

            <p className="mt-3 text-xs text-sand-400">
              Pesanan tersimpan lebih dulu, jadi kalau pembayaran terputus isinya
              tidak hilang dan bisa dilanjutkan dari halaman Pesanan Saya.
            </p>
          </Kartu>
        </div>
      </div>
    </ShopLayout>
  );
}
