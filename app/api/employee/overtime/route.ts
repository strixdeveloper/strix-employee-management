import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch overtime records for current employee only
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employeeId = user.user_metadata?.employee_id;
    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID not found in user metadata" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const overtimeType = searchParams.get("overtime_type");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Fetch overtime records for this employee only
    let query = supabase
      .from("overtime")
      .select(`
        *,
        projects:project_id (
          rowid,
          project_name,
          client_name
        )
      `)
      .eq("employee_id", employeeId) // Filter by current employee
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply additional filters if provided
    if (status) {
      query = query.eq("status", status);
    }

    if (overtimeType) {
      query = query.eq("overtime_type", overtimeType);
    }

    if (startDate && endDate) {
      query = query.gte("date", startDate).lte("date", endDate);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

