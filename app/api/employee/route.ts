import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch all employees or a single employee by ID
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const rowid = searchParams.get("rowid");

    if (rowid) {
      // Fetch single employee by rowid
      const { data, error } = await supabase
        .from("employees")
        .select("*")
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
      // Fetch all employees
      const { data, error } = await supabase
        .from("employees")
        .select("*")
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

// POST - Create a new employee
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { name, employee_id, email, designation, department } = body;

    // Validate required fields
    if (!name || !employee_id || !email || !designation || !department) {
      return NextResponse.json(
        { error: "All fields are required: name, employee_id, email, designation, department" },
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

    // Insert new employee
    const { data, error } = await supabase
      .from("employees")
      .insert([
        {
          name,
          employee_id,
          email,
          designation,
          department,
        },
      ])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violations
      if (error.code === "23505") {
        if (error.message.includes("employee_id")) {
          return NextResponse.json(
            { error: "Employee ID already exists" },
            { status: 409 }
          );
        }
        if (error.message.includes("email")) {
          return NextResponse.json(
            { error: "Email already exists" },
            { status: 409 }
          );
        }
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

// PUT - Update an existing employee
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { rowid, name, employee_id, email, designation, department } = body;

    // Validate rowid is provided
    if (!rowid) {
      return NextResponse.json(
        { error: "rowid is required for update" },
        { status: 400 }
      );
    }

    // Validate email format if email is being updated
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (employee_id !== undefined) updateData.employee_id = employee_id;
    if (email !== undefined) updateData.email = email;
    if (designation !== undefined) updateData.designation = designation;
    if (department !== undefined) updateData.department = department;

    // Update employee
    const { data, error } = await supabase
      .from("employees")
      .update(updateData)
      .eq("rowid", rowid)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violations
      if (error.code === "23505") {
        if (error.message.includes("employee_id")) {
          return NextResponse.json(
            { error: "Employee ID already exists" },
            { status: 409 }
          );
        }
        if (error.message.includes("email")) {
          return NextResponse.json(
            { error: "Email already exists" },
            { status: 409 }
          );
        }
      }
      // Handle foreign key constraint violations
      if (error.code === "23503") {
        return NextResponse.json(
          { 
            error: "Cannot update employee. This employee has related records in salaries, overtime, attendance, or other tables. Please ensure the database trigger for cascading updates is installed.",
            details: error.message
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Employee not found" },
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

// DELETE - Delete an employee
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

    // Delete employee
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("rowid", rowid);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Employee deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

