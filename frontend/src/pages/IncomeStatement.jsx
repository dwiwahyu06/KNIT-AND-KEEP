import React, { useEffect, useState } from "react";
import axios from "axios";

const IncomeStatement = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:8080/api/reports/income-statement")

      .then(res => {
        setReport(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading laporan...</p>;
  if (!report) return <p>Tidak ada data laporan</p>;

  return (
    <div className="max-w-lg mx-auto mt-8 bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-center">Laporan Laba Rugi</h2>
      <div className="space-y-2">
        <p><strong>Pendapatan (Revenue):</strong> Rp {report.revenue.toLocaleString()}</p>
        <p><strong>HPP:</strong> Rp {report.hpp.toLocaleString()}</p>
        <p><strong>Total Pengeluaran:</strong> Rp {report.expense.toLocaleString()}</p>
        <hr />
        <p className="text-lg font-semibold">
          Laba/Rugi: Rp {report.profit.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default IncomeStatement;
