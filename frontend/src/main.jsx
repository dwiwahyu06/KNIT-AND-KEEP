import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import App from "./App.jsx";
import "./index.css";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import SelectRole from "./pages/SelectRole.jsx";
import RegisterPelanggan from "./pages/RegisterPelanggan.jsx";
import LoginPelanggan from "./pages/LoginPelanggan.jsx";
import Dashboard_pelanggan from "./pages/Dashboard_pelanggan.jsx";
import Profile from "./pages/Profile.jsx";
import AddressForm from "./pages/AddressForm.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import Inventory from "./pages/Inventory.jsx";
import InventoryTable from "./pages/InventoryTable.jsx";
import ProductListPage from "./pages/ProductListPage.jsx";
import AddressListPage from "./pages/AddressListPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import AdminOrdersPage from "./pages/AdminOrdersPage.jsx";
import UserOrdersPage from "./pages/UserOrdersPage.jsx";
import OrdersPage from "./pages/orders.jsx";
import TransaksiPage from "./pages/Transaksi.jsx";
import AdminOrderDetailPage from "./pages/AdminOrderDetailPage.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/SelectRole",
        element: <SelectRole />,
      },
      {
        path: "/Registrasi",
        element: <Register />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/RegisterPelanggan",
        element: <RegisterPelanggan />,
      },
       {
        path: "/LoginPelanggan",
        element: <LoginPelanggan />,
      },
      {
        path: "/Dashboard_pelanggan",
        element: <Dashboard_pelanggan />,
      },
      {
        path: "/Profile",
        element: <Profile />,
      },
      {
        path: "/AddressForm",
        element: <AddressForm />,
      },
      {
        path: "/AdminOrdersPage",
        element: <AdminOrdersPage />,
      },
      {
        path: "/AdminOrderDetailPage",
        element: <AdminOrderDetailPage />,
      },
      {
        path: "/UserOrdersPage",
        element: <UserOrdersPage />,
      },
      {
        path: "/CheckoutPage",
        element: <CheckoutPage />,
      },
      {
        path: "/ProductsPage",
        element: <ProductPage />,
      },
      {
        path: "/Inventory",
        element: <Inventory />,
      },
      {
        path: "/InventoryTable",
        element: <InventoryTable />,
      },
      {
        path: "/ProductListPage",
        element: <ProductListPage />,
      },
      {
        path: "/Orders",
        element: <OrdersPage />,
      },
      {
        path: "/Transaksi",
        element: <TransaksiPage />,
      },
      {
        path: "/Dashboard",
        element: <Dashboard />,
      },
      {
        path: "/products",
        element: <ProductListPage />,
      },
      {
        path: "/alamat-form",
        element: <AddressForm />,
      },
      {
        path: "/AddressListPage",
        element: <AddressListPage />,
      },
      {
        path: "/alamat-form/:addressId",
        element: <AddressForm />,
      },
      {
        path: "CartPage",
        element: <CartPage />,
      }
      
    ],
  },
]);

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
} else {
  console.error("Root element not found");
}
