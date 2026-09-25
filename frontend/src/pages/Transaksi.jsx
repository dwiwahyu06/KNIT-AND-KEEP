import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ShopLayout from "../components/ShopLayout";
import { Bintang, PilihBintang } from "../components/Bintang";
import TombolWa from "../components/TombolWa";
import {
  AreaTeks, Chip, Dialog, Galat, Isian, JudulHalaman, Kartu, Kosong,
  Memuat, Pilihan, Tombol,
} from "../components/ui";
import {
  pembayaranApi, pengirimanApi, pesananApi, returApi, testimoniApi,
} from "../lib/api";
import { PESAN_CS } from "../lib/cs";
import { ALUR_UTAMA, labelStatus, rupiah, tanggal, warnaStatus } from "../lib/format";
import { pelangganId } from "../lib/session";

export default function TransaksiPage() {
  const lokasi = useLocation();
  const id = pelangganId();

  const [pesanan, setPesanan] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [pesan, setPesan] = useState("");
  const [sibuk, setSibuk] = useState(false);

  // Penilaian disimpan per pesanan: { [transactionId]: testimoni }
  const [penilaian, setPenilaian] = useState({});
  const [beriNilai, setBeriNilai] = useState(null);
  const [formNilai, setFormNilai] = useState({ rating: 0, ulasan: "" });

  const [jenisKendala, setJenisKendala] = useState([]);
  const [komplain, setKomplain] = useState(null);
  const [formKomplain, setFormKomplain] = useState({
    jenisKendala: "BARANG_RUSAK",
    alasan: "",
    fotoBukti: "",
  });

  const ambilPenilaian = useCallback(async () => {
    if (!id) return;
    try {
      const daftar = await testimoniApi.milikSaya(id);
      setPenilaian(Object.fromEntries(daftar.map((t) => [t.transactionId, t])));
    } catch {
      /* penilaian cuma pelengkap — daftar pesanan tetap harus tampil */
    }
  }, [id]);

  const ambil = useCallback(async () => {
    if (!id) return;
    setMemuat(true);
    try {
      setPesanan(await pesananApi.milikSaya(id));
      setGalat("");
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
    ambilPenilaian();
  }, [id, ambilPenilaian]);

  useEffect(() => {
    ambil();
    returApi.jenisKendala().then(setJenisKendala).catch(() => {});
  }, [ambil]);

  useEffect(() => {
    if (lokasi.state?.baruBayar) {
      setPesan(
        `Pesanan ${lokasi.state.baruBayar} sudah dibuat. Status pembayarannya diperiksa langsung ke Midtrans — kalau masih menunggu, tekan "Cek status pembayaran".`
      );
    } else if (lokasi.state?.menunggu) {
      setPesan(`Pesanan ${lokasi.state.menunggu} tersimpan dan menunggu pembayaran.`);
    }
  }, [lokasi.state]);

  const cekPembayaran = async (p) => {
    setSibuk(true);
    setGalat("");
    try {
      const hasil = await pembayaranApi.sinkron(p.id);
      setPesan(hasil.pesan);
      if (hasil.berubah) await ambil();
    } catch (e) {
      setGalat(e.message);
    } finally {
      setSibuk(false);
    }
  };

  const terima = async (p) => {
    setSibuk(true);
    try {
      await pesananApi.terimaBarang(p.id, id);
      setPesan("Terima kasih, pesanan ditandai selesai.");
      await ambil();
    } catch (e) {
      setGalat(e.message);
    } finally {
      setSibuk(false);
    }
  };

  const bukaPenilaian = (p) => {
    const lama = penilaian[p.id];
    setFormNilai({ rating: lama?.rating || 0, ulasan: lama?.ulasan || "" });
    setBeriNilai(p);
  };

  const kirimPenilaian = async () => {
    setSibuk(true);
    setGalat("");
    try {
      const lama = penilaian[beriNilai.id];
      // Pesanan yang sudah pernah dinilai diperbarui, bukan ditumpuk: satu
      // pesanan satu penilaian, supaya rata-rata bintang tidak bisa didorong
      // naik dengan mengirim ulang.
      if (lama) {
        await testimoniApi.ubah(lama.id, formNilai);
      } else {
        await testimoniApi.kirim({ transactionId: beriNilai.id, ...formNilai });
      }
      setBeriNilai(null);
      setPesan(
        lama
          ? "Penilaian Anda diperbarui. Terima kasih."
          : "Terima kasih, penilaian Anda sudah kami terima."
      );
      await ambilPenilaian();
    } catch (e) {
      setGalat(e.message);
    } finally {
      setSibuk(false);
    }
  };

  const bacaFoto = (file) => {
    if (!file) return;
    if (file.size > 1_500_000) {
      setGalat("Ukuran foto maksimal 1,5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFormKomplain((f) => ({ ...f, fotoBukti: reader.result }));
    reader.readAsDataURL(file);
  };

  const kirimKomplain = async () => {
    setSibuk(true);
    setGalat("");
    try {
      await returApi.ajukan({
        transactionId: komplain.id,
        jenisKendala: formKomplain.jenisKendala,
        alasan: formKomplain.alasan,
        fotoBukti: formKomplain.fotoBukti,
        diajukanOleh: "PELANGGAN",
      });
      setKomplain(null);
      setFormKomplain({ jenisKendala: "BARANG_RUSAK", alasan: "", fotoBukti: "" });
      setPesan("Komplain terkirim. Admin akan meninjau pengajuan Anda.");
      await ambil();
    } catch (e) {
      setGalat(e.message);
    } finally {
      setSibuk(false);
    }
  };

  if (!id) {
    return (
      <ShopLayout>
        <Kosong
          judul="Belum masuk"
          keterangan="Masuk dulu untuk melihat riwayat pesanan Anda."
          aksi={<Link to="/LoginPelanggan"><Tombol>Masuk</Tombol></Link>}
        />
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <JudulHalaman
        judul="Pesanan Saya"
        keterangan="Pantau perjalanan pesanan dari pembayaran sampai barang diterima. Kalau ada kendala, ajukan komplain dari sini — dan kalau puas, beri penilaian setelah pesanan selesai."
      />

      {pesan && (
        <div className="mb-4 rounded-lg border border-leaf-100 bg-leaf-100/60 px-4 py-3 text-sm font-medium text-leaf-500">
          {pesan}
        </div>
      )}
      {galat && <div className="mb-4"><Galat pesan={galat} onCoba={ambil} /></div>}

      {memuat ? (
        <Memuat />
      ) : pesanan.length === 0 ? (
        <Kosong
          judul="Belum ada pesanan"
          keterangan="Pesanan Anda akan muncul di sini setelah checkout."
          aksi={<Link to="/products"><Tombol>Mulai belanja</Tombol></Link>}
        />
      ) : (
        <div className="space-y-4">
          {pesanan.map((p) => (
            <KartuPesanan
              key={p.id}
              pesanan={p}
              sibuk={sibuk}
              penilaian={penilaian[p.id]}
              onTerima={() => terima(p)}
              onKomplain={() => setKomplain(p)}
              onCekBayar={() => cekPembayaran(p)}
              onBeriNilai={() => bukaPenilaian(p)}
            />
          ))}
        </div>
      )}

      <Dialog
        terbuka={!!beriNilai}
        onTutup={() => setBeriNilai(null)}
        judul={penilaian[beriNilai?.id] ? "Ubah penilaian" : "Beri penilaian"}
        keterangan={beriNilai ? `Pesanan ${beriNilai.orderId}` : ""}
      >
        <div className="space-y-4">
          <Isian label="Seberapa puas Anda?" wajib>
            <PilihBintang
              nilai={formNilai.rating}
              onPilih={(r) => setFormNilai({ ...formNilai, rating: r })}
            />
          </Isian>

          <Isian
            label="Ceritakan pengalamannya"
            hint="Boleh dikosongkan. Kondisi barang, kecepatan pengiriman, dan pelayanan paling membantu pembeli berikutnya."
          >
            <AreaTeks
              value={formNilai.ulasan}
              onChange={(e) => setFormNilai({ ...formNilai, ulasan: e.target.value })}
              maxLength={1024}
              placeholder="Contoh: Rajutannya masih tebal dan tidak bau apek, sesuai foto. Dikirim sehari setelah dibayar."
            />
          </Isian>

          <p className="rounded-lg bg-sand-100 px-3 py-2.5 text-xs text-sand-500">
            Penilaian tampil di halaman depan toko. Nama Anda disamarkan,
            misalnya {`"dw•••"`}.
          </p>

          <div className="flex gap-2">
            <Tombol
              className="flex-1"
              onClick={kirimPenilaian}
              disabled={sibuk || !formNilai.rating}
            >
              {sibuk ? "Mengirim…" : "Kirim penilaian"}
            </Tombol>
            <Tombol variant="halus" onClick={() => setBeriNilai(null)}>Batal</Tombol>
          </div>
        </div>
      </Dialog>

      <Dialog
        terbuka={!!komplain}
        onTutup={() => setKomplain(null)}
        judul="Ajukan komplain"
        keterangan={komplain ? `Pesanan ${komplain.orderId}` : ""}
      >
        <div className="space-y-4">
          <Isian label="Jenis kendala" wajib>
            <Pilihan
              value={formKomplain.jenisKendala}
              onChange={(e) => setFormKomplain({ ...formKomplain, jenisKendala: e.target.value })}
            >
              {(jenisKendala.length
                ? jenisKendala
                : [{ value: "BARANG_RUSAK", label: "Barang Rusak" }]
              ).map((j) => (
                <option key={j.value} value={j.value}>{j.label}</option>
              ))}
            </Pilihan>
          </Isian>

          <Isian label="Ceritakan kendalanya" wajib>
            <AreaTeks
              value={formKomplain.alasan}
              onChange={(e) => setFormKomplain({ ...formKomplain, alasan: e.target.value })}
              placeholder="Contoh: Ada sobek di bagian lengan yang tidak terlihat di foto katalog."
            />
          </Isian>

          <Isian label="Foto bukti" hint="Maksimal 1,5 MB. Sangat membantu mempercepat peninjauan.">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => bacaFoto(e.target.files?.[0])}
              className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-sand-200 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-sand-700"
            />
          </Isian>

          {formKomplain.fotoBukti && (
            <img
              src={formKomplain.fotoBukti}
              alt="Pratinjau bukti"
              className="max-h-44 w-full rounded-lg object-contain"
            />
          )}

          <div className="flex gap-2">
            <Tombol
              className="flex-1"
              onClick={kirimKomplain}
              disabled={sibuk || !formKomplain.alasan.trim()}
            >
              {sibuk ? "Mengirim…" : "Kirim komplain"}
            </Tombol>
            <Tombol variant="halus" onClick={() => setKomplain(null)}>Batal</Tombol>
          </div>
        </div>
      </Dialog>
    </ShopLayout>
  );
}

function KartuPesanan({
  pesanan, sibuk, penilaian, onTerima, onKomplain, onCekBayar, onBeriNilai,
}) {
  const [buka, setBuka] = useState(false);
  const bermasalah = !ALUR_UTAMA.includes(pesanan.status) && pesanan.status !== "DIBATALKAN";
  const indeks = ALUR_UTAMA.indexOf(pesanan.status);

  const bolehKomplain = ["DIPROSES", "DIKIRIM", "SELESAI"].includes(pesanan.status);
  const bolehTerima = pesanan.status === "DIKIRIM";
  const belumBayar = pesanan.status === "MENUNGGU_PEMBAYARAN";
  // Menilai barang yang belum sampai tidak ada isinya. Pesanan yang batal pun
  // tidak pernah jadi pengalaman belanja yang bisa dinilai.
  const bolehMenilai = pesanan.status === "SELESAI";

  // --- pelacakan paket ke kurir ---
  const [lacak, setLacak] = useState(null);
  const [memuatLacak, setMemuatLacak] = useState(false);
  const [galatLacak, setGalatLacak] = useState("");

  const lacakPaket = async () => {
    setMemuatLacak(true);
    setGalatLacak("");
    try {
      setLacak(await pengirimanApi.lacakPesanan(pesanan.id));
    } catch (e) {
      setGalatLacak(e.message);
    } finally {
      setMemuatLacak(false);
    }
  };

  return (
    <Kartu>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-semibold text-brand-600">{pesanan.orderId}</p>
          <p className="text-xs text-sand-400">
            {tanggal(pesanan.createdAt, true)} · {pesanan.totalQty} barang
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip className={warnaStatus(pesanan.status)}>{labelStatus(pesanan.status)}</Chip>
          <span className="tabular font-bold text-sand-800">{rupiah(pesanan.amount)}</span>
        </div>
      </div>

      {/* Linimasa pelacakan */}
      {!bermasalah && pesanan.status !== "DIBATALKAN" && (
        <div className="mt-5">
          <div className="flex items-center">
            {ALUR_UTAMA.map((s, i) => {
              const lewat = i <= indeks;
              return (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                        lewat
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-sand-300 bg-white text-sand-300"
                      }`}
                    >
                      {lewat ? "✓" : i + 1}
                    </span>
                    <span
                      className={`w-16 text-center text-[10px] leading-tight sm:w-24 ${
                        lewat ? "font-semibold text-sand-700" : "text-sand-400"
                      }`}
                    >
                      {labelStatus(s)}
                    </span>
                  </div>
                  {i < ALUR_UTAMA.length - 1 && (
                    <div className={`-mt-5 h-0.5 flex-1 ${i < indeks ? "bg-brand-600" : "bg-sand-200"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {bermasalah && (
        <div className="mt-4 rounded-lg bg-rust-100/60 px-3 py-2.5 text-sm text-rust-500">
          Pesanan ini sedang ditangani sebagai kendala: <b>{labelStatus(pesanan.status)}</b>
        </div>
      )}

      {pesanan.nomorResi && (
        <div className="mt-4 rounded-lg bg-sand-100 px-3 py-2.5 text-sm text-sand-600">
          Resi <b className="font-mono">{pesanan.nomorResi}</b>
          {pesanan.kurir && ` · ${pesanan.kurir.toUpperCase()}`}
          {pesanan.layananKurir && ` ${pesanan.layananKurir}`}
        </div>
      )}

      {/* Posisi paket langsung dari sistem kurir */}
      {lacak && (
        <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-brand-600">
              {lacak.status || "Dalam perjalanan"}
            </span>
            <span className="text-xs text-sand-500">
              {lacak.asal} → {lacak.tujuan}
            </span>
          </div>
          {lacak.terkirim && lacak.diterimaOleh && (
            <p className="mt-1 text-xs text-leaf-500">
              Diterima {lacak.diterimaOleh} · {lacak.waktuDiterima}
            </p>
          )}
          <ol className="mt-3 space-y-2 border-l border-brand-200 pl-4">
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
        </div>
      )}
      {galatLacak && (
        <p className="mt-3 rounded-lg bg-amber-100/60 px-3 py-2 text-sm text-amber-ui">{galatLacak}</p>
      )}

      {penilaian && (
        <div className="mt-4 rounded-lg border border-wool-100 bg-wool-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Bintang nilai={penilaian.rating} ukuran="sm" />
            <span className="text-xs text-sand-500">
              Anda menilai pesanan ini pada {tanggal(penilaian.createdAt)}
            </span>
          </div>
          {penilaian.ulasan && (
            <p className="mt-2 whitespace-pre-line text-sm text-sand-600">{penilaian.ulasan}</p>
          )}
          {penilaian.balasanAdmin && (
            <p className="mt-2 rounded-md bg-white/70 px-3 py-2 text-sm text-sand-600">
              <span className="font-semibold text-sand-700">Balasan toko: </span>
              {penilaian.balasanAdmin}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {belumBayar && (
          <Tombol size="sm" onClick={onCekBayar} disabled={sibuk}>
            Cek status pembayaran
          </Tombol>
        )}
        {pesanan.nomorResi && (
          <Tombol size="sm" variant="garis" onClick={lacakPaket} disabled={memuatLacak}>
            {memuatLacak ? "Menghubungi kurir…" : lacak ? "Perbarui posisi paket" : "Lacak paket"}
          </Tombol>
        )}
        {bolehTerima && (
          <Tombol size="sm" onClick={onTerima} disabled={sibuk}>Barang sudah diterima</Tombol>
        )}
        {bolehMenilai && (
          <Tombol size="sm" variant="aksen" onClick={onBeriNilai} disabled={sibuk}>
            {penilaian ? "Ubah penilaian" : "Beri penilaian"}
          </Tombol>
        )}
        {bolehKomplain && (
          <Tombol size="sm" variant="garis" onClick={onKomplain} disabled={sibuk}>
            Ada kendala
          </Tombol>
        )}
        {/* Nomor pesanan ikut terbawa ke percakapan, jadi admin tidak perlu
            menanyakannya lebih dulu. */}
        <TombolWa size="sm" variant="halus" pesan={PESAN_CS.pesanan(pesanan)}>
          Tanya CS
        </TombolWa>
        <Tombol size="sm" variant="halus" onClick={() => setBuka((b) => !b)}>
          {buka ? "Sembunyikan rincian" : "Lihat rincian"}
        </Tombol>
      </div>

      {buka && (
        <div className="mt-4 space-y-4 border-t border-sand-200 pt-4">
          <div>
            <p className="label-mono mb-2 text-sand-400">Barang</p>
            <ul className="divide-y divide-sand-100">
              {(pesanan.items || []).map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-2 text-sm">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-sand-100">
                    {i.gambar ? (
                      <img src={i.gambar} alt={i.namaProduk} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sand-300">◻</div>
                    )}
                  </div>
                  <span className="flex-1 text-sand-700">{i.namaProduk}</span>
                  <span className="tabular text-sand-400">
                    {rupiah(i.hargaJual)} × {i.quantity}
                  </span>
                  <span className="tabular w-24 text-right font-semibold">{rupiah(i.subtotal)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between text-sand-500">
                <span>Subtotal</span><span className="tabular">{rupiah(pesanan.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sand-500">
                <span>Ongkos kirim</span><span className="tabular">{rupiah(pesanan.ongkir)}</span>
              </div>
            </div>
          </div>

          {pesanan.alamatPengiriman && (
            <div>
              <p className="label-mono mb-1 text-sand-400">Alamat</p>
              <p className="text-sm text-sand-600">{pesanan.alamatPengiriman}</p>
            </div>
          )}

          <div>
            <p className="label-mono mb-2 text-sand-400">Riwayat</p>
            <ol className="space-y-2 border-l border-sand-200 pl-4">
              {(pesanan.riwayat || []).map((r) => (
                <li key={r.id} className="relative text-sm">
                  <span className="absolute -left-[22px] top-1.5 h-2 w-2 rounded-full bg-brand-500" />
                  <span className="font-medium text-sand-700">{labelStatus(r.status)}</span>
                  <span className="text-xs text-sand-400"> · {tanggal(r.waktu, true)}</span>
                  {r.catatan && <p className="text-xs text-sand-500">{r.catatan}</p>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Kartu>
  );
}
