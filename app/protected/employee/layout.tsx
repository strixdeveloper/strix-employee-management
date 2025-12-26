import { Suspense } from "react";
import { EmployeeSidebar } from "@/components/employee-sidebar";
import { SidebarProvider } from "@/components/sidebar-provider";
import { AuthCheck } from "@/components/auth-check";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full overflow-hidden">
        <div className="flex-1 overflow-auto flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <AuthCheck>
        <SidebarProvider>
          <div className="flex h-screen w-full overflow-hidden">
            <EmployeeSidebar />
            <main className="flex-1 overflow-auto lg:ml-0">
              <div className="h-full w-full">
                {children}
              </div>
            </main>
          </div>
        </SidebarProvider>
      </AuthCheck>
    </Suspense>
  );
}

