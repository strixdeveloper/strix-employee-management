import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthCheck } from "@/components/auth-check";

export default function ProtectedLayout({
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
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="h-full w-full">
              {children}
            </div>
          </main>
        </div>
      </AuthCheck>
    </Suspense>
  );
}
