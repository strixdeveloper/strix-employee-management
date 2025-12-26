import { EmployeeLeavesHeader } from "@/components/employee-leaves-header";

export default function EmployeeLeavesPage() {
  return (
    <div className="flex flex-col h-full">
      <EmployeeLeavesHeader />
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
            <p className="text-muted-foreground text-center">
              Leaves content will be added here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

