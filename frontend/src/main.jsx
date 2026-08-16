import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import "./index.css";

import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { pasangPenangkapSesi } from "./lib/api";
import { keluar } from "./lib/session";

// --- Umum ---
import Home from "./pages/Home.jsx";
import SelectRole from "./pages/SelectRole.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import LoginPelanggan from "./pages/LoginPelanggan.jsx";
import RegisterPelanggan from "./pages/RegisterPelanggan.jsx";

// --- Admin ---
import Dashboard from "./pages/Dashboard.jsx";
import AdminOrdersPage from "./pages/AdminOrdersPage.jsx";
import AdminOrderDetailPage from "./pages/AdminOrderDetailPage.jsx";
import Kasir from "./pages/Kasir.jsx";
import AdminRetur from "./pages/AdminRetur.jsx";
import Barang from "./pages/Barang.jsx";
import Stock from "./pages/Stock.jsx";
import KartuStok from "./pages/KartuStok.jsx";
import Keuangan from "./pages/Keuangan.jsx";
import Expenses from "./pages/Expenses.jsx";
import CashFlow from "./pages/CashFlow.jsx";
import IncomeStatement from "./pages/IncomeStatement.jsx";
import IncomeStatementDetailed from "./pages/IncomeStatementDetailed.jsx";
import MonthlyReport from "./pages/MonthlyReport.jsx";
import Analisis from "./pages/Analisis.jsx";
import User from "./pages/User.jsx";

// --- Pelanggan ---
import DashboardPelanggan from "./pages/Dashboard_pelanggan.jsx";
import ProductListPage from "./pages/ProductListPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import SuccessPage from "./pages/SuccessPage.jsx";
import Transaksi from "./pages/Transaksi.jsx";
import AddressListPage from "./pages/AddressListPage.jsx";
import AddressForm from "./pages/AddressForm.jsx";
import Profile from "./pages/Profile.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import TidakDitemukan from "./pages/TidakDitemukan.jsx";

const admin = (el) => <ProtectedRoute peran="admin">{el}</ProtectedRoute>;
const pelanggan = (el) => <ProtectedRoute peran="pelanggan">{el}</ProtectedRoute>;

const router = createBrowserRouter([
  // --- Halaman terbuka ---
  { path: "/", element: <Home /> },
  { path: "/SelectRole", element: <SelectRole /> },
  { path: "/login", element: <Login /> },
  // Pendaftaran pengelola bukan halaman umum. Backend hanya menerimanya saat
  // toko benar-benar masih kosong, atau bila dikirim oleh admin yang sudah masuk
  // lewat halaman Akun.
  { path: "/Registrasi", element: <Register /> },
  { path: "/LoginPelanggan", element: <LoginPelanggan /> },
  { path: "/RegisterPelanggan", element: <RegisterPelanggan /> },
  { path: "/products", element: <ProductListPage /> },
  { path: "/produk/:id", element: <ProductDetail /> },
  { path: "/ProductListPage", element: <Navigate to="/products" replace /> },

  // --- Admin ---
  { path: "/Dashboard", element: admin(<Dashboard />) },
  { path: "/AdminOrdersPage", element: admin(<AdminOrdersPage />) },
  { path: "/AdminOrderDetailPage/:orderId", element: admin(<AdminOrderDetailPage />) },
  { path: "/Kasir", element: admin(<Kasir />) },
  { path: "/AdminRetur", element: admin(<AdminRetur />) },
  { path: "/Barang", element: admin(<Barang />) },
  { path: "/Stock", element: admin(<Stock />) },
  { path: "/KartuStok", element: admin(<KartuStok />) },
  { path: "/Keuangan", element: admin(<Keuangan />) },
  { path: "/Expenses", element: admin(<Expenses />) },
  { path: "/CashFlow", element: admin(<CashFlow />) },
  { path: "/IncomeStatement", element: admin(<IncomeStatement />) },
  { path: "/IncomeStatementDetailed", element: admin(<IncomeStatementDetailed />) },
  { path: "/MonthlyReport", element: admin(<MonthlyReport />) },
  { path: "/Analisis", element: admin(<Analisis />) },
  { path: "/User", element: admin(<User />) },
  // Menu lama yang sekarang menyatu ke Katalog Produk.
  { path: "/Inventory", element: <Navigate to="/Barang" replace /> },
  { path: "/InventoryTable", element: <Navigate to="/Barang" replace /> },
  { path: "/ProductsPage", element: <Navigate to="/Barang" replace /> },

  // --- Pelanggan ---
  { path: "/Dashboard_pelanggan", element: pelanggan(<DashboardPelanggan />) },
  { path: "/CartPage", element: pelanggan(<CartPage />) },
  { path: "/CheckoutPage", element: pelanggan(<CheckoutPage />) },
  { path: "/SuccessPage", element: pelanggan(<SuccessPage />) },
  { path: "/Transaksi", element: pelanggan(<Transaksi />) },
  { path: "/AddressListPage", element: pelanggan(<AddressListPage />) },
  { path: "/AddressForm", element: pelanggan(<AddressForm />) },
  { path: "/alamat-form", element: pelanggan(<AddressForm />) },
  { path: "/alamat-form/:addressId", element: pelanggan(<AddressForm />) },
  { path: "/Profile", element: pelanggan(<Profile />) },

  { path: "*", element: <TidakDitemukan /> },
]);

// Saat server menyatakan sesi sudah berakhir, bersihkan data sesi lalu antar
// pengguna ke halaman masuk yang sesuai — bukan membiarkannya menatap halaman
// yang gagal memuat data.
pasangPenangkapSesi(() => {
  const diHalamanAdmin = window.location.pathname.match(
    /^\/(Dashboard|AdminOrdersPage|AdminOrderDetailPage|Kasir|AdminRetur|Barang|Stock|KartuStok|Keuangan|Expenses|CashFlow|IncomeStatement|MonthlyReport|User)/i
  );
  keluar();
  window.location.href = diHalamanAdmin ? "/login" : "/LoginPelanggan";
});

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error("Elemen root tidak ditemukan");
}
