 import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch overtime records
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const rowid = searchParams.get("rowid");
    const employeeId = searchParams.get("employee_id");
    const projectId = searchParams.get("project_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const overtimeType = searchParams.get("overtime_type");

    if (rowid) {
      // Fetch single overtime record
      const { data, error } = await supabase
        .from("overtime")
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
          projects:project_id (
            rowid,
            project_name,
            client_name
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

    // Fetch all overtime records with filters
    let query = supabase
      .from("overtime")
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
        projects:project_id (
          rowid,
          project_name,
          client_name
        )
      `)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply filters
    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (overtimeType) {
      query = query.eq("overtime_type", overtimeType);
    }

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

// POST - Create a new overtime record
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      employee_id,
      project_id,
      date,
      overtime_type,
      start_time,
      end_time,
      description,
      status,
      remarks,
    } = body;

    // Validate required fields
    if (!employee_id || !date || !overtime_type || !start_time || !end_time) {
      return NextResponse.json(
        { error: "employee_id, date, overtime_type, start_time, and end_time are required" },
        { status: 400 }
      );
    }

    // Validate overtime_type
    const validTypes = ["pending_tasks", "new_tasks", "tracking"];
    if (!validTypes.includes(overtime_type)) {
      return NextResponse.json(
        { error: "Invalid overtime_type. Must be one of: pending_tasks, new_tasks, tracking" },
        { status: 400 }
      );
    }

    // Validate time order
    if (end_time <= start_time) {
      return NextResponse.json(
        { error: "end_time must be after start_time" },
        { status: 400 }
      );
    }

    // Insert new overtime record
    const { data, error } = await supabase
      .from("overtime")
      .insert([
        {
          employee_id,
          project_id: project_id || null,
          date,
          overtime_type,
          start_time,
          end_time,
          description: description || null,
          status: status || "pending",
          remarks: remarks || null,
        },
      ])
      .select()
      .single();

    if (error) {
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

// PUT - Update an existing overtime record
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      rowid,
      employee_id,
      project_id,
      date,
      overtime_type,
      start_time,
      end_time,
      description,
      status,
      approved_by,
      approved_at,
      remarks,
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
    if (project_id !== undefined) updateData.project_id = project_id;
    if (date !== undefined) updateData.date = date;
    if (overtime_type !== undefined) updateData.overtime_type = overtime_type;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (approved_by !== undefined) updateData.approved_by = approved_by;
    if (approved_at !== undefined) updateData.approved_at = approved_at;
    if (remarks !== undefined) updateData.remarks = remarks;

    // Update overtime record
    const { data, error } = await supabase
      .from("overtime")
      .update(updateData)
      .eq("rowid", rowid)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Overtime record not found" },
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

// DELETE - Delete an overtime record
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

    // Delete overtime record
    const { error } = await supabase
      .from("overtime")
      .delete()
      .eq("rowid", rowid);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Overtime record deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

