"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  Building2,
  DollarSign,
  Calendar,
  TrendingUp,
  Clock,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalEmployees: number;
  activeToday: number;
  departments: number;
  totalSalaryThisMonth: number;
  onLeaveToday: number;
  presentToday: number;
  absentToday: number;
  totalProjects: number;
  activeProjects: number;
  pendingLeaves: number;
  totalLeaves: number;
  recentActivity: any[];
}

export function DashboardContent() {
  const [stats, setStats] = React.useState<DashboardStats>({
    totalEmployees: 0,
    activeToday: 0,
    departments: 0,
    totalSalaryThisMonth: 0,
    onLeaveToday: 0,
    presentToday: 0,
    absentToday: 0,
    totalProjects: 0,
    activeProjects: 0,
    pendingLeaves: 0,
    totalLeaves: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [employeesRes, attendanceRes, salaryRes, projectsRes, leavesRes] = await Promise.all([
        fetch("/api/employee"),
        fetch(`/api/attendance?date=${new Date().toISOString().split("T")[0]}`),
        fetch("/api/salary"),
        fetch("/api/project"),
        fetch("/api/leaves"),
      ]);

      const [employeesData, attendanceData, salaryData, projectsData, leavesData] = await Promise.all([
        employeesRes.json(),
        attendanceRes.json(),
        salaryRes.json(),
        projectsRes.json(),
        leavesRes.json(),
      ]);

      const employees = employeesData.data || [];
      const attendance = attendanceData.data || [];
      const salaries = salaryData.data || [];
      const projects = projectsData.data || [];
      const leaves = leavesData.data || [];

      // Calculate today's date
      const today = new Date().toISOString().split("T")[0];
      const todayAttendance = attendance.filter(
        (a: any) => a.date === today
      );

      // Get unique departments
      const uniqueDepartments = new Set(
        employees.map((emp: any) => emp.department).filter(Boolean)
      );

      // Calculate current month salary
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const currentMonthSalaries = salaries.filter(
        (s: any) => s.month === currentMonth && s.year === currentYear
      );
      const totalSalary = currentMonthSalaries.reduce(
        (sum: number, s: any) => sum + (parseFloat(s.net_salary) || 0),
        0
      );

      // Calculate active today (checked in)
      const activeToday = todayAttendance.filter(
        (a: any) => a.check_in_time !== null
      ).length;

      // Calculate present, absent, on leave today
      const presentToday = todayAttendance.filter(
        (a: any) => a.status === "present"
      ).length;
      const absentToday = todayAttendance.filter(
        (a: any) => a.status === "absent"
      ).length;
      const onLeaveToday = todayAttendance.filter(
        (a: any) => a.status === "leave"
      ).length;

      // Calculate projects stats
      const totalProjects = projects.length;
      const activeProjects = projects.filter((p: any) => {
        if (!p.deadline) return true;
        const deadline = new Date(p.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return deadline >= today;
      }).length;

      // Calculate leaves stats
      const totalLeaves = leaves.length;
      const pendingLeaves = leaves.filter((l: any) => l.status === "pending").length;

      // Get recent activity (last 5 records from attendance, projects, and leaves)
      const recentActivity: any[] = [];
      
      // Add recent attendance
      attendance.slice(0, 3).forEach((a: any) => {
        recentActivity.push({
          type: "attendance",
          employee: a.employees?.name || a.employee_id,
          action: a.status === "present" ? "checked in" : a.status,
          time: a.check_in_time || a.date,
          date: a.date,
        });
      });

      // Add recent projects
      projects.slice(0, 2).forEach((p: any) => {
        recentActivity.push({
          type: "project",
          name: p.project_name,
          action: "created",
          date: p.created_at || new Date().toISOString().split("T")[0],
        });
      });

      // Sort by date and take last 5
      recentActivity.sort((a, b) => {
        const dateA = new Date(a.date || a.time || 0).getTime();
        const dateB = new Date(b.date || b.time || 0).getTime();
        return dateB - dateA;
      });

      setStats({
        totalEmployees: employees.length,
        activeToday,
        departments: uniqueDepartments.size,
        totalSalaryThisMonth: totalSalary,
        onLeaveToday,
        presentToday,
        absentToday,
        totalProjects,
        activeProjects,
        pendingLeaves,
        totalLeaves,
        recentActivity: recentActivity.slice(0, 5),
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "-";
    return timeString.substring(0, 5);
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            Overview of your employee management system
          </p>
        </div>

        {/* Main Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Employees */}
          <Card className="bg-gradient-to-br from-pink-50 to-fuchsia-50 dark:from-pink-950/20 dark:to-fuchsia-950/20 border-pink-200 dark:border-pink-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Total Employees
                  </p>
                  <p className="text-3xl font-bold">{stats.totalEmployees}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Today */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Active Today
                  </p>
                  <p className="text-3xl font-bold">{stats.activeToday}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.presentToday} present
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Departments */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Departments
                  </p>
                  <p className="text-3xl font-bold">{stats.departments}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Salary This Month */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Salary This Month
                  </p>
                  <p className="text-xl font-bold">
                    {formatCurrency(stats.totalSalaryThisMonth)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Present Today */}
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Present Today
                  </p>
                  <p className="text-xl font-bold">{stats.presentToday}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Absent Today */}
          <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Absent Today
                  </p>
                  <p className="text-xl font-bold">{stats.absentToday}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* On Leave Today */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    On Leave Today
                  </p>
                  <p className="text-xl font-bold">{stats.onLeaveToday}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects and Leaves Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Projects */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Total Projects
                  </p>
                  <p className="text-xl font-bold">{stats.totalProjects}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.activeProjects} active
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-teal-200 dark:border-teal-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Active Projects
                  </p>
                  <p className="text-xl font-bold">{stats.activeProjects}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Leaves */}
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Pending Leaves
                  </p>
                  <p className="text-xl font-bold">{stats.pendingLeaves}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Leaves */}
          <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Total Leaves
                  </p>
                  <p className="text-xl font-bold">{stats.totalLeaves}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Activity */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                  <p className="text-sm text-muted-foreground">
                    Latest activity from attendance, projects & leaves
                  </p>
                </div>
                <Briefcase className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {stats.recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No recent activity</p>
                  </div>
                ) : (
                  stats.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.employee || activity.name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.type === "project" ? "Project" : activity.action} • {activity.date || activity.time?.split("T")[0] || "N/A"}
                        </p>
                      </div>
                      {activity.time && activity.time !== "-" && activity.type !== "project" && (
                        <div className="text-xs text-muted-foreground">
                          {formatTime(activity.time)}
                        </div>
                      )}
                      {activity.type === "project" && (
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Summary */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Today's Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    Attendance overview
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Present
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.presentToday}
                    </p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600 dark:text-green-400 opacity-50" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border border-red-200 dark:border-red-800">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Absent
                    </p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {stats.absentToday}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-red-600 dark:text-red-400 opacity-50" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      On Leave
                    </p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {stats.onLeaveToday}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-amber-600 dark:text-amber-400 opacity-50" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
