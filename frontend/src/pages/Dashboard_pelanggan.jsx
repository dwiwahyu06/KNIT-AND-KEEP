// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { FaBars, FaTimes, FaTshirt } from "react-icons/fa";

// // Data untuk kartu fitur agar lebih mudah dikelola
// const featureCards = [
//   { title: "Produk Baru", icon: <FaTshirt size={60} />, path: "/products?sort=newest" },
// ];

// export default function DashboardPelanggan() {
//   const navigate = useNavigate();
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   const handleMenuClick = (path) => {
//     if (path) navigate(path);
//     setSidebarOpen(false); // tutup sidebar setelah klik menu
//   };

//   return (
//     <div className="min-h-screen bg-[#183D4B] text-white relative">
//       {/* Navbar */}
//       <nav className="bg-[#183D4B]/80 backdrop-blur-lg text-white px-6 py-4 flex justify-between items-center shadow-md sticky top-0 z-30 border-b border-white/10">
//         <div className="flex items-center space-x-4">
//           <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-full hover:bg-white/10 transition">
//             {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
//           </button>
//           <h1 className="text-xl font-bold tracking-wider">Knit & Keep</h1>
//         </div>
//         <button
//           className="bg-white/10 text-white px-4 py-2 rounded-lg font-semibold transition hover:bg-white/20"
//           onClick={() => navigate("/")} // Asumsi halaman login ada di root
//         >
//           Logout
//         </button>
//       </nav>

//       {/* Sidebar */}
//       {sidebarOpen && (
//         <>
//           <div
//             className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
//             onClick={() => setSidebarOpen(false)}
//           ></div>

//           <div className="fixed top-0 left-0 w-64 h-full bg-[#2a5a6e]/80 backdrop-blur-xl shadow-2xl p-6 space-y-4 z-50 animate-slide-in">
//             <h2 className="text-2xl font-bold text-white">Menu</h2>
//             <ul className="space-y-3 pt-4">
//               <li className="cursor-pointer hover:text-white text-slate-200 transition" onClick={() => handleMenuClick("/profile")}>
//                 Profil
//               </li>
//               <li className="cursor-pointer hover:text-white text-slate-200 transition" onClick={() => handleMenuClick("/AddressListpage")}>
//                 Alamat
//               </li>
//               <li className="cursor-pointer hover:text-white text-slate-200 transition" onClick={() => handleMenuClick("/Transaksi")}>
//                Transaksi
//               </li>
//               <li className="cursor-pointer hover:text-white text-slate-200 transition" onClick={() => handleMenuClick("/CartPage")}>
//                 Keranjang
//               </li>
              
//             </ul>
//           </div>
//         </>
//       )}

//       {/* Konten utama */}
//       <div className={`transition-all duration-300 ${sidebarOpen ? "blur-sm" : "blur-0"}`}>
//         {/* Hero Section */}
//         <div className="text-center py-20 px-6">
//           <h2 className="text-4xl font-bold">Selamat Datang di Dashboard</h2>
//           <p className="mt-3 text-lg text-slate-300 max-w-2xl mx-auto">Temukan pakaian thrift berkualitas pilihan yang dikurasi khusus untuk gaya Anda.</p>
//         </div>

//         {/* Layout Kotak-Kotak Fitur */}
//         <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
//           {featureCards.map((item) => (
//             <div
//               key={item.title}
//               className="bg-white/10 rounded-2xl shadow-lg p-6 text-center cursor-pointer transform hover:-translate-y-2 transition-transform duration-300"
//               onClick={() => handleMenuClick(item.path)}
//             >
//               <div className="flex justify-center items-center text-white mb-3">
//                 {item.icon}
//               </div>
//               <h3 className="text-xl font-bold text-white">{item.title}</h3>
//               <p className="text-slate-400 mt-2 text-sm">Lihat {item.title}</p>
//             </div>
//           ))}
//         </div>

//         {/* Katalog Produk (menggunakan data dari API, sama seperti ProductListPage) */}
//         {/* Disarankan untuk membuat komponen ProductList terpisah agar bisa digunakan di banyak tempat */}
//         <div className="p-6 mt-6">
//             <h3 className="text-3xl font-bold text-white mb-6">Produk Pilihan</h3>
//             {/* Di sini Anda akan me-render komponen ProductList atau melakukan fetch data */}
//             <p className="text-slate-300">Bagian ini akan menampilkan produk dari API, sama seperti halaman utama Toko.</p>
//         </div>
//       </div>
//     </div>
//   );
// };


import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaTshirt, FaArrowRight } from "react-icons/fa";

