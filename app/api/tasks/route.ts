import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch tasks for a project
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");
    const rowid = searchParams.get("rowid");

    if (rowid) {
      // Fetch single task
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:assignee_id (
            name,
            employee_id
          ),
          creator:created_by (
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

    if (!projectId) {
      return NextResponse.json(
        { error: "project_id is required" },
        { status: 400 }
      );
    }

    // Fetch all tasks for a project
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        assignee:assignee_id (
          name,
          employee_id
        ),
        creator:created_by (
          name,
          employee_id
        )
      `)
      .eq("project_id", projectId)
      .order("status", { ascending: true })
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Tasks API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      project_id,
      title,
      description,
      status,
      priority,
      assignee_id,
      due_date,
      created_by,
    } = body;

    // Validate required fields
    if (!project_id || !title || !status) {
      return NextResponse.json(
        { error: "project_id, title, and status are required" },
        { status: 400 }
      );
    }

    // Get max order_index for the status
    const { data: existingTasks } = await supabase
      .from("tasks")
      .select("order_index")
      .eq("project_id", project_id)
      .eq("status", status)
      .order("order_index", { ascending: false })
      .limit(1);

    const maxOrderIndex = existingTasks && existingTasks.length > 0
      ? (existingTasks[0].order_index || 0) + 1
      : 0;

    // Insert new task
    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          project_id: parseInt(project_id),
          title,
          description: description || null,
          status,
          priority: priority || "medium",
          assignee_id: assignee_id || null,
          due_date: due_date || null,
          created_by: created_by || null,
          order_index: maxOrderIndex,
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
    console.error("Tasks API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update a task
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      rowid,
      title,
      description,
      status,
      priority,
      assignee_id,
      due_date,
      order_index,
    } = body;

    if (!rowid) {
      return NextResponse.json(
        { error: "rowid is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assignee_id !== undefined) updateData.assignee_id = assignee_id || null;
    if (due_date !== undefined) updateData.due_date = due_date || null;
    if (order_index !== undefined) updateData.order_index = order_index;

    const { data, error } = await supabase
      .from("tasks")
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
    console.error("Tasks API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a task
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
      .from("tasks")
      .delete()
      .eq("rowid", rowid);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Tasks API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

