import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

const getUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export async function DashboardContent() {
  const user = await getUser();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {user?.email?.split("@")[0] || "User"}!
          </h2>
          <p className="text-muted-foreground">
            Manage your employee management system from here.
          </p>
        </div>

        {/* Dashboard Content - Blank for now */}
        <div className="grid gap-6">
          {/* Placeholder cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Employees
                </p>
                <p className="text-3xl font-bold">0</p>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Active Today
                </p>
                <p className="text-3xl font-bold">0</p>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Departments
                </p>
                <p className="text-3xl font-bold">0</p>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="rounded-lg border bg-card p-8 shadow-sm min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Dashboard Content
              </p>
              <p className="text-sm text-muted-foreground">
                Your dashboard content will appear here
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

