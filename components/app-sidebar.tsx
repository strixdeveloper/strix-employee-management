"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Settings,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  CalendarCheck,
  FolderKanban,
  CalendarX,
  Timer,
  FileText,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavUser } from "@/components/nav-user";
import { useSidebar } from "@/components/sidebar-provider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import strixLogo from "../app/Strix-logo-1.png";

type MenuItem = {
  title: string;
  url?: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: {
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
};

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/protected",
    icon: LayoutDashboard,
  },
  {
    title: "Reports",
    url: "/protected/reports",
    icon: FileText,
  },
  {
    title: "Employees",
    url: "/protected/employees",
    icon: Users,
  },
  {
    title: "Attendance",
    url: "/protected/attendance",
    icon: CalendarCheck,
  },
  {
    title: "Projects",
    url: "/protected/projects",
    icon: FolderKanban,
  },
  {
    title: "Leaves",
    url: "/protected/leaves",
    icon: CalendarX,
  },
  {
    title: "Overtime",
    url: "/protected/overtime",
    icon: Timer,
  },
  {
    title: "Salary",
    url: "/protected/salary",
    icon: DollarSign,
  },
  {
    title: "Office Hours",
    url: "/protected/office-hours",
    icon: Clock,
  },
  {
    title: "Settings",
    icon: Settings,
    subItems: [
      {
        title: "Profile",
        url: "/protected/settings/profile",
        icon: User,
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar();
  const [openSettings, setOpenSettings] = React.useState(false);

  // Auto-expand Settings if we're on a settings sub-page
  React.useEffect(() => {
    if (pathname?.startsWith("/protected/settings/")) {
      setOpenSettings(true);
    }
  }, [pathname]);

  // Close sub-menus when sidebar is collapsed
  React.useEffect(() => {
    if (isCollapsed) {
      setOpenSettings(false);
    }
  }, [isCollapsed]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex h-full flex-col border-r bg-background transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center border-b px-3 lg:px-6">
          <Link
            href="/protected"
            className={cn(
              "flex items-center gap-2 transition-all",
              isCollapsed ? "justify-center w-full" : ""
            )}
          >
            {isCollapsed ? (
              <div className="h-10 w-10 rounded bg-gradient-to-r from-pink-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">S</span>
              </div>
            ) : (
              <Image
                src={strixLogo}
                alt="Strix Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            )}
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto py-4">
          <nav className={cn("space-y-1", isCollapsed ? "px-2" : "px-3")}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              
              // Handle items with sub-menus
              if (item.subItems && !isCollapsed) {
                const isSettingsActive = pathname?.startsWith("/protected/settings/");
                const isSettingsOpen = openSettings;
                
                return (
                  <Collapsible
                    key={item.title}
                    open={isSettingsOpen}
                    onOpenChange={setOpenSettings}
                  >
                    <CollapsibleTrigger
                      className={cn(
                        "w-full flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors gap-3",
                        isSettingsActive
                          ? "bg-gradient-to-r from-pink-500/10 to-fuchsia-500/10 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.title}</span>
                      {isSettingsOpen ? (
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1 space-y-1">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = pathname === subItem.url;
                        return (
                          <Link
                            key={subItem.url}
                            href={subItem.url}
                            onClick={closeMobile}
                            className={cn(
                              "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors gap-3 ml-6",
                              isSubActive
                                ? "bg-gradient-to-r from-pink-500/10 to-fuchsia-500/10 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <SubIcon className="h-4 w-4 flex-shrink-0" />
                            <span>{subItem.title}</span>
                          </Link>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              }
              
              // Handle regular menu items (or Settings when collapsed)
              const isActive = pathname === item.url || (item.title === "Settings" && pathname?.startsWith("/protected/settings/"));
              const displayUrl = item.url || (item.subItems?.[0]?.url);
              
              return (
                <Link
                  key={item.title}
                  href={displayUrl || "#"}
                  onClick={closeMobile}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isCollapsed ? "justify-center" : "gap-3",
                    isActive
                      ? "bg-gradient-to-r from-pink-500/10 to-fuchsia-500/10 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Section */}
        <div className="border-t p-2 lg:p-4">
          <NavUser />
        </div>
      </div>
    </>
  );
}

