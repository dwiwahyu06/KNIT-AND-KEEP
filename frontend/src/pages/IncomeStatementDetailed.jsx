import React, { useEffect, useState } from "react";
import axios from "axios";

const IncomeStatementDetailed = () => {
  const [r, setR] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:8080/api/reports/income-statement/detailed")
      .then(res => { setR(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading laporan...</p>;
  if (!r) return <p>Tidak ada data laporan</p>;

  const cur = (n) => `Rp ${Number(n || 0).toLocaleString("id-ID")}`;

  return (
    <div className="max-w-2xl mx-auto bg-white shadow rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-4 text-center">Laporan Laba Rugi (Detil)</h2>

      <div className="space-y-2">
        <div className="flex justify-between"><span>Pendapatan (Revenue)</span><span>{cur(r.revenue)}</span></div>
        <div className="flex justify-between"><span>HPP</span><span>{cur(r.hpp)}</span></div>
        <hr />
        <div className="flex justify-between font-semibold"><span>Laba Kotor</span><span>{cur(r.grossProfit)}</span></div>
        <div className="flex justify-between"><span>Beban Operasional</span><span>{cur(r.operatingExpense)}</span></div>
        <hr />
        <div className="flex justify-between font-semibold"><span>Laba Usaha</span><span>{cur(r.operatingProfit)}</span></div>
        <div className="flex justify-between"><span>Pendapatan/Beban Lain-lain (net)</span><span>{cur(r.otherIncomeExpense)}</span></div>
        <div className="flex justify-between"><span>Pajak</span><span>{cur(r.tax)}</span></div>
        <hr />
        <div className="flex justify-between text-lg font-bold"><span>Laba Bersih</span><span>{cur(r.netProfit)}</span></div>
      </div>
    </div>
  );
};

export default IncomeStatementDetailed;
