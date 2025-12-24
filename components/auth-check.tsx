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

  return <>{children}</>;
}

