"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Settings,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavUser } from "@/components/nav-user";
import { useSidebar } from "@/components/sidebar-provider";
import strixLogo from "../app/Strix-logo-1.png";

const menuItems = [
  {
    title: "Dashboard",
    url: "/protected",
    icon: LayoutDashboard,
  },
  {
    title: "Employees",
    url: "/protected/employees",
    icon: Users,
  },
  {
    title: "Salary",
    url: "/protected/salary",
    icon: DollarSign,
  },
  {
    title: "Settings",
    url: "/protected/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
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
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex h-full flex-col border-r bg-background transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center border-b px-3 lg:px-6">
          <Link
            href="/protected"
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
        <div className="flex-1 overflow-auto py-4">
          <nav className={cn("space-y-1", isCollapsed ? "px-2" : "px-3")}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.url;
              return (
                <Link
                  key={item.url}
                  href={item.url}
                  onClick={closeMobile}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isCollapsed ? "justify-center" : "gap-3",
                    isActive
                      ? "bg-gradient-to-r from-pink-500/10 to-fuchsia-500/10 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Section */}
        <div className="border-t p-2 lg:p-4">
          <NavUser />
        </div>
      </div>
    </>
  );
}