// Data untuk kartu fitur agar lebih mudah dikelola
const featureCards = [
  { title: "Produk Baru", icon: <FaTshirt size={60} />, path: "/products?sort=newest" },
  // Anda bisa menambahkan kartu fitur lain di sini
];

// --- DATA DUMMY UNTUK KATALOG PRODUK ---
const dummyProducts = [
    { 
        id: 1, 
        name: "Vintage Crewneck", 
        category: "LIMITED EDITION", 
        imageUrl: "https://i.pinimg.com/736x/5c/62/f2/5c62f2cc626672256e16e161798aacf1.jpg",
        description: "Crewneck gaya 90-an dengan bahan premium, cocok untuk tampilan kasual yang tak lekang oleh waktu."
    },
    { 
        id: 2, 
        name: "FLORAL BLOUSE", 
        imageUrl: "https://i.pinimg.com/736x/37/84/6d/37846daef8ac75dec3767b1a6a743995.jpg",
    },
    { 
        id: 3, 
        name: "DENIM JACKET", 
        imageUrl: "https://i.pinimg.com/1200x/0e/71/60/0e71608ce4dc6e2addd9535a77a27db0.jpg",
    },
    { 
        id: 4, 
        name: "PLAID SHIRT", 
        imageUrl: "https://i.pinimg.com/1200x/dc/68/87/dc688771da588896dcb03be4cc48c766.jpg",
    },
    { 
        id: 5, 
        name: "GRAPHIC TEE", 
        imageUrl: "https://i.pinimg.com/1200x/30/28/fb/3028fb4d5ebc52452b9b72d89e04dc72.jpg",
    },
];

