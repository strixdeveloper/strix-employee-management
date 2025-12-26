"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/sidebar-provider";

export function ProtectedLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't render admin sidebar for employee routes (note: /protected/employee not /protected/employees)
  // /protected/employees is an admin route, /protected/employee/* is employee route
  const isEmployeeRoute = pathname?.startsWith("/protected/employee/");

  if (isEmployeeRoute) {
    // Employee routes will use their own layout with EmployeeSidebar
    // Still need SidebarProvider for EmployeeSidebar to work
    return (
      <SidebarProvider>
        {children}
      </SidebarProvider>
    );
  }

  // Admin routes use AppSidebar (including /protected/employees, /protected, etc.)
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

