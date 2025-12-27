import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch leaves for the logged-in employee
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get employee_id from user metadata
    const employeeId = user.user_metadata?.employee_id;
    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID not found in user metadata" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Build query
    let query = supabase
      .from("leaves")
      .select("*")
      .eq("employee_id", employeeId)
      .order("start_date", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply status filter if provided
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Employee leaves API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new leave request for the logged-in employee
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get employee_id from user metadata
    const employeeId = user.user_metadata?.employee_id;
    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID not found in user metadata" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { leave_type, start_date, end_date, reason } = body;

    // Validate required fields
    if (!leave_type || !start_date) {
      return NextResponse.json(
        { error: "leave_type and start_date are required" },
        { status: 400 }
      );
    }

    // Validate leave_type
    const validTypes = ["full_day", "half_day", "multiple_days"];
    if (!validTypes.includes(leave_type)) {
      return NextResponse.json(
        { error: "Invalid leave_type. Must be one of: full_day, half_day, multiple_days" },
        { status: 400 }
      );
    }

    // Validate end_date for multiple_days
    if (leave_type === "multiple_days" && !end_date) {
      return NextResponse.json(
        { error: "end_date is required for multiple_days leave type" },
        { status: 400 }
      );
    }

    // Validate date range
    if (leave_type === "multiple_days" && end_date < start_date) {
      return NextResponse.json(
        { error: "end_date must be after or equal to start_date" },
        { status: 400 }
      );
    }

    // Insert new leave record with status "pending"
    const { data, error } = await supabase
      .from("leaves")
      .insert([
        {
          employee_id: employeeId,
          leave_type,
          start_date,
          end_date: leave_type === "multiple_days" ? end_date : null,
          reason: reason || null,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Employee leaves API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

