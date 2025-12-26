import { LeavesHeader } from "@/components/leaves-header";

export default function LeavesPage() {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
        <LeavesHeader />
      </div>

      {/* Main Content - Blank Container */}
      <div className="flex-1 overflow-auto w-full">
        <div className="p-4 lg:p-8 w-full">
          <div className="max-w-7xl mx-auto">
            {/* Blank container - ready for content */}
          </div>
        </div>
      </div>
    </div>
  );
}

