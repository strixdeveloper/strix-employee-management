import { LeavesHeader } from "@/components/leaves-header";
import { LeavesContent } from "@/components/leaves-content";

export default function LeavesPage() {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
        <LeavesHeader />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto w-full">
        <LeavesContent />
      </div>
    </div>
  );
}

