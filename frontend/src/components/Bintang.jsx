import React, { useState } from "react";

/**
 * Bintang penilaian, dalam dua bentuk: yang hanya dibaca dan yang bisa dipilih.
 */

const UKURAN = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
};

/** Menampilkan nilai bintang, boleh pecahan seperti 4,6. */
export function Bintang({ nilai = 0, ukuran = "md", className = "" }) {
  const angka = Number(nilai) || 0;
  const bulat = Math.round(angka);
  return (
    <span
      className={`inline-flex items-center gap-0.5 leading-none ${UKURAN[ukuran]} ${className}`}
      role="img"
      aria-label={`${angka} dari 5 bintang`}
    >
      {[1, 2, 3, 4, 5].map((b) => (
        <span key={b} className={b <= bulat ? "text-wool-400" : "text-sand-300"} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

const ARTI = {
  1: "Mengecewakan",
  2: "Kurang",
  3: "Cukup",
  4: "Bagus",
  5: "Sangat memuaskan",
};

/**
 * Bintang yang bisa dipilih.
 *
 * Artinya ditulis di sebelah bintang karena "4 bintang" tidak sama maknanya
 * bagi setiap orang, dan penilaian yang salah tafsir tidak bisa dibaca ulang
 * oleh toko sebagai masukan.
 */
export function PilihBintang({ nilai = 0, onPilih }) {
  const [sorot, setSorot] = useState(0);
  const tampak = sorot || nilai;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1" onMouseLeave={() => setSorot(0)}>
        {[1, 2, 3, 4, 5].map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => onPilih(b)}
            onMouseEnter={() => setSorot(b)}
            aria-label={`${b} bintang — ${ARTI[b]}`}
            aria-pressed={nilai === b}
            className={`text-3xl leading-none transition ${
              b <= tampak ? "text-wool-400" : "text-sand-300 hover:text-wool-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <span className="text-sm font-medium text-sand-500">
        {tampak ? ARTI[tampak] : "Pilih bintangnya"}
      </span>
    </div>
  );
}

export default Bintang;
