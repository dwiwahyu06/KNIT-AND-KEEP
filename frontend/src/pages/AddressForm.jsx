// import React, { useState, useEffect, useMemo} from 'react';
// import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
// import { useNavigate, useParams } from 'react-router-dom';
// import L from 'leaflet';

// // Fix untuk ikon marker default Leaflet
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
//   iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
// });

// // Komponen kecil untuk handle klik dan drag di peta
// function MapEvents({ onPositionChange }) {
//     const map = useMapEvents({
//         click(e) {
//             onPositionChange(e.latlng);
//             map.flyTo(e.latlng, map.getZoom());
//         },
//         dragend() {
//             onPositionChange(map.getCenter());
//         }
//     });
//     return null;
// }

// export default function AddressForm() {
//     const navigate = useNavigate();
//     const { addressId } = useParams();
//     const isEditMode = Boolean(addressId);

//     const [formData, setFormData] = useState({
//         provinsi: '', kabupaten: '', kecamatan: '', kelurahan: '',
//         detailAlamat: '', rt: '', rw: '',
//     });
//     const [markerPosition, setMarkerPosition] = useState({ lat: -6.9175, lng: 107.6191 });

//     const [provinces, setProvinces] = useState([]);
//     const [regencies, setRegencies] = useState([]);
//     const [districts, setDistricts] = useState([]);
//     const [villages, setVillages] = useState([]);

//     const [selectedProvince, setSelectedProvince] = useState('');
//     const [selectedRegency, setSelectedRegency] = useState('');
//     const [selectedDistrict, setSelectedDistrict] = useState('');
    
//     const [addressDataForEdit, setAddressDataForEdit] = useState(null);

//     const API_WILAYAH_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';
//     const API_BASE_URL = 'http://localhost:8080/api';

//     const loggedInUserId = localStorage.getItem('loggedInUserId');

//     useEffect(() => {
//         if (!loggedInUserId) {
//             alert("Sesi tidak ditemukan, silakan login kembali.");
//             navigate('/');
//         }
//     }, [loggedInUserId, navigate]);

//     useEffect(() => {
//         if (isEditMode) {
//             fetch(`${API_BASE_URL}/addresses/${addressId}`)
//                 .then(res => {
//                     if (!res.ok) throw new Error("Alamat tidak ditemukan");
//                     return res.json();
//                 })
//                 .then(data => {
//                     setAddressDataForEdit(data);
//                     setFormData(data);
//                     setMarkerPosition({ lat: data.latitude, lng: data.longitude });
//                 })
//                 .catch(err => {
//                     console.error("Gagal mengambil data alamat untuk diedit:", err);
//                     alert("Gagal memuat data alamat. Mengarahkan kembali.");
//                     navigate('/AddressListPage');
//                 });
//         }
//     }, [addressId, isEditMode, navigate]);

//     useEffect(() => {
//         fetch(`${API_WILAYAH_URL}/provinces.json`).then(res => res.json()).then(data => setProvinces(data));
//     }, []);

//     useEffect(() => {
//         if (provinces.length > 0 && addressDataForEdit) {
//             const provinceToSelect = provinces.find(p => p.name === addressDataForEdit.provinsi);
//             if (provinceToSelect) setSelectedProvince(provinceToSelect.id);
//         }
//     }, [provinces, addressDataForEdit]);

//     useEffect(() => {
//         if (selectedProvince) {
//             fetch(`${API_WILAYAH_URL}/regencies/${selectedProvince}.json`)
//                 .then(res => res.json())
//                 .then(data => {
//                     setRegencies(data);
//                     if (addressDataForEdit) {
//                         const regencyToSelect = data.find(r => r.name === addressDataForEdit.kabupaten);
//                         if (regencyToSelect) setSelectedRegency(regencyToSelect.id);
//                     }
//                 });
//         }
//     }, [selectedProvince, addressDataForEdit]);
    
//     useEffect(() => {
//         if (selectedRegency) {
//             fetch(`${API_WILAYAH_URL}/districts/${selectedRegency}.json`)
//                 .then(res => res.json())
//                 .then(data => {
//                     setDistricts(data);
//                     if (addressDataForEdit) {
//                         const districtToSelect = data.find(d => d.name === addressDataForEdit.kecamatan);
//                         if (districtToSelect) setSelectedDistrict(districtToSelect.id);
//                     }
//                 });
//         }
//     }, [selectedRegency, addressDataForEdit]);

//     useEffect(() => {
//         if (selectedDistrict) {
//             fetch(`${API_WILAYAH_URL}/villages/${selectedDistrict}.json`).then(res => res.json()).then(data => setVillages(data));
//         }
//     }, [selectedDistrict]);

//     const handleFormChange = (e) => {
//         setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         const completeAddress = {
//             ...formData,
//             latitude: markerPosition.lat,
//             longitude: markerPosition.lng,
//         };
        
//         const url = isEditMode
//             ? `${API_BASE_URL}/addresses/${addressId}`
//             : `${API_BASE_URL}/pelanggan/${loggedInUserId}/addresses`;
        
//         const method = isEditMode ? 'PUT' : 'POST';

//         try {
//             const res = await fetch(url, {
//                 method,
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(completeAddress)
//             });

//             if (res.ok) {
//                 alert(`Alamat berhasil ${isEditMode ? 'diperbarui' : 'disimpan'}!`);
//                 navigate('/AddressListPage');
//             } else {
//                 const errorData = await res.json().catch(() => ({}));
//                 alert(`Gagal: ${errorData.message || 'Terjadi kesalahan pada server.'}`);
//             }
//         } catch (error) {
//             console.error("Error menyimpan alamat:", error);
//             alert("Gagal terhubung ke server.");
//         }
//     };

//     return (
//         <div className="min-h-screen bg-[#183D4B] p-6 md:p-10 text-white">
//             <div className="mx-auto max-w-4xl">
//                 <h1 className="text-3xl font-bold mb-6">{isEditMode ? 'Edit Alamat Pengiriman' : 'Formulir Alamat Baru'}</h1>
//                 <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/10 p-8 rounded-2xl shadow-lg">
                    
//                     <div className="flex flex-col gap-4">
//                         <select value={selectedProvince} onChange={(e) => {
//                             setSelectedProvince(e.target.value);
//                             setFormData(prev => ({...prev, provinsi: e.target.options[e.target.selectedIndex].text, kabupaten: '', kecamatan: '', kelurahan: ''}));
//                             setSelectedRegency(''); setSelectedDistrict(''); setRegencies([]); setDistricts([]); setVillages([]);
//                         }} className="bg-white/20 p-3 rounded-lg border border-white/30 text-white">
//                             <option value="" className="text-black">Pilih Provinsi</option>
//                             {provinces.map(p => <option key={p.id} value={p.id} className="text-black">{p.name}</option>)}
//                         </select>
                        
