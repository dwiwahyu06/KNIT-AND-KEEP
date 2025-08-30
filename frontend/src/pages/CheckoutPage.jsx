// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';

// function formatIDR(value) {
//     const n = Number(value || 0);
//     return new Intl.NumberFormat("id-ID", {
//         style: "currency",
//         currency: "IDR",
//         maximumFractionDigits: 0,
//     }).format(isNaN(n) ? 0 : n);
// }

// const API_BASE_URL = 'http://localhost:8080/api';

// const ID_KECAMATAN_ASAL = '4835';

// export default function CheckoutPage() {
//     const navigate = useNavigate();
//     const [itemsToCheckout, setItemsToCheckout] = useState([]);
//     const [selectedAddress, setSelectedAddress] = useState(null);
//     const [loading, setLoading] = useState(true);
    
//     const loggedInUserId = localStorage.getItem('loggedInUserId');

//     const [shippingOptions, setShippingOptions] = useState([]);
//     const [selectedShipping, setSelectedShipping] = useState(null);
//     const [shippingCost, setShippingCost] = useState(0);
//     const [loadingShipping, setLoadingShipping] = useState(false);

//     useEffect(() => {
//         if (!loggedInUserId) {
//             alert("Sesi tidak ditemukan, silakan login.");
//             navigate('/');
//             return;
//         }

//         const cartKey = `itemsToCheckout_${loggedInUserId}`;
//         const itemsJSON = localStorage.getItem(cartKey);
//         if (!itemsJSON || JSON.parse(itemsJSON).length === 0) {
//             alert("Tidak ada item yang dipilih untuk checkout.");
//             navigate('/CartPage');
//             return;
//         }
//         setItemsToCheckout(JSON.parse(itemsJSON));

//         const addressKey = `selectedAddress_${loggedInUserId}`;
//         const addressJSON = localStorage.getItem(addressKey);
//         if (!addressJSON) {
//             // Jika pengguna langsung ke checkout tanpa memilih alamat,
//             // arahkan mereka ke halaman pilih alamat.
//             navigate('/AddressForm');
//             return;
//         }
//         setSelectedAddress(JSON.parse(addressJSON));
        
//         setLoading(false);

//     }, [loggedInUserId, navigate]);
//      useEffect(() => {
//         if (selectedAddress && itemsToCheckout.length > 0) {
//             const calculateOngkir = async () => {
//                 setLoadingShipping(true);
//                 setShippingOptions([]);
//                 setSelectedShipping(null);
//                 setShippingCost(0);
                
//                 const originCityId = '152'; // Ganti dengan ID kota asal toko Anda (Contoh: Kota Bandung)
//                 const destinationCityId = selectedAddress.cityId;
                
//                 const totalWeight = itemsToCheckout.reduce((total, item) => total + (item.product.weight || 100) * item.quantity, 0);
                
//                 if (totalWeight > 0 && destinationCityId) {
//                     try {
//                         const payload = { origin: originCityId, destination: destinationCityId, weight: totalWeight, courier: "jne" };
//                         const res = await fetch(`${API_BASE_URL}/shipping/cost`, {
//                             method: 'POST',
//                             headers: { 'Content-Type': 'application/json' },
//                             body: JSON.stringify(payload)
//                         });
//                         const data = await res.json();
//                         if (res.ok) {
//                             setShippingOptions(data);
//                         } else {
//                             throw new Error(data.error || "Gagal mengambil ongkir");
//                         }
//                     } catch (err) {
//                         console.error("Gagal mengambil ongkir:", err);
//                         alert(err.message);
//                     } finally {
//                         setLoadingShipping(false);
//                     }
//                 } else {
//                     setLoadingShipping(false);
//                 }
//             };
//             calculateOngkir();
//         }
//     }, [selectedAddress, itemsToCheckout]);
    
//     const calculateTotal = () => {
//         const subtotal = itemsToCheckout.reduce((total, item) => total + (item.product.sellPrice * item.quantity), 0);
//         return subtotal + shippingCost;
//     };

//     const handleSelectShipping = (option) => {
//         setSelectedShipping(option);
//         setShippingCost(option.cost);
//     };

//     const handlePayment = async () => {
//         if (!selectedAddress) {
//             alert("Alamat pengiriman tidak valid.");
//             return;
//         }
//         const totalAmount = calculateTotal();
//         try {
//             const response = await fetch(`${API_BASE_URL}/payments/create-transaction`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ 
//                     amount: totalAmount,
//                     pelangganId: loggedInUserId 
//                 }),
//             });
            
//             if (!response.ok) {
//                 const errorData = await response.json().catch(() => ({}));
//                 throw new Error(errorData.error || "Gagal membuat transaksi di backend.");
//             }

//             const data = await response.json();
//             const { token } = data;
//             if (!token) {
//                 alert('Gagal mendapatkan token pembayaran.');
//                 return;
//             }

//             window.snap.pay(token, {
//                 onSuccess: (result) => {
//                     console.log('SUCCESS', result);
//                     alert('Pembayaran Berhasil!');
//                     const cartKey = `itemsToCheckout_${loggedInUserId}`;
//                     const addressKey = `selectedAddress_${loggedInUserId}`;
//                     localStorage.removeItem(cartKey);
//                     localStorage.removeItem(addressKey);
//                     navigate('/Transaksi'); 
//                 },
//                 onPending: (result) => {
//                     console.log('PENDING', result);
//                     alert('Menunggu pembayaran Anda...');
//                     const cartKey = `itemsToCheckout_${loggedInUserId}`;
//                     const addressKey = `selectedAddress_${loggedInUserId}`;
//                     localStorage.removeItem(cartKey);
//                     localStorage.removeItem(addressKey);
//                     navigate('/CartPage'); 
//                 },
//                 onError: (result) => {
//                     console.log('ERROR', result);
//                     alert('Pembayaran Gagal!');
//                 },
//                 onClose: () => {
//                     console.log('Anda menutup pop-up pembayaran.');
//                 }
//             });
//         } catch (error) {
//             console.error('Error saat proses pembayaran:', error);
//             alert('Terjadi kesalahan: ' + error.message);
//         }
//     };

