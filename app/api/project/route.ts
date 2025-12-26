import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch all projects or a single project by ID
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const rowid = searchParams.get("rowid");

    if (rowid) {
      // Fetch single project with assigned employees
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("rowid", rowid)
        .single();

      if (projectError) {
        return NextResponse.json(
          { error: projectError.message },
          { status: 404 }
        );
      }

      // Fetch assigned employees
      const { data: assignedEmployees, error: employeesError } = await supabase
        .from("project_employees")
        .select("employee_id, role")
        .eq("project_id", rowid);

      if (employeesError) {
        return NextResponse.json(
          { error: employeesError.message },
          { status: 500 }
        );
      }

      // Get employee details
      const employeeIds = assignedEmployees?.map((e) => e.employee_id) || [];
      let employees: Array<{
        rowid: number;
        name: string;
        employee_id: string;
        email: string;
        designation: string;
      }> = [];
      if (employeeIds.length > 0) {
        const { data: employeeData } = await supabase
          .from("employees")
          .select("rowid, name, employee_id, email, designation")
          .in("employee_id", employeeIds);

        employees = employeeData || [];
      }

      return NextResponse.json(
        {
          data: {
            ...project,
            assigned_employees: employees.map((emp) => ({
              ...emp,
              role: assignedEmployees?.find((ae) => ae.employee_id === emp.employee_id)?.role,
            })),
          },
        },
        { status: 200 }
      );
    } else {
      // Fetch all projects with assigned employees count
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectsError) {
        return NextResponse.json(
          { error: projectsError.message },
          { status: 500 }
        );
      }

      // Fetch assigned employees for all projects
      const projectIds = projects?.map((p) => p.rowid) || [];
      let assignedEmployeesMap: Record<number, any[]> = {};

      if (projectIds.length > 0) {
        const { data: projectEmployees } = await supabase
          .from("project_employees")
          .select("project_id, employee_id, role")
          .in("project_id", projectIds);

        // Group by project_id
        projectEmployees?.forEach((pe) => {
          if (!assignedEmployeesMap[pe.project_id]) {
            assignedEmployeesMap[pe.project_id] = [];
          }
          assignedEmployeesMap[pe.project_id].push(pe);
        });

        // Get all unique employee IDs
        const allEmployeeIds = [
          ...new Set(
            projectEmployees?.map((pe) => pe.employee_id) || []
          ),
        ];

        // Fetch employee details
        let employeesMap: Record<string, any> = {};
        if (allEmployeeIds.length > 0) {
          const { data: employees } = await supabase
            .from("employees")
            .select("rowid, name, employee_id, email, designation")
            .in("employee_id", allEmployeeIds);

          employees?.forEach((emp) => {
            employeesMap[emp.employee_id] = emp;
          });
        }

        // Combine projects with assigned employees
        const projectsWithEmployees = projects?.map((project) => {
          const assigned = assignedEmployeesMap[project.rowid] || [];
          return {
            ...project,
            assigned_employees: assigned.map((ae) => ({
              ...employeesMap[ae.employee_id],
              role: ae.role,
            })),
          };
        });

        return NextResponse.json({ data: projectsWithEmployees }, { status: 200 });
      }

      return NextResponse.json({ data: projects }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new project
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      project_name,
      project_description,
      client_name,
      priority,
      deadline,
      tracking_type,
      tracking_hours,
      fixed_days,
      status,
      assigned_employees,
      media_files,
    } = body;

    // Validate required fields
    if (!project_name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Validate tracking_type
    if (tracking_type === "tracking" && !tracking_hours) {
      return NextResponse.json(
        { error: "Tracking hours is required when tracking_type is 'tracking'" },
        { status: 400 }
      );
    }

    if (tracking_type === "fixed" && !fixed_days) {
      return NextResponse.json(
        { error: "Fixed days is required when tracking_type is 'fixed'" },
        { status: 400 }
      );
    }

    // Insert new project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert([
        {
          project_name,
          project_description,
          client_name,
          priority: priority || "medium",
          deadline,
          tracking_type: tracking_type || "fixed",
          tracking_hours,
          fixed_days,
          status: status || "planning",
          media_files: media_files || [],
        },
      ])
      .select()
      .single();

    if (projectError) {
      return NextResponse.json(
        { error: projectError.message },
        { status: 400 }
      );
    }

    // Assign employees if provided
    if (assigned_employees && Array.isArray(assigned_employees) && assigned_employees.length > 0) {
      const projectEmployees = assigned_employees.map((emp: any) => ({
        project_id: project.rowid,
        employee_id: typeof emp === "string" ? emp : emp.employee_id,
        role: typeof emp === "object" ? emp.role : null,
      }));

      const { error: employeesError } = await supabase
        .from("project_employees")
        .insert(projectEmployees);

      if (employeesError) {
        // If employee assignment fails, still return the project
        console.error("Error assigning employees:", employeesError);
      }
    }

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing project
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      rowid,
      project_name,
      project_description,
      client_name,
      priority,
      deadline,
      tracking_type,
      tracking_hours,
      fixed_days,
      status,
      assigned_employees,
      media_files,
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
    if (project_name !== undefined) updateData.project_name = project_name;
    if (project_description !== undefined) updateData.project_description = project_description;
    if (client_name !== undefined) updateData.client_name = client_name;
    if (priority !== undefined) updateData.priority = priority;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (tracking_type !== undefined) updateData.tracking_type = tracking_type;
    if (tracking_hours !== undefined) updateData.tracking_hours = tracking_hours;
    if (fixed_days !== undefined) updateData.fixed_days = fixed_days;
    if (status !== undefined) updateData.status = status;
    if (media_files !== undefined) updateData.media_files = media_files;

    // Update project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .update(updateData)
      .eq("rowid", rowid)
      .select()
      .single();

    if (projectError) {
      return NextResponse.json(
        { error: projectError.message },
        { status: 404 }
      );
    }

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Update assigned employees if provided
    if (assigned_employees !== undefined) {
      // Delete existing assignments
      await supabase.from("project_employees").delete().eq("project_id", rowid);

      // Insert new assignments
      if (Array.isArray(assigned_employees) && assigned_employees.length > 0) {
        const projectEmployees = assigned_employees.map((emp: any) => ({
          project_id: rowid,
          employee_id: typeof emp === "string" ? emp : emp.employee_id,
          role: typeof emp === "object" ? emp.role : null,
        }));

        await supabase.from("project_employees").insert(projectEmployees);
      }
    }

    return NextResponse.json({ data: project }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a project
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

    // Delete project (cascade will handle project_employees and project_comments)
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("rowid", rowid);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Project deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

