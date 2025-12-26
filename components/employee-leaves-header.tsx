"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/sidebar-provider";

export function EmployeeLeavesHeader() {
  const { isCollapsed, toggleSidebar, toggleMobile } = useSidebar();

  return (
    <div className="flex h-16 items-center justify-between px-4 lg:px-8 border-b bg-white dark:bg-gray-900">
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

        <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-pink-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
          Leaves
        </h1>
      </div>
    </div>
  );
}

