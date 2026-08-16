import React from "react";

/**
 * Penangkap galat tampilan.
 *
 * Tanpa ini, satu kesalahan saat menggambar halaman membuat seluruh layar
 * kosong tanpa penjelasan apa pun — pengguna tidak tahu harus berbuat apa.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { galat: null };
  }

  static getDerivedStateFromError(galat) {
    return { galat };
  }

  componentDidCatch(galat, info) {
    console.error("Galat tampilan:", galat, info);
  }

  render() {
    if (!this.state.galat) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50 px-6">
        <div className="w-full max-w-md rounded-xl border border-sand-200 bg-white p-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rust-100 text-xl text-rust-500">
            !
          </span>
          <h1 className="display text-lg font-bold text-sand-800">
            Halaman ini gagal ditampilkan
          </h1>
          <p className="mt-2 text-sm text-sand-500">
            Ada yang tidak beres saat menggambar halaman. Data Anda aman —
            coba muat ulang, atau kembali ke beranda.
          </p>

          <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-sand-100 p-3 text-left text-xs text-sand-600">
            {String(this.state.galat?.message || this.state.galat)}
          </pre>

          <div className="mt-5 flex justify-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Muat ulang
            </button>
            <a
              href="/"
              className="rounded-lg border border-sand-300 px-4 py-2 text-sm font-semibold text-sand-700 transition hover:border-brand-400"
            >
              Ke beranda
            </a>
          </div>
        </div>
      </div>
    );
  }
}
