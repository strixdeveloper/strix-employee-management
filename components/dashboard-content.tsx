"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Users,
  UserCheck,
  Building2,
  DollarSign,
  Calendar,
  TrendingUp,
  Clock,
  Briefcase,
  CalendarCheck,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalEmployees: number;
  departments: number;
  totalSalary: number;
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
    departments: 0,
    totalSalary: 0,
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
  const [timePeriod, setTimePeriod] = React.useState<"today" | "month" | "overall">("today");

  React.useEffect(() => {
    fetchDashboardData();
  }, [timePeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split("T")[0];
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      
      // Fetch all data in parallel
      const [employeesRes, attendanceRes, salaryRes, projectsRes, leavesRes] = await Promise.all([
        fetch("/api/employee"),
        fetch(`/api/attendance${timePeriod === "today" ? `?date=${today}` : timePeriod === "month" ? `?start_date=${monthStart}&end_date=${today}` : ""}`),
        fetch("/api/salary"),
        fetch("/api/project"),
        fetch(`/api/leaves${timePeriod === "today" ? `?start_date=${today}&end_date=${today}` : timePeriod === "month" ? `?start_date=${monthStart}&end_date=${today}` : ""}`),
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

      // Filter attendance based on time period
      let filteredAttendance = attendance;
      if (timePeriod === "today") {
        filteredAttendance = attendance.filter((a: any) => a.date === today);
      } else if (timePeriod === "month") {
        filteredAttendance = attendance.filter((a: any) => {
          const date = new Date(a.date);
          return date >= new Date(monthStart) && date <= new Date(today);
        });
      }

      // Get unique departments
      const uniqueDepartments = new Set(
        employees.map((emp: any) => emp.department).filter(Boolean)
      );

      // Calculate salary based on time period
      let totalSalary = 0;
      if (timePeriod === "month" || timePeriod === "overall") {
        const filteredSalaries = timePeriod === "month" 
          ? salaries.filter((s: any) => s.month === currentMonth && s.year === currentYear)
          : salaries;
        totalSalary = filteredSalaries.reduce(
          (sum: number, s: any) => sum + (parseFloat(s.net_salary) || 0),
          0
        );
      }

      // Calculate present, absent, on leave
      const presentToday = filteredAttendance.filter(
        (a: any) => a.status === "present"
      ).length;
      const absentToday = filteredAttendance.filter(
        (a: any) => a.status === "absent"
      ).length;
      const onLeaveToday = filteredAttendance.filter(
        (a: any) => a.status === "leave"
      ).length;

      // Calculate projects stats
      const totalProjects = projects.length;
      const activeProjects = projects.filter((p: any) => {
        if (!p.deadline) return true;
        const deadline = new Date(p.deadline);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        return deadline >= todayDate;
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
        departments: uniqueDepartments.size,
        totalSalary,
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
    <div className="p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">
                Dashboard
              </h2>
              <p className="text-muted-foreground text-sm">
                Overview of your employee management system
              </p>
            </div>
            
            {/* Time Period Tabs */}
            <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as "today" | "month" | "overall")}>
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800">
                <TabsTrigger value="today" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  Today
                </TabsTrigger>
                <TabsTrigger value="month" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  This Month
                </TabsTrigger>
                <TabsTrigger value="overall" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  Overall
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Employees */}
          <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-pink-300 dark:hover:border-pink-600 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Total Employees
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalEmployees}</p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Departments */}
          <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Departments
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.departments}</p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary */}
          <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {timePeriod === "today" ? "Salary (This Month)" : timePeriod === "month" ? "Salary (This Month)" : "Total Salary"}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.totalSalary)}
                  </p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-lg">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Projects */}
          <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Total Projects
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalProjects}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.activeProjects} active
                  </p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Briefcase className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance & Leaves Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Present */}
          <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-green-300 dark:hover:border-green-600 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {timePeriod === "today" ? "Present Today" : timePeriod === "month" ? "Present (This Month)" : "Total Present"}
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.presentToday}</p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <CalendarCheck className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Absent */}
          <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-red-300 dark:hover:border-red-600 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {timePeriod === "today" ? "Absent Today" : timePeriod === "month" ? "Absent (This Month)" : "Total Absent"}
                  </p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.absentToday}</p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg">
                  <AlertCircle className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* On Leave */}
          <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {timePeriod === "today" ? "On Leave Today" : timePeriod === "month" ? "On Leave (This Month)" : "Total On Leave"}
                  </p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.onLeaveToday}</p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Leaves */}
          <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-yellow-300 dark:hover:border-yellow-600 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Pending Leaves
                  </p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingLeaves}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalLeaves} total
                  </p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg">
                  <Clock className="h-7 w-7 text-white" />
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
          <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {timePeriod === "today" ? "Today's Summary" : timePeriod === "month" ? "This Month Summary" : "Overall Summary"}
                  </h3>
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