//                         <select value={selectedRegency} onChange={(e) => {
//                             setSelectedRegency(e.target.value);
//                             setFormData(prev => ({...prev, kabupaten: e.target.options[e.target.selectedIndex].text, kecamatan: '', kelurahan: ''}));
//                             setSelectedDistrict(''); setDistricts([]); setVillages([]);
//                         }} className="bg-white/20 p-3 rounded-lg border border-white/30 text-white" disabled={!selectedProvince}>
//                             <option value="" className="text-black">Pilih Kabupaten/Kota</option>
//                             {regencies.map(r => <option key={r.id} value={r.id} className="text-black">{r.name}</option>)}
//                         </select>

//                         <select value={selectedDistrict} onChange={(e) => {
//                             setSelectedDistrict(e.target.value);
//                             setFormData(prev => ({...prev, kecamatan: e.target.options[e.target.selectedIndex].text, kelurahan: ''}));
//                             setVillages([]);
//                         }} className="bg-white/20 p-3 rounded-lg border border-white/30 text-white" disabled={!selectedRegency}>
//                             <option value="" className="text-black">Pilih Kecamatan</option>
//                             {districts.map(d => <option key={d.id} value={d.id} className="text-black">{d.name}</option>)}
//                         </select>
                        
//                         <select
//                             value={villages.find(v => v.name === formData.kelurahan)?.id || ''}
//                             onChange={(e) => {
//                                 setFormData(prev => ({...prev, kelurahan: e.target.options[e.target.selectedIndex].text}));
//                             }} 
//                             className="bg-white/20 p-3 rounded-lg border border-white/30 text-white" 
//                             disabled={!selectedDistrict}
//                         >
//                             <option value="" className="text-black">Pilih Kelurahan</option>
//                             {villages.map(v => <option key={v.id} value={v.id} className="text-black">{v.name}</option>)}
//                         </select>
//                     </div>

//                     <div className="flex flex-col gap-4">
//                         <textarea name="detailAlamat" value={formData.detailAlamat} onChange={handleFormChange} placeholder="Nama Jalan, Gedung, No. Rumah" rows="4" className="bg-white/20 p-3 rounded-lg border border-white/30"></textarea>
//                         <div className="flex gap-4">
//                             <input name="rt" value={formData.rt} onChange={handleFormChange} placeholder="RT" className="w-full bg-white/20 p-3 rounded-lg border border-white/30"/>
//                             <input name="rw" value={formData.rw} onChange={handleFormChange} placeholder="RW" className="w-full bg-white/20 p-3 rounded-lg border border-white/30"/>
//                         </div>
//                     </div>

//                     <div className="md:col-span-2 h-80 rounded-lg overflow-hidden z-0">
//                          <MapContainer center={markerPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
//                             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors'/>
//                             <Marker position={markerPosition} draggable={true} eventHandlers={useMemo(() => ({
//                                 dragend(e) { setMarkerPosition(e.target.getLatLng()); },
//                             }), [])}></Marker>
//                             <MapEvents onPositionChange={setMarkerPosition} />
//                         </MapContainer>
//                     </div>
                    
//                     <div className="md:col-span-2 text-right">
//                         <button type="submit" className="bg-white text-[#183D4B] font-bold py-3 px-6 rounded-lg transition hover:bg-slate-200">
//                             Simpan Alamat
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }


// import React, { useState, useEffect} from 'react';
// import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
// import { useNavigate, useParams } from 'react-router-dom';
// import L from 'leaflet';

// // --- KONFIGURASI PENTING ---
// // Ganti dengan API Key Komerce Anda yang valid
// const KOMERCE_API_KEY = 'yABtIbyicc5dbdac281c8bd4XYxU5tUi';
// const KOMERCE_API_URL = 'https://rajaongkir.komerce.id/api/v1';
// const API_BASE_URL = 'http://localhost:8080/api';
// // -------------------------

// // Fix untuk ikon marker default Leaflet
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
//   iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
// });

// function MapEvents({ onPositionChange, mapRef }) {
//     const map = useMapEvents({
//         click(e) { onPositionChange(e.latlng); },
//         dragend() { onPositionChange(map.getCenter()); }
//     });
//     if (mapRef) mapRef.current = map;
//     return null;
// }

// export default function AddressForm() {
//     const navigate = useNavigate();
//     const { addressId } = useParams();
//     const isEditMode = Boolean(addressId);
//     const loggedInUserId = localStorage.getItem('loggedInUserId');
    
//     // State untuk data yang akan dikirim ke backend
//     const [formData, setFormData] = useState({ detailAlamat: '', rt: '', rw: '' });
//     // State untuk interaksi UI
//     const [searchTerm, setSearchTerm] = useState('');
//     const [searchResults, setSearchResults] = useState([]);
//     const [selectedLocation, setSelectedLocation] = useState(null);
//     const [isSearching, setIsSearching] = useState(false);
//     const [markerPosition, setMarkerPosition] = useState({ lat: -6.9175, lng: 107.6191 }); // Default Bandung
//     const mapRef = React.useRef();

//     // Fetch data alamat jika dalam mode edit
//     useEffect(() => {
//         if (isEditMode) {
//             fetch(`${API_BASE_URL}/addresses/${addressId}`)
//                 .then(res => res.ok ? res.json() : Promise.reject("Alamat tidak ditemukan"))
//                 .then(data => {
//                     setFormData({ detailAlamat: data.detailAlamat, rt: data.rt, rw: data.rw });
//                     const location = {
//                         id: data.destinationId,
//                         label: `${data.kelurahan}, ${data.kecamatan}, ${data.kabupaten}, ${data.provinsi}`,
//                         province_name: data.provinsi, city_name: data.kabupaten,
//                         district_name: data.kecamatan, subdistrict_name: data.kelurahan,
//                         zip_code: data.kodepos // Asumsi ada field kodepos
//                     };
//                     setSelectedLocation(location);
//                     setSearchTerm(location.label);
//                     if (data.latitude && data.longitude) {
//                         const newPos = { lat: data.latitude, lng: data.longitude };
//                         setMarkerPosition(newPos);
//                         if(mapRef.current) mapRef.current.flyTo(newPos, 15);
//                     }
//                 })
//                 .catch(err => {
//                     console.error("Gagal memuat alamat:", err);
//                     alert("Gagal memuat alamat.");
//                     navigate('/AddressListPage');
//                 });
//         }
//     }, [addressId, isEditMode, navigate]);