//     if (loading) return <div className="min-h-screen bg-[#183D4B] text-white flex justify-center items-center">Mempersiapkan Checkout...</div>;

//     return (
//         <div className="min-h-screen bg-[#183D4B] p-10 text-white flex justify-center items-center">
//             <div className="w-full max-w-lg bg-white/10 p-8 rounded-2xl shadow-2xl">
//                 <h1 className="text-3xl font-bold mb-6">Ringkasan Checkout</h1>
                
//                 <div className="space-y-2 max-h-48 overflow-y-auto pr-2 mb-4 border-b border-white/20 pb-4">
//                     <h2 className="font-semibold text-lg mb-2">Produk yang Dipesan</h2>
//                     {itemsToCheckout.map(item => (
//                         <div key={item.id} className="flex justify-between text-slate-300">
//                             <span>{item.product.name} (x{item.quantity})</span>
//                             <span>{formatIDR(item.product.sellPrice * item.quantity)}</span>
//                         </div>
//                     ))}
//                 </div>
                
//                 <div className="my-6">
//                     <h2 className="block font-semibold mb-2 text-lg">Alamat Pengiriman</h2>
//                     {selectedAddress ? (
//                         <div className="bg-white/20 p-4 rounded-lg border border-white/30 text-white">
//                             <p className="font-bold">{selectedAddress.detailAlamat}</p>
//                             <p className="text-sm text-slate-300">{selectedAddress.kelurahan}, {selectedAddress.kecamatan}</p>
//                             <p className="text-sm text-slate-300">{selectedAddress.kabupaten}, {selectedAddress.provinsi}</p>
//                         </div>
//                     ) : (
//                         <p className="text-slate-400">Memuat alamat...</p>
//                     )}
//                 </div>

//                 <div className="my-6">
//                     <h2 className="block font-semibold mb-2 text-lg">Opsi Pengiriman</h2>
//                     {loadingShipping ? <p className="text-slate-300">Menghitung ongkir...</p> : (
//                         <div className="space-y-2">
//                             {shippingOptions.map(opt => (
//                                 <div key={opt.service} onClick={() => handleSelectShipping(opt)} className={`p-3 rounded-lg border cursor-pointer transition ${selectedShipping?.service === opt.service ? 'bg-emerald-500/30 border-emerald-400' : 'bg-white/10 border-white/30'}`}>
//                                     <p className="font-bold">{`JNE ${opt.service}`} ({formatIDR(opt.cost)})</p>
//                                     <p className="text-sm text-slate-300">Estimasi Tiba: {opt.etd} hari</p>
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </div>

                

//                 <div className="text-left my-6 space-y-2 border-t border-white/20 pt-4">
//                     <p className="flex justify-between text-lg">
//                         <span className="font-bold">Subtotal:</span> 
//                         <span className="font-bold">{formatIDR(itemsToCheckout.reduce((total, item) => total + (item.product.sellPrice * item.quantity), 0))}</span>
//                     </p>
//                     <p className="flex justify-between text-lg">
//                         <span className="font-bold">Ongkos Kirim:</span> 
//                         <span className="font-bold">{formatIDR(shippingCost)}</span>
//                     </p>
//                     <p className="flex justify-between mt-2 text-xl">
//                         <span className="font-bold">Total Bayar:</span> 
//                         <span className="font-bold">{formatIDR(calculateTotal())}</span>
//                     </p>
//                 </div>
                
//                 <button 
//                     onClick={handlePayment}
//                     className="w-full bg-white text-[#183D4B] font-bold py-3 px-6 rounded-lg transition hover:bg-slate-200"
//                     disabled={loadingShipping || !selectedShipping}
//                 >
//                     Bayar Sekarang
//                 </button>
//             </div>
//         </div>
//     );
// }

// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';

// function formatIDR(value) {
//     const n = Number(value || 0);
//     return new Intl.NumberFormat("id-ID", {
//         style: "currency",
//         currency: "IDR",
//         maximumFractionDigits: 0,
//     }).format(isNaN(n) ? 0 : n);
// }

// const API_BASE_URL = 'http://localhost:8080/api';

// // ID Tetap untuk lokasi asal pengiriman (Toko Anda)
// const ID_ASAL_TOKO = '4835';

// export default function CheckoutPage() {
//     const navigate = useNavigate();
//     const [itemsToCheckout, setItemsToCheckout] = useState([]);
//     const [selectedAddress, setSelectedAddress] = useState(null);
//     const [loading, setLoading] = useState(true);
    
//     const loggedInUserId = localStorage.getItem('loggedInUserId');

//     const [shippingOptions, setShippingOptions] = useState([]);
//     const [selectedShipping, setSelectedShipping] = useState(null);
//     const [shippingCost, setShippingCost] = useState(0);
//     const [loadingShipping, setLoadingShipping] = useState(false);

//     useEffect(() => {
//         if (!loggedInUserId) {
//             alert("Sesi tidak ditemukan, silakan login.");
//             navigate('/');
//             return;
//         }

//         const cartKey = `itemsToCheckout_${loggedInUserId}`;
//         const itemsJSON = localStorage.getItem(cartKey);
//         if (!itemsJSON || JSON.parse(itemsJSON).length === 0) {
//             alert("Tidak ada item yang dipilih untuk checkout.");
//             navigate('/CartPage');
//             return;
//         }
//         setItemsToCheckout(JSON.parse(itemsJSON));

