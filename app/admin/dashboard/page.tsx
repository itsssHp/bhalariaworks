// ✅ File: app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import RoleGuard from "@/components/RoleGuard";
import StatCard from "@/components/shared/StatCard";
import "@/lib/registerCharts";
import { Pie } from "react-chartjs-2";

const Line = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), {
  ssr: false,
});

interface DashboardStats {
  totalEmployees: number;
  totalAdmins: number;
  totalHR: number;
  pendingLeaves: number;
  activeToday: number;
  weeklyClockIns: Record<string, number>;
  deptCounts: Record<string, number>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDocs(
          query(collection(db, "employees"), where("uid", "==", user.uid))
        );
        if (!snap.empty) {
          const name = snap.docs[0].data().name || "Admin";
          const role = snap.docs[0].data().role || "unknown";
          const ip = window.location.hostname;
          setUserName(name);

          // ✅ Log login success
          await addDoc(collection(db, "audit-logs"), {
            actor: name,
            action: "Login Success",
            details: `Logged in to dashboard`,
            ip,
            role,
            timestamp: Timestamp.now(),
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchStats() {
      const [empSnap, adminSnap, hrSnap, leaveSnap] = await Promise.all([
        getDocs(collection(db, "employees")),
        getDocs(
          query(collection(db, "employees"), where("role", "==", "admin"))
        ),
        getDocs(query(collection(db, "employees"), where("role", "==", "hr"))),
        getDocs(
          query(
            collection(db, "leave-requests"),
            where("status", "==", "Pending")
          )
        ),
      ]);

      const totalEmployees = empSnap.size;
      const deptCounts: Record<string, number> = {};
      empSnap.docs.forEach((doc) => {
        const dept = doc.data().department || "Unknown";
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });

      const today = new Date().toISOString().split("T")[0];
      const attSnap = await getDocs(
        query(collection(db, "attendance-records"), where("date", "==", today))
      );
      const activeToday = attSnap.docs.filter(
        (doc) => doc.data().clockIn && !doc.data().clockOut
      ).length;

      const weeklyClockIns: Record<string, number> = {};
      const now = new Date();
      const start = new Date();
      start.setDate(now.getDate() - 6);
      const startDate = start.toISOString().split("T")[0];

      const weekSnap = await getDocs(collection(db, "attendance-records"));
      weekSnap.docs.forEach((doc) => {
        const data = doc.data();
        const date = data.date;
        if (date >= startDate && data.clockIn) {
          weeklyClockIns[date] = (weeklyClockIns[date] || 0) + 1;
        }
      });

      setStats({
        totalEmployees,
        totalAdmins: adminSnap.size,
        totalHR: hrSnap.size,
        pendingLeaves: leaveSnap.size,
        activeToday,
        weeklyClockIns,
        deptCounts,
      });
    }

    fetchStats();
  }, []);

  if (!stats) {
    return (
      <p className="p-6 text-gray-600 dark:text-gray-300">
        Loading dashboard...
      </p>
    );
  }

  const lineChartData = {
    labels: Object.keys(stats.weeklyClockIns).sort(),
    datasets: [
      {
        label: "Clock-ins (last 7 days)",
        data: Object.keys(stats.weeklyClockIns)
          .sort()
          .map((d) => stats.weeklyClockIns[d]),
        fill: true,
        backgroundColor: "rgba(59,130,246,0.2)",
        borderColor: "#3b82f6",
        tension: 0.3,
      },
    ],
  };

  const donutData = {
    labels: Object.keys(stats.deptCounts),
    datasets: [
      {
        label: "Department Distribution",
        data: Object.values(stats.deptCounts),
        backgroundColor: [
          "#3b82f6",
          "#10b981",
          "#f59e0b",
          "#ef4444",
          "#6366f1",
          "#ec4899",
          "#14b8a6",
        ],
        borderColor: "#fff",
        borderWidth: 1,
      },
    ],
  };

  return (
    <RoleGuard allowedRoles={["admin", "super-admin"]}>
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-6 py-5 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {userName} 👋</h1>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              Here’s what’s happening today.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            icon="👥"
            bg="bg-blue-100"
            href="/admin/employees"
          />
          <StatCard
            title="Admins"
            value={stats.totalAdmins}
            icon="🛠"
            bg="bg-green-100"
            href="/admin/employees"
          />
          <StatCard
            title="HR Members"
            value={stats.totalHR}
            icon="📋"
            bg="bg-yellow-100"
            href="/admin/employees"
          />
          <StatCard
            title="Pending Leaves"
            value={stats.pendingLeaves}
            icon="⏳"
            bg="bg-red-100"
            href="/admin/leaves"
          />
          <StatCard
            title="Active Today"
            value={stats.activeToday}
            icon="✅"
            bg="bg-teal-100"
            href="/admin/attendance"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 w-full">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Weekly Attendance Trend
            </h2>
            <div className="w-full h-[280px]">
              <Line
                data={lineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: false,
                  plugins: {
                    legend: { display: true, position: "top" },
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { color: "#6b7280" },
                    },
                    y: {
                      grid: { color: "#e5e7eb" },
                      ticks: { color: "#6b7280" },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 w-full">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Department Distribution
            </h2>
            <div className="w-full max-w-[400px] mx-auto h-[280px]">
              <Pie
                data={donutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        color: "#6b7280",
                        padding: 20,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
