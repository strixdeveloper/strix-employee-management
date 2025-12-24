import { Suspense } from "react";
import { DashboardContent } from "@/components/dashboard-content";

export default function ProtectedPage() {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
          </div>
        </div>
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
