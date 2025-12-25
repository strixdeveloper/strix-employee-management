import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch attendance records
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const employeeId = searchParams.get("employee_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const date = searchParams.get("date");

    let query = supabase
      .from("attendance")
      .select(`
        *,
        employees:employee_id (
          name,
          employee_id,
          designation,
          department
        )
      `)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    // Filter by employee if provided
    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    // Filter by date range
    if (startDate && endDate) {
      query = query.gte("date", startDate).lte("date", endDate);
    } else if (date) {
      query = query.eq("date", date);
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new attendance record
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      employee_id,
      date,
      check_in_time,
      check_out_time,
      status,
      notes,
    } = body;

    // Validate required fields
    if (!employee_id || !date) {
      return NextResponse.json(
        { error: "employee_id and date are required" },
        { status: 400 }
      );
    }

    // Insert new attendance record
    const { data, error } = await supabase
      .from("attendance")
      .insert([
        {
          employee_id,
          date,
          check_in_time: check_in_time || null,
          check_out_time: check_out_time || null,
          status: status || "present",
          notes: notes || null,
        },
      ])
      .select(`
        *,
        employees:employee_id (
          name,
          employee_id,
          designation,
          department
        )
      `)
      .single();

    if (error) {
      // Handle unique constraint violations
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Attendance record already exists for this employee and date" },
          { status: 409 }
        );
      }
      // Handle foreign key violations
      if (error.code === "23503") {
        return NextResponse.json(
          { error: "Employee not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing attendance record
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      rowid,
      employee_id,
      date,
      check_in_time,
      check_out_time,
      status,
      notes,
    } = body;

    // Validate rowid is provided
    if (!rowid) {
      return NextResponse.json(
        { error: "rowid is required for update" },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (employee_id !== undefined) updateData.employee_id = employee_id;
    if (date !== undefined) updateData.date = date;
    if (check_in_time !== undefined) updateData.check_in_time = check_in_time || null;
    if (check_out_time !== undefined) updateData.check_out_time = check_out_time || null;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes || null;

    const { data, error } = await supabase
      .from("attendance")
      .update(updateData)
      .eq("rowid", rowid)
      .select(`
        *,
        employees:employee_id (
          name,
          employee_id,
          designation,
          department
        )
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an attendance record
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
      .from("attendance")
      .delete()
      .eq("rowid", rowid);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Attendance record deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

