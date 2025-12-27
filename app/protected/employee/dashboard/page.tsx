import { EmployeeDashboardHeader } from "@/components/employee-dashboard-header";
import { EmployeeDashboardContent } from "@/components/employee-dashboard-content";

export default function EmployeeDashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <EmployeeDashboardHeader />
      <div className="flex-1 overflow-y-auto">
        <EmployeeDashboardContent />
      </div>
    </div>
  );
}