//     // Efek untuk mencari lokasi saat pengguna mengetik
//     useEffect(() => {
//         if (searchTerm.length < 3 || selectedLocation) {
//             setSearchResults([]);
//             return;
//         }
//         const handler = setTimeout(async () => {
//             setIsSearching(true);
//             try {
//                 const res = await fetch(`${KOMERCE_API_URL}/destination/domestic-destination?search=${searchTerm}`, {
//                     headers: { 'key': KOMERCE_API_KEY }
//                 });
//                 if (!res.ok) throw new Error('Pencarian lokasi gagal');
//                 const result = await res.json();
//                 setSearchResults(result.data || []);
//             } catch (error) {
//                 console.error(error);
//             } finally {
//                 setIsSearching(false);
//             }
//         }, 500); // Debounce 500ms

//         return () => clearTimeout(handler);
//     }, [searchTerm, selectedLocation]);

//     const handleSelectLocation = (location) => {
//         setSelectedLocation(location);
//         setSearchTerm(location.label);
//         setSearchResults([]);
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         if (!selectedLocation || !formData.detailAlamat) {
//             alert('Harap cari dan pilih lokasi, serta isi detail alamat.');
//             return;
//         }

//         const payload = {
//             detailAlamat: formData.detailAlamat,
//             rt: formData.rt,
//             rw: formData.rw,
//             provinsi: selectedLocation.province_name,
//             kabupaten: selectedLocation.city_name,
//             kecamatan: selectedLocation.district_name,
//             kelurahan: selectedLocation.subdistrict_name,
//             kodepos: selectedLocation.zip_code,
//             latitude: markerPosition.lat,
//             longitude: markerPosition.lng,
//             destinationId: selectedLocation.id.toString()
//         };

//         const url = isEditMode
//             ? `${API_BASE_URL}/addresses/${addressId}`
//             : `${API_BASE_URL}/pelanggan/${loggedInUserId}/addresses`;
//         const method = isEditMode ? 'PUT' : 'POST';

//         try {
//             const res = await fetch(url, {
//                 method,
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(payload)
//             });
//             if (!res.ok) throw new Error('Gagal menyimpan alamat ke server.');

//             alert(`Alamat berhasil ${isEditMode ? 'diperbarui' : 'disimpan'}!`);
//             navigate('/AddressListPage');
//         } catch (error) {
//             console.error("Error saat menyimpan:", error);
//             alert(error.message);
//         }
//     };
    
//     return (
//         <div className="min-h-screen bg-[#183D4B] p-6 md:p-10 text-white">
//             <div className="mx-auto max-w-4xl">
//                 <h1 className="text-3xl font-bold mb-6">{isEditMode ? 'Edit Alamat' : 'Tambah Alamat Baru'}</h1>
//                 <form onSubmit={handleSubmit} className="bg-white/10 p-8 rounded-2xl shadow-lg space-y-6">
//                     <div>
//                         <label className="block mb-2 font-semibold">Cari Kecamatan / Kelurahan</label>
//                         <div className="relative">
//                             <input
//                                 type="text"
//                                 value={searchTerm}
//                                 onChange={(e) => {
//                                     setSearchTerm(e.target.value);
//                                     setSelectedLocation(null);
//                                 }}
//                                 placeholder="Ketik minimal 3 huruf (cth: Hegarmanah)"
//                                 className="w-full p-3 rounded-lg bg-white/20 border border-white/30"
//                             />
//                             {isSearching && <span className="absolute right-3 top-3">🔍</span>}
//                         </div>
//                         {searchResults.length > 0 && (
//                             <ul className="bg-slate-800 mt-1 rounded-lg max-h-48 overflow-y-auto z-10">
//                                 {searchResults.map(loc => (
//                                     <li key={loc.id} onClick={() => handleSelectLocation(loc)} className="p-3 hover:bg-slate-700 cursor-pointer text-sm">
//                                         {loc.label}
//                                     </li>
//                                 ))}
//                             </ul>
//                         )}
//                     </div>
                    
//                     <div>
//                         <label className="block mb-2 font-semibold">Detail Alamat</label>
//                         <textarea name="detailAlamat" value={formData.detailAlamat} onChange={e => setFormData({...formData, detailAlamat: e.target.value})} placeholder="Nama Jalan, Gedung, No. Rumah" rows="3" className="w-full p-3 rounded-lg bg-white/20 border border-white/30"></textarea>
//                     </div>

//                     <div className="flex gap-4">
//                         <div className="flex-1">
//                             <label className="block mb-2 font-semibold">RT</label>
//                             <input name="rt" value={formData.rt} onChange={e => setFormData({...formData, rt: e.target.value})} placeholder="001" className="w-full p-3 rounded-lg bg-white/20 border border-white/30" />
//                         </div>
//                         <div className="flex-1">
//                             <label className="block mb-2 font-semibold">RW</label>
//                             <input name="rw" value={formData.rw} onChange={e => setFormData({...formData, rw: e.target.value})} placeholder="002" className="w-full p-3 rounded-lg bg-white/20 border border-white/30" />
//                         </div>
//                     </div>
                    
//                     <div>
//                         <label className="block mb-2 font-semibold">Tandai Lokasi di Peta</label>
//                         <div className="h-80 rounded-lg overflow-hidden z-0">
//                             <MapContainer center={markerPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
//                                 <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors'/>
//                                 <Marker position={markerPosition}></Marker>
//                                 <MapEvents onPositionChange={setMarkerPosition} mapRef={mapRef} />
//                             </MapContainer>
//                         </div>
//                     </div>
                    
//                     <div className="text-right pt-4">
//                         <button type="submit" className="bg-white text-[#183D4B] font-bold py-3 px-6 rounded-lg transition hover:bg-slate-200">
//                             Simpan Alamat
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }


import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useNavigate, useParams } from 'react-router-dom';
import L from 'leaflet';

// --- KONFIGURASI PENTING ---
// Ganti dengan API Key Komerce Anda yang valid
const KOMERCE_API_KEY = 'MASUKKAN_API_KEY_KOMERCE_ANDA_DI_SINI';
const KOMERCE_API_URL = 'https://rajaongkir.komerce.id/api/v1';
const API_WILAYAH_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';
const API_BASE_URL = 'http://localhost:8080/api';
// -------------------------

