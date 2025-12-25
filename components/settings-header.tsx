"use client";

import { usePathname } from "next/navigation";

export function SettingsHeader() {
  const pathname = usePathname();
  
  const getTitle = () => {
    if (pathname?.includes("/office-hours")) {
      return "Office Hours";
    }
    if (pathname?.includes("/profile")) {
      return "Profile";
    }
    return "Settings";
  };

  return (
    <div className="flex h-16 items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-pink-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
          {getTitle()}
        </h1>
      </div>
    </div>
  );
}

