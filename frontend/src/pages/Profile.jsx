import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ShopLayout from "../components/ShopLayout";
import {
  Galat, Input, Isian, JudulHalaman, Kartu, KartuJudul, Kosong, Memuat, Tombol,
} from "../components/ui";
import { akunApi, returApi } from "../lib/api";
import { labelKendala, labelStatus, rupiah, tanggal, warnaStatus } from "../lib/format";
import { pelangganId, simpanPelanggan } from "../lib/session";
import { Chip } from "../components/ui";

export default function Profile() {
  const id = pelangganId();
  const [retur, setRetur] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [pesan, setPesan] = useState("");
  const [sibuk, setSibuk] = useState(false);

  const [form, setForm] = useState({ username: "", email: "" });
  const [sandi, setSandi] = useState({ passwordLama: "", passwordBaru: "" });

  const ambil = useCallback(async () => {
    if (!id) return;
    setMemuat(true);
    try {
      const [p, r] = await Promise.all([
        akunApi.profil(id),
        returApi.milikSaya(id).catch(() => []),
      ]);
      const user = p.user || p;
      setForm({ username: user.username || "", email: user.email || "" });
      setRetur(r);
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

  const simpanProfil = async (e) => {
    e.preventDefault();
    setSibuk(true);
    setGalat("");
    try {
      await akunApi.ubahProfil(id, form);
      // Token lama tetap dipakai; hanya nama yang ditampilkan yang diperbarui.
      simpanPelanggan({ id, username: form.username }, null);
      setPesan("Profil diperbarui.");
      await ambil();
    } catch (err) {
      setGalat(err.message);
    } finally {
      setSibuk(false);
    }
  };

  const gantiSandi = async (e) => {
    e.preventDefault();
    if (sandi.passwordBaru.length < 6) {
      setGalat("Password baru minimal 6 karakter.");
      return;
    }
    setSibuk(true);
    setGalat("");
    try {
      await akunApi.ubahPassword(id, sandi);
      setSandi({ passwordLama: "", passwordBaru: "" });
      setPesan("Password berhasil diganti.");
    } catch (err) {
      setGalat(err.message);
    } finally {
      setSibuk(false);
    }
  };

  if (!id) {
    return (
      <ShopLayout>
        <Kosong
          judul="Belum masuk"
          keterangan="Masuk dulu untuk melihat profil Anda."
          aksi={<Link to="/LoginPelanggan"><Tombol>Masuk</Tombol></Link>}
        />
      </ShopLayout>
    );
  }

  if (memuat) return <ShopLayout><Memuat /></ShopLayout>;

  return (
    <ShopLayout lebar="max-w-4xl">
      <JudulHalaman judul="Profil" keterangan="Data akun dan riwayat komplain Anda." />

      {pesan && (
        <div className="mb-4 rounded-lg border border-leaf-100 bg-leaf-100/60 px-4 py-3 text-sm font-medium text-leaf-500">
          {pesan}
        </div>
      )}
      {galat && <div className="mb-4"><Galat pesan={galat} onCoba={ambil} /></div>}

      <div className="grid gap-5 lg:grid-cols-2">
        <Kartu>
          <KartuJudul judul="Data akun" />
          <form onSubmit={simpanProfil} className="space-y-3">
            <Isian label="Nama pengguna" wajib>
              <Input required value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </Isian>
            <Isian label="Email" wajib>
              <Input type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Isian>
            <Tombol type="submit" disabled={sibuk}>Simpan perubahan</Tombol>
          </form>
        </Kartu>

        <Kartu>
          <KartuJudul judul="Ganti password" />
          <form onSubmit={gantiSandi} className="space-y-3">
            <Isian label="Password sekarang" wajib>
              <Input type="password" required value={sandi.passwordLama}
                onChange={(e) => setSandi({ ...sandi, passwordLama: e.target.value })} />
            </Isian>
            <Isian label="Password baru" wajib hint="Minimal 6 karakter.">
              <Input type="password" required minLength={6} value={sandi.passwordBaru}
                onChange={(e) => setSandi({ ...sandi, passwordBaru: e.target.value })} />
            </Isian>
            <Tombol type="submit" variant="garis" disabled={sibuk}>Ganti password</Tombol>
          </form>
        </Kartu>

        <Kartu className="lg:col-span-2">
          <KartuJudul
            judul="Riwayat komplain"
            keterangan="Pengajuan kendala yang pernah Anda kirim beserta keputusan admin."
          />
          {retur.length === 0 ? (
            <p className="py-6 text-center text-sm text-sand-400">
              Belum pernah mengajukan komplain.
            </p>
          ) : (
            <ul className="divide-y divide-sand-100">
              {retur.map((r) => (
                <li key={r.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs font-semibold text-brand-600">{r.orderId}</p>
                      <p className="text-sm text-sand-700">{labelKendala(r.jenisKendala)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip className={warnaStatus(r.status)}>{labelStatus(r.status)}</Chip>
                      {r.status === "DISETUJUI" && r.nominalRefund > 0 && (
                        <span className="tabular text-sm font-semibold text-leaf-500">
                          {rupiah(r.nominalRefund)}
                        </span>
                      )}
                    </div>
                  </div>
                  {r.alasan && <p className="mt-1 text-xs text-sand-500">{r.alasan}</p>}
                  {r.catatanAdmin && (
                    <p className="mt-1 rounded bg-sand-100 px-2 py-1.5 text-xs text-sand-600">
                      Balasan admin: {r.catatanAdmin}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-sand-400">{tanggal(r.createdAt, true)}</p>
                </li>
              ))}
            </ul>
          )}
        </Kartu>
      </div>
    </ShopLayout>
  );
}
