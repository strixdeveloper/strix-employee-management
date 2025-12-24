"use client";

import { useState, useRef } from "react";
import { SalaryContent } from "@/components/salary-content";
import { SalaryHeader } from "@/components/salary-header";

export default function SalaryPage() {
  const [isCreateMode, setIsCreateMode] = useState(false);
  const salaryContentRef = useRef<{ handleBackToTable: () => void } | null>(null);

  const handleBackToTable = () => {
    setIsCreateMode(false);
    // Also call the internal reset if available
    if (salaryContentRef.current?.handleBackToTable) {
      salaryContentRef.current.handleBackToTable();
    } else {
      // Fallback: if ref not set yet, just update state
      // The useEffect in SalaryContent will handle the reset
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
        <SalaryHeader isCreateMode={isCreateMode} onBack={handleBackToTable} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <SalaryContent 
          isCreateMode={isCreateMode}
          onCreateModeChange={setIsCreateMode}
          onBackRef={(handler: () => void) => {
            salaryContentRef.current = { handleBackToTable: handler };
          }}
        />
      </div>
    </div>
  );
}

