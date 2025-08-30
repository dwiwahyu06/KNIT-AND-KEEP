// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { FaPlus, FaEdit, FaTrash, FaArrowLeft } from 'react-icons/fa';

// const API_BASE_URL = 'http://localhost:8080/api';

// export default function AddressListPage() {
//     const [addresses, setAddresses] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [selectedAddressId, setSelectedAddressId] = useState(null);
//     const navigate = useNavigate();
//     const loggedInUserId = localStorage.getItem('loggedInUserId');

//     const fetchAddresses = useCallback(async () => {
//         if (!loggedInUserId) {
//             alert("Silakan login untuk melihat alamat Anda.");
//             navigate('/');
//             return;
//         }
//         setLoading(true);
//         try {
//             const url = new URL(`${API_BASE_URL}/pelanggan/${loggedInUserId}/addresses`);
//             url.searchParams.append('_', new Date().getTime());
//             const res = await fetch(url);
//             if (!res.ok) {
//                 // Jika tidak ada alamat, backend akan kirim 204 atau 404
//                 if (res.status === 204 || res.status === 404) {
//                     setAddresses([]);
//                     return;
//                 }
//                 throw new Error('Gagal mengambil data alamat');
//             }
//             const data = await res.json();
//             setAddresses(data);
//             if (data.length > 0) {
//                 setSelectedAddressId(data[0].id);
//             }
//         } catch (error) {
//             console.error(error);
//             setAddresses([]);
//         } finally {
//             setLoading(false);
//         }
//     }, [loggedInUserId, navigate]);

//     useEffect(() => {
//         fetchAddresses();
//     }, [fetchAddresses]);

//     const handleDelete = async (addressId) => {
//         if (!window.confirm("Apakah Anda yakin ingin menghapus alamat ini?")) return;
//         try {
//             const res = await fetch(`${API_BASE_URL}/addresses/${addressId}`, { method: 'DELETE' });
//             if (res.ok) {
//                 alert("Alamat berhasil dihapus.");
//                 fetchAddresses();
//             } else {
//                 alert("Gagal menghapus alamat.");
//             }
//         } catch (error) {
//             console.error("Error menghapus alamat:", error);
//         }
//     };

//     const handleProceedToCheckout = () => {
//         if (!selectedAddressId) {
//             alert("Silakan pilih satu alamat untuk melanjutkan.");
//             return;
//         }
//         const chosenAddress = addresses.find(addr => addr.id === selectedAddressId);
//         if (chosenAddress) {
//             const addressKey = `selectedAddress_${loggedInUserId}`;
//             localStorage.setItem(addressKey, JSON.stringify(chosenAddress));
            
//             // ✅ PERUBAHAN: Arahkan ke halaman checkout setelah memilih alamat
//             navigate('/CheckoutPage');
//         } else {
//             alert("Alamat yang dipilih tidak valid.");
//         }
//     };

//     if (loading) {
//         return <div className="min-h-screen bg-[#183D4B] text-white flex justify-center items-center">Memuat Alamat...</div>;
//     }

//     return (
//         <div className="min-h-screen bg-[#183D4B] p-6 md:p-10 text-white">
//             <div className="mx-auto max-w-4xl">
//                 <div className="flex justify-between items-center mb-6">
//                     <h1 className="text-3xl font-bold">Pilih Alamat Pengiriman</h1>
//                     <button onClick={() => navigate('/CartPage')} className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-semibold transition hover:bg-white/20">
//                         <FaArrowLeft /> Kembali ke Keranjang
//                     </button>
//                 </div>
                
//                 {addresses.length > 0 ? (
//                     <div className="bg-white/10 p-8 rounded-2xl shadow-lg">
//                         <div className="space-y-4 mb-6">
//                             {addresses.map(addr => (
//                                 <div key={addr.id} className="bg-white/5 p-4 rounded-xl flex items-start gap-4">
//                                     <input 
//                                         type="radio"
//                                         name="selectedAddress"
//                                         id={`addr-${addr.id}`}
//                                         value={addr.id}
//                                         checked={selectedAddressId === addr.id}
//                                         onChange={() => setSelectedAddressId(addr.id)}
//                                         className="mt-1 h-5 w-5 text-emerald-500 bg-white/20 border-white/30 focus:ring-emerald-500"
//                                     />
//                                     <label htmlFor={`addr-${addr.id}`} className="flex-grow cursor-pointer">
//                                         <div className="flex justify-between items-start">
//                                             <div>
//                                                 <h2 className="font-bold text-lg">{addr.detailAlamat}</h2>
//                                                 <p className="text-slate-300 text-sm">
//                                                     {addr.kelurahan}, {addr.kecamatan}, {addr.kabupaten}, {addr.provinsi}
//                                                 </p>
//                                                 <p className="text-slate-400 text-xs mt-1">RT {addr.rt} / RW {addr.rw}</p>
//                                             </div>
//                                             <div className="flex gap-3">
//                                                 <button onClick={() => navigate(`/alamat-form/${addr.id}`)} className="p-2 hover:text-blue-400 transition" title="Edit Alamat"><FaEdit /></button>
//                                                 <button onClick={() => handleDelete(addr.id)} className="p-2 hover:text-red-400 transition" title="Hapus Alamat"><FaTrash /></button>
//                                             </div>
//                                         </div>
//                                     </label>
//                                 </div>
//                             ))}
//                         </div>
//                         <div className="border-t border-white/20 pt-6 flex justify-between items-center">
//                             <button onClick={() => navigate('/alamat-form')} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white">
//                                 <FaPlus /> Tambah Alamat Lain
//                             </button>
//                             <button 
//                                 onClick={handleProceedToCheckout} 
//                                 className="bg-white text-[#183D4B] font-bold py-2 px-6 rounded-lg transition hover:bg-slate-200"
//                                 disabled={!selectedAddressId}
//                             >
//                                 Gunakan Alamat Ini & Lanjut
//                             </button>
//                         </div>
//                     </div>
//                 ) : (
//                     <div className="text-center bg-white/10 p-10 rounded-xl">
//                         <p className="text-slate-300">Anda belum memiliki alamat tersimpan.</p>
//                         <button onClick={() => navigate('/alamat-form')} className="mt-4 bg-white text-[#183D4B] font-bold py-2 px-4 rounded-lg transition hover:bg-slate-200">
//                             + Tambah Alamat Pertama Anda
//                         </button>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }


import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft } from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:8080/api';

export default function AddressListPage() {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const navigate = useNavigate();
    const loggedInUserId = localStorage.getItem('loggedInUserId');

    const fetchAddresses = useCallback(async () => {
        if (!loggedInUserId) {
            alert("Silakan login untuk melihat alamat Anda.");
            navigate('/');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/pelanggan/${loggedInUserId}/addresses`);
            if (!res.ok) {
                if (res.status === 404) { // Menangani jika pelanggan belum punya alamat
                    setAddresses([]);
                    return;
                }
                throw new Error('Gagal mengambil data alamat');
            }
            const data = await res.json();
            setAddresses(data);
            // Otomatis memilih alamat pertama jika ada
            if (data.length > 0 && !selectedAddressId) {
                setSelectedAddressId(data[0].id);
            }
        } catch (error) {
            console.error(error);
            setAddresses([]);
        } finally {
            setLoading(false);
        }
    }, [loggedInUserId, navigate, selectedAddressId]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const handleDelete = async (addressId) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus alamat ini?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/addresses/${addressId}`, { method: 'DELETE' });
            if (res.ok) {
                alert("Alamat berhasil dihapus.");
                fetchAddresses(); // Muat ulang daftar alamat
            } else {
                alert("Gagal menghapus alamat.");
            }
        } catch (error) {
            console.error("Error menghapus alamat:", error);
        }
    };

    const handleProceedToCheckout = () => {
        if (!selectedAddressId) {
            alert("Silakan pilih satu alamat untuk melanjutkan.");
            return;
        }
        const chosenAddress = addresses.find(addr => addr.id === selectedAddressId);
        if (chosenAddress) {
            // Menyimpan seluruh objek alamat ke localStorage
            const addressKey = `selectedAddress_${loggedInUserId}`;
            localStorage.setItem(addressKey, JSON.stringify(chosenAddress));
            navigate('/CheckoutPage');
        } else {
            alert("Alamat yang dipilih tidak valid.");
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#183D4B] text-white flex justify-center items-center">Memuat Alamat...</div>;
    }

    return (
        <div className="min-h-screen bg-[#183D4B] p-6 md:p-10 text-white">
            <div className="mx-auto max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Pilih Alamat Pengiriman</h1>
                    <button onClick={() => navigate('/CartPage')} className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-semibold transition hover:bg-white/20">
                        <FaArrowLeft /> Kembali ke Keranjang
                    </button>
                </div>
                
                {addresses.length > 0 ? (
                    <div className="bg-white/10 p-8 rounded-2xl shadow-lg">
                        <div className="space-y-4 mb-6">
                            {addresses.map(addr => (
                                <div key={addr.id} className="bg-white/5 p-4 rounded-xl flex items-start gap-4">
                                    <input 
                                        type="radio"
                                        name="selectedAddress"
                                        id={`addr-${addr.id}`}
                                        value={addr.id}
                                        checked={selectedAddressId === addr.id}
                                        onChange={() => setSelectedAddressId(addr.id)}
                                        className="mt-1 h-5 w-5 text-emerald-500 bg-white/20 border-white/30 focus:ring-emerald-500"
                                    />
                                    <label htmlFor={`addr-${addr.id}`} className="flex-grow cursor-pointer">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="font-bold text-lg">{addr.detailAlamat}</h2>
                                                <p className="text-slate-300 text-sm">
                                                    {addr.kelurahan}, {addr.kecamatan}, {addr.kabupaten}, {addr.provinsi}
                                                </p>
                                                <p className="text-slate-400 text-xs mt-1">RT {addr.rt} / RW {addr.rw}</p>
                                                {/* Pesan untuk alamat lama yang belum lengkap */}
                                                {!addr.destinationId && (
                                                    <p className="text-yellow-400 text-xs mt-2 font-semibold">
                                                        Alamat ini perlu diperbarui untuk menghitung ongkir. Silakan klik Edit.
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={() => navigate(`/alamat-form/${addr.id}`)} className="p-2 hover:text-blue-400 transition" title="Edit Alamat"><FaEdit /></button>
                                                <button onClick={() => handleDelete(addr.id)} className="p-2 hover:text-red-400 transition" title="Hapus Alamat"><FaTrash /></button>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-white/20 pt-6 flex justify-between items-center">
                            <button onClick={() => navigate('/alamat-form')} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white">
                                <FaPlus /> Tambah Alamat Lain
                            </button>
                            <button 
                                onClick={handleProceedToCheckout} 
                                className="bg-white text-[#183D4B] font-bold py-2 px-6 rounded-lg transition hover:bg-slate-200"
                                disabled={!selectedAddressId}
                            >
                                Gunakan Alamat Ini & Lanjut
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center bg-white/10 p-10 rounded-xl">
                        <p className="text-slate-300">Anda belum memiliki alamat tersimpan.</p>
                        <button onClick={() => navigate('/alamat-form')} className="mt-4 bg-white text-[#183D4B] font-bold py-2 px-4 rounded-lg transition hover:bg-slate-200">
                            + Tambah Alamat Pertama Anda
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
