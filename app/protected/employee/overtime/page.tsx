import { Suspense } from "react";
import { EmployeeOvertimeHeader } from "@/components/employee-overtime-header";
import { EmployeeOvertimeContent } from "@/components/employee-overtime-content";

export default function EmployeeOvertimePage() {
  return (
    <div className="flex flex-col h-full">
      <EmployeeOvertimeHeader />
      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-4">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          </div>
        }>
          <EmployeeOvertimeContent />
        </Suspense>
      </div>
    </div>
  );
}

