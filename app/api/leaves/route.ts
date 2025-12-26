import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch leaves records
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const rowid = searchParams.get("rowid");
    const employeeId = searchParams.get("employee_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const status = searchParams.get("status");
    const leaveType = searchParams.get("leave_type");

    if (rowid) {
      // Fetch single leave record
      const { data, error } = await supabase
        .from("leaves")
        .select(`
          *,
          employees:employee_id (
            rowid,
            name,
            employee_id,
            email,
            designation,
            department
          ),
          approver:approved_by (
            name,
            employee_id
          )
        `)
        .eq("rowid", rowid)
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      return NextResponse.json({ data }, { status: 200 });
    }

    // Fetch all leaves records with filters
    let query = supabase
      .from("leaves")
      .select(`
        *,
        employees:employee_id (
          rowid,
          name,
          employee_id,
          email,
          designation,
          department
        ),
        approver:approved_by (
          name,
          employee_id
        )
      `)
      .order("start_date", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply filters
    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (leaveType) {
      query = query.eq("leave_type", leaveType);
    }

    if (startDate && endDate) {
      // Find leaves that overlap with the date range
      // A leave overlaps if: start_date <= filter_end_date AND (end_date >= filter_start_date OR end_date IS NULL)
      query = query
        .lte("start_date", endDate)
        .or(`end_date.gte.${startDate},end_date.is.null`);
    } else if (startDate) {
      query = query.gte("start_date", startDate);
    } else if (endDate) {
      query = query.or(`start_date.lte.${endDate},end_date.lte.${endDate},end_date.is.null`);
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
    console.error("Leaves API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new leave record
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      employee_id,
      leave_type,
      start_date,
      end_date,
      reason,
    } = body;

    // Validate required fields
    if (!employee_id || !leave_type || !start_date) {
      return NextResponse.json(
        { error: "employee_id, leave_type, and start_date are required" },
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

    // Insert new leave record
    const { data, error } = await supabase
      .from("leaves")
      .insert([
        {
          employee_id,
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
    console.error("Leaves API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update a leave record
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      rowid,
      employee_id,
      leave_type,
      start_date,
      end_date,
      status,
      reason,
      approved_by,
      cancelled_reason,
    } = body;

    if (!rowid) {
      return NextResponse.json(
        { error: "rowid is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (employee_id !== undefined) updateData.employee_id = employee_id;
    if (leave_type !== undefined) updateData.leave_type = leave_type;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) {
      updateData.end_date = leave_type === "multiple_days" ? end_date : null;
    }
    if (status !== undefined) {
      updateData.status = status;
      if (status === "approved") {
        updateData.approved_by = approved_by || null;
        updateData.approved_at = new Date().toISOString();
      } else if (status === "cancelled") {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancelled_reason = cancelled_reason || null;
      }
    }
    if (reason !== undefined) updateData.reason = reason;

    const { data, error } = await supabase
      .from("leaves")
      .update(updateData)
      .eq("rowid", rowid)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Leaves API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a leave record
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const rowid = searchParams.get("rowid");

    if (!rowid) {
      return NextResponse.json(
        { error: "rowid is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("leaves")
      .delete()
      .eq("rowid", rowid);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Leave record deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Leaves API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

