"use client";

import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useTheme } from "next-themes";

interface PayStub {
  name: string;
  empId: string;
  department: string;
  baseRate: number;
  bonus: number;
  overtime: number;
  deductions: number;
  hoursWorked: number;
  email: string;
  netPay: number;
  payPeriod: {
    end: string;
  };
  month: string;
}

export default function PayStubPage() {
  const [payStubs, setPayStubs] = useState<PayStub[]>([]);
  const [selectedMonthYear, setSelectedMonthYear] = useState("");
  const [currentStub, setCurrentStub] = useState<PayStub | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const empId = localStorage.getItem("employeeId");
    if (!empId) return;

    const q = query(collection(db, "paystubs"), where("empId", "==", empId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const result: PayStub[] = snapshot.docs.map(
        (doc) => doc.data() as PayStub
      );
      setPayStubs(result);

      if (result.length > 0) {
        const first = result[0];
        const year = new Date(first.payPeriod.end).getFullYear();
        setSelectedMonthYear(`${first.month}-${year}`);
        setCurrentStub(first);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedMonthYear || payStubs.length === 0) return;

    const [month, year] = selectedMonthYear.split("-");
    const found = payStubs.find(
      (stub) =>
        stub.month === month &&
        new Date(stub.payPeriod.end).getFullYear().toString() === year
    );
    if (found) setCurrentStub(found);
  }, [selectedMonthYear, payStubs]);

  if (!currentStub) {
    return (
      <div className="p-6 text-gray-700 dark:text-gray-200">
        <h1 className="text-xl font-semibold mb-4">My Paystubs</h1>
        <p>Loading or no paystubs found.</p>
      </div>
    );
  }

  const basePay = currentStub.baseRate * currentStub.hoursWorked;
  const totalEarnings = basePay + currentStub.bonus + currentStub.overtime;
  const totalDeductions = currentStub.deductions;
  const netPay = totalEarnings - totalDeductions;

  const chartData = payStubs.map((stub) => {
    const label = `${stub.month}-${new Date(stub.payPeriod.end).getFullYear()}`;
    const base = stub.baseRate * stub.hoursWorked;
    return {
      label,
      net: base + stub.bonus + stub.overtime - stub.deductions,
    };
  });

  const uniqueMonthYears = Array.from(
    new Set(
      payStubs.map(
        (p) => `${p.month}-${new Date(p.payPeriod.end).getFullYear()}`
      )
    )
  );

  const downloadPDF = async () => {
    const input = pdfRef.current;
    if (!input) return;

    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`PayStub-${selectedMonthYear}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          Pay Stub - {selectedMonthYear}
        </h1>
        <div className="flex gap-3">
          <select
            value={selectedMonthYear}
            onChange={(e) => setSelectedMonthYear(e.target.value)}
            className="border px-3 py-1 rounded-md bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
          >
            {uniqueMonthYears.map((monthYear) => (
              <option key={monthYear} value={monthYear}>
                {monthYear}
              </option>
            ))}
          </select>
          <button
            onClick={downloadPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-md mb-6">
        <h2 className="text-center font-semibold text-green-700 dark:text-green-400 mb-2">
          📈 Net Pay Overview
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme === "dark" ? "#444" : "#ccc"}
            />
            <XAxis
              dataKey="label"
              stroke={theme === "dark" ? "#ddd" : "#000"}
            />
            <YAxis stroke={theme === "dark" ? "#ddd" : "#000"} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#10b981"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* PDF Section */}
      <div
        ref={pdfRef}
        style={{
          background: "#ffffff",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "800px",
          margin: "0 auto",
          fontSize: "13px",
          fontFamily: "Arial, sans-serif",
          color: "#000000",
          border: "1px solid #ccc",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            fontSize: "16px",
            textAlign: "center",
            marginBottom: "8px",
          }}
        >
          Bhalaria Metal Craft Pvt Ltd
        </div>
        <p
          style={{
            textAlign: "center",
            fontSize: "10px",
            marginBottom: "20px",
          }}
        >
          Raj Asman, Ground Floor, Swami Satyanandji Maharaj Marg, Off
          Radhaswami Satsang Road, Bhayandar West, Mira Bhayandar, Maharashtra
          401101, India
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <div>
            <p>
              <strong>Name:</strong> {currentStub.name}
            </p>
            <p>
              <strong>Employee ID:</strong> {currentStub.empId}
            </p>
            <p>
              <strong>Email:</strong> {currentStub.email}
            </p>
          </div>
          <div>
            <p>
              <strong>Department:</strong> {currentStub.department}
            </p>
            <p>
              <strong>Pay Period End:</strong> {currentStub.payPeriod?.end}
            </p>
          </div>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "16px",
          }}
        >
          <thead>
            <tr style={{ background: "#eee" }}>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "6px",
                  textAlign: "left",
                }}
              >
                Description
              </th>
              <th style={{ border: "1px solid #ccc", padding: "6px" }}>
                Earnings
              </th>
              <th style={{ border: "1px solid #ccc", padding: "6px" }}>
                Deductions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                Base Pay
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                ₹{currentStub.baseRate} × {currentStub.hoursWorked} hrs = ₹
                {basePay}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                -
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                Bonus
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                ₹{currentStub.bonus}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                -
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                Overtime
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                ₹{currentStub.overtime}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                -
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                Deductions
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                -
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                ₹{currentStub.deductions}
              </td>
            </tr>
            <tr style={{ background: "#f9f9f9", fontWeight: "bold" }}>
              <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                Total
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                ₹{totalEarnings}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                ₹{totalDeductions}
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
          }}
        >
          <span>Net Pay:</span>
          <span style={{ color: "green", fontSize: "18px" }}>₹{netPay}</span>
        </div>
      </div>
    </div>
  );
}
