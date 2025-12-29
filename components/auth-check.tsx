import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

const getUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export async function AuthCheck({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Role-based access control
  // Get user role from metadata
  const userRole = user.user_metadata?.role || null;
  // If role is empty/null, user is admin. Otherwise use the actual role
  const role = (!userRole || userRole === "") ? "admin" : userRole;

  // Note: Pathname-based redirects are handled in proxy.ts middleware
  // This component just ensures user is authenticated
  // Role-based redirects happen at the middleware level for better security

  return <>{children}</>;
}

