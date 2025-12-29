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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Log password info for debugging (without exposing the actual password)
    console.log("Creating user with:", {
      email: email.toLowerCase().trim(),
      passwordLength: password.length,
      passwordStartsWith: password.substring(0, 2) + "...",
      hasSpecialChars: /[!@#$%^*]/.test(password),
    });

    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      return NextResponse.json(
        { error: "Failed to check existing users" },
        { status: 500 }
      );
    }

    const existingUser = existingUsers?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return NextResponse.json(
        { 
          error: "User with this email already exists",
          details: "A user account with this email is already registered. Please use a different email or reset the password."
        },
        { status: 409 }
      );
    }

    // Create user in Supabase Auth
    // IMPORTANT: Don't modify password - pass it as-is to avoid encoding issues
    const normalizedEmail = email.toLowerCase().trim();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: password, // Pass password directly without any modification
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
      console.error("Auth error creating user:", authError);
      return NextResponse.json(
        { 
          error: authError.message || "Failed to create user account",
          details: authError.message
        },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user - no user data returned" },
        { status: 500 }
      );
    }

    // Verify user was created and email is confirmed
    if (!authData.user.email_confirmed_at) {
      // Force confirm the email
      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        authData.user.id,
        {
          email_confirm: true,
        }
      );
      
      if (confirmError) {
        console.error("Error confirming email:", confirmError);
      }
    }

    // Update user metadata with role - ensure role is properly set
    // IMPORTANT: Only update metadata, NOT password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authData.user.id,
      {
        user_metadata: {
          full_name: first_name || username || email.split("@")[0],
          username: username || email.split("@")[0],
          avatar_url: avatar_url || null,
          employee_id: employee_id || null,
          role: role, // Explicitly set role
        },
        // DO NOT include password here - it would reset/change it
      }
    );

    if (updateError) {
      console.error("Error updating user metadata:", updateError);
      // Don't fail the request, user is already created, but log the error
    }

    // Verify the user can be retrieved and role is set correctly
    const { data: verifyUser, error: verifyError } = await supabase.auth.admin.getUserById(
      authData.user.id
    );

    if (verifyError) {
      console.error("Error verifying created user:", verifyError);
    } else if (verifyUser?.user) {
      // Log the verified user metadata for debugging
      console.log("User created and verified:", {
        id: verifyUser.user.id,
        email: verifyUser.user.email,
        role: verifyUser.user.user_metadata?.role,
        email_confirmed: !!verifyUser.user.email_confirmed_at,
      });
      
      // Double-check role is set
      if (verifyUser.user.user_metadata?.role !== role) {
        console.warn("Role mismatch! Expected:", role, "Got:", verifyUser.user.user_metadata?.role);
        // Try to update again
        await supabase.auth.admin.updateUserById(authData.user.id, {
          user_metadata: {
            ...verifyUser.user.user_metadata,
            role: role,
          },
        });
      }
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username: username || email.split("@")[0],
          role: role,
          email_confirmed: !!authData.user.email_confirmed_at,
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

