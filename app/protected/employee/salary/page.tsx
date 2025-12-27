import { EmployeeSalaryHeader } from "@/components/employee-salary-header";
import { EmployeeSalaryContent } from "@/components/employee-salary-content";

export default function EmployeeSalaryPage() {
  return (
    <div className="flex flex-col h-full">
      <EmployeeSalaryHeader />
      <div className="flex-1 overflow-y-auto">
        <EmployeeSalaryContent />
      </div>
    </div>
  );
}

