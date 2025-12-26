"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/sidebar-provider";
import { useEffect, useState } from "react";

export function ProtectedLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Don't render admin sidebar for employee routes (note: /protected/employee not /protected/employees)
  const isEmployeeRoute = pathname?.startsWith("/protected/employee");

  // Wait for mount to avoid hydration mismatch
  if (!mounted) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <div className="w-64 flex-shrink-0"></div>
          <main className="flex-1 overflow-auto lg:ml-0">
            <div className="h-full w-full">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (isEmployeeRoute) {
    // Employee routes will use their own layout with EmployeeSidebar
    // Still need SidebarProvider for EmployeeSidebar to work
    return (
      <SidebarProvider>
        {children}
      </SidebarProvider>
    );
  }

  // Admin routes use AppSidebar (including /protected/employees)
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto lg:ml-0">
          <div className="h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

