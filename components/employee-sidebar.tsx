"use client";

import * as React from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarX,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavUser } from "@/components/nav-user";
import { useSidebar } from "@/components/sidebar-provider";
import strixLogo from "../app/Strix-logo-1.png";

type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/protected/employee/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Attendance",
    url: "/protected/employee/attendance",
    icon: CalendarCheck,
  },
  {
    title: "Leaves",
    url: "/protected/employee/leaves",
    icon: CalendarX,
  },
];

export function EmployeeSidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar();

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex h-full flex-col border-r bg-background transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center border-b px-3 lg:px-6">
          <Link
            href="/protected/employee/dashboard"
            className={cn(
              "flex items-center gap-2 transition-all",
              isCollapsed ? "justify-center w-full" : ""
            )}
          >
            {isCollapsed ? (
              <div className="h-10 w-10 rounded bg-gradient-to-r from-pink-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">S</span>
              </div>
            ) : (
              <Image
                src={strixLogo}
                alt="Strix Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 lg:p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.url;

              return (
                <li key={item.url}>
                  <Link
                    href={item.url}
                    onClick={closeMobile}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white shadow-lg shadow-pink-500/50"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t p-3 lg:p-4">
          <NavUser />
        </div>
      </aside>
    </>
  );
}

