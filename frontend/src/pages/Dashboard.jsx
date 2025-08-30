import React, { useState} from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBox,
  FaClipboardList,
  FaChartPie,
  FaSignOutAlt,
  FaDollarSign,
  FaUsers,
  FaShoppingBag,
} from "react-icons/fa";
import { RiEBikeLine } from "react-icons/ri";

// --- KOMPONEN BARU: KARTU OVERVIEW ---
const OverviewCard = ({ icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center">
        <div className={`p-4 rounded-full mr-4 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

// --- KOMPONEN BARU: TABEL MANAJEMEN TRANSAKSI ---
const TransactionTable = () => {
    // Data dummy ini akan Anda ganti dengan data dari API backend Anda
    const [transactions, setTransactions] = useState([
        { id: 'TRX-001', customerName: 'Budi Santoso', date: '2025-08-30', total: 150000, status: 'Pending' },
        { id: 'TRX-002', customerName: 'Citra Lestari', date: '2025-08-29', total: 250000, status: 'Paid' },
        { id: 'TRX-003', customerName: 'Ahmad Abdullah', date: '2025-08-28', total: 85000, status: 'Success' },
        { id: 'TRX-004', customerName: 'Dewi Anggraini', date: '2025-08-27', total: 320000, status: 'Success' },
    ]);
    // const navigate = useNavigate();

    // useEffect(() => {
    //   // Di sini Anda akan melakukan fetch ke backend untuk mendapatkan data transaksi
    //   // fetch('/api/transactions')
    //   //   .then(res => res.json())
    //   //   .then(data => setTransactions(data));
    // }, []);

    const handleStatusChange = (transactionId, newStatus) => {
        // Logika untuk mengirim update ke backend
        console.log(`Mengubah status transaksi ${transactionId} menjadi ${newStatus}`);
        // Simulasi update di frontend untuk sementara
        setTransactions(prev =>
            prev.map(t => t.id === transactionId ? { ...t, status: newStatus } : t)
        );
        // Anda akan menambahkan fetch() ke backend di sini untuk update permanen
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Paid': return 'bg-blue-100 text-blue-800';
            case 'Success': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Transaksi Terbaru</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-gray-600">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-4 font-semibold">ID Transaksi</th>
                            <th className="p-4 font-semibold">Nama Pelanggan</th>
                            <th className="p-4 font-semibold">Tanggal</th>
                            <th className="p-4 font-semibold">Total</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(trx => (
                            <tr key={trx.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-mono text-sm text-gray-800">{trx.id}</td>
                                <td className="p-4">{trx.customerName}</td>
                                <td className="p-4">{trx.date}</td>
                                <td className="p-4 font-medium">Rp {trx.total.toLocaleString('id-ID')}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(trx.status)}`}>
                                        {trx.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <select 
                                        value={trx.status} 
                                        onChange={(e) => handleStatusChange(trx.id, e.target.value)}
                                        className="bg-gray-50 border border-gray-300 rounded-md p-1.5 text-gray-700 text-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Success">Success</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- KOMPONEN UTAMA DASHBOARD ADMIN ---
const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [ setSidebarOpen] = useState(false);

  const handleMenuClick = (path) => {
    if (path) navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[#183D4B] text-white flex flex-col">
        <div className="p-6 text-center border-b border-gray-700">
          <img
            src="https://i.pinimg.com/1200x/07/9a/bb/079abb280809dc376ef64617d75ffc97.jpg"
            alt="profile"
            className="w-20 h-20 rounded-full mx-auto mb-2 object-cover"
          />
          <h2 className="font-semibold">Dwi wahyu susilowati</h2>
          <p className="text-sm">dwiwahyu@gmail.com</p>
        </div>

        <nav className="flex-1 p-4 space-y-3">
          <button
            onClick={() => handleMenuClick("/Dashboard")} // Ganti path sesuai routing Anda
            className="flex w-full items-center space-x-2 px-3 py-2 hover:bg-[#254B5B] rounded-r-full transition"
          >
            <FaBars /> <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleMenuClick("/InventoryTable")}
            className="flex w-full items-center space-x-2 px-3 py-2 hover:bg-[#254B5B] rounded-r-full transition"
          >
            <FaBox /> <span>Inventory</span>
          </button>

          <button
            onClick={() => handleMenuClick("/orders")}
            className="flex w-full items-center space-x-2 px-3 py-2 hover:bg-[#254B5B] rounded-r-full transition"
          >
            <FaClipboardList /> <span>Pembayaran</span>
          </button>

          

          
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => handleMenuClick("/")}
            className="flex w-full items-center space-x-2 px-3 py-2 hover:bg-[#254B5B] rounded-r-full transition"
          >
            <FaSignOutAlt /> <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Admin</h1>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <OverviewCard 
                icon={<FaDollarSign size={24} className="text-green-800"/>}
                title="Total Pendapatan"
                value="Rp 15.750.000"
                color="bg-green-100"
            />
             <OverviewCard 
                icon={<FaShoppingBag size={24} className="text-blue-800"/>}
                title="Pesanan Baru"
                value="12"
                color="bg-blue-100"
            />
             <OverviewCard 
                icon={<FaUsers size={24} className="text-purple-800"/>}
                title="Pelanggan Aktif"
                value="254"
                color="bg-purple-100"
            />
        </div>
        
        {/* Transaction Table */}
        <div className="mt-8">
            <TransactionTable />
        </div>
      </main>
    </div>
  );
};

export default DashboardAdmin;
