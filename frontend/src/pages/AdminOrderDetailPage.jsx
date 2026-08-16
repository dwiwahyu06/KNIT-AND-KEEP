import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  AreaTeks, Baris, Chip, Galat, Input, Isian, Kartu, KartuJudul, Memuat,
  Pilihan, Sel, Tabel, Tombol,
} from "../components/ui";
import { pembayaranApi, pengirimanApi, pesananApi } from "../lib/api";
import { labelStatus, rupiah, tanggal, warnaStatus } from "../lib/format";

export default function AdminOrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [pesanan, setPesanan] = useState(null);
  const [lanjutan, setLanjutan] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [pesan, setPesan] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  const [form, setForm] = useState({ status: "", nomorResi: "", kurir: "", catatan: "" });

  const [lacak, setLacak] = useState(null);
  const [memuatLacak, setMemuatLacak] = useState(false);
  const [galatLacak, setGalatLacak] = useState("");

  const lacakPaket = async () => {
    setMemuatLacak(true);
    setGalatLacak("");
    try {
      setLacak(await pengirimanApi.lacakPesanan(orderId));
    } catch (e) {
      setGalatLacak(e.message);
    } finally {
      setMemuatLacak(false);
    }
  };

  const ambil = useCallback(async () => {
    setMemuat(true);
    setGalat("");
    try {
      const data = await pesananApi.detail(orderId);
      setPesanan(data);
      setForm((f) => ({
        ...f,
        status: "",
        nomorResi: data.nomorResi || "",
        kurir: data.kurir || "",
        catatan: "",
      }));
      const next = await pesananApi.statusLanjutan(orderId);
      setLanjutan(next.lanjutan || []);
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
  }, [orderId]);

  useEffect(() => {
    ambil();
  }, [ambil]);

  const jalankan = async (fn, sukses) => {
    setMenyimpan(true);
    setGalat("");
    setPesan("");
    try {
      await fn();
      setPesan(sukses);
      await ambil();
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMenyimpan(false);
    }
  };

  const simpanStatus = (e) => {
    e.preventDefault();
    if (!form.status) {
      setGalat("Pilih status tujuan lebih dulu.");
      return;
    }
    jalankan(
      () => pesananApi.ubahStatus(orderId, form),
      `Status diperbarui menjadi ${labelStatus(form.status)}.`
    );
  };

  const simpanResi = () =>
    jalankan(
      () => pesananApi.ubahStatus(orderId, {
        status: pesanan.status,
        nomorResi: form.nomorResi,
        kurir: form.kurir,
      }),
      "Nomor resi dan kurir disimpan."
    );

  const konfirmasi = () =>
    jalankan(
      () => pesananApi.konfirmasiPembayaran(orderId, { metodeBayar: "TRANSFER" }),
      "Pembayaran dikonfirmasi manual. Stok sudah dipotong dan kas masuk dicatat."
    );

  const cekMidtrans = async () => {
    setMenyimpan(true);
    setGalat("");
    setPesan("");
    try {
      const hasil = await pembayaranApi.sinkron(orderId);
      setPesan(`Midtrans menjawab: ${hasil.pesan}`);
      if (hasil.berubah) await ambil();
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMenyimpan(false);
    }
  };

  const hapus = () => {
    if (!window.confirm("Hapus pesanan ini? Stok akan dikembalikan dan catatan kasnya dibatalkan.")) return;
    jalankan(async () => {
      await pesananApi.hapus(orderId);
      navigate("/AdminOrdersPage");
    }, "Pesanan dihapus.");
  };

  if (memuat) return <AdminLayout><Memuat /></AdminLayout>;
  if (!pesanan) return <AdminLayout><Galat pesan={galat || "Pesanan tidak ditemukan."} onCoba={ambil} /></AdminLayout>;

  const belumBayar = pesanan.status === "MENUNGGU_PEMBAYARAN";

  return (
    <AdminLayout>
      <Link to="/AdminOrdersPage" className="mb-4 inline-block text-sm text-sand-500 hover:text-brand-600">
        ← Kembali ke daftar pesanan
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="display font-mono text-xl font-bold text-sand-800">{pesanan.orderId}</h1>
          <p className="mt-1 text-sm text-sand-500">
            Dibuat {tanggal(pesanan.createdAt, true)} · {pesanan.namaPelanggan}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip className={pesanan.channel === "OFFLINE" ? "bg-wool-100 text-wool-600" : "bg-brand-100 text-brand-600"}>
            {pesanan.channel}
          </Chip>
          <Chip className={warnaStatus(pesanan.status)}>{labelStatus(pesanan.status)}</Chip>
        </div>
      </div>

      {pesan && (
        <div className="mb-4 rounded-lg border border-leaf-100 bg-leaf-100/60 px-4 py-3 text-sm font-medium text-leaf-500">
          {pesan}
        </div>
      )}
      {galat && <div className="mb-4"><Galat pesan={galat} /></div>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kiri: isi pesanan */}
        <div className="space-y-6 lg:col-span-2">
          <Kartu padat>
            <div className="p-5 pb-0">
              <KartuJudul
                judul="Barang yang dipesan"
                keterangan="Harga jual dan modal disimpan apa adanya saat pesanan dibuat."
              />
            </div>
            <div className="px-2">
              <Tabel kepala={["Produk", "Harga", "Qty", "Subtotal", "Modal"]} min="min-w-[560px]">
                {(pesanan.items || []).map((i) => (
                  <Baris key={i.id}>
                    <Sel>
                      <span className="font-medium text-sand-800">{i.namaProduk}</span>
                      <div className="font-mono text-xs text-sand-400">{i.sku}</div>
                    </Sel>
                    <Sel className="tabular">{rupiah(i.hargaJual)}</Sel>
                    <Sel className="tabular">{i.quantity}</Sel>
                    <Sel className="tabular font-semibold">{rupiah(i.subtotal)}</Sel>
                    <Sel className="tabular text-sand-400">{rupiah(i.totalModal)}</Sel>
                  </Baris>
                ))}
              </Tabel>
            </div>
            <div className="space-y-1.5 border-t border-sand-200 px-5 py-4 text-sm">
              <div className="flex justify-between text-sand-600">
                <span>Subtotal</span><span className="tabular">{rupiah(pesanan.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sand-600">
                <span>Ongkos kirim</span><span className="tabular">{rupiah(pesanan.ongkir)}</span>
              </div>
              <div className="flex justify-between border-t border-sand-200 pt-2 font-bold text-sand-800">
                <span>Total dibayar</span><span className="tabular">{rupiah(pesanan.amount)}</span>
              </div>
              <div className="flex justify-between pt-1 text-xs text-sand-400">
                <span>Modal barang</span><span className="tabular">{rupiah(pesanan.totalModal)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-leaf-500">
                <span>Laba kotor pesanan ini</span>
                <span className="tabular">{rupiah((pesanan.subtotal || 0) - (pesanan.totalModal || 0))}</span>
              </div>
            </div>
          </Kartu>

          <Kartu>
            <KartuJudul judul="Riwayat status" keterangan="Setiap perubahan tercatat lengkap dengan siapa yang mengubahnya." />
            <ol className="relative space-y-4 border-l border-sand-200 pl-5">
              {(pesanan.riwayat || []).map((r) => (
                <li key={r.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-500" />
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip className={warnaStatus(r.status)}>{labelStatus(r.status)}</Chip>
                    <span className="text-xs text-sand-400">
                      {tanggal(r.waktu, true)} · oleh {r.diubahOleh}
                    </span>
                  </div>
                  {r.catatan && <p className="mt-1 text-sm text-sand-600">{r.catatan}</p>}
                </li>
              ))}
            </ol>
          </Kartu>
        </div>

        {/* Kanan: tindakan */}
        <div className="space-y-6">
          {belumBayar && (
            <Kartu className="border-wool-200 bg-wool-50">
              <KartuJudul
                judul="Pembayaran belum masuk"
                keterangan="Tanyakan dulu ke Midtrans. Konfirmasi manual hanya untuk pembayaran di luar Midtrans, misalnya transfer langsung."
              />
              <div className="space-y-2">
                {pesanan.channel === "ONLINE" && (
                  <Tombol className="w-full" disabled={menyimpan} onClick={cekMidtrans}>
                    Tanya status ke Midtrans
                  </Tombol>
                )}
                <Tombol variant="aksen" className="w-full" disabled={menyimpan} onClick={konfirmasi}>
                  Tandai lunas secara manual
                </Tombol>
              </div>
              <p className="mt-2 text-xs text-sand-500">
                Begitu lunas, stok dipotong dan kas masuk otomatis tercatat.
              </p>
            </Kartu>
          )}

          {pesanan.nomorResi && (
            <Kartu>
              <KartuJudul
                judul="Posisi paket"
                keterangan="Data langsung dari sistem kurir."
                aksi={
                  <Tombol variant="halus" size="sm" onClick={lacakPaket} disabled={memuatLacak}>
                    {memuatLacak ? "Menghubungi…" : lacak ? "Perbarui" : "Lacak"}
                  </Tombol>
                }
              />
              {galatLacak && <p className="rounded-lg bg-amber-100/60 px-3 py-2 text-sm text-amber-ui">{galatLacak}</p>}
              {lacak && (
                <>
                  <p className="mb-3 text-sm font-semibold text-brand-600">
                    {lacak.status || "Dalam perjalanan"}
                  </p>
                  <ol className="space-y-2.5 border-l border-sand-200 pl-4">
                    {(lacak.riwayat || []).map((r, i) => (
                      <li key={i} className="relative text-sm">
                        <span className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${i === 0 ? "bg-brand-600" : "bg-sand-300"}`} />
                        <span className={i === 0 ? "font-medium text-sand-800" : "text-sand-600"}>
                          {r.keterangan}
                        </span>
                        <span className="block text-xs text-sand-400">
                          {r.waktu}{r.lokasi ? ` · ${r.lokasi}` : ""}
                        </span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
              {!lacak && !galatLacak && (
                <p className="text-sm text-sand-400">
                  Tekan Lacak untuk menanyakan posisi paket ke kurir.
                </p>
              )}
            </Kartu>
          )}

          <Kartu>
            <KartuJudul judul="Ubah status" keterangan="Hanya status yang sah menurut alur yang bisa dipilih." />
            {lanjutan.length === 0 ? (
              <p className="rounded-lg bg-sand-100 px-3 py-3 text-sm text-sand-500">
                Pesanan ini sudah di tahap akhir, tidak ada lanjutan status.
              </p>
            ) : (
              <form onSubmit={simpanStatus} className="space-y-3">
                <Isian label="Status tujuan" wajib>
                  <Pilihan value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="">Pilih status…</option>
                    {lanjutan.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </Pilihan>
                </Isian>
                {form.status === "DIKIRIM" && (
                  <>
                    <Isian
                      label="Nomor resi"
                      wajib
                      hint="Nomor dari kurir, diterima saat paket diserahkan ke agen — bukan nomor pesanan."
                    >
                      <Input
                        value={form.nomorResi}
                        onChange={(e) => setForm({ ...form, nomorResi: e.target.value })}
                        placeholder="Contoh: JP1234567890 atau PP01234567890ID"
                      />
                    </Isian>
                    <Isian label="Kurir" hint="Harus sama dengan penerbit resinya, kalau tidak pelacakan gagal.">
                      <Input
                        value={form.kurir}
                        onChange={(e) => setForm({ ...form, kurir: e.target.value })}
                        placeholder="JNE, J&T, SiCepat, POS…"
                      />
                    </Isian>
                  </>
                )}
                <Isian label="Catatan" hint="Ikut tersimpan di riwayat status.">
                  <AreaTeks
                    value={form.catatan}
                    onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                    placeholder="Opsional"
                  />
                </Isian>
                <Tombol type="submit" className="w-full" disabled={menyimpan}>
                  {menyimpan ? "Menyimpan…" : "Perbarui status"}
                </Tombol>
              </form>
            )}
          </Kartu>

          <Kartu>
            <KartuJudul judul="Pengiriman" />
            <div className="space-y-3">
              <Isian
                label="Nomor resi"
                hint="Nomor dari kurir, bukan nomor pesanan. Salah isi membuat pelacakan selalu gagal."
              >
                <Input
                  value={form.nomorResi}
                  onChange={(e) => setForm({ ...form, nomorResi: e.target.value })}
                  placeholder="Contoh: JP1234567890 atau PP01234567890ID"
                />
              </Isian>
              <Isian label="Kurir" hint="Harus sama dengan penerbit resinya.">
                <Input
                  value={form.kurir}
                  onChange={(e) => setForm({ ...form, kurir: e.target.value })}
                  placeholder="JNE, J&T, SiCepat, POS…"
                />
              </Isian>
              <Tombol variant="garis" className="w-full" onClick={simpanResi} disabled={menyimpan}>
                Simpan resi
              </Tombol>
            </div>
          </Kartu>

          <Kartu>
            <KartuJudul judul="Rincian" />
            <dl className="space-y-2.5 text-sm">
              <Rincian k="Kanal" v={pesanan.channel} />
              <Rincian k="Metode bayar" v={pesanan.metodeBayar || "—"} />
              {pesanan.metodeMidtrans && (
                <Rincian k="Lewat" v={pesanan.metodeMidtrans} />
              )}
              <Rincian k="Penerima" v={pesanan.namaPenerima || "—"} />
              <Rincian k="Telepon" v={pesanan.teleponPenerima || "—"} />
              <Rincian k="Alamat" v={pesanan.alamatPengiriman || "—"} />
              <Rincian
                k="Pengiriman"
                v={
                  pesanan.kurir
                    ? `${pesanan.kurir.toUpperCase()} ${pesanan.layananKurir || ""}${
                        pesanan.estimasiKirim ? ` · ${pesanan.estimasiKirim}` : ""
                      }`
                    : "—"
                }
              />
              <Rincian k="Berat" v={pesanan.beratGram ? `${pesanan.beratGram} gram` : "—"} />
              <Rincian k="Catatan pembeli" v={pesanan.catatan || "—"} />
              <Rincian k="Dibayar" v={tanggal(pesanan.dibayarPada, true)} />
              <Rincian k="Dikirim" v={tanggal(pesanan.dikirimPada, true)} />
              <Rincian k="Selesai" v={tanggal(pesanan.selesaiPada, true)} />
            </dl>
          </Kartu>

          <Tombol variant="bahaya" className="w-full" onClick={hapus} disabled={menyimpan}>
            Hapus pesanan
          </Tombol>
        </div>
      </div>
    </AdminLayout>
  );
}

function Rincian({ k, v }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-sand-400">{k}</dt>
      <dd className="text-right text-sand-700">{v}</dd>
    </div>
  );
}