// --- KOMPONEN BARU UNTUK KATALOG PRODUK ---
const ProductCatalog = () => {
    const navigate = useNavigate();
    const mainProduct = dummyProducts[0];
    const otherProducts = dummyProducts.slice(1);

    return (
        <div className="bg-white/5 p-6 rounded-3xl shadow-lg border border-white/10">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Kartu Produk Utama (Besar) */}
                <div className="md:w-1/2 flex-shrink-0 group cursor-pointer" onClick={() => navigate(`/products/${mainProduct.id}`)}>
                    <div className="bg-white/10 rounded-2xl p-4 h-full flex flex-col justify-between border border-white/20 shadow-inner">
                        <img 
                            src={mainProduct.imageUrl} 
                            alt={mainProduct.name}
                            className="w-full h-auto object-cover rounded-xl mb-4"
                        />
                        <div>
                            <p className="text-xs text-emerald-400 font-bold tracking-widest">{mainProduct.category}</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{mainProduct.name}</h3>
                        </div>
                    </div>
                </div>
                
                {/* Grid Produk Lainnya (Kecil) */}
                <div className="grid grid-cols-2 gap-4 md:w-1/2">
                    {otherProducts.map(product => (
                         <div key={product.id} className="bg-white/10 rounded-2xl p-3 flex flex-col justify-between cursor-pointer group transform hover:scale-105 transition-transform" onClick={() => navigate(`/products/${product.id}`)}>
                            <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="w-full h-auto object-cover rounded-lg mb-3"
                            />
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-white">{product.name}</h4>
                                <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-400 transform group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                    <FaArrowRight size={12} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Bagian Deskripsi dan Order */}
            <div className="mt-6 flex flex-col md:flex-row gap-6 items-start">
                 <div className="bg-white/10 rounded-2xl p-6 md:w-2/3">
                    <p className="text-slate-300">
                        "{mainProduct.description}"
                    </p>
                    <button onClick={() => navigate(`/products/${mainProduct.id}`)} className="mt-4 bg-white text-[#183D4B] font-bold py-2 px-5 rounded-lg transition hover:bg-slate-200">
                        Lihat Detail
                    </button>
                 </div>
                 <div className="bg-white/10 rounded-2xl p-6 md:w-1/3 text-center">
                    <h4 className="font-bold text-lg">SPESIFIKASI</h4>
                     <ul className="text-left mt-3 space-y-2 text-sm text-slate-300">
                        <li className="flex items-center gap-2">✨ Kualitas Terjamin</li>
                        <li className="flex items-center gap-2"> thrift original</li>
                        <li className="flex items-center gap-2">👕 Ukuran All Size</li>
                     </ul>
                 </div>
            </div>
        </div>
    )
}


export default function DashboardPelanggan() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuClick = (path) => {
    if (path) navigate(path);
    setSidebarOpen(false); // tutup sidebar setelah klik menu
  };

  return (
    <div className="min-h-screen bg-[#183D4B] text-white relative">
      {/* Navbar */}
      <nav className="bg-[#183D4B]/80 backdrop-blur-lg text-white px-6 py-4 flex justify-between items-center shadow-md sticky top-0 z-30 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-full hover:bg-white/10 transition">
            {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
          <h1 className="text-xl font-bold tracking-wider">Knit & Keep</h1>
        </div>
        <button
          className="bg-white/10 text-white px-4 py-2 rounded-lg font-semibold transition hover:bg-white/20"
          onClick={() => navigate("/")} // Asumsi halaman login ada di root
        >
          Logout
        </button>
      </nav>

      {/* Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          ></div>

          <div className="fixed top-0 left-0 w-64 h-full bg-[#2a5a6e]/80 backdrop-blur-xl shadow-2xl p-6 space-y-4 z-50 animate-slide-in">
            <h2 className="text-2xl font-bold text-white">Menu</h2>
            <ul className="space-y-3 pt-4">
              <li className="cursor-pointer hover:text-white text-slate-200 transition" onClick={() => handleMenuClick("/profile")}>
                Profil
              </li>
              <li className="cursor-pointer hover:text-white text-slate-200 transition" onClick={() => handleMenuClick("/AddressListPage")}>
                Alamat
              </li>
              <li className="cursor-pointer hover:text-white text-slate-200 transition" onClick={() => handleMenuClick("/Transaksi")}>
                Transaksi
              </li>
              <li className="cursor-pointer hover:text-white text-slate-200 transition" onClick={() => handleMenuClick("/CartPage")}>
                Keranjang
              </li>
              
            </ul>
          </div>
        </>
      )}

      {/* Konten utama */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "blur-sm" : "blur-0"}`}>
        {/* Hero Section */}
        <div className="text-center py-20 px-6">
          <h2 className="text-4xl font-bold">Selamat Datang di Dashboard</h2>
          <p className="mt-3 text-lg text-slate-300 max-w-2xl mx-auto">Temukan pakaian thrift berkualitas pilihan yang dikurasi khusus untuk gaya Anda.</p>
        </div>

        {/* Layout Kotak-Kotak Fitur */}
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {featureCards.map((item) => (
            <div
              key={item.title}
              className="bg-white/10 rounded-2xl shadow-lg p-6 text-center cursor-pointer transform hover:-translate-y-2 transition-transform duration-300"
              onClick={() => handleMenuClick(item.path)}
            >
              <div className="flex justify-center items-center text-white mb-3">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-white">{item.title}</h3>
              <p className="text-slate-400 mt-2 text-sm">Lihat {item.title}</p>
            </div>
          ))}
        </div>

        {/* --- BAGIAN KATALOG PRODUK YANG DIPERBARUI --- */}
        <div className="p-6 mt-6">
            <h3 className="text-3xl font-bold text-white mb-6">Produk Pilihan</h3>
            <ProductCatalog />
        </div>
      </div>
    </div>
  );
};
