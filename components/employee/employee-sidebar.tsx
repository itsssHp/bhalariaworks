"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FaTachometerAlt,
  FaSuitcase,
  FaTasks,
  FaUserCircle,
  FaSignOutAlt,
  FaClock,
  FaBriefcaseMedical,
  FaFileInvoiceDollar,
  FaClipboardList,
  FaHistory,
} from "react-icons/fa";

export default function EmployeeSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("isEmployeeLoggedIn");
    router.push("/login");
  };

  const linkClasses = (path: string) =>
    `flex items-center gap-2 p-3 rounded-lg transition-colors duration-200 ${
      pathname === path
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-semibold"
        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
    }`;

  return (
    <aside className="fixed top-0 left-0 w-64 h-full bg-white dark:bg-gray-900 shadow-lg p-6 overflow-y-auto">
      {/* Header */}
      <div className="text-xl font-bold text-blue-600 dark:text-blue-400 px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-center whitespace-nowrap overflow-hidden text-ellipsis sticky top-0 bg-white dark:bg-gray-900 z-10">
        Bhalaria Works
      </div>

      {/* Navigation */}
      <nav className="flex flex-col space-y-3 mt-4">
        <Link href="/employee" className={linkClasses("/employee")}>
          <FaTachometerAlt /> Dashboard
        </Link>
        <Link
          href="/employee/attendance-history"
          className={linkClasses("/employee/attendance-history")}
        >
          <FaHistory /> Attendance History
        </Link>
        <Link href="/employee/leave" className={linkClasses("/employee/leave")}>
          <FaSuitcase /> Leave
        </Link>
        <Link
          href="/employee/projects"
          className={linkClasses("/employee/projects")}
        >
          <FaTasks /> Projects
        </Link>
        <Link href="/employee/clock" className={linkClasses("/employee/clock")}>
          <FaClock /> Clock In/Out
        </Link>
        <Link
          href="/employee/benefits"
          className={linkClasses("/employee/benefits")}
        >
          <FaBriefcaseMedical /> Benefits
        </Link>
        <Link
          href="/employee/paystub"
          className={linkClasses("/employee/paystub")}
        >
          <FaFileInvoiceDollar /> Pay Stub
        </Link>
        <Link href="/employee/job" className={linkClasses("/employee/job")}>
          <FaClipboardList /> Job Post
        </Link>
        <Link
          href="/employee/profile"
          className={linkClasses("/employee/profile")}
        >
          <FaUserCircle /> Profile
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg mt-10 transition-colors duration-200"
        >
          <FaSignOutAlt /> Logout
        </button>
      </nav>
    </aside>
  );
}
