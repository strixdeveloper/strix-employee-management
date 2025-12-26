import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch aggregated reports data
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const reportType = searchParams.get("type"); // 'overtime', 'attendance', 'leaves', 'projects'
    const employeeId = searchParams.get("employee_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    // Default to current month if no date range provided
    const currentDate = new Date();
    const defaultStartDate = startDate || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
    const defaultEndDate = endDate || currentDate.toISOString().split('T')[0];

    switch (reportType) {
      case 'overtime':
        return getOvertimeReport(supabase, employeeId, defaultStartDate, defaultEndDate);
      case 'attendance':
        return getAttendanceReport(supabase, employeeId, defaultStartDate, defaultEndDate);
      case 'leaves':
        return getLeavesReport(supabase, employeeId, defaultStartDate, defaultEndDate);
      case 'projects':
        return getProjectsReport(supabase, employeeId, month, year);
      case 'summary':
        return getSummaryReport(supabase, defaultStartDate, defaultEndDate);
      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Overtime Report - Employee-wise monthly overtime
async function getOvertimeReport(supabase: any, employeeId: string | null, startDate: string, endDate: string) {
  let query = supabase
    .from("overtime")
    .select(`
      *,
      employees:employee_id (
        rowid,
        name,
        employee_id,
        department
      )
    `)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by employee and month
  const employeeMonthlyData: Record<string, Record<string, { hours: number; count: number }>> = {};
  
  data?.forEach((record: any) => {
    const empId = record.employee_id;
    const empName = record.employees?.name || empId;
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!employeeMonthlyData[empId]) {
      employeeMonthlyData[empId] = {};
    }
    if (!employeeMonthlyData[empId][monthKey]) {
      employeeMonthlyData[empId][monthKey] = { hours: 0, count: 0 };
    }
    
    employeeMonthlyData[empId][monthKey].hours += parseFloat(record.total_hours) || 0;
    employeeMonthlyData[empId][monthKey].count += 1;
  });

  // Format for charts
  const chartData: any[] = [];
  Object.keys(employeeMonthlyData).forEach(empId => {
    const empData = data?.find((r: any) => r.employee_id === empId);
    const empName = empData?.employees?.name || empId;
    
    Object.keys(employeeMonthlyData[empId]).forEach(month => {
      chartData.push({
        employee: empName,
        employeeId: empId,
        month,
        hours: employeeMonthlyData[empId][month].hours,
        count: employeeMonthlyData[empId][month].count
      });
    });
  });

  return NextResponse.json({
    data: chartData,
    raw: data,
    summary: {
      totalHours: data?.reduce((sum: number, r: any) => sum + (parseFloat(r.total_hours) || 0), 0) || 0,
      totalRecords: data?.length || 0,
      uniqueEmployees: new Set(data?.map((r: any) => r.employee_id)).size || 0
    }
  });
}

// Attendance Report
async function getAttendanceReport(supabase: any, employeeId: string | null, startDate: string, endDate: string) {
  let query = supabase
    .from("attendance")
    .select(`
      *,
      employees:employee_id (
        rowid,
        name,
        employee_id,
        department
      )
    `)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by employee and status
  const employeeStats: Record<string, { present: number; absent: number; leave: number; total: number }> = {};
  
  data?.forEach((record: any) => {
    const empId = record.employee_id;
    if (!employeeStats[empId]) {
      employeeStats[empId] = { present: 0, absent: 0, leave: 0, total: 0 };
    }
    employeeStats[empId].total += 1;
    if (record.status === 'present') employeeStats[empId].present += 1;
    else if (record.status === 'absent') employeeStats[empId].absent += 1;
    else if (record.status === 'leave') employeeStats[empId].leave += 1;
  });

  // Format for charts
  const chartData: any[] = [];
  Object.keys(employeeStats).forEach(empId => {
    const empData = data?.find((r: any) => r.employee_id === empId);
    const empName = empData?.employees?.name || empId;
    chartData.push({
      employee: empName,
      employeeId: empId,
      ...employeeStats[empId],
      attendanceRate: employeeStats[empId].total > 0 
        ? ((employeeStats[empId].present / employeeStats[empId].total) * 100).toFixed(1)
        : 0
    });
  });

  // Daily attendance trend
  const dailyTrend: Record<string, { present: number; absent: number; leave: number }> = {};
  data?.forEach((record: any) => {
    const date = record.date;
    if (!dailyTrend[date]) {
      dailyTrend[date] = { present: 0, absent: 0, leave: 0 };
    }
    if (record.status === 'present') dailyTrend[date].present += 1;
    else if (record.status === 'absent') dailyTrend[date].absent += 1;
    else if (record.status === 'leave') dailyTrend[date].leave += 1;
  });

  const dailyChartData = Object.keys(dailyTrend).map(date => ({
    date,
    present: dailyTrend[date].present,
    absent: dailyTrend[date].absent,
    leave: dailyTrend[date].leave
  })).sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    employeeData: chartData,
    dailyTrend: dailyChartData,
    raw: data,
    summary: {
      totalRecords: data?.length || 0,
      uniqueEmployees: new Set(data?.map((r: any) => r.employee_id)).size || 0,
      totalPresent: data?.filter((r: any) => r.status === 'present').length || 0,
      totalAbsent: data?.filter((r: any) => r.status === 'absent').length || 0,
      totalLeaves: data?.filter((r: any) => r.status === 'leave').length || 0
    }
  });
}

