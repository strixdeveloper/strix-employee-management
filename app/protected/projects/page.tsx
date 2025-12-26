import { Suspense } from "react";
import { ProjectsContent } from "@/components/projects-content";
import { ProjectsHeader } from "@/components/projects-header";

export default function ProjectsPage() {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
        <ProjectsHeader />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto w-full">
        <Suspense fallback={
          <div className="p-8 w-full">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
              </div>
            </div>
          </div>
        }>
          <ProjectsContent />
        </Suspense>
      </div>
    </div>
  );
}

