"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { NavUser } from "@/components/nav-user";
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
    title: "Settings",
    url: "/protected/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/protected" className="flex items-center gap-2">
          <Image
            src={strixLogo}
            alt="Strix Logo"
            width={120}
            height={40}
            className="h-8 w-auto"
          />
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.url;
            return (
              <Link
                key={item.url}
                href={item.url}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gradient-to-r from-pink-500/10 to-fuchsia-500/10 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-4">
        <NavUser />
      </div>
    </div>
  );
}

