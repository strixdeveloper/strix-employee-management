import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch salary records for the logged-in employee
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

    // Fetch salary records for this employee only
    const { data, error } = await supabase
      .from("salaries")
      .select(`
        *,
        employees:employee_id (
          rowid,
          name,
          employee_id,
          email,
          designation,
          department
        )
      `)
      .eq("employee_id", employeeId)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Employee salary API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

