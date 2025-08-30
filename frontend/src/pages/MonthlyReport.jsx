import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";

const SAMPLE_ORDERS = [
  { id: 1, date: "2025-08-01", total: 250000, payment: "Cash" },
  { id: 2, date: "2025-08-02", total: 500000, payment: "Transfer" },
  { id: 3, date: "2025-08-02", total: 300000, payment: "QRIS" },
  { id: 4, date: "2025-08-03", total: 400000, payment: "Cash" },
  { id: 5, date: "2025-08-03", total: 200000, payment: "Transfer" },
  { id: 6, date: "2025-08-04", total: 350000, payment: "QRIS" },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function MonthlyReport() {
  const [month, setMonth] = useState("2025-08");

  const filteredOrders = useMemo(() => {
    return SAMPLE_ORDERS.filter((o) => o.date.startsWith(month));
  }, [month]);

  const summary = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);

    const byDate = {};
    const byPayment = {};
    filteredOrders.forEach((o) => {
      byDate[o.date] = (byDate[o.date] || 0) + o.total;
      byPayment[o.payment] = (byPayment[o.payment] || 0) + o.total;
    });

    const dailyData = Object.entries(byDate).map(([date, total]) => ({
      date,
      total,
    }));
    const paymentData = Object.entries(byPayment).map(([method, total]) => ({
      name: method,
      value: total,
    }));

    return { totalOrders, totalRevenue, dailyData, paymentData };
  }, [filteredOrders]);

  const handleDownloadPDF = () => {
    import("jspdf").then(({ default: jsPDF }) => {
      import("html2canvas").then((html2canvas) => {
        const input = document.getElementById("report-section");
        html2canvas.default(input).then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF("p", "mm", "a4");
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save("Laporan_Bulanan.pdf");
        });
      });
    });
  };

  return (
    <div className="p-6 space-y-6 bg-[#183D4B] min-h-screen text-white">
      <h1 className="text-2xl font-bold">Laporan Bulanan Penjualan</h1>

      <div className="flex justify-between items-center">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="p-2 rounded text-black"
        />
        <Button onClick={handleDownloadPDF} className="bg-white text-[#183D4B]">
          Download PDF
        </Button>
      </div>

      <div id="report-section" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white text-[#183D4B]">
            <CardContent className="p-4">
              <p className="text-lg font-semibold">Total Orders</p>
              <p className="text-2xl">{summary.totalOrders}</p>
            </CardContent>
          </Card>
          <Card className="bg-white text-[#183D4B]">
            <CardContent className="p-4">
              <p className="text-lg font-semibold">Total Revenue</p>
              <p className="text-2xl">Rp {summary.totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-white text-[#183D4B]">
            <CardContent className="p-4">
              <p className="text-lg font-semibold">Bulan</p>
              <p className="text-2xl">{month}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white text-[#183D4B]">
            <CardContent className="p-4">
              <h2 className="font-semibold mb-4">Grafik Penjualan Harian</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={summary.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#183D4B" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white text-[#183D4B]">
            <CardContent className="p-4">
              <h2 className="font-semibold mb-4">Metode Pembayaran</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={summary.paymentData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {summary.paymentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white text-[#183D4B]">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-4">Detail Harian</h2>
            <table className="w-full border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">Tanggal</th>
                  <th className="border px-2 py-1">Total Penjualan</th>
                </tr>
              </thead>
              <tbody>
                {summary.dailyData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{row.date}</td>
                    <td className="border px-2 py-1">
                      Rp {row.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
