import { Suspense } from "react";
import { DashboardContent } from "@/components/dashboard-content";
import { ProtectedHeader } from "@/components/protected-header";

export default function ProtectedPage() {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
        <ProtectedHeader />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Suspense fallback={
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
                  <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        }>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}