//         const addressKey = `selectedAddress_${loggedInUserId}`;
//         const addressJSON = localStorage.getItem(addressKey);
//         if (!addressJSON) {
//             navigate('/AddressForm');
//             return;
//         }
//         setSelectedAddress(JSON.parse(addressJSON));
        
//         setLoading(false);

//     }, [loggedInUserId, navigate]);

//       useEffect(() => {
//         if (selectedAddress && itemsToCheckout.length > 0) {
//             const calculateOngkir = async () => {
//                 setLoadingShipping(true);
//                 setShippingOptions([]);
//                 setSelectedShipping(null);
//                 setShippingCost(0);
                
//                 // PASTIKAN OBJEK ALAMAT ANDA MEMILIKI FIELD `id` YANG MENYIMPAN ID TUJUAN DARI KOMERCE
//                 const destinationId = selectedAddress.id;
                
//                 if (!destinationId) {
//                     console.error("Alamat yang dipilih tidak memiliki ID tujuan.");
//                     alert("Alamat yang dipilih tidak memiliki ID tujuan. Harap perbarui alamat Anda.");
//                     setLoadingShipping(false);
//                     return;
//                 }

//                 const totalWeight = itemsToCheckout.reduce((total, item) => total + (item.product.weight || 100) * item.quantity, 0);
                
//                 if (totalWeight > 0) {
//                     try {
//                         // 1. Membuat payload untuk dikirim
//                         const payload = { 
//                             origin: ID_ASAL_TOKO, 
//                             destination: destinationId.toString(), 
//                             weight: totalWeight, 
//                             courier: "jne" 
//                         };

//                         // 2. Mengubah payload menjadi format form-urlencoded
//                         const formBody = new URLSearchParams(payload);

//                         // 3. Mengirim request dengan header & body yang benar ke backend Anda
//                         const res = await fetch(`${API_BASE_URL}/shipping/cost`, {
//                             method: 'POST',
//                             headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//                             body: formBody
//                         });

//                         if (!res.ok) {
//                             const errorData = await res.json().catch(() => ({ error: "Gagal memproses respons error dari server." }));
//                             throw new Error(errorData.error || `Gagal mengambil ongkir: Status ${res.status}`);
//                         }

//                         const data = await res.json();
//                         setShippingOptions(data);

//                     } catch (err) {
//                         console.error("Gagal mengambil ongkir:", err);
//                         alert(err.message);
//                     } finally {
//                         setLoadingShipping(false);
//                     }
//                 } else {
//                     setLoadingShipping(false);
//                 }
//             };
//             calculateOngkir();
//         }
//     }, [selectedAddress, itemsToCheckout]);
    
//     const calculateTotal = () => {
//         const subtotal = itemsToCheckout.reduce((total, item) => total + (item.product.sellPrice * item.quantity), 0);
//         return subtotal + shippingCost;
//     };

//     const handleSelectShipping = (option) => {
//         setSelectedShipping(option);
//         setShippingCost(option.cost);
//     };

//     const handlePayment = async () => {
//         if (!selectedAddress) {
//             alert("Alamat pengiriman tidak valid.");
//             return;
//         }
//         if (!selectedShipping) {
//             alert("Silakan pilih opsi pengiriman terlebih dahulu.");
//             return;
//         }
//         const totalAmount = calculateTotal();
//         try {
//             const response = await fetch(`${API_BASE_URL}/payments/create-transaction`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ 
//                     amount: totalAmount,
//                     pelangganId: loggedInUserId 
//                 }),
//             });
            
//             if (!response.ok) {
//                 const errorData = await response.json().catch(() => ({}));
//                 throw new Error(errorData.error || "Gagal membuat transaksi di backend.");
//             }

//             const data = await response.json();
//             const { token } = data;
//             if (!token) {
//                 alert('Gagal mendapatkan token pembayaran.');
//                 return;
//             }

//             window.snap.pay(token, {
//                 onSuccess: (result) => {
//                     console.log('SUCCESS', result);
//                     alert('Pembayaran Berhasil!');
//                     const cartKey = `itemsToCheckout_${loggedInUserId}`;
//                     const addressKey = `selectedAddress_${loggedInUserId}`;
//                     localStorage.removeItem(cartKey);
//                     localStorage.removeItem(addressKey);
//                     navigate('/Transaksi'); 
//                 },
//                 onPending: (result) => {
//                     console.log('PENDING', result);
//                     alert('Menunggu pembayaran Anda...');
//                     const cartKey = `itemsToCheckout_${loggedInUserId}`;
//                     const addressKey = `selectedAddress_${loggedInUserId}`;
//                     localStorage.removeItem(cartKey);
//                     localStorage.removeItem(addressKey);
//                     navigate('/CartPage'); 
//                 },
//                 onError: (result) => {
//                     console.log('ERROR', result);
//                     alert('Pembayaran Gagal!');
//                 },
//                 onClose: () => {
//                     console.log('Anda menutup pop-up pembayaran.');
//                 }
//             });
//         } catch (error) {
//             console.error('Error saat proses pembayaran:', error);
//             alert('Terjadi kesalahan: ' + error.message);
//         }
//     };

//     if (loading) return <div className="min-h-screen bg-[#183D4B] text-white flex justify-center items-center">Mempersiapkan Checkout...</div>;

//     return (
//         <div className="min-h-screen bg-[#183D4B] p-10 text-white flex justify-center items-center">
//             <div className="w-full max-w-lg bg-white/10 p-8 rounded-2xl shadow-2xl">
//                 <h1 className="text-3xl font-bold mb-6">Ringkasan Checkout</h1>
                
//                 <div className="space-y-2 max-h-48 overflow-y-auto pr-2 mb-4 border-b border-white/20 pb-4">
//                     <h2 className="font-semibold text-lg mb-2">Produk yang Dipesan</h2>
//                     {itemsToCheckout.map(item => (
//                         <div key={item.id} className="flex justify-between text-slate-300">
//                             <span>{item.product.name} (x{item.quantity})</span>
//                             <span>{formatIDR(item.product.sellPrice * item.quantity)}</span>
//                         </div>
//                     ))}
//                 </div>
                
