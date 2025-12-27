import { EmployeeLeavesHeader } from "@/components/employee-leaves-header";
import { EmployeeLeavesContent } from "@/components/employee-leaves-content";

export default function EmployeeLeavesPage() {
  return (
    <div className="flex flex-col h-full">
      <EmployeeLeavesHeader />
      <div className="flex-1 overflow-y-auto">
        <EmployeeLeavesContent />
      </div>
    </div>
  );
}

