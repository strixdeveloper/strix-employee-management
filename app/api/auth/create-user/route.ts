import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST - Create a new user account in Supabase Auth
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const body = await request.json();

    const {
      email,
      password,
      username,
      first_name,
      avatar_url,
      employee_id,
      role = "employee",
    } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: first_name || username || email.split("@")[0],
        username: username || email.split("@")[0],
        avatar_url: avatar_url || null,
        employee_id: employee_id || null,
        role: role,
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Update user metadata with role (if you have a custom user_metadata structure)
    // You might want to store this in a separate table for better role management
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authData.user.id,
      {
        user_metadata: {
          ...authData.user.user_metadata,
          role: role,
          employee_id: employee_id,
        },
      }
    );

    if (updateError) {
      console.error("Error updating user metadata:", updateError);
      // Don't fail the request, user is already created
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username: username || email.split("@")[0],
          role: role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

