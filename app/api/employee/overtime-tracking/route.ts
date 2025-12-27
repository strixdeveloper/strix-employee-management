import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Helper function to check if current time is within office hours
async function isWithinOfficeHours(supabase: any, currentTime: Date): Promise<boolean> {
  const dayOfWeek = currentTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentTimeStr = currentTime.toTimeString().slice(0, 5); // HH:MM format

  // Get office hours for this day
  const { data: officeHours, error } = await supabase
    .from("office_hours")
    .select("*")
    .eq("day_of_week", dayOfWeek)
    .single();

  if (error || !officeHours) {
    // If no office hours configured, allow overtime
    return false;
  }

  // If it's not a working day, it's off-time (allow overtime)
  if (!officeHours.is_working_day) {
    return false;
  }

  // If it's a working day, check if current time is within office hours
  const startTime = officeHours.start_time.slice(0, 5); // HH:MM
  const endTime = officeHours.end_time.slice(0, 5); // HH:MM

  // If current time is before start or after end, it's off-time (allow overtime)
  if (currentTimeStr < startTime || currentTimeStr >= endTime) {
    return false;
  }

  // If within office hours, don't allow overtime
  return true;
}

// GET - Get current active tracking session for employee
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

    // Get active session
    const { data: session, error } = await supabase
      .from("overtime_tracking_sessions")
      .select(`
        *,
        projects:project_id (
          rowid,
          project_name,
          client_name
        )
      `)
      .eq("employee_id", employeeId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // If session exists, get breaks
    let breaks: any[] = [];
    if (session) {
      const { data: breaksData } = await supabase
        .from("overtime_breaks")
        .select("*")
        .eq("tracking_session_id", session.rowid)
        .order("break_start_time", { ascending: true });

      breaks = breaksData || [];
    }

    return NextResponse.json({
      data: session ? { ...session, breaks } : null,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Start tracking session
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { overtime_type, project_id, project_name, memo } = body;

    // Validate overtime_type
    const validTypes = ["pending_tasks", "new_tasks", "tracking"];
    if (!overtime_type || !validTypes.includes(overtime_type)) {
      return NextResponse.json(
        { error: "Invalid overtime_type. Must be one of: pending_tasks, new_tasks, tracking" },
        { status: 400 }
      );
    }

    // Check if there's already an active session
    const { data: existingSession } = await supabase
      .from("overtime_tracking_sessions")
      .select("rowid")
      .eq("employee_id", employeeId)
      .single();

    if (existingSession) {
      return NextResponse.json(
        { error: "An active tracking session already exists. Please end it first." },
        { status: 400 }
      );
    }

    // Validate that current time is NOT within office hours (overtime only allowed outside office hours)
    const currentTime = new Date();
    const isWithinHours = await isWithinOfficeHours(supabase, currentTime);

    if (isWithinHours) {
      return NextResponse.json(
        { error: "Overtime tracking can only be started outside office hours or on off-days." },
        { status: 400 }
      );
    }

    // Create new tracking session
    const { data: session, error } = await supabase
      .from("overtime_tracking_sessions")
      .insert([
        {
          employee_id: employeeId,
          project_id: project_id || null,
          project_name: project_name || null,
          overtime_type: overtime_type,
          memo: memo || null,
          start_time: currentTime.toISOString(),
          is_paused: false,
          total_break_seconds: 0,
        },
      ])
      .select(`
        *,
        projects:project_id (
          rowid,
          project_name,
          client_name
        )
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: session }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Pause/Resume/End tracking session
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { action } = body; // 'pause', 'resume', or 'end'

    // Get active session
    const { data: session, error: sessionError } = await supabase
      .from("overtime_tracking_sessions")
      .select("*")
      .eq("employee_id", employeeId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "No active tracking session found" },
        { status: 404 }
      );
    }

    const currentTime = new Date();

    if (action === "pause") {
      // Start a break
      if (session.is_paused) {
        return NextResponse.json(
          { error: "Session is already paused" },
          { status: 400 }
        );
      }

      // Create break record
      const { data: breakRecord, error: breakError } = await supabase
        .from("overtime_breaks")
        .insert([
          {
            tracking_session_id: session.rowid,
            break_start_time: currentTime.toISOString(),
            break_end_time: null,
            break_duration_seconds: null,
          },
        ])
        .select()
        .single();

      if (breakError) {
        return NextResponse.json(
          { error: breakError.message },
          { status: 400 }
        );
      }

      // Update session to paused
      const { data: updatedSession, error: updateError } = await supabase
        .from("overtime_tracking_sessions")
        .update({
          is_paused: true,
          last_pause_time: currentTime.toISOString(),
        })
        .eq("rowid", session.rowid)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        data: { ...updatedSession, current_break: breakRecord },
      }, { status: 200 });
    }

    if (action === "resume") {
      // End the current break
      if (!session.is_paused) {
        return NextResponse.json(
          { error: "Session is not paused" },
          { status: 400 }
        );
      }

      // Find the active break (one without end_time)
      const { data: activeBreak, error: breakError } = await supabase
        .from("overtime_breaks")
        .select("*")
        .eq("tracking_session_id", session.rowid)
        .is("break_end_time", null)
        .single();

      if (breakError || !activeBreak) {
        return NextResponse.json(
          { error: "No active break found" },
          { status: 400 }
        );
      }

      // Calculate break duration
      const breakStart = new Date(activeBreak.break_start_time);
      const breakDurationSeconds = Math.floor((currentTime.getTime() - breakStart.getTime()) / 1000);

      // Update break record
      const { error: updateBreakError } = await supabase
        .from("overtime_breaks")
        .update({
          break_end_time: currentTime.toISOString(),
          break_duration_seconds: breakDurationSeconds,
        })
        .eq("rowid", activeBreak.rowid);

      if (updateBreakError) {
        return NextResponse.json(
          { error: updateBreakError.message },
          { status: 400 }
        );
      }

      // Update session: add break time to total and resume
      const newTotalBreakSeconds = session.total_break_seconds + breakDurationSeconds;
      const { data: updatedSession, error: updateError } = await supabase
        .from("overtime_tracking_sessions")
        .update({
          is_paused: false,
          last_pause_time: null,
          total_break_seconds: newTotalBreakSeconds,
        })
        .eq("rowid", session.rowid)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }

      return NextResponse.json({ data: updatedSession }, { status: 200 });
    }

    if (action === "end") {
      // End tracking and create overtime entry
      if (session.is_paused) {
        return NextResponse.json(
          { error: "Please resume the session before ending it" },
          { status: 400 }
        );
      }

      const startTime = new Date(session.start_time);
      const endTime = currentTime;

      // Calculate total time (including breaks)
      const totalSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const totalHours = totalSeconds / 3600;

      // Calculate actual working hours (excluding breaks)
      const actualWorkingSeconds = totalSeconds - session.total_break_seconds;
      const actualWorkingHours = actualWorkingSeconds / 3600;

      // Get date for overtime entry
      const date = startTime.toISOString().split("T")[0];

      // Create overtime entry
      // Include project_name in description if project_id is not set
      let description = session.memo || null;
      if ((session as any).project_name && !session.project_id) {
        description = (session as any).project_name + (session.memo ? ` - ${session.memo}` : "");
      }

      const { data: overtimeEntry, error: overtimeError } = await supabase
        .from("overtime")
        .insert([
          {
            employee_id: employeeId,
            project_id: session.project_id || null,
            date: date,
            overtime_type: session.overtime_type || "tracking",
            start_time: startTime.toTimeString().slice(0, 8), // HH:MM:SS
            end_time: endTime.toTimeString().slice(0, 8), // HH:MM:SS
            total_hours: parseFloat(totalHours.toFixed(2)),
            actual_working_hours: parseFloat(actualWorkingHours.toFixed(2)),
            description: description,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (overtimeError) {
        return NextResponse.json(
          { error: overtimeError.message },
          { status: 400 }
        );
      }

      // Delete the tracking session
      const { error: deleteError } = await supabase
        .from("overtime_tracking_sessions")
        .delete()
        .eq("rowid", session.rowid);

      if (deleteError) {
        console.error("Error deleting tracking session:", deleteError);
        // Don't fail if deletion fails, overtime entry is already created
      }

      return NextResponse.json({
        data: {
          overtime_entry: overtimeEntry,
          session: {
            ...session,
            total_hours: totalHours,
            actual_working_hours: actualWorkingHours,
          },
        },
      }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Invalid action. Must be 'pause', 'resume', or 'end'" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

