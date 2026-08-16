import React from "react";
import { Link, useLocation } from "react-router-dom";
import ShopLayout from "../components/ShopLayout";
import { Kartu, Tombol } from "../components/ui";
import { rupiah } from "../lib/format";

export default function SuccessPage() {
  const { state } = useLocation();

  return (
    <ShopLayout lebar="max-w-2xl">
      <Kartu className="text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-leaf-100 text-2xl text-leaf-500">
          ✓
        </span>
        <h1 className="display text-2xl font-bold text-sand-800">Pesanan diterima</h1>
        <p className="mt-2 text-sand-500">
          Terima kasih. Pesanan Anda sedang disiapkan dan akan segera dikirim.
        </p>

        {(state?.orderId || state?.amount) && (
          <div className="mt-6 space-y-1.5 rounded-lg bg-sand-100 px-4 py-3 text-sm">
            {state.orderId && (
              <div className="flex justify-between">
                <span className="text-sand-500">Nomor pesanan</span>
                <span className="font-mono font-semibold text-sand-800">{state.orderId}</span>
              </div>
            )}
            {state.amount && (
              <div className="flex justify-between">
                <span className="text-sand-500">Total dibayar</span>
                <span className="tabular font-semibold text-sand-800">{rupiah(state.amount)}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/Transaksi"><Tombol>Lacak pesanan</Tombol></Link>
          <Link to="/products"><Tombol variant="garis">Lanjut belanja</Tombol></Link>
        </div>
      </Kartu>
    </ShopLayout>
  );
}