// Leaves Report
async function getLeavesReport(supabase: any, employeeId: string | null, startDate: string, endDate: string) {
  // Use the leaves table
  let query = supabase
    .from("leaves")
    .select(`
      *,
      employees:employee_id (
        rowid,
        name,
        employee_id,
        department
      )
    `)
    .gte("start_date", startDate)
    .lte("start_date", endDate)
    .order("start_date", { ascending: true });

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by employee and calculate leave days
  const employeeLeaves: Record<string, { count: number; days: number; dates: string[] }> = {};
  
  data?.forEach((record: any) => {
    const empId = record.employee_id;
    if (!employeeLeaves[empId]) {
      employeeLeaves[empId] = { count: 0, days: 0, dates: [] };
    }
    employeeLeaves[empId].count += 1;
    
    // Calculate days for this leave
    const start = new Date(record.start_date);
    const end = record.end_date ? new Date(record.end_date) : start;
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    employeeLeaves[empId].days += days;
    
    // Add date range to dates array
    if (record.leave_type === "multiple_days" && record.end_date) {
      employeeLeaves[empId].dates.push(`${record.start_date} to ${record.end_date}`);
    } else {
      employeeLeaves[empId].dates.push(record.start_date);
    }
  });

  const chartData = Object.keys(employeeLeaves).map(empId => {
    const empData = data?.find((r: any) => r.employee_id === empId);
    return {
      employee: empData?.employees?.name || empId,
      employeeId: empId,
      leaveCount: employeeLeaves[empId].count,
      leaveDays: employeeLeaves[empId].days,
      dates: employeeLeaves[empId].dates
    };
  });

  // Monthly leave trend
  const monthlyTrend: Record<string, number> = {};
  data?.forEach((record: any) => {
    const date = new Date(record.start_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    // Calculate days for this leave
    const start = new Date(record.start_date);
    const end = record.end_date ? new Date(record.end_date) : start;
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + days;
  });

  const monthlyChartData = Object.keys(monthlyTrend).map(month => ({
    month,
    count: monthlyTrend[month]
  })).sort((a, b) => a.month.localeCompare(b.month));

  // Status breakdown
  const statusBreakdown: Record<string, number> = {};
  data?.forEach((record: any) => {
    const status = record.status || "pending";
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
  });

  return NextResponse.json({
    employeeData: chartData,
    monthlyTrend: monthlyChartData,
    statusBreakdown: Object.keys(statusBreakdown).map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: statusBreakdown[status]
    })),
    raw: data,
    summary: {
      totalLeaves: data?.length || 0,
      totalDays: Object.values(employeeLeaves).reduce((sum, emp) => sum + emp.days, 0),
      uniqueEmployees: new Set(data?.map((r: any) => r.employee_id)).size || 0
    }
  });
}

// Projects Report
async function getProjectsReport(supabase: any, employeeId: string | null, month: string | null, year: string | null) {
  let query = supabase
    .from("projects")
    .select(`
      *,
      project_employees:project_employees (
        employee_id,
        employees:employee_id (
          name,
          employee_id
        )
      )
    `)
    .order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter by employee if provided
  let filteredData = data;
  if (employeeId) {
    filteredData = data?.filter((project: any) => 
      project.project_employees?.some((pe: any) => pe.employee_id === employeeId)
    );
  }

  // Group by status
  const statusCounts: Record<string, number> = {};
  filteredData?.forEach((project: any) => {
    const status = project.status || 'active';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  // Employee project count
  const employeeProjectCount: Record<string, number> = {};
  filteredData?.forEach((project: any) => {
    project.project_employees?.forEach((pe: any) => {
      const empId = pe.employee_id;
      employeeProjectCount[empId] = (employeeProjectCount[empId] || 0) + 1;
    });
  });

  const employeeChartData = Object.keys(employeeProjectCount).map(empId => {
    const project = filteredData?.find((p: any) => 
      p.project_employees?.some((pe: any) => pe.employee_id === empId)
    );
    const empData = project?.project_employees?.find((pe: any) => pe.employee_id === empId);
    return {
      employee: empData?.employees?.name || empId,
      employeeId: empId,
      projectCount: employeeProjectCount[empId]
    };
  });

  return NextResponse.json({
    employeeData: employeeChartData,
    statusData: Object.keys(statusCounts).map(status => ({
      status,
      count: statusCounts[status]
    })),
    raw: filteredData,
    summary: {
      totalProjects: filteredData?.length || 0,
      uniqueEmployees: new Set(
        filteredData?.flatMap((p: any) => 
          p.project_employees?.map((pe: any) => pe.employee_id) || []
        )
      ).size || 0
    }
  });
}

// Summary Report - All metrics
async function getSummaryReport(supabase: any, startDate: string, endDate: string) {
  const [overtimeRes, attendanceRes, projectsRes] = await Promise.all([
    getOvertimeReport(supabase, null, startDate, endDate),
    getAttendanceReport(supabase, null, startDate, endDate),
    getProjectsReport(supabase, null, null, null)
  ]);

  const overtimeData = await overtimeRes.json();
  const attendanceData = await attendanceRes.json();
  const projectsData = await projectsRes.json();

  return NextResponse.json({
    overtime: overtimeData.summary,
    attendance: attendanceData.summary,
    projects: projectsData.summary,
    leaves: attendanceData.summary?.totalLeaves || 0
  });
}