//                 <div className="my-6">
//                     <h2 className="block font-semibold mb-2 text-lg">Alamat Pengiriman</h2>
//                     {selectedAddress ? (
//                         <div className="bg-white/20 p-4 rounded-lg border border-white/30 text-white">
//                             <p className="font-bold">{selectedAddress.detailAlamat}</p>
//                             <p className="text-sm text-slate-300">{selectedAddress.kelurahan}, {selectedAddress.kecamatan}</p>
//                             <p className="text-sm text-slate-300">{selectedAddress.kabupaten}, {selectedAddress.provinsi}</p>
//                         </div>
//                     ) : (
//                         <p className="text-slate-400">Memuat alamat...</p>
//                     )}
//                 </div>

//                 <div className="my-6">
//                     <h2 className="block font-semibold mb-2 text-lg">Opsi Pengiriman</h2>
//                     {loadingShipping ? <p className="text-slate-300">Menghitung ongkir...</p> : (
//                         <div className="space-y-2">
//                             {shippingOptions.length > 0 ? shippingOptions.map(opt => (
//                                 <div key={opt.service} onClick={() => handleSelectShipping(opt)} className={`p-3 rounded-lg border cursor-pointer transition ${selectedShipping?.service === opt.service ? 'bg-emerald-500/30 border-emerald-400' : 'bg-white/10 border-white/30 hover:bg-white/20'}`}>
//                                     <p className="font-bold">{`${opt.courier_name} ${opt.service}`} ({formatIDR(opt.cost)})</p>
//                                     <p className="text-sm text-slate-300">Estimasi Tiba: {opt.etd} hari</p>
//                                 </div>
//                             )) : <p className="text-slate-400 text-sm">Tidak ada opsi pengiriman tersedia.</p>}
//                         </div>
//                     )}
//                 </div>

//                 <div className="text-left my-6 space-y-2 border-t border-white/20 pt-4">
//                     <p className="flex justify-between text-lg">
//                         <span className="font-bold">Subtotal:</span> 
//                         <span className="font-bold">{formatIDR(itemsToCheckout.reduce((total, item) => total + (item.product.sellPrice * item.quantity), 0))}</span>
//                     </p>
//                     <p className="flex justify-between text-lg">
//                         <span className="font-bold">Ongkos Kirim:</span> 
//                         <span className="font-bold">{formatIDR(shippingCost)}</span>
//                     </p>
//                     <p className="flex justify-between mt-2 text-xl">
//                         <span className="font-bold">Total Bayar:</span> 
//                         <span className="font-bold">{formatIDR(calculateTotal())}</span>
//                     </p>
//                 </div>
                
//                 <button 
//                     onClick={handlePayment}
//                     className="w-full bg-white text-[#183D4B] font-bold py-3 px-6 rounded-lg transition hover:bg-slate-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
//                     disabled={loadingShipping || !selectedShipping}
//                 >
//                     Bayar Sekarang
//                 </button>
//             </div>
//         </div>
//     );
// }


// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';

// function formatIDR(value) {
//     const n = Number(value || 0);
//     return new Intl.NumberFormat("id-ID", {
//         style: "currency",
//         currency: "IDR",
//         maximumFractionDigits: 0,
//     }).format(isNaN(n) ? 0 : n);
// }

// const API_BASE_URL = 'http://localhost:8080/api';

// // ID Tetap untuk lokasi asal pengiriman (Toko Anda) - Ganti jika perlu
// const ID_ASAL_TOKO = '4835';

// export default function CheckoutPage() {
//     const navigate = useNavigate();
//     const [itemsToCheckout, setItemsToCheckout] = useState([]);
//     const [selectedAddress, setSelectedAddress] = useState(null);
//     const [loading, setLoading] = useState(true);
    
//     const loggedInUserId = localStorage.getItem('loggedInUserId');

//     const [shippingOptions, setShippingOptions] = useState([]);
//     const [selectedShipping, setSelectedShipping] = useState(null);
//     const [shippingCost, setShippingCost] = useState(0);
//     const [loadingShipping, setLoadingShipping] = useState(false);

//     useEffect(() => {
//         if (!loggedInUserId) {
//             alert("Sesi tidak ditemukan, silakan login.");
//             navigate('/');
//             return;
//         }

//         const cartKey = `itemsToCheckout_${loggedInUserId}`;
//         const itemsJSON = localStorage.getItem(cartKey);
//         if (!itemsJSON || JSON.parse(itemsJSON).length === 0) {
//             alert("Tidak ada item yang dipilih untuk checkout.");
//             navigate('/CartPage');
//             return;
//         }
//         setItemsToCheckout(JSON.parse(itemsJSON));

//         const addressKey = `selectedAddress_${loggedInUserId}`;
//         const addressJSON = localStorage.getItem(addressKey);
//         if (!addressJSON) {
//             navigate('/AddressForm');
//             return;
//         }
//         setSelectedAddress(JSON.parse(addressJSON));
        
//         setLoading(false);

//     }, [loggedInUserId, navigate]);

//       useEffect(() => {
//         if (selectedAddress && itemsToCheckout.length > 0) {
//             const calculateOngkir = async () => {
//                 setLoadingShipping(true);
//                 setShippingOptions([]);
//                 setSelectedShipping(null);
//                 setShippingCost(0);
                
//                 // --- PERUBAHAN UTAMA DI SINI ---
//                 // Memeriksa apakah alamat yang dipilih memiliki 'destinationId'
//                 // Sesuaikan 'destinationId' jika nama field di objek alamat Anda berbeda
//                 const destinationId = selectedAddress.destinationId;
                
