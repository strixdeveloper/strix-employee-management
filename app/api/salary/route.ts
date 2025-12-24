import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch all salaries or a single salary by ID
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const rowid = searchParams.get("rowid");

    if (rowid) {
      // Fetch single salary by rowid with employee details
      const { data, error } = await supabase
        .from("salaries")
        .select(`
          *,
          employees:employee_id (
            name,
            employee_id,
            designation,
            department
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
    } else {
      // Fetch all salaries with employee details
      const { data, error } = await supabase
        .from("salaries")
        .select(`
          *,
          employees:employee_id (
            name,
            employee_id,
            designation,
            department
          )
        `)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ data }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new salary record
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      employee_id,
      month,
      year,
      date,
      basic_salary,
      allowances,
      bonus,
      advance,
      leave_lop,
      penalty,
    } = body;

    // Validate required fields
    if (
      !employee_id ||
      !month ||
      !year ||
      !date ||
      basic_salary === undefined ||
      allowances === undefined ||
      bonus === undefined ||
      advance === undefined ||
      leave_lop === undefined
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Validate month range
    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Month must be between 1 and 12" },
        { status: 400 }
      );
    }

    // Insert new salary record (triggers will calculate gross_salary, total_deductions, net_salary)
    const { data, error } = await supabase
      .from("salaries")
      .insert([
        {
          employee_id,
          month,
          year,
          date,
          basic_salary: parseFloat(basic_salary) || 0,
          allowances: parseFloat(allowances) || 0,
          bonus: parseFloat(bonus) || 0,
          advance: parseFloat(advance) || 0,
          leave_lop: parseFloat(leave_lop) || 0,
          penalty: parseFloat(penalty) || 0,
        },
      ])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violations
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Salary record already exists for this employee, month, and year" },
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

// PUT - Update an existing salary record
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      rowid,
      employee_id,
      month,
      year,
      date,
      basic_salary,
      allowances,
      bonus,
      advance,
      leave_lop,
      penalty,
    } = body;

    // Validate rowid is provided
    if (!rowid) {
      return NextResponse.json(
        { error: "rowid is required for update" },
        { status: 400 }
      );
    }

    // Validate month range if provided
    if (month !== undefined && (month < 1 || month > 12)) {
      return NextResponse.json(
        { error: "Month must be between 1 and 12" },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (employee_id !== undefined) updateData.employee_id = employee_id;
    if (month !== undefined) updateData.month = month;
    if (year !== undefined) updateData.year = year;
    if (date !== undefined) updateData.date = date;
    if (basic_salary !== undefined) updateData.basic_salary = parseFloat(basic_salary) || 0;
    if (allowances !== undefined) updateData.allowances = parseFloat(allowances) || 0;
    if (bonus !== undefined) updateData.bonus = parseFloat(bonus) || 0;
    if (advance !== undefined) updateData.advance = parseFloat(advance) || 0;
    if (leave_lop !== undefined) updateData.leave_lop = parseFloat(leave_lop) || 0;
    if (penalty !== undefined) updateData.penalty = parseFloat(penalty) || 0;

    // Update salary record (triggers will recalculate amounts)
    const { data, error } = await supabase
      .from("salaries")
      .update(updateData)
      .eq("rowid", rowid)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violations
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Salary record already exists for this employee, month, and year" },
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
        { status: 404 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Salary record not found" },
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

// DELETE - Delete a salary record
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

    // Get the salary record to delete PDF if exists
    const { data: salaryData } = await supabase
      .from("salaries")
      .select("pdf_url, employee_id, year, month")
      .eq("rowid", rowid)
      .single();

    // Delete salary record
    const { error } = await supabase
      .from("salaries")
      .delete()
      .eq("rowid", rowid);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Optionally delete PDF from storage if exists
    if (salaryData?.pdf_url) {
      const fileName = salaryData.pdf_url.split("/").pop();
      if (fileName) {
        await supabase.storage
          .from("salary-slips")
          .remove([fileName]);
      }
    }

    return NextResponse.json(
      { message: "Salary record deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

