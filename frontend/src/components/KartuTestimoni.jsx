import React from "react";
import { Bintang } from "./Bintang";
import { urlBerkas } from "../lib/api";
import { tanggal } from "../lib/format";

/**
 * Satu testimoni pelanggan.
 *
 * Dipakai halaman depan dan halaman detail barang, jadi bentuknya ditulis
 * sekali di sini. Nama penulis sudah tersamar dari server — testimoni tampil
 * di halaman yang bisa dibuka siapa saja.
 */
export default function KartuTestimoni({ testimoni, denganBarang = true }) {
  const t = testimoni;
  const barang = (t.barang || []).filter(Boolean);

  return (
    <figure className="flex h-full flex-col rounded-xl border border-sand-200 bg-white p-5">
      <Bintang nilai={t.rating} ukuran="sm" />

      {t.ulasan ? (
        <blockquote className="mt-3 flex-1 whitespace-pre-line text-sm leading-relaxed text-sand-700">
          “{t.ulasan}”
        </blockquote>
      ) : (
        <p className="mt-3 flex-1 text-sm italic text-sand-400">
          Memberi bintang tanpa menulis ulasan.
        </p>
      )}

      {t.balasanAdmin && (
        <div className="mt-3 rounded-lg bg-sand-100 px-3 py-2.5">
          <p className="label-mono text-sand-400">Balasan toko</p>
          <p className="mt-1 text-sm text-sand-600">{t.balasanAdmin}</p>
        </div>
      )}

      <figcaption className="mt-4 flex items-center gap-3 border-t border-sand-100 pt-3">
        {denganBarang && t.gambar && (
          <img
            src={urlBerkas(t.gambar)}
            alt=""
            className="h-9 w-9 shrink-0 rounded object-cover"
            loading="lazy"
          />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sand-700">{t.namaPelanggan}</p>
          <p className="truncate text-xs text-sand-400">
            {tanggal(t.createdAt)}
            {denganBarang && barang.length > 0 && ` · ${barang.join(", ")}`}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}