//                 // Jika tidak ada ID (alamat lama), tampilkan pesan dan hentikan proses
//                 if (!destinationId) {
//                     console.error("Alamat yang dipilih tidak memiliki ID tujuan (destinationId). Alamat ini mungkin perlu diperbarui.");
//                     alert("Alamat ini perlu diperbarui untuk menghitung ongkos kirim. Silakan lengkapi alamat Anda di halaman profil.");
//                     setLoadingShipping(false);
//                     return; // Menghentikan fungsi agar tidak lanjut ke fetch
//                 }
//                 // --- AKHIR PERUBAHAN ---

//                 const totalWeight = itemsToCheckout.reduce((total, item) => total + (item.product.weight || 100) * item.quantity, 0);
                
//                 if (totalWeight > 0) {
//                     try {
//                         const payload = { 
//                             origin: ID_ASAL_TOKO, 
//                             destination: destinationId.toString(), 
//                             weight: totalWeight, 
//                             courier: "jne" 
//                         };

//                         const formBody = new URLSearchParams(payload);

//                         const res = await fetch(`${API_BASE_URL}/shipping/cost`, {
//                             method: 'POST',
//                             headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//                             body: formBody
//                         });

//                         if (!res.ok) {
//                             const errorData = await res.json().catch(() => ({ error: "Gagal memproses respons error dari server." }));
//                             throw new Error(errorData.error || `Gagal mengambil ongkir: Status ${res.status}`);
//                         }

//                         const data = await res.json();
//                         setShippingOptions(data);

//                     } catch (err) {
//                         console.error("Gagal mengambil ongkir:", err);
//                         alert(err.message);
//                     } finally {
//                         setLoadingShipping(false);
//                     }
//                 } else {
//                     setLoadingShipping(false);
//                 }
//             };
//             calculateOngkir();
//         }
//     }, [selectedAddress, itemsToCheckout]);
    
//     const calculateTotal = () => {
//         const subtotal = itemsToCheckout.reduce((total, item) => total + (item.product.sellPrice * item.quantity), 0);
//         return subtotal + shippingCost;
//     };

//     const handleSelectShipping = (option) => {
//         setSelectedShipping(option);
//         setShippingCost(option.cost);
//     };

//     const handlePayment = async () => {
//         if (!selectedAddress) {
//             alert("Alamat pengiriman tidak valid.");
//             return;
//         }
//         if (!selectedShipping) {
//             alert("Silakan pilih opsi pengiriman terlebih dahulu.");
//             return;
//         }
//         const totalAmount = calculateTotal();
//         try {
//             const response = await fetch(`${API_BASE_URL}/payments/create-transaction`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ 
//                     amount: totalAmount,
//                     pelangganId: loggedInUserId 
//                 }),
//             });
            
//             if (!response.ok) {
//                 const errorData = await response.json().catch(() => ({}));
//                 throw new Error(errorData.error || "Gagal membuat transaksi di backend.");
//             }

//             const data = await response.json();
//             const { token } = data;
//             if (!token) {
//                 alert('Gagal mendapatkan token pembayaran.');
//                 return;
//             }

//             window.snap.pay(token, {
//                 onSuccess: (result) => {
//                     console.log('SUCCESS', result);
//                     alert('Pembayaran Berhasil!');
//                     const cartKey = `itemsToCheckout_${loggedInUserId}`;
//                     const addressKey = `selectedAddress_${loggedInUserId}`;
//                     localStorage.removeItem(cartKey);
//                     localStorage.removeItem(addressKey);
//                     navigate('/Transaksi'); 
//                 },
//                 onPending: (result) => {
//                     console.log('PENDING', result);
//                     alert('Menunggu pembayaran Anda...');
//                     const cartKey = `itemsToCheckout_${loggedInUserId}`;
//                     const addressKey = `selectedAddress_${loggedInUserId}`;
//                     localStorage.removeItem(cartKey);
//                     localStorage.removeItem(addressKey);
//                     navigate('/CartPage'); 
//                 },
//                 onError: (result) => {
//                     console.log('ERROR', result);
//                     alert('Pembayaran Gagal!');
//                 },
//                 onClose: () => {
//                     console.log('Anda menutup pop-up pembayaran.');
//                 }
//             });
//         } catch (error) {
//             console.error('Error saat proses pembayaran:', error);
//             alert('Terjadi kesalahan: ' + error.message);
//         }
//     };

//     if (loading) return <div className="min-h-screen bg-[#183D4B] text-white flex justify-center items-center">Mempersiapkan Checkout...</div>;

//     return (
//         <div className="min-h-screen bg-[#183D4B] p-10 text-white flex justify-center items-center">
//             <div className="w-full max-w-lg bg-white/10 p-8 rounded-2xl shadow-2xl">
//                 <h1 className="text-3xl font-bold mb-6">Ringkasan Checkout</h1>
                
//                 <div className="space-y-2 max-h-48 overflow-y-auto pr-2 mb-4 border-b border-white/20 pb-4">
//                     <h2 className="font-semibold text-lg mb-2">Produk yang Dipesan</h2>
//                     {itemsToCheckout.map(item => (
//                         <div key={item.id} className="flex justify-between text-slate-300">
//                             <span>{item.product.name} (x{item.quantity})</span>
//                             <span>{formatIDR(item.product.sellPrice * item.quantity)}</span>
//                         </div>
//                     ))}
//                 </div>
                
//                 <div className="my-6">
//                     <h2 className="block font-semibold mb-2 text-lg">Alamat Pengiriman</h2>
//                     {selectedAddress ? (
//                         <div className="bg-white/20 p-4 rounded-lg border border-white/30 text-white">
//                             <p className="font-bold">{selectedAddress.detailAlamat}</p>
//                             <p className="text-sm text-slate-300">{selectedAddress.kelurahan}, {selectedAddress.kecamatan}</p>
//                             <p className="text-sm text-slate-300">{selectedAddress.kabupaten}, {selectedAddress.provinsi}</p>
//                         </div>
//                     ) : (
//                         <p className="text-slate-400">Memuat alamat...</p>
//                     )}
//                 </div>

