"use client";

import { ReactNode } from "react";
import EmployeeSidebar from "@/components/employee/employee-sidebar";
import RoleGuard from "@/components/RoleGuard";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["employee"]}>
      <div className="min-h-screen">
        {/* ✅ Sidebar stays fixed on desktop */}
        <EmployeeSidebar />

        {/* ✅ Main content
            - pt-16 for topbar height on mobile
            - md:ml-64 to make space for fixed sidebar on desktop
        */}
        <main className="pt-16 md:pt-0 md:ml-64 px-4 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
