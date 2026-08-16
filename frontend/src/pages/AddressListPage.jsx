import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ShopLayout from "../components/ShopLayout";
import { Galat, JudulHalaman, Kartu, Kosong, Memuat, Tombol } from "../components/ui";
// navigate dipakai untuk membuka formulir dalam mode ubah
import { alamatApi } from "../lib/api";
import { pelangganId } from "../lib/session";

export default function AddressListPage() {
  const navigate = useNavigate();
  const id = pelangganId();
  const [alamat, setAlamat] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");

  const ambil = useCallback(async () => {
    if (!id) return;
    setMemuat(true);
    try {
      setAlamat(await alamatApi.milik(id));
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

  if (!id) {
    return (
      <ShopLayout>
        <Kosong
          judul="Belum masuk"
          keterangan="Masuk dulu untuk mengelola alamat pengiriman."
          aksi={<Link to="/LoginPelanggan"><Tombol>Masuk</Tombol></Link>}
        />
      </ShopLayout>
    );
  }

  return (
    <ShopLayout lebar="max-w-4xl">
      <JudulHalaman
        judul="Alamat Pengiriman"
        keterangan="Alamat tersimpan bisa langsung dipilih saat checkout."
        aksi={<Tombol onClick={() => navigate("/AddressForm")}>Tambah alamat</Tombol>}
      />

      {galat && <div className="mb-4"><Galat pesan={galat} onCoba={ambil} /></div>}

      {memuat ? (
        <Memuat />
      ) : alamat.length === 0 ? (
        <Kosong
          judul="Belum ada alamat"
          keterangan="Tambahkan alamat supaya proses checkout berikutnya lebih cepat."
          aksi={<Tombol onClick={() => navigate("/AddressForm")}>Tambah alamat</Tombol>}
        />
      ) : (
        <div className="space-y-3">
          {alamat.map((a) => (
            <Kartu key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sand-800">
                    {a.namaPenerima || "Penerima"}
                    {a.teleponPenerima && (
                      <span className="ml-2 font-normal text-sand-400">{a.teleponPenerima}</span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-sand-600">{a.detailAlamat}</p>
                  <p className="mt-0.5 text-sm text-sand-500">
                    {[
                      a.rt && `RT ${a.rt}`,
                      a.rw && `RW ${a.rw}`,
                      a.kelurahan,
                      a.kecamatan,
                      a.kabupaten,
                      a.provinsi,
                      a.kodePos,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>

                  {a.destinationId ? (
                    <p className="mt-2 text-xs text-leaf-500">
                      Titik kirim terdaftar — ongkos kirim bisa dihitung otomatis.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-amber-ui">
                      Belum punya titik kirim kurir. Tambahkan alamat baru lewat
                      pencarian wilayah supaya ongkir bisa dihitung.
                    </p>
                  )}

                  {a.latitude && a.longitude && (
                    <p className="mt-1 font-mono text-xs text-sand-400">
                      {Number(a.latitude).toFixed(5)}, {Number(a.longitude).toFixed(5)}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <Tombol variant="halus" size="sm" onClick={() => navigate(`/alamat-form/${a.id}`)}>
                    Ubah
                  </Tombol>
                  <Tombol
                    variant="garis"
                    size="sm"
                    onClick={async () => {
                      if (!window.confirm("Hapus alamat ini?")) return;
                      try {
                        await alamatApi.hapus(a.id);
                        await ambil();
                      } catch (e) {
                        setGalat(e.message);
                      }
                    }}
                  >
                    Hapus
                  </Tombol>
                </div>
              </div>
            </Kartu>
          ))}
        </div>
      )}
    </ShopLayout>
  );
}