//                 <div className="my-6">
//                     <h2 className="block font-semibold mb-2 text-lg">Opsi Pengiriman</h2>
//                     {loadingShipping ? <p className="text-slate-300">Menghitung ongkir...</p> : (
//                         <div className="space-y-2">
//                             {shippingOptions.length > 0 ? shippingOptions.map(opt => (
//                                 <div key={opt.service} onClick={() => handleSelectShipping(opt)} className={`p-3 rounded-lg border cursor-pointer transition ${selectedShipping?.service === opt.service ? 'bg-emerald-500/30 border-emerald-400' : 'bg-white/10 border-white/30 hover:bg-white/20'}`}>
//                                     <p className="font-bold">{`${opt.courier_name} ${opt.service}`} ({formatIDR(opt.cost)})</p>
//                                     <p className="text-sm text-slate-300">Estimasi Tiba: {opt.etd} hari</p>
//                                 </div>
//                             )) : <p className="text-slate-400 text-sm">Tidak ada opsi pengiriman tersedia.</p>}
//                         </div>
//                     )}
//                 </div>

//                 <div className="text-left my-6 space-y-2 border-t border-white/20 pt-4">
//                     <p className="flex justify-between text-lg">
//                         <span className="font-bold">Subtotal:</span> 
//                         <span className="font-bold">{formatIDR(itemsToCheckout.reduce((total, item) => total + (item.product.sellPrice * item.quantity), 0))}</span>
//                     </p>
//                     <p className="flex justify-between text-lg">
//                         <span className="font-bold">Ongkos Kirim:</span> 
//                         <span className="font-bold">{formatIDR(shippingCost)}</span>
//                     </p>
//                     <p className="flex justify-between mt-2 text-xl">
//                         <span className="font-bold">Total Bayar:</span> 
//                         <span className="font-bold">{formatIDR(calculateTotal())}</span>
//                     </p>
//                 </div>
                
//                 <button 
//                     onClick={handlePayment}
//                     className="w-full bg-white text-[#183D4B] font-bold py-3 px-6 rounded-lg transition hover:bg-slate-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
//                     disabled={loadingShipping || !selectedShipping}
//                 >
//                     Bayar Sekarang
//                 </button>
//             </div>
//         </div>
//     );
// }


// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';

// function formatIDR(value) {
//     const n = Number(value || 0);
//     return new Intl.NumberFormat("id-ID", {
//         style: "currency",
//         currency: "IDR",
//         maximumFractionDigits: 0,
//     }).format(isNaN(n) ? 0 : n);
// }

// const API_BASE_URL = 'http://localhost:8080/api';

// export default function CheckoutPage() {
//     const navigate = useNavigate();
//     const [itemsToCheckout, setItemsToCheckout] = useState([]);
//     const [selectedAddress, setSelectedAddress] = useState(null);
//     const [loading, setLoading] = useState(true);
    
//     const loggedInUserId = localStorage.getItem('loggedInUserId');

//     // --- LOGIKA ONGKIR DIHAPUS ---
//     // Semua state terkait shipping (shippingOptions, selectedShipping, dll) telah dihapus.
//     // Ongkos kirim sekarang dianggap 0.

//     useEffect(() => {
//         if (!loggedInUserId) {
//             alert("Sesi tidak ditemukan, silakan login.");
//             navigate('/');
//             return;
//         }

//         const cartKey = `itemsToCheckout_${loggedInUserId}`;
//         const itemsJSON = localStorage.getItem(cartKey);
//         if (!itemsJSON || JSON.parse(itemsJSON).length === 0) {
//             alert("Tidak ada item yang dipilih untuk checkout.");
//             navigate('/CartPage');
//             return;
//         }
//         setItemsToCheckout(JSON.parse(itemsJSON));

//         const addressKey = `selectedAddress_${loggedInUserId}`;
//         const addressJSON = localStorage.getItem(addressKey);
//         if (!addressJSON) {
//             // Arahkan ke halaman pemilihan alamat jika belum ada yang dipilih
//             navigate('/AddressListPage');
//             return;
//         }
//         setSelectedAddress(JSON.parse(addressJSON));
        
//         setLoading(false);

//     }, [loggedInUserId, navigate]);

//     // Fungsi useEffect untuk menghitung ongkir telah dihapus sepenuhnya.

//     const calculateTotal = () => {
//         const subtotal = itemsToCheckout.reduce((total, item) => total + (item.product.sellPrice * item.quantity), 0);
//         // Ongkos kirim (shippingCost) sekarang 0, jadi tidak perlu ditambahkan.
//         return subtotal;
//     };

//     // Fungsi handleSelectShipping telah dihapus.

//     const handlePayment = async () => {
//         if (!selectedAddress) {
//             alert("Alamat pengiriman tidak valid.");
//             return;
//         }

//         // Pengecekan terhadap selectedShipping telah dihapus.

//         const totalAmount = calculateTotal();
//         try {
//             const response = await fetch(`${API_BASE_URL}/payments/create-transaction`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ 
//                     amount: totalAmount,
//                     pelangganId: loggedInUserId 
//                 }),
//             });
            
//             if (!response.ok) {
//                 const errorData = await response.json().catch(() => ({}));
//                 throw new Error(errorData.error || "Gagal membuat transaksi di backend.");
//             }

//             const data = await response.json();
//             const { token } = data;
//             if (!token) {
//                 alert('Gagal mendapatkan token pembayaran.');
//                 return;
//             }

