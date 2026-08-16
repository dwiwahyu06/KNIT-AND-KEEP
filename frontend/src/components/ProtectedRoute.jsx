import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { adminSaatIni, pelangganId } from "../lib/session";

/**
 * Penjaga akses halaman.
 *
 * Sebelumnya route admin bisa dibuka siapa saja yang tahu alamatnya, karena
 * tidak ada pemeriksaan sama sekali di sisi frontend.
 */
export default function ProtectedRoute({ peran, children }) {
  const lokasi = useLocation();

  if (peran === "admin") {
    const admin = adminSaatIni();
    if (!admin || String(admin.role).toUpperCase() !== "ADMIN") {
      return <Navigate to="/login" state={{ dari: lokasi.pathname }} replace />;
    }
  }

  if (peran === "pelanggan" && !pelangganId()) {
    return (
      <Navigate to="/LoginPelanggan" state={{ dari: lokasi.pathname }} replace />
    );
  }

  return children;
}
