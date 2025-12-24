"use client";

import { Menu, ArrowLeft } from "lucide-react";
import { useSidebar } from "@/components/sidebar-provider";
import { Button } from "@/components/ui/button";

interface SalaryHeaderProps {
  isCreateMode?: boolean;
  onBack?: () => void;
}

export function SalaryHeader({ isCreateMode = false, onBack }: SalaryHeaderProps) {
  const { isCollapsed, toggleSidebar, toggleMobile } = useSidebar();

  return (
    <div className="flex h-16 items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleMobile}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={toggleSidebar}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {isCreateMode ? (
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Salaries
          </Button>
        ) : (
          <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-pink-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
            Salary
          </h1>
        )}
      </div>
    </div>
  );
}