//             window.snap.pay(token, {
//                 onSuccess: (result) => {
//                     console.log('SUCCESS', result);
//                     alert('Pembayaran Berhasil!');
//                     const cartKey = `itemsToCheckout_${loggedInUserId}`;
//                     const addressKey = `selectedAddress_${loggedInUserId}`;
//                     localStorage.removeItem(cartKey);
//                     localStorage.removeItem(addressKey);
//                     navigate('/Transaksi'); 
//                 },
//                 onPending: (result) => {
//                     console.log('PENDING', result);
//                     alert('Menunggu pembayaran Anda...');
//                     const cartKey = `itemsToCheckout_${loggedInUserId}`;
//                     const addressKey = `selectedAddress_${loggedInUserId}`;
//                     localStorage.removeItem(cartKey);
//                     localStorage.removeItem(addressKey);
//                     navigate('/CartPage'); 
//                 },
//                 onError: (result) => {
//                     console.log('ERROR', result);
//                     alert('Pembayaran Gagal!');
//                 },
//                 onClose: () => {
//                     console.log('Anda menutup pop-up pembayaran.');
//                 }
//             });
//         } catch (error) {
//             console.error('Error saat proses pembayaran:', error);
//             alert('Terjadi kesalahan: ' + error.message);
//         }
//     };

//     if (loading) return <div className="min-h-screen bg-[#183D4B] text-white flex justify-center items-center">Mempersiapkan Checkout...</div>;

//     return (
//         <div className="min-h-screen bg-[#183D4B] p-10 text-white flex justify-center items-center">
//             <div className="w-full max-w-lg bg-white/10 p-8 rounded-2xl shadow-2xl">
//                 <h1 className="text-3xl font-bold mb-6">Ringkasan Checkout</h1>
                
//                 <div className="space-y-2 max-h-48 overflow-y-auto pr-2 mb-4 border-b border-white/20 pb-4">
//                     <h2 className="font-semibold text-lg mb-2">Produk yang Dipesan</h2>
//                     {itemsToCheckout.map(item => (
//                         <div key={item.id} className="flex justify-between text-slate-300">
//                             <span>{item.product.name} (x{item.quantity})</span>
//                             <span>{formatIDR(item.product.sellPrice * item.quantity)}</span>
//                         </div>
//                     ))}
//                 </div>
                
//                 <div className="my-6">
//                     <h2 className="block font-semibold mb-2 text-lg">Alamat Pengiriman</h2>
//                     {selectedAddress ? (
//                         <div className="bg-white/20 p-4 rounded-lg border border-white/30 text-white">
//                             <p className="font-bold">{selectedAddress.detailAlamat}</p>
//                             <p className="text-sm text-slate-300">{selectedAddress.kelurahan}, {selectedAddress.kecamatan}</p>
//                             <p className="text-sm text-slate-300">{selectedAddress.kabupaten}, {selectedAddress.provinsi}</p>
//                         </div>
//                     ) : (
//                         <p className="text-slate-400">Memuat alamat...</p>
//                     )}
//                 </div>

//                 {/* --- BAGIAN OPSI PENGIRIMAN DIHAPUS --- */}
//                 {/* Tampilan opsi pengiriman tidak lagi ditampilkan kepada pengguna. */}

//                 <div className="text-left my-6 space-y-2 border-t border-white/20 pt-4">
//                     <p className="flex justify-between text-lg">
//                         <span className="font-bold">Subtotal:</span> 
//                         <span className="font-bold">{formatIDR(itemsToCheckout.reduce((total, item) => total + (item.product.sellPrice * item.quantity), 0))}</span>
//                     </p>
//                     <p className="flex justify-between text-lg">
//                         <span className="font-bold">Ongkos Kirim:</span> 
//                         {/* Nilai ongkos kirim di-hardcode menjadi 0 */}
//                         <span className="font-bold">{formatIDR(0)}</span>
//                     </p>
//                     <p className="flex justify-between mt-2 text-xl">
//                         <span className="font-bold">Total Bayar:</span> 
//                         <span className="font-bold">{formatIDR(calculateTotal())}</span>
//                     </p>
//                 </div>
                
//                 <button 
//                     onClick={handlePayment}
//                     className="w-full bg-white text-[#183D4B] font-bold py-3 px-6 rounded-lg transition hover:bg-slate-200"
//                     // Logika 'disabled' yang berhubungan dengan shipping telah dihapus
//                 >
//                     Bayar Sekarang
//                 </button>
//             </div>
//         </div>
//     );
// }




import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function formatIDR(value) {
    const n = Number(value || 0);
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(isNaN(n) ? 0 : n);
}

const API_BASE_URL = 'http://localhost:8080/api';

