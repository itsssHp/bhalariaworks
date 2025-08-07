"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import { parseISO, format, addMonths, isBefore } from "date-fns";

type Employee = {
  uid: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  position: string;
};

type PayStatuses = {
  [employeeId: string]: string;
};

function getMonthKeysBetween(start: string, end: string): string[] {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  const keys: string[] = [];

  let current = startDate;
  while (!isBefore(endDate, current)) {
    keys.push(format(current, "yyyy-MM"));
    current = addMonths(current, 1);
  }

  return keys;
}

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payStatuses, setPayStatuses] = useState<PayStatuses>({});
  const [payPeriodStart, setPayPeriodStart] = useState("");
  const [payPeriodEnd, setPayPeriodEnd] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      const snapshot = await getDocs(collection(db, "employees"));
      const data = snapshot.docs.map((doc) => {
        const emp = doc.data() as Omit<Employee, "uid">;
        return { ...emp, uid: doc.id };
      });
      setEmployees(data);
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const checkPayStatus = async () => {
      if (!payPeriodStart || !payPeriodEnd) return;

      const requiredMonths = getMonthKeysBetween(payPeriodStart, payPeriodEnd);
      const statuses: PayStatuses = {};

      for (const emp of employees) {
        const q = query(
          collection(db, "paystubs"),
          where("uid", "==", emp.uid)
        );
        const snapshot = await getDocs(q);

        const employeeStubMonths = new Set<string>();
        snapshot.forEach((doc) => {
          const data = doc.data();
          const payPeriod = data.payPeriod;
          if (payPeriod?.start && payPeriod?.end) {
            const stubStart = format(parseISO(payPeriod.start), "yyyy-MM");
            employeeStubMonths.add(stubStart);
          }
        });

        const allMonthsExist = requiredMonths.every((m) =>
          employeeStubMonths.has(m)
        );

        statuses[emp.employeeId] = allMonthsExist ? "Paid" : "Pending";
      }

      setPayStatuses(statuses);
    };

    if (employees.length > 0 && payPeriodStart && payPeriodEnd) {
      checkPayStatus();
    }
  }, [employees, payPeriodStart, payPeriodEnd]);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-100 to-blue-50 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/hr/dashboard"
          className="inline-block mb-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 font-semibold transition"
        >
          ← Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
            📋 Payroll - Employee Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Click any employee below to view and process their paystub for the
            selected period.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 flex flex-wrap gap-6">
          <div className="flex flex-col">
            <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">
              Pay Period Start
            </label>
            <input
              type="date"
              value={payPeriodStart}
              onChange={(e) => setPayPeriodStart(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex flex-col">
            <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">
              Pay Period End
            </label>
            <input
              type="date"
              value={payPeriodEnd}
              onChange={(e) => setPayPeriodEnd(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-blue-100 dark:bg-gray-700 text-gray-700 dark:text-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">EMP ID</th>
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">
                  Department
                </th>
                <th className="text-left px-4 py-3 font-semibold">Position</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">
                  Pay Status
                </th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, index) => (
                <tr
                  key={emp.employeeId}
                  className={`${
                    index % 2 === 0
                      ? "bg-white dark:bg-gray-800"
                      : "bg-gray-50 dark:bg-gray-700"
                  }`}
                >
                  <td className="px-4 py-3 text-gray-800 dark:text-white">
                    {emp.employeeId}
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-white">
                    {emp.name}
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-white">
                    {emp.email}
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-white">
                    {emp.department}
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-white">
                    {emp.position}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-xs font-semibold px-3 py-1 rounded-full">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {payPeriodStart && payPeriodEnd ? (
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full ${
                          payStatuses[emp.employeeId] === "Paid"
                            ? "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
                            : "bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200"
                        }`}
                      >
                        {payStatuses[emp.employeeId] || "Checking..."}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-sm">
                        No period
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/hr/payroll/${emp.employeeId}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded shadow-sm transition"
                    >
                      View Paystub
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {employees.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-6">
            No employees found.
          </p>
        )}
      </div>
    </div>
  );
}
