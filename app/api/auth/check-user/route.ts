import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Check if user exists for an employee email
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // List all users and find by email
    const { data: usersData, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const user = usersData?.users?.find((u) => u.email === email);
    
    if (!user) {
      return NextResponse.json(
        { exists: false },
        { status: 200 }
      );
    }

    // Get role from user metadata
    const role = user.user_metadata?.role || null;
    // If role is empty/null, user is admin. Otherwise display the actual role
    const displayRole = (!role || role === "") ? "admin" : role;

    return NextResponse.json(
      {
        exists: true,
        user: {
          id: user.id,
          email: user.email,
          role: displayRole,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Check user error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