export default function CheckoutPage() {
    const navigate = useNavigate();
    const [itemsToCheckout, setItemsToCheckout] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const loggedInUserId = localStorage.getItem('loggedInUserId');

    // --- LOGIKA ONGKIR DIHAPUS ---
    // Semua state terkait shipping (shippingOptions, selectedShipping, dll) telah dihapus.
    // Ongkos kirim sekarang dianggap 0.

    useEffect(() => {
        if (!loggedInUserId) {
            alert("Sesi tidak ditemukan, silakan login.");
            navigate('/');
            return;
        }

        const cartKey = `itemsToCheckout_${loggedInUserId}`;
        const itemsJSON = localStorage.getItem(cartKey);
        if (!itemsJSON || JSON.parse(itemsJSON).length === 0) {
            alert("Tidak ada item yang dipilih untuk checkout.");
            navigate('/CartPage');
            return;
        }
        setItemsToCheckout(JSON.parse(itemsJSON));

        const addressKey = `selectedAddress_${loggedInUserId}`;
        const addressJSON = localStorage.getItem(addressKey);
        if (!addressJSON) {
            // Arahkan ke halaman pemilihan alamat jika belum ada yang dipilih
            navigate('/AddressListPage');
            return;
        }
        setSelectedAddress(JSON.parse(addressJSON));
        
        setLoading(false);

    }, [loggedInUserId, navigate]);

    // Fungsi useEffect untuk menghitung ongkir telah dihapus sepenuhnya.

    const calculateTotal = () => {
        const subtotal = itemsToCheckout.reduce((total, item) => total + (item.product.sellPrice * item.quantity), 0);
        // Ongkos kirim (shippingCost) sekarang 0, jadi tidak perlu ditambahkan.
        return subtotal;
    };

    // Fungsi handleSelectShipping telah dihapus.

    const handlePayment = async () => {
        if (!selectedAddress) {
            alert("Alamat pengiriman tidak valid.");
            return;
        }

        // Pengecekan terhadap selectedShipping telah dihapus.

        const totalAmount = calculateTotal();
        try {
            const response = await fetch(`${API_BASE_URL}/payments/create-transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    amount: totalAmount,
                    pelangganId: loggedInUserId 
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Gagal membuat transaksi di backend.");
            }

            const data = await response.json();
            const { token } = data;
            if (!token) {
                alert('Gagal mendapatkan token pembayaran.');
                return;
            }

            window.snap.pay(token, {
                onSuccess: (result) => {
                    console.log('SUCCESS', result);
                    alert('Pembayaran Berhasil!');
                    const cartKey = `itemsToCheckout_${loggedInUserId}`;
                    const addressKey = `selectedAddress_${loggedInUserId}`;
                    localStorage.removeItem(cartKey);
                    localStorage.removeItem(addressKey);
                    navigate('/Transaksi'); 
                },
                onPending: (result) => {
                    console.log('PENDING', result);
                    alert('Menunggu pembayaran Anda...');
                    const cartKey = `itemsToCheckout_${loggedInUserId}`;
                    const addressKey = `selectedAddress_${loggedInUserId}`;
                    localStorage.removeItem(cartKey);
                    localStorage.removeItem(addressKey);
                    navigate('/CartPage'); 
                },
                onError: (result) => {
                    console.log('ERROR', result);
                    alert('Pembayaran Gagal!');
                },
                onClose: () => {
                    console.log('Anda menutup pop-up pembayaran.');
                }
            });
        } catch (error) {
            console.error('Error saat proses pembayaran:', error);
            alert('Terjadi kesalahan: ' + error.message);
        }
    };

    // --- FUNGSI BARU UNTUK KEMBALI KE KERANJANG ---
    const handleBackToCart = () => {
        // Menampilkan dialog konfirmasi bawaan browser
        if (window.confirm("Anda yakin ingin membatalkan checkout dan kembali ke keranjang?")) {
            navigate('/CartPage');
        }
    };
    // ---------------------------------------------

    if (loading) return <div className="min-h-screen bg-[#183D4B] text-white flex justify-center items-center">Mempersiapkan Checkout...</div>;

    return (
        <div className="min-h-screen bg-[#183D4B] p-10 text-white flex justify-center items-center">
            <div className="w-full max-w-lg bg-white/10 p-8 rounded-2xl shadow-2xl">
                
                {/* --- TOMBOL KEMBALI DITAMBAHKAN DI SINI --- */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Ringkasan Checkout</h1>
                    <button 
                        onClick={handleBackToCart}
                        className="text-sm bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        Kembali ke Keranjang
                    </button>
                </div>
                {/* ------------------------------------------- */}
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 mb-4 border-b border-white/20 pb-4">
                    <h2 className="font-semibold text-lg mb-2">Produk yang Dipesan</h2>
                    {itemsToCheckout.map(item => (
                        <div key={item.id} className="flex justify-between text-slate-300">
                            <span>{item.product.name} (x{item.quantity})</span>
                            <span>{formatIDR(item.product.sellPrice * item.quantity)}</span>
                        </div>
                    ))}
                </div>
                
                <div className="my-6">
                    <h2 className="block font-semibold mb-2 text-lg">Alamat Pengiriman</h2>
                    {selectedAddress ? (
                        <div className="bg-white/20 p-4 rounded-lg border border-white/30 text-white">
                            <p className="font-bold">{selectedAddress.detailAlamat}</p>
                            <p className="text-sm text-slate-300">{selectedAddress.kelurahan}, {selectedAddress.kecamatan}</p>
                            <p className="text-sm text-slate-300">{selectedAddress.kabupaten}, {selectedAddress.provinsi}</p>
                        </div>
                    ) : (
                        <p className="text-slate-400">Memuat alamat...</p>
                    )}
                </div>

                {/* --- BAGIAN OPSI PENGIRIMAN DIHAPUS --- */}
                {/* Tampilan opsi pengiriman tidak lagi ditampilkan kepada pengguna. */}

                <div className="text-left my-6 space-y-2 border-t border-white/20 pt-4">
                    <p className="flex justify-between text-lg">
                        <span className="font-bold">Subtotal:</span> 
                        <span className="font-bold">{formatIDR(itemsToCheckout.reduce((total, item) => total + (item.product.sellPrice * item.quantity), 0))}</span>
                    </p>
                    <p className="flex justify-between text-lg">
                        <span className="font-bold">Ongkos Kirim:</span> 
                        {/* Nilai ongkos kirim di-hardcode menjadi 0 */}
                        <span className="font-bold">{formatIDR(0)}</span>
                    </p>
                    <p className="flex justify-between mt-2 text-xl">
                        <span className="font-bold">Total Bayar:</span> 
                        <span className="font-bold">{formatIDR(calculateTotal())}</span>
                    </p>
                </div>
                
                <button 
                    onClick={handlePayment}
                    className="w-full bg-white text-[#183D4B] font-bold py-3 px-6 rounded-lg transition hover:bg-slate-200"
                    // Logika 'disabled' yang berhubungan dengan shipping telah dihapus
                >
                    Bayar Sekarang
                </button>
            </div>
        </div>
    );
}

