import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch all office hours
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("office_hours")
      .select("*")
      .order("day_of_week", { ascending: true });

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

// PUT - Update office hours (can update single or multiple days)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // If updating a single day
    if (body.day_of_week !== undefined) {
      const {
        day_of_week,
        is_working_day,
        start_time,
        end_time,
        has_lunch_break,
        lunch_start_time,
        lunch_end_time,
        lunch_duration_minutes,
      } = body;

      // Validate day_of_week
      if (day_of_week < 0 || day_of_week > 6) {
        return NextResponse.json(
          { error: "day_of_week must be between 0 (Sunday) and 6 (Saturday)" },
          { status: 400 }
        );
      }

      const updateData: any = {};
      if (is_working_day !== undefined) updateData.is_working_day = is_working_day;
      if (start_time !== undefined) updateData.start_time = start_time;
      if (end_time !== undefined) updateData.end_time = end_time;
      if (has_lunch_break !== undefined) updateData.has_lunch_break = has_lunch_break;
      if (lunch_start_time !== undefined) updateData.lunch_start_time = lunch_start_time;
      if (lunch_end_time !== undefined) updateData.lunch_end_time = lunch_end_time;
      if (lunch_duration_minutes !== undefined) updateData.lunch_duration_minutes = lunch_duration_minutes;

      const { data, error } = await supabase
        .from("office_hours")
        .update(updateData)
        .eq("day_of_week", day_of_week)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({ data }, { status: 200 });
    }

    // If updating multiple days at once
    if (Array.isArray(body.updates)) {
      const updates = body.updates;
      const results = [];

      for (const update of updates) {
        const { day_of_week, ...updateData } = update;

        if (day_of_week === undefined) {
          continue;
        }

        const { data, error } = await supabase
          .from("office_hours")
          .update(updateData)
          .eq("day_of_week", day_of_week)
          .select()
          .single();

        if (error) {
          return NextResponse.json(
            { error: `Error updating day ${day_of_week}: ${error.message}` },
            { status: 400 }
          );
        }

        results.push(data);
      }

      return NextResponse.json({ data: results }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

