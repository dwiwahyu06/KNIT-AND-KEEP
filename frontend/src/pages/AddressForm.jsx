import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import ShopLayout from "../components/ShopLayout";
import {
  AreaTeks, Galat, Input, Isian, JudulHalaman, Kartu, KartuJudul, Memuat, Tombol,
} from "../components/ui";
import { alamatApi, pengirimanApi } from "../lib/api";
import { pelangganId, pelangganNama } from "../lib/session";

// Ikon bawaan Leaflet memakai path relatif yang tidak ikut ter-bundle Vite,
// jadi penandanya digambar sendiri.
const penanda = L.divIcon({
  className: "",
  html: '<span style="display:block;width:18px;height:18px;border-radius:50%;background:#183d4b;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function PemilihTitik({ posisi, onPilih }) {
  useMapEvents({
    click(e) {
      onPilih([e.latlng.lat, e.latlng.lng]);
    },
  });
  return posisi ? <Marker position={posisi} icon={penanda} /> : null;
}

export default function AddressForm() {
  const navigate = useNavigate();
  const { addressId } = useParams();
  const id = pelangganId();
  const sedangUbah = Boolean(addressId);

  const [form, setForm] = useState({
    namaPenerima: pelangganNama(),
    teleponPenerima: "",
    detailAlamat: "",
    rt: "",
    rw: "",
  });
  const [memuatAwal, setMemuatAwal] = useState(sedangUbah);

  // Wilayah tidak diketik bebas lagi. Ia dipilih dari daftar resmi kurir,
  // karena ongkos kirim hanya bisa dihitung untuk titik yang mereka kenali.
  const [kataCari, setKataCari] = useState("");
  const [saran, setSaran] = useState([]);
  const [mencari, setMencari] = useState(false);
  const [tujuan, setTujuan] = useState(null);
  const [galatCari, setGalatCari] = useState("");

  // Jalan keluar saat layanan kurir sedang tidak bisa dihubungi atau kuotanya
  // habis. Tanpa ini, pembeli tidak bisa menyimpan alamat sama sekali, jadi
  // tidak bisa berbelanja — gangguan di pihak lain menghentikan seluruh toko.
  // Alamat yang diisi begini tetap sah, hanya ongkirnya memakai tarif
  // perkiraan sampai wilayahnya dicocokkan ulang.
  const [isiSendiri, setIsiSendiri] = useState(false);
  const [wilayah, setWilayah] = useState({
    provinsi: "", kabupaten: "", kecamatan: "", kelurahan: "", kodePos: "",
  });

  const [posisi, setPosisi] = useState(null);
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  const timerRef = useRef(null);

  // Memuat alamat yang sedang diubah, termasuk wilayah yang sudah dipilih dulu.
  useEffect(() => {
    if (!sedangUbah) return;
    alamatApi
      .detail(addressId)
      .then((a) => {
        setForm({
          namaPenerima: a.namaPenerima || "",
          teleponPenerima: a.teleponPenerima || "",
          detailAlamat: a.detailAlamat || "",
          rt: a.rt || "",
          rw: a.rw || "",
        });
        if (a.destinationId) {
          setTujuan({
            id: a.destinationId,
            label: a.labelTujuan || [a.kelurahan, a.kecamatan, a.kabupaten, a.provinsi]
              .filter(Boolean).join(", "),
            provinsi: a.provinsi, kabupaten: a.kabupaten,
            kecamatan: a.kecamatan, kelurahan: a.kelurahan, kodePos: a.kodePos,
          });
        }
        else if (a.provinsi || a.kabupaten) {
          // Alamat yang dulu disimpan tanpa titik kirim kurir.
          setIsiSendiri(true);
          setWilayah({
            provinsi: a.provinsi || "", kabupaten: a.kabupaten || "",
            kecamatan: a.kecamatan || "", kelurahan: a.kelurahan || "",
            kodePos: a.kodePos || "",
          });
        }
        if (a.latitude && a.longitude) setPosisi([a.latitude, a.longitude]);
      })
      .catch((e) => setGalat(e.message))
      .finally(() => setMemuatAwal(false));
  }, [addressId, sedangUbah]);

  useEffect(() => {
    if (tujuan) return;
    if (kataCari.trim().length < 3) {
      setSaran([]);
      setGalatCari("");
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setMencari(true);
      setGalatCari("");
      try {
        setSaran(await pengirimanApi.cariTujuan(kataCari.trim()));
      } catch (e) {
        setGalatCari(e.message);
        setSaran([]);
      } finally {
        setMencari(false);
      }
    }, 400);

    return () => clearTimeout(timerRef.current);
  }, [kataCari, tujuan]);

  const pilihTujuan = (t) => {
    setTujuan(t);
    setSaran([]);
    setKataCari(t.label);
  };

  const gantiTujuan = () => {
    setTujuan(null);
    setKataCari("");
    setSaran([]);
  };

  const simpan = async (e) => {
    e.preventDefault();
    if (!id) {
      navigate("/LoginPelanggan");
      return;
    }
    if (!tujuan && !isiSendiri) {
      setGalat("Pilih wilayah dari daftar saran supaya ongkos kirim bisa dihitung.");
      return;
    }
    if (!tujuan && (!wilayah.provinsi.trim() || !wilayah.kabupaten.trim())) {
      setGalat("Provinsi dan kabupaten/kota wajib diisi.");
      return;
    }
    setProses(true);
    setGalat("");
    try {
      const w = tujuan || wilayah;
      const data = {
        namaPenerima: form.namaPenerima,
        teleponPenerima: form.teleponPenerima,
        detailAlamat: form.detailAlamat,
        rt: form.rt,
        rw: form.rw,
        provinsi: w.provinsi,
        kabupaten: w.kabupaten,
        kecamatan: w.kecamatan,
        kelurahan: w.kelurahan,
        kodePos: w.kodePos,
        // Kosong berarti wilayahnya belum dicocokkan dengan daftar kurir, dan
        // ongkirnya nanti memakai tarif perkiraan toko.
        destinationId: tujuan ? String(tujuan.id) : null,
        labelTujuan: tujuan
          ? tujuan.label
          : [wilayah.kelurahan, wilayah.kecamatan, wilayah.kabupaten, wilayah.provinsi,
             wilayah.kodePos].filter(Boolean).join(", "),
        latitude: posisi ? posisi[0] : null,
        longitude: posisi ? posisi[1] : null,
      };
      if (sedangUbah) await alamatApi.ubah(addressId, data);
      else await alamatApi.buat(id, data);
      navigate("/AddressListPage");
    } catch (err) {
      setGalat(err.message);
    } finally {
      setProses(false);
    }
  };

  if (memuatAwal) return <ShopLayout lebar="max-w-4xl"><Memuat /></ShopLayout>;

  return (
    <ShopLayout lebar="max-w-4xl">
      <JudulHalaman
        judul={sedangUbah ? "Ubah Alamat" : "Tambah Alamat"}
        keterangan="Wilayah dipilih dari daftar resmi kurir, jadi ongkos kirimnya nanti benar-benar sesuai tarif yang berlaku."
      />

      <form onSubmit={simpan} className="grid gap-5 lg:grid-cols-2">
        <Kartu className="lg:col-span-2">
          <KartuJudul
            judul="Wilayah tujuan"
            keterangan="Ketik nama kelurahan, kecamatan, atau kota — minimal 3 huruf."
          />

          {tujuan ? (
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-brand-600">{tujuan.label}</p>
                <p className="mt-0.5 font-mono text-xs text-sand-500">
                  Kode wilayah kurir: {tujuan.id} · kode pos {tujuan.kodePos || "-"}
                </p>
              </div>
              <Tombol type="button" variant="halus" size="sm" onClick={gantiTujuan}>
                Ganti
              </Tombol>
            </div>
          ) : isiSendiri ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-sand-700">
                <p className="font-semibold">Wilayah diisi sendiri</p>
                <p className="mt-1 text-xs">
                  Ongkos kirimnya nanti memakai tarif perkiraan toko, bukan tarif
                  resmi kurir. Anda bisa mengubah alamat ini nanti dan memilih
                  wilayah dari daftar kurir supaya ongkirnya persis.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Isian label="Provinsi" wajib>
                  <Input
                    required
                    value={wilayah.provinsi}
                    onChange={(e) => setWilayah({ ...wilayah, provinsi: e.target.value })}
                    placeholder="JAWA BARAT"
                  />
                </Isian>
                <Isian label="Kabupaten / Kota" wajib>
                  <Input
                    required
                    value={wilayah.kabupaten}
                    onChange={(e) => setWilayah({ ...wilayah, kabupaten: e.target.value })}
                    placeholder="BANDUNG"
                  />
                </Isian>
                <Isian label="Kecamatan">
                  <Input
                    value={wilayah.kecamatan}
                    onChange={(e) => setWilayah({ ...wilayah, kecamatan: e.target.value })}
                    placeholder="CIBIRU"
                  />
                </Isian>
                <Isian label="Kelurahan / Desa">
                  <Input
                    value={wilayah.kelurahan}
                    onChange={(e) => setWilayah({ ...wilayah, kelurahan: e.target.value })}
                    placeholder="CIPADUNG"
                  />
                </Isian>
                <Isian label="Kode pos">
                  <Input
                    value={wilayah.kodePos}
                    onChange={(e) => setWilayah({ ...wilayah, kodePos: e.target.value })}
                    placeholder="40614"
                    inputMode="numeric"
                  />
                </Isian>
              </div>
              <button
                type="button"
                onClick={() => { setIsiSendiri(false); setGalatCari(""); }}
                className="text-sm font-semibold text-brand-600 hover:underline"
              >
                ← Kembali mencari wilayah dari daftar kurir
              </button>
            </div>
          ) : (
            <div className="relative">
              <Input
                value={kataCari}
                onChange={(e) => setKataCari(e.target.value)}
                placeholder="Contoh: Cibiru, atau Bandung Kidul"
                autoComplete="off"
              />
              {mencari && <p className="mt-2 text-xs text-sand-400">Mencari wilayah…</p>}
              {galatCari && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <p className="text-xs text-rust-500">{galatCari}</p>
                  <button
                    type="button"
                    onClick={() => setIsiSendiri(true)}
                    className="mt-1.5 text-sm font-semibold text-brand-600 hover:underline"
                  >
                    Isi wilayah sendiri →
                  </button>
                </div>
              )}

              {saran.length > 0 && (
                <ul className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-sand-200 bg-white">
                  {saran.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => pilihTujuan(s)}
                        className="w-full border-b border-sand-100 px-4 py-2.5 text-left text-sm transition last:border-0 hover:bg-sand-50"
                      >
                        <span className="block font-medium text-sand-800">
                          {s.kelurahan && s.kelurahan !== "-" ? `${s.kelurahan}, ` : ""}
                          {s.kecamatan}
                        </span>
                        <span className="text-xs text-sand-400">
                          {s.kabupaten}, {s.provinsi} {s.kodePos}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Kartu>

        <Kartu>
          <KartuJudul judul="Penerima" />
          <div className="space-y-3">
            <Isian label="Nama penerima" wajib>
              <Input
                required
                value={form.namaPenerima}
                onChange={(e) => setForm({ ...form, namaPenerima: e.target.value })}
              />
            </Isian>
            <Isian
              label="Nomor telepon"
              wajib
              hint="Lima digit terakhirnya diminta kurir saat melacak resi."
            >
              <Input
                required
                inputMode="numeric"
                value={form.teleponPenerima}
                onChange={(e) => setForm({ ...form, teleponPenerima: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </Isian>
            <Isian label="Alamat lengkap" wajib hint="Nama jalan, nomor rumah, patokan.">
              <AreaTeks
                required
                value={form.detailAlamat}
                onChange={(e) => setForm({ ...form, detailAlamat: e.target.value })}
                placeholder="Jl. Melati No. 12, sebelah warung Bu Ani"
              />
            </Isian>
            <div className="grid grid-cols-2 gap-3">
              <Isian label="RT">
                <Input value={form.rt} onChange={(e) => setForm({ ...form, rt: e.target.value })} placeholder="003" />
              </Isian>
              <Isian label="RW">
                <Input value={form.rw} onChange={(e) => setForm({ ...form, rw: e.target.value })} placeholder="005" />
              </Isian>
            </div>
          </div>
        </Kartu>

        <Kartu>
          <KartuJudul
            judul="Tandai di peta"
            keterangan="Opsional. Klik lokasi rumah supaya kurir lebih mudah menemukannya."
          />
          <div className="h-72 overflow-hidden rounded-lg border border-sand-200">
            <MapContainer
              center={[-6.9175, 107.6191]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <PemilihTitik posisi={posisi} onPilih={setPosisi} />
            </MapContainer>
          </div>
          <p className="mt-2 font-mono text-xs text-sand-400">
            {posisi ? `${posisi[0].toFixed(5)}, ${posisi[1].toFixed(5)}` : "Belum ada titik dipilih"}
          </p>
        </Kartu>

        <div className="lg:col-span-2">
          {galat && <div className="mb-3"><Galat pesan={galat} /></div>}
          <div className="flex gap-2">
            <Tombol type="submit" disabled={proses}>
              {proses ? "Menyimpan…" : sedangUbah ? "Simpan perubahan" : "Simpan alamat"}
            </Tombol>
            <Tombol type="button" variant="halus" onClick={() => navigate(-1)}>Batal</Tombol>
          </div>
        </div>
      </form>
    </ShopLayout>
  );
}