// Fix untuk ikon marker default Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function MapEvents({ onPositionChange }) {
    const map = useMapEvents({
        click(e) {
            onPositionChange(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
        dragend() {
            onPositionChange(map.getCenter());
        }
    });
    return null;
}

export default function AddressForm() {
    const navigate = useNavigate();
    const { addressId } = useParams();
    const isEditMode = Boolean(addressId);
    const loggedInUserId = localStorage.getItem('loggedInUserId');

    // State untuk form
    const [formData, setFormData] = useState({
        provinsi: '', kabupaten: '', kecamatan: '', kelurahan: '',
        detailAlamat: '', rt: '', rw: '',
    });
    const [markerPosition, setMarkerPosition] = useState({ lat: -6.9175, lng: 107.6191 });

    // State untuk dropdown dari emsifa.com
    const [provinces, setProvinces] = useState([]);
    const [regencies, setRegencies] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedRegency, setSelectedRegency] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    // --- PERUBAHAN DIMULAI DI SINI ---
    // State baru untuk menyimpan ID dari Komerce
    const [destinationId, setDestinationId] = useState(null);
    const [isFetchingDestinationId, setIsFetchingDestinationId] = useState(false);
    // -------------------------------

    // Fetch data alamat jika dalam mode edit
    useEffect(() => {
        if (isEditMode) {
            fetch(`${API_BASE_URL}/addresses/${addressId}`)
                .then(res => res.ok ? res.json() : Promise.reject("Alamat tidak ditemukan"))
                .then(data => {
                    setFormData(data);
                    setDestinationId(data.destinationId); // Muat destinationId yang sudah ada
                    if (data.latitude && data.longitude) {
                        setMarkerPosition({ lat: data.latitude, lng: data.longitude });
                    }
                    // Logika untuk mengisi ulang dropdown akan ditangani oleh useEffect lain
                })
                .catch(err => {
                    console.error("Gagal memuat alamat:", err);
                    navigate('/AddressListPage');
                });
        }
    }, [addressId, isEditMode, navigate]);

    // Fetch data provinsi dari emsifa.com
    useEffect(() => {
        fetch(`${API_WILAYAH_URL}/provinces.json`).then(res => res.json()).then(setProvinces);
    }, []);

    // Chain effect untuk dropdown
    useEffect(() => {
        if (selectedProvince) fetch(`${API_WILAYAH_URL}/regencies/${selectedProvince}.json`).then(res => res.json()).then(setRegencies);
    }, [selectedProvince]);

    useEffect(() => {
        if (selectedRegency) fetch(`${API_WILAYAH_URL}/districts/${selectedRegency}.json`).then(res => res.json()).then(setDistricts);
    }, [selectedRegency]);

    useEffect(() => {
        if (selectedDistrict) fetch(`${API_WILAYAH_URL}/villages/${selectedDistrict}.json`).then(res => res.json()).then(setVillages);
    }, [selectedDistrict]);

    // --- LOGIKA BARU UNTUK MENCARI DESTINATION ID ---
    // Efek ini berjalan SETELAH pengguna memilih kelurahan
    useEffect(() => {
        // Hanya berjalan jika semua field alamat teks sudah terisi dan destinationId belum ada
        if (formData.provinsi && formData.kabupaten && formData.kecamatan && formData.kelurahan && !destinationId) {
            const findDestinationId = async () => {
                setIsFetchingDestinationId(true);
                const searchTerm = `${formData.kelurahan}, ${formData.kecamatan}, ${formData.kabupaten}`;
                console.log("Mencari ID untuk:", searchTerm);
                try {
                    const res = await fetch(`${KOMERCE_API_URL}/destination/domestic-destination?search=${searchTerm}`, {
                        headers: { 'key': KOMERCE_API_KEY }
                    });
                    if (!res.ok) throw new Error('Pencarian Komerce gagal');
                    
                    const result = await res.json();
                    const locations = result.data || [];
                    
                    // Mencari kecocokan terbaik
                    const bestMatch = locations.find(loc => 
                        loc.subdistrict_name.toUpperCase() === formData.kelurahan.toUpperCase() &&
                        loc.district_name.toUpperCase() === formData.kecamatan.toUpperCase() &&
                        loc.city_name.toUpperCase() === formData.kabupaten.toUpperCase()
                    );

                    if (bestMatch) {
                        console.log("ID Ditemukan:", bestMatch.id);
                        setDestinationId(bestMatch.id.toString());
                    } else {
                        console.warn("Tidak ada kecocokan ID yang sempurna ditemukan untuk alamat ini.");
                    }
                } catch (error) {
                    console.error("Gagal mendapatkan destination ID:", error);
                } finally {
                    setIsFetchingDestinationId(false);
                }
            };
            findDestinationId();
        }
    }, [formData.provinsi, formData.kabupaten, formData.kecamatan, formData.kelurahan, destinationId]);
    // ----------------------------------------------------

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isFetchingDestinationId) {
            alert("Harap tunggu, sedang memverifikasi lokasi...");
            return;
        }

        if (!destinationId) {
            alert("Lokasi tidak dapat diverifikasi. Harap periksa kembali pilihan alamat Anda atau coba lagi.");
            return;
        }

        const payload = {
            ...formData,
            latitude: markerPosition.lat,
            longitude: markerPosition.lng,
            destinationId: destinationId // Mengirim ID yang sudah ditemukan
        };
        
        const url = isEditMode ? `${API_BASE_URL}/addresses/${addressId}` : `${API_BASE_URL}/pelanggan/${loggedInUserId}/addresses`;
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Gagal menyimpan alamat.');
            
            alert(`Alamat berhasil ${isEditMode ? 'diperbarui' : 'disimpan'}!`);
            navigate('/AddressListPage');
        } catch (error) {
            console.error("Error:", error);
            alert(error.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#183D4B] p-6 md:p-10 text-white">
            <div className="mx-auto max-w-4xl">
                <h1 className="text-3xl font-bold mb-6">{isEditMode ? 'Edit Alamat' : 'Tambah Alamat Baru'}</h1>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/10 p-8 rounded-2xl shadow-lg">
                    <div className="flex flex-col gap-4">
                        <select onChange={(e) => {
                            setSelectedProvince(e.target.value);
                            setFormData(prev => ({...prev, provinsi: e.target.options[e.target.selectedIndex].text, kabupaten: '', kecamatan: '', kelurahan: ''}));
                            setSelectedRegency(''); setSelectedDistrict(''); setDestinationId(null);
                        }} className="bg-black/20 p-3 rounded-lg border border-white/30">
                            <option value="" className="text-black">Pilih Provinsi</option>
                            {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        
                        
                        <select onChange={(e) => {
                            setSelectedRegency(e.target.value);
                            setFormData(prev => ({...prev, kabupaten: e.target.options[e.target.selectedIndex].text, kecamatan: '', kelurahan: ''}));
                            setSelectedDistrict(''); setDestinationId(null);
                        }} className="bg-black/20 p-3 rounded-lg border border-white/30" disabled={!selectedProvince}>
                            <option value="">Pilih Kabupaten/Kota</option>
                            {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>

                        <select onChange={(e) => {
                            setSelectedDistrict(e.target.value);
                            setFormData(prev => ({...prev, kecamatan: e.target.options[e.target.selectedIndex].text, kelurahan: ''}));
                            setDestinationId(null);
                        }} className="bg-black/20 p-3 rounded-lg border border-white/30" disabled={!selectedRegency}>
                            <option value="">Pilih Kecamatan</option>
                            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        
                        <select onChange={(e) => {
                            setFormData(prev => ({...prev, kelurahan: e.target.options[e.target.selectedIndex].text}));
                            setDestinationId(null); // Akan dicari oleh useEffect
                        }} className="bg-black/20 p-3 rounded-lg border border-white/30" disabled={!selectedDistrict}>
                            <option value="">Pilih Kelurahan</option>
                            {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-4">
                        <textarea name="detailAlamat" value={formData.detailAlamat} onChange={e => setFormData({...formData, detailAlamat: e.target.value})} placeholder="Nama Jalan, Gedung, No. Rumah" rows="4" className="bg-white/20 p-3 rounded-lg border border-white/30"></textarea>
                        <div className="flex gap-4">
                            <input name="rt" value={formData.rt} onChange={e => setFormData({...formData, rt: e.target.value})} placeholder="RT" className="w-full bg-white/20 p-3 rounded-lg border border-white/30"/>
                            <input name="rw" value={formData.rw} onChange={e => setFormData({...formData, rw: e.target.value})} placeholder="RW" className="w-full bg-white/20 p-3 rounded-lg border border-white/30"/>
                        </div>
                    </div>

                    <div className="md:col-span-2 h-80 rounded-lg overflow-hidden z-0">
                         <MapContainer center={markerPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
                             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors'/>
                             <Marker position={markerPosition} draggable={true} eventHandlers={useMemo(() => ({
                                 dragend(e) { setMarkerPosition(e.target.getLatLng()); },
                             }), [])}></Marker>
                             <MapEvents onPositionChange={setMarkerPosition} />
                         </MapContainer>
                    </div>
                    
                    <div className="md:col-span-2 text-right">
                        <button type="submit" className="bg-white text-[#183D4B] font-bold py-3 px-6 rounded-lg transition hover:bg-slate-200 disabled:bg-slate-400" disabled={isFetchingDestinationId}>
                            {isFetchingDestinationId ? 'Memverifikasi...' : 'Simpan Alamat'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}



// import React, { useState, useEffect, useMemo } from 'react';
// import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
// import { useNavigate, useParams } from 'react-router-dom';
// import L from 'leaflet';

// // Backend Anda akan menangani komunikasi dengan Komerce
// const API_WILAYAH_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';
// const API_BASE_URL = 'http://localhost:8080/api';

// // Fix untuk ikon marker default Leaflet
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
//   iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
// });

// // Komponen kecil untuk handle klik dan drag di peta
// function MapEvents({ onPositionChange }) {
//     const map = useMapEvents({
//         click(e) {
//             onPositionChange(e.latlng);
//             map.flyTo(e.latlng, map.getZoom());
//         },
//         dragend() {
//             onPositionChange(map.getCenter());
//         }
//     });
//     return null;
// }

// export default function AddressForm() {
//     const navigate = useNavigate();
//     const { addressId } = useParams();
//     const isEditMode = Boolean(addressId);
//     const loggedInUserId = localStorage.getItem('loggedInUserId');

//     // State untuk form
//     const [formData, setFormData] = useState({
//         provinsi: '', kabupaten: '', kecamatan: '', kelurahan: '',
//         detailAlamat: '', rt: '', rw: '',
//     });
//     const [markerPosition, setMarkerPosition] = useState({ lat: -6.9175, lng: 107.6191 });

//     // State untuk dropdown dari emsifa.com
//     const [provinces, setProvinces] = useState([]);
//     const [regencies, setRegencies] = useState([]);
//     const [districts, setDistricts] = useState([]);
//     const [villages, setVillages] = useState([]);
//     const [selectedProvince, setSelectedProvince] = useState('');
//     const [selectedRegency, setSelectedRegency] = useState('');
//     const [selectedDistrict, setSelectedDistrict] = useState('');

//     // --- PERUBAHAN DIMULAI DI SINI ---
//     // State baru untuk menyimpan ID dari Komerce dan status pencariannya
//     const [destinationId, setDestinationId] = useState(null);
//     const [isFetchingDestinationId, setIsFetchingDestinationId] = useState(false);
//     // -------------------------------

//     // Fetch data alamat jika dalam mode edit
//     useEffect(() => {
//         if (isEditMode) {
//             fetch(`${API_BASE_URL}/addresses/${addressId}`)
//                 .then(res => res.ok ? res.json() : Promise.reject("Alamat tidak ditemukan"))
//                 .then(data => {
//                     setFormData(data);
//                     // Muat destinationId yang sudah ada agar tidak perlu mencari lagi
//                     setDestinationId(data.destinationId);
//                     if (data.latitude && data.longitude) {
//                         setMarkerPosition({ lat: data.latitude, lng: data.longitude });
//                     }
//                     // Logika untuk mengisi ulang dropdown akan ditangani oleh useEffect lain
//                 })
//                 .catch(err => {
//                     console.error("Gagal memuat alamat:", err);
//                     navigate('/AddressListPage');
//                 });
//         }
//     }, [addressId, isEditMode, navigate]);

//     // Fetch data provinsi dari emsifa.com
//     useEffect(() => {
//         fetch(`${API_WILAYAH_URL}/provinces.json`).then(res => res.json()).then(setProvinces);
//     }, []);

//     // Chain effect untuk dropdown (tidak diubah)
//     useEffect(() => {
//         if (selectedProvince) fetch(`${API_WILAYAH_URL}/regencies/${selectedProvince}.json`).then(res => res.json()).then(setRegencies);
//     }, [selectedProvince]);

//     useEffect(() => {
//         if (selectedRegency) fetch(`${API_WILAYAH_URL}/districts/${selectedRegency}.json`).then(res => res.json()).then(setDistricts);
//     }, [selectedRegency]);

//     useEffect(() => {
//         if (selectedDistrict) fetch(`${API_WILAYAH_URL}/villages/${selectedDistrict}.json`).then(res => res.json()).then(setVillages);
//     }, [selectedDistrict]);


//     // --- LOGIKA BARU UNTUK MENCARI DESTINATION ID SECARA OTOMATIS ---
//     // Efek ini berjalan SETELAH pengguna memilih kelurahan dari dropdown
//     useEffect(() => {
//         // Hanya berjalan jika semua field alamat teks sudah terisi dan destinationId belum ada
//         const { provinsi, kabupaten, kecamatan, kelurahan } = formData;
//         if (provinsi && kabupaten && kecamatan && kelurahan && !destinationId) {
//             const findDestinationId = async () => {
//                 setIsFetchingDestinationId(true);
//                 const searchTerm = `${kelurahan}, ${kecamatan}, ${kabupaten}`;
//                 console.log("Mencari ID Komerce untuk:", searchTerm);
                
//                 try {
//                     // Panggil backend Anda sebagai proxy untuk menghindari CORS
//                     const res = await fetch(`${API_BASE_URL}/shipping/search-destination?search=${searchTerm}`);
//                     if (!res.ok) throw new Error('Pencarian Komerce gagal melalui server.');
                    
//                     const result = await res.json();
//                     const locations = result.data || [];
                    
//                     // Mencari kecocokan terbaik dari hasil pencarian
//                     const bestMatch = locations.find(loc => 
//                         loc.subdistrict_name.toUpperCase() === kelurahan.toUpperCase() &&
//                         loc.district_name.toUpperCase() === kecamatan.toUpperCase() &&
//                         loc.city_name.toUpperCase() === kabupaten.toUpperCase()
//                     );

//                     if (bestMatch) {
//                         console.log("ID Komerce Ditemukan:", bestMatch.id);
//                         setDestinationId(bestMatch.id.toString());
//                     } else {
//                         console.warn("Tidak ada kecocokan ID yang sempurna ditemukan untuk alamat ini.");
//                         // Anda bisa menampilkan notifikasi ke user di sini jika perlu
//                     }
//                 } catch (error) {
//                     console.error("Gagal mendapatkan destination ID:", error);
//                 } finally {
//                     setIsFetchingDestinationId(false);
//                 }
//             };
//             findDestinationId();
//         }
//     }, [formData.provinsi, formData.kabupaten, formData.kecamatan, formData.kelurahan, destinationId]);
//     // ----------------------------------------------------

//     const handleSubmit = async (e) => {
//         e.preventDefault();
        
//         if (isFetchingDestinationId) {
//             alert("Harap tunggu, sedang memverifikasi lokasi...");
//             return;
//         }

//         // Pengecekan baru: Pastikan ID sudah ditemukan sebelum menyimpan
//         if (!destinationId) {
//             alert("Lokasi tidak dapat diverifikasi oleh sistem pengiriman. Harap periksa kembali pilihan alamat Anda atau coba lagi.");
//             return;
//         }

//         const payload = {
//             ...formData,
//             latitude: markerPosition.lat,
//             longitude: markerPosition.lng,
//             destinationId: destinationId // Mengirim ID yang sudah ditemukan
//         };
        
//         const url = isEditMode ? `${API_BASE_URL}/addresses/${addressId}` : `${API_BASE_URL}/pelanggan/${loggedInUserId}/addresses`;
//         const method = isEditMode ? 'PUT' : 'POST';

//         try {
//             const res = await fetch(url, {
//                 method,
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(payload)
//             });
//             if (!res.ok) throw new Error('Gagal menyimpan alamat.');
            
//             alert(`Alamat berhasil ${isEditMode ? 'diperbarui' : 'disimpan'}!`);
//             navigate('/AddressListPage');
//         } catch (error) {
//             console.error("Error:", error);
//             alert(error.message);
//         }
//     };

//     return (
//         <div className="min-h-screen bg-[#183D4B] p-6 md:p-10 text-white">
//             <div className="mx-auto max-w-4xl">
//                 <h1 className="text-3xl font-bold mb-6">{isEditMode ? 'Edit Alamat Pengiriman' : 'Formulir Alamat Baru'}</h1>
//                 <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/10 p-8 rounded-2xl shadow-lg">
                    
//                     <div className="flex flex-col gap-4">
//                         <select value={selectedProvince} onChange={(e) => {
//                             setSelectedProvince(e.target.value);
//                             setFormData(prev => ({...prev, provinsi: e.target.options[e.target.selectedIndex].text, kabupaten: '', kecamatan: '', kelurahan: ''}));
//                             setSelectedRegency(''); setSelectedDistrict(''); setDestinationId(null); setRegencies([]); setDistricts([]); setVillages([]);
//                         }} className="bg-white/20 p-3 rounded-lg border border-white/30 text-white">
//                             <option value="" className="text-black">Pilih Provinsi</option>
//                             {provinces.map(p => <option key={p.id} value={p.id} className="text-black">{p.name}</option>)}
//                         </select>
                        
//                         <select value={selectedRegency} onChange={(e) => {
//                             setSelectedRegency(e.target.value);
//                             setFormData(prev => ({...prev, kabupaten: e.target.options[e.target.selectedIndex].text, kecamatan: '', kelurahan: ''}));
//                             setSelectedDistrict(''); setDestinationId(null); setDistricts([]); setVillages([]);
//                         }} className="bg-white/20 p-3 rounded-lg border border-white/30 text-white" disabled={!selectedProvince}>
//                             <option value="" className="text-black">Pilih Kabupaten/Kota</option>
//                             {regencies.map(r => <option key={r.id} value={r.id} className="text-black">{r.name}</option>)}
//                         </select>

//                         <select value={selectedDistrict} onChange={(e) => {
//                             setSelectedDistrict(e.target.value);
//                             setFormData(prev => ({...prev, kecamatan: e.target.options[e.target.selectedIndex].text, kelurahan: ''}));
//                             setDestinationId(null); setVillages([]);
//                         }} className="bg-white/20 p-3 rounded-lg border border-white/30 text-white" disabled={!selectedRegency}>
//                             <option value="" className="text-black">Pilih Kecamatan</option>
//                             {districts.map(d => <option key={d.id} value={d.id} className="text-black">{d.name}</option>)}
//                         </select>
                        
//                         <select
//                             value={villages.find(v => v.name === formData.kelurahan)?.id || ''}
//                             onChange={(e) => {
//                                 setFormData(prev => ({...prev, kelurahan: e.target.options[e.target.selectedIndex].text}));
//                                 setDestinationId(null); // Akan dicari secara otomatis oleh useEffect
//                             }} 
//                             className="bg-white/20 p-3 rounded-lg border border-white/30 text-white" 
//                             disabled={!selectedDistrict}
//                         >
//                             <option value="" className="text-black">Pilih Kelurahan</option>
//                             {villages.map(v => <option key={v.id} value={v.id} className="text-black">{v.name}</option>)}
//                         </select>
//                     </div>

//                     <div className="flex flex-col gap-4">
//                         <textarea name="detailAlamat" value={formData.detailAlamat} onChange={e => setFormData({...formData, detailAlamat: e.target.value})} placeholder="Nama Jalan, Gedung, No. Rumah" rows="4" className="bg-white/20 p-3 rounded-lg border border-white/30"></textarea>
//                         <div className="flex gap-4">
//                             <input name="rt" value={formData.rt} onChange={e => setFormData({...formData, rt: e.target.value})} placeholder="RT" className="w-full bg-white/20 p-3 rounded-lg border border-white/30"/>
//                             <input name="rw" value={formData.rw} onChange={e => setFormData({...formData, rw: e.target.value})} placeholder="RW" className="w-full bg-white/20 p-3 rounded-lg border border-white/30"/>
//                         </div>
//                     </div>

//                     <div className="md:col-span-2 h-80 rounded-lg overflow-hidden z-0">
//                          <MapContainer center={markerPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
//                              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors'/>
//                              <Marker position={markerPosition} draggable={true} eventHandlers={useMemo(() => ({
//                                  dragend(e) { setMarkerPosition(e.target.getLatLng()); },
//                              }), [])}></Marker>
//                              <MapEvents onPositionChange={setMarkerPosition} />
//                          </MapContainer>
//                     </div>
                    
//                     <div className="md:col-span-2 text-right">
//                         <button type="submit" className="bg-white text-[#183D4B] font-bold py-3 px-6 rounded-lg transition hover:bg-slate-200 disabled:bg-slate-400" disabled={isFetchingDestinationId}>
//                             {isFetchingDestinationId ? 'Memverifikasi Lokasi...' : 'Simpan Alamat'}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }



// import React, { useState, useEffect, useMemo } from 'react';
// import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
// import { useNavigate, useParams } from 'react-router-dom';
// import L from 'leaflet';

// // Backend Anda akan menangani komunikasi dengan Komerce
// const API_WILAYAH_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';
// const API_BASE_URL = 'http://localhost:8080/api';

// // Fix untuk ikon marker default Leaflet
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
//   iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
// });

// // Komponen kecil untuk handle klik dan drag di peta
// function MapEvents({ onPositionChange }) {
//     const map = useMapEvents({
//         click(e) {
//             onPositionChange(e.latlng);
//             map.flyTo(e.latlng, map.getZoom());
//         },
//         dragend() {
//             onPositionChange(map.getCenter());
//         }
//     });
//     return null;
// }

// export default function AddressForm() {
//     const navigate = useNavigate();
//     const { addressId } = useParams();
//     const isEditMode = Boolean(addressId);
//     const loggedInUserId = localStorage.getItem('loggedInUserId');

//     // State untuk form
//     const [formData, setFormData] = useState({
//         provinsi: '', kabupaten: '', kecamatan: '', kelurahan: '',
//         detailAlamat: '', rt: '', rw: '',
//     });
//     const [markerPosition, setMarkerPosition] = useState({ lat: -6.9175, lng: 107.6191 });

//     // State untuk dropdown dari emsifa.com
//     const [provinces, setProvinces] = useState([]);
//     const [regencies, setRegencies] = useState([]);
//     const [districts, setDistricts] = useState([]);
//     const [villages, setVillages] = useState([]);
//     const [selectedProvince, setSelectedProvince] = useState('');
//     const [selectedRegency, setSelectedRegency] = useState('');
//     const [selectedDistrict, setSelectedDistrict] = useState('');

//     // State baru untuk menyimpan ID dari Komerce dan status pencariannya
//     const [destinationId, setDestinationId] = useState(null);
//     const [isFetchingDestinationId, setIsFetchingDestinationId] = useState(false);
    
//     // Fetch data alamat jika dalam mode edit
//     useEffect(() => {
//         if (isEditMode) {
//             fetch(`${API_BASE_URL}/addresses/${addressId}`)
//                 .then(res => res.ok ? res.json() : Promise.reject("Alamat tidak ditemukan"))
//                 .then(data => {
//                     setFormData(data);
//                     setDestinationId(data.destinationId);
//                     if (data.latitude && data.longitude) {
//                         setMarkerPosition({ lat: data.latitude, lng: data.longitude });
//                     }
//                 })
//                 .catch(err => {
//                     console.error("Gagal memuat alamat:", err);
//                     navigate('/AddressListPage');
//                 });
//         }
//     }, [addressId, isEditMode, navigate]);

//     // Fetch data provinsi dari emsifa.com
//     useEffect(() => {
//         fetch(`${API_WILAYAH_URL}/provinces.json`).then(res => res.json()).then(setProvinces);
//     }, []);

//     // Chain effect untuk dropdown (tidak diubah)
//     useEffect(() => {
//         if (selectedProvince) fetch(`${API_WILAYAH_URL}/regencies/${selectedProvince}.json`).then(res => res.json()).then(setRegencies);
//     }, [selectedProvince]);

//     useEffect(() => {
//         if (selectedRegency) fetch(`${API_WILAYAH_URL}/districts/${selectedRegency}.json`).then(res => res.json()).then(setDistricts);
//     }, [selectedRegency]);

//     useEffect(() => {
//         if (selectedDistrict) fetch(`${API_WILAYAH_URL}/villages/${selectedDistrict}.json`).then(res => res.json()).then(setVillages);
//     }, [selectedDistrict]);


//     // --- LOGIKA PENCARIAN ID DENGAN PENCOCOKAN YANG LEBIH BAIK ---
//     useEffect(() => {
//         const { provinsi, kabupaten, kecamatan, kelurahan } = formData;
//         // Hanya berjalan jika semua field alamat teks sudah terisi dan destinationId belum ada atau NULL
//         if (provinsi && kabupaten && kecamatan && kelurahan && !destinationId) {
//             const findDestinationId = async () => {
//                 setIsFetchingDestinationId(true);
//                 const searchTerm = `${kelurahan}, ${kecamatan}, ${kabupaten}`;
//                 console.log("Mencari ID Komerce untuk:", searchTerm);
                
//                 try {
//                     const res = await fetch(`${API_BASE_URL}/shipping/search-destination?search=${searchTerm}`);
//                     if (!res.ok) throw new Error('Pencarian Komerce gagal melalui server.');
                    
//                     const result = await res.json();
//                     const locations = result.data || [];
                    
//                     // --- LOGIKA PENCOCOKAN YANG DIPERBARUI ---
//                     // Menghilangkan "KABUPATEN " atau "KOTA " untuk pencocokan yang lebih fleksibel
//                     const cleanKabupaten = kabupaten.replace("KABUPATEN ", "").replace("KOTA ", "");

//                     // 1. Mencari kecocokan yang paling sempurna
//                     let bestMatch = locations.find(loc => 
//                         loc.subdistrict_name.toUpperCase() === kelurahan.toUpperCase() &&
//                         loc.district_name.toUpperCase() === kecamatan.toUpperCase() &&
//                         loc.city_name.toUpperCase() === cleanKabupaten.toUpperCase()
//                     );

//                     // 2. Jika tidak ada kecocokan sempurna, coba cari yang lebih longgar
//                     if (!bestMatch) {
//                          console.warn("Pencocokan sempurna gagal, mencoba pencocokan yang lebih longgar...");
//                          bestMatch = locations.find(loc => 
//                             loc.subdistrict_name.toUpperCase() === kelurahan.toUpperCase() &&
//                             loc.district_name.toUpperCase() === kecamatan.toUpperCase()
//                          );
//                     }

//                     if (bestMatch) {
//                         console.log("ID Komerce Ditemukan:", bestMatch.id);
//                         setDestinationId(bestMatch.id.toString());
//                     } else {
//                         console.warn("Tidak ada kecocokan ID yang ditemukan untuk alamat ini.");
//                     }
//                 } catch (error) {
//                     console.error("Gagal mendapatkan destination ID:", error);
//                 } finally {
//                     setIsFetchingDestinationId(false);
//                 }
//             };
//             findDestinationId();
//         }
//     }, [formData.provinsi, formData.kabupaten, formData.kecamatan, formData.kelurahan, destinationId]);
//     // ----------------------------------------------------

//     const handleSubmit = async (e) => {
//         e.preventDefault();
        
//         if (isFetchingDestinationId) {
//             alert("Harap tunggu, sedang memverifikasi lokasi...");
//             return;
//         }

//         if (!destinationId) {
//             alert("Lokasi tidak dapat diverifikasi oleh sistem pengiriman. Harap periksa kembali pilihan alamat Anda atau coba lagi.");
//             return;
//         }

//         const payload = {
//             ...formData,
//             latitude: markerPosition.lat,
//             longitude: markerPosition.lng,
//             destinationId: destinationId
//         };
        
//         const url = isEditMode ? `${API_BASE_URL}/addresses/${addressId}` : `${API_BASE_URL}/pelanggan/${loggedInUserId}/addresses`;
//         const method = isEditMode ? 'PUT' : 'POST';

//         try {
//             const res = await fetch(url, {
//                 method,
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(payload)
//             });
//             if (!res.ok) throw new Error('Gagal menyimpan alamat.');
            
//             alert(`Alamat berhasil ${isEditMode ? 'diperbarui' : 'disimpan'}!`);
//             navigate('/AddressListPage');
//         } catch (error) {
//             console.error("Error:", error);
//             alert(error.message);
//         }
//     };

//     return (
//         <div className="min-h-screen bg-[#183D4B] p-6 md:p-10 text-white">
//             <div className="mx-auto max-w-4xl">
//                 <h1 className="text-3xl font-bold mb-6">{isEditMode ? 'Edit Alamat Pengiriman' : 'Formulir Alamat Baru'}</h1>
//                 <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/10 p-8 rounded-2xl shadow-lg">
                    
//                     <div className="flex flex-col gap-4">
//                         <select value={selectedProvince} onChange={(e) => {
//                             setSelectedProvince(e.target.value);
//                             setFormData(prev => ({...prev, provinsi: e.target.options[e.target.selectedIndex].text, kabupaten: '', kecamatan: '', kelurahan: ''}));
//                             setSelectedRegency(''); setSelectedDistrict(''); setDestinationId(null); setRegencies([]); setDistricts([]); setVillages([]);
//                         }} className="bg-white/20 p-3 rounded-lg border border-white/30 text-white">
//                             <option value="" className="text-black">Pilih Provinsi</option>
//                             {provinces.map(p => <option key={p.id} value={p.id} className="text-black">{p.name}</option>)}
//                         </select>
                        
//                         <select value={selectedRegency} onChange={(e) => {
//                             setSelectedRegency(e.target.value);
//                             setFormData(prev => ({...prev, kabupaten: e.target.options[e.target.selectedIndex].text, kecamatan: '', kelurahan: ''}));
//                             setSelectedDistrict(''); setDestinationId(null); setDistricts([]); setVillages([]);
//                         }} className="bg-white/20 p-3 rounded-lg border border-white/30 text-white" disabled={!selectedProvince}>
//                             <option value="" className="text-black">Pilih Kabupaten/Kota</option>
//                             {regencies.map(r => <option key={r.id} value={r.id} className="text-black">{r.name}</option>)}
//                         </select>

//                         <select value={selectedDistrict} onChange={(e) => {
//                             setSelectedDistrict(e.target.value);
//                             setFormData(prev => ({...prev, kecamatan: e.target.options[e.target.selectedIndex].text, kelurahan: ''}));
//                             setDestinationId(null); setVillages([]);
//                         }} className="bg-white/20 p-3 rounded-lg border border-white/30 text-white" disabled={!selectedRegency}>
//                             <option value="" className="text-black">Pilih Kecamatan</option>
//                             {districts.map(d => <option key={d.id} value={d.id} className="text-black">{d.name}</option>)}
//                         </select>
                        
//                         <select
//                             value={villages.find(v => v.name === formData.kelurahan)?.id || ''}
//                             onChange={(e) => {
//                                 setFormData(prev => ({...prev, kelurahan: e.target.options[e.target.selectedIndex].text}));
//                                 setDestinationId(null); // Akan dicari secara otomatis oleh useEffect
//                             }} 
//                             className="bg-white/20 p-3 rounded-lg border border-white/30 text-white" 
//                             disabled={!selectedDistrict}
//                         >
//                             <option value="" className="text-black">Pilih Kelurahan</option>
//                             {villages.map(v => <option key={v.id} value={v.id} className="text-black">{v.name}</option>)}
//                         </select>
//                     </div>

//                     <div className="flex flex-col gap-4">
//                         <textarea name="detailAlamat" value={formData.detailAlamat} onChange={e => setFormData({...formData, detailAlamat: e.target.value})} placeholder="Nama Jalan, Gedung, No. Rumah" rows="4" className="bg-white/20 p-3 rounded-lg border border-white/30"></textarea>
//                         <div className="flex gap-4">
//                             <input name="rt" value={formData.rt} onChange={e => setFormData({...formData, rt: e.target.value})} placeholder="RT" className="w-full bg-white/20 p-3 rounded-lg border border-white/30"/>
//                             <input name="rw" value={formData.rw} onChange={e => setFormData({...formData, rw: e.target.value})} placeholder="RW" className="w-full bg-white/20 p-3 rounded-lg border border-white/30"/>
//                         </div>
//                     </div>

//                     <div className="md:col-span-2 h-80 rounded-lg overflow-hidden z-0">
//                          <MapContainer center={markerPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
//                              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors'/>
//                              <Marker position={markerPosition} draggable={true} eventHandlers={useMemo(() => ({
//                                  dragend(e) { setMarkerPosition(e.target.getLatLng()); },
//                              }), [])}></Marker>
//                              <MapEvents onPositionChange={setMarkerPosition} />
//                          </MapContainer>
//                     </div>
                    
//                     <div className="md:col-span-2 text-right">
//                         <button type="submit" className="bg-white text-[#183D4B] font-bold py-3 px-6 rounded-lg transition hover:bg-slate-200 disabled:bg-slate-400" disabled={isFetchingDestinationId}>
//                             {isFetchingDestinationId ? 'Memverifikasi Lokasi...' : 'Simpan Alamat'}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }

