import { ReportsHeader } from "@/components/reports-header";
import { ReportsContent } from "@/components/reports-content";

export default function ReportsPage() {
  return (
    <div className="flex flex-col h-screen">
      <ReportsHeader />
      <div className="flex-1 overflow-auto">
        <ReportsContent />
      </div>
    </div>
  );
}

