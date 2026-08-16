import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Baris, Chip, Dialog, Galat, Input, Isian, JudulHalaman, Kartu, KartuAngka,
  Kosong, Memuat, Sel, Tabel, Tombol,
} from "../components/ui";
import { akunApi } from "../lib/api";
import { angka } from "../lib/format";
import { adminSaatIni } from "../lib/session";

/**
 * Pengelolaan akun.
 *
 * Penambahan pengelola dilakukan dari sini, bukan dari halaman pendaftaran
 * terbuka — sebelumnya siapa pun yang tahu alamatnya bisa mengangkat dirinya
 * sendiri menjadi pengelola toko.
 */
export default function User() {
  const saya = adminSaatIni();

  const [pelanggan, setPelanggan] = useState([]);
  const [admin, setAdmin] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [pesan, setPesan] = useState("");
  const [cari, setCari] = useState("");
  const [tab, setTab] = useState("pelanggan");
  const [sibuk, setSibuk] = useState(false);

  const [bukaTambah, setBukaTambah] = useState(false);
  const [formTambah, setFormTambah] = useState({ username: "", email: "", password: "" });

  const [aturUlang, setAturUlang] = useState(null);
  const [passwordBaru, setPasswordBaru] = useState("");

  const ambil = useCallback(async () => {
    setMemuat(true);
    setGalat("");
    try {
      const [p, a] = await Promise.all([akunApi.semuaPelanggan(), akunApi.semuaAdmin()]);
      setPelanggan(p);
      setAdmin(a);
    } catch (e) {
      setGalat(e.message);
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    ambil();
  }, [ambil]);

  const daftar = tab === "pelanggan" ? pelanggan : admin;

  const terlihat = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return daftar;
    return daftar.filter(
      (u) => u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [daftar, cari]);

  const jalankan = async (fn, sukses) => {
    setSibuk(true);
    setGalat("");
    setPesan("");
    try {
      await fn();
      setPesan(sukses);
      await ambil();
    } catch (e) {
      setGalat(e.message);
    } finally {
      setSibuk(false);
    }
  };

  const tambahPengelola = (e) => {
    e.preventDefault();
    jalankan(
      () => akunApi.daftarAdmin(formTambah),
      `Akun pengelola ${formTambah.username} ditambahkan.`
    ).then(() => {
      setBukaTambah(false);
      setFormTambah({ username: "", email: "", password: "" });
    });
  };

  const hapusPengelola = (u) => {
    if (!window.confirm(`Hapus akun pengelola ${u.username}?`)) return;
    jalankan(() => akunApi.hapusAdmin(u.id), `Akun ${u.username} dihapus.`);
  };

  const simpanPasswordBaru = (e) => {
    e.preventDefault();
    jalankan(
      () => akunApi.aturUlangPasswordAdmin(aturUlang.id, passwordBaru),
      `Password ${aturUlang.username} diatur ulang.`
    ).then(() => {
      setAturUlang(null);
      setPasswordBaru("");
    });
  };

  const ubahStatus = (u) => {
    const aktif = u.aktif === false;
    const kata = aktif ? "Aktifkan kembali" : "Nonaktifkan";
    if (!window.confirm(`${kata} akun ${u.username}?`)) return;
    jalankan(
      () => akunApi.ubahStatusPelanggan(u.id, aktif),
      `Akun ${u.username} ${aktif ? "diaktifkan kembali" : "dinonaktifkan"}.`
    );
  };

  const nonaktif = pelanggan.filter((p) => p.aktif === false).length;

  return (
    <AdminLayout>
      <JudulHalaman
        judul="Akun"
        keterangan="Pelanggan toko dan akun pengelola. Keduanya sistem akun yang terpisah."
        aksi={
          <>
            {tab === "admin" && (
              <Tombol onClick={() => setBukaTambah(true)}>Tambah pengelola</Tombol>
            )}
            <Tombol variant="garis" size="sm" onClick={ambil}>Muat ulang</Tombol>
          </>
        }
      />

      {pesan && (
        <div className="mb-4 rounded-lg border border-leaf-100 bg-leaf-100/60 px-4 py-3 text-sm font-medium text-leaf-500">
          {pesan}
        </div>
      )}
      {galat && <div className="mb-4"><Galat pesan={galat} onCoba={ambil} /></div>}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <KartuAngka label="Pelanggan terdaftar" nilai={angka(pelanggan.length)} nada="brand" />
        <KartuAngka label="Akun dinonaktifkan" nilai={angka(nonaktif)}
          nada={nonaktif > 0 ? "perhatian" : "netral"} />
        <KartuAngka label="Akun pengelola" nilai={angka(admin.length)} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { n: "pelanggan", l: "Pelanggan" },
          { n: "admin", l: "Pengelola" },
        ].map((t) => (
          <button
            key={t.n}
            onClick={() => setTab(t.n)}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              tab === t.n
                ? "bg-brand-600 text-white"
                : "border border-sand-300 bg-white text-sand-600 hover:border-brand-400"
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      <Kartu className="mb-5">
        <Input
          placeholder="Cari nama pengguna atau email…"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
        />
      </Kartu>

      {memuat ? (
        <Memuat />
      ) : terlihat.length === 0 ? (
        <Kosong judul="Tidak ada akun" keterangan="Belum ada akun yang cocok." />
      ) : tab === "pelanggan" ? (
        <Tabel kepala={["#", "Nama pengguna", "Email", "Status", ""]} min="min-w-[640px]">
          {terlihat.map((u, i) => (
            <Baris key={u.id}>
              <Sel className="tabular text-sand-400">{i + 1}</Sel>
              <Sel className="font-medium text-sand-800">{u.username}</Sel>
              <Sel className="text-sand-500">{u.email}</Sel>
              <Sel>
                <Chip className={u.aktif === false ? "bg-sand-200 text-sand-600" : "bg-leaf-100 text-leaf-500"}>
                  {u.aktif === false ? "Nonaktif" : "Aktif"}
                </Chip>
              </Sel>
              <Sel>
                <div className="flex justify-end">
                  <Tombol
                    size="sm"
                    variant={u.aktif === false ? "utama" : "garis"}
                    disabled={sibuk}
                    onClick={() => ubahStatus(u)}
                  >
                    {u.aktif === false ? "Aktifkan" : "Nonaktifkan"}
                  </Tombol>
                </div>
              </Sel>
            </Baris>
          ))}
        </Tabel>
      ) : (
        <Tabel kepala={["#", "Nama pengguna", "Email", "Peran", ""]} min="min-w-[680px]">
          {terlihat.map((u, i) => (
            <Baris key={u.id}>
              <Sel className="tabular text-sand-400">{i + 1}</Sel>
              <Sel className="font-medium text-sand-800">
                {u.username}
                {saya?.id === u.id && (
                  <span className="ml-2 text-xs font-normal text-sand-400">(Anda)</span>
                )}
              </Sel>
              <Sel className="text-sand-500">{u.email}</Sel>
              <Sel><Chip className="bg-brand-100 text-brand-600">{u.role || "ADMIN"}</Chip></Sel>
              <Sel>
                <div className="flex justify-end gap-2">
                  <Tombol size="sm" variant="halus" disabled={sibuk}
                    onClick={() => { setAturUlang(u); setPasswordBaru(""); }}>
                    Atur ulang password
                  </Tombol>
                  <Tombol size="sm" variant="garis" disabled={sibuk || saya?.id === u.id}
                    onClick={() => hapusPengelola(u)}>
                    Hapus
                  </Tombol>
                </div>
              </Sel>
            </Baris>
          ))}
        </Tabel>
      )}

      <Dialog
        terbuka={bukaTambah}
        onTutup={() => setBukaTambah(false)}
        judul="Tambah akun pengelola"
        keterangan="Akun ini akan punya akses penuh ke stok, pesanan, dan pembukuan toko."
      >
        <form onSubmit={tambahPengelola} className="space-y-4">
          <Isian label="Nama pengguna" wajib>
            <Input required value={formTambah.username}
              onChange={(e) => setFormTambah({ ...formTambah, username: e.target.value })} />
          </Isian>
          <Isian label="Email" wajib>
            <Input type="email" required value={formTambah.email}
              onChange={(e) => setFormTambah({ ...formTambah, email: e.target.value })} />
          </Isian>
          <Isian label="Password" wajib hint="Minimal 6 karakter.">
            <Input type="password" required minLength={6} value={formTambah.password}
              onChange={(e) => setFormTambah({ ...formTambah, password: e.target.value })} />
          </Isian>
          <div className="flex gap-2">
            <Tombol type="submit" className="flex-1" disabled={sibuk}>Tambah pengelola</Tombol>
            <Tombol type="button" variant="halus" onClick={() => setBukaTambah(false)}>Batal</Tombol>
          </div>
        </form>
      </Dialog>

      <Dialog
        terbuka={!!aturUlang}
        onTutup={() => setAturUlang(null)}
        judul="Atur ulang password"
        keterangan={aturUlang ? `Untuk akun ${aturUlang.username}` : ""}
      >
        <form onSubmit={simpanPasswordBaru} className="space-y-4">
          <Isian label="Password baru" wajib hint="Minimal 6 karakter. Sampaikan langsung ke pemilik akun.">
            <Input type="password" required minLength={6} value={passwordBaru}
              onChange={(e) => setPasswordBaru(e.target.value)} />
          </Isian>
          <div className="flex gap-2">
            <Tombol type="submit" className="flex-1" disabled={sibuk}>Simpan password baru</Tombol>
            <Tombol type="button" variant="halus" onClick={() => setAturUlang(null)}>Batal</Tombol>
          </div>
        </form>
      </Dialog>
    </AdminLayout>
  );
}
