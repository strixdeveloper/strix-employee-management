"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  CalendarX,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmployeeDashboardStats {
  totalSalary: number;
  thisMonthSalary: number;
  totalLeaves: number;
  pendingLeaves: number;
  approvedLeaves: number;
  totalOvertimeHours: number;
  thisMonthOvertimeHours: number;
  recentSalary: any;
  recentLeaves: any[];
  recentOvertime: any[];
}

export function EmployeeDashboardContent() {
  const [stats, setStats] = React.useState<EmployeeDashboardStats>({
    totalSalary: 0,
    thisMonthSalary: 0,
    totalLeaves: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    totalOvertimeHours: 0,
    thisMonthOvertimeHours: 0,
    recentSalary: null,
    recentLeaves: [],
    recentOvertime: [],
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Fetch all data in parallel
      const [salaryRes, leavesRes, overtimeRes] = await Promise.all([
        fetch("/api/employee/salary"),
        fetch("/api/employee/leaves"),
        fetch("/api/employee/overtime"),
      ]);

      const [salaryData, leavesData, overtimeData] = await Promise.all([
        salaryRes.json(),
        leavesRes.json(),
        overtimeRes.json(),
      ]);

      const salaries = salaryData.data || [];
      const leaves = leavesData.data || [];
      const overtime = overtimeData.data || [];

      // Calculate salary stats
      const totalSalary = salaries.reduce(
        (sum: number, s: any) => sum + (parseFloat(s.net_salary) || 0),
        0
      );

      const thisMonthSalaries = salaries.filter(
        (s: any) => s.month === currentMonth && s.year === currentYear
      );
      const thisMonthSalary = thisMonthSalaries.reduce(
        (sum: number, s: any) => sum + (parseFloat(s.net_salary) || 0),
        0
      );

      const recentSalary = salaries.length > 0 ? salaries[0] : null;

      // Calculate leaves stats
      const totalLeaves = leaves.length;
      const pendingLeaves = leaves.filter((l: any) => l.status === "pending").length;
      const approvedLeaves = leaves.filter((l: any) => l.status === "approved").length;

      const recentLeaves = leaves
        .sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || a.start_date).getTime();
          const dateB = new Date(b.created_at || b.start_date).getTime();
          return dateB - dateA;
        })
        .slice(0, 3);

      // Calculate overtime stats
      const totalOvertimeHours = overtime.reduce(
        (sum: number, o: any) => sum + (parseFloat(o.actual_working_hours || o.total_hours) || 0),
        0
      );

      const thisMonthOvertime = overtime.filter((o: any) => {
        const date = new Date(o.date);
        return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
      });
      const thisMonthOvertimeHours = thisMonthOvertime.reduce(
        (sum: number, o: any) => sum + (parseFloat(o.actual_working_hours || o.total_hours) || 0),
        0
      );

      const recentOvertime = overtime
        .sort((a: any, b: any) => {
          const dateA = new Date(a.date || a.created_at).getTime();
          const dateB = new Date(b.date || b.created_at).getTime();
          return dateB - dateA;
        })
        .slice(0, 3);

      setStats({
        totalSalary,
        thisMonthSalary,
        totalLeaves,
        pendingLeaves,
        approvedLeaves,
        totalOvertimeHours,
        thisMonthOvertimeHours,
        recentSalary,
        recentLeaves,
        recentOvertime,
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    } catch {
      return dateString;
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  if (loading) {
    return (
      <div className="p-6 lg:p-12 min-h-full">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-12 min-h-full">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Welcome back! Here's your overview.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Total Salary Card */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Salary</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1 text-green-700 dark:text-green-400">
                    {formatCurrency(stats.totalSalary)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-500/20 dark:bg-green-500/10 flex items-center justify-center shrink-0">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Month Salary Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">This Month Salary</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1 text-blue-700 dark:text-blue-400">
                    {formatCurrency(stats.thisMonthSalary)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {monthNames[new Date().getMonth()]} {new Date().getFullYear()}
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-500/20 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Leaves Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Leaves</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1 text-purple-700 dark:text-purple-400">
                    {stats.totalLeaves}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.pendingLeaves} pending, {stats.approvedLeaves} approved
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-purple-500/20 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                  <CalendarX className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Leaves Card */}
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pending Leaves</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1 text-orange-700 dark:text-orange-400">
                    {stats.pendingLeaves}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-orange-500/20 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Overtime Card */}
          <Card className="bg-gradient-to-br from-pink-50 to-fuchsia-50 dark:from-pink-950/20 dark:to-fuchsia-950/20 border-pink-200 dark:border-pink-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Overtime</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1 text-pink-700 dark:text-pink-400">
                    {stats.totalOvertimeHours.toFixed(1)}h
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-pink-500/20 dark:bg-pink-500/10 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600 dark:text-pink-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Month Overtime Card */}
          <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 border-indigo-200 dark:border-indigo-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">This Month Overtime</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1 text-indigo-700 dark:text-indigo-400">
                    {stats.thisMonthOvertimeHours.toFixed(1)}h
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {monthNames[new Date().getMonth()]} {new Date().getFullYear()}
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-indigo-500/20 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent Salary Slip */}
          <Card className="border border-gray-200/50 dark:border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                Recent Salary Slip
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentSalary ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Month</p>
                    <p className="text-lg font-semibold">
                      {monthNames[stats.recentSalary.month - 1]} {stats.recentSalary.year}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net Salary</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(stats.recentSalary.net_salary)}
                    </p>
                  </div>
                  <Link href="/protected/employee/salary">
                    <Button variant="outline" className="w-full">
                      View All Salary Slips
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No salary slips yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Leaves */}
          <Card className="border border-gray-200/50 dark:border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarX className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Recent Leaves
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentLeaves.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentLeaves.map((leave: any) => (
                    <div
                      key={leave.rowid}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {formatDate(leave.start_date)}
                          {leave.end_date && ` - ${formatDate(leave.end_date)}`}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {leave.leave_type?.replace("_", " ")}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          leave.status === "approved"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : leave.status === "pending"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}
                      >
                        {leave.status}
                      </div>
                    </div>
                  ))}
                  <Link href="/protected/employee/leaves">
                    <Button variant="outline" className="w-full mt-3">
                      View All Leaves
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CalendarX className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No leave records yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Overtime */}
          <Card className="border border-gray-200/50 dark:border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                Recent Overtime
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentOvertime.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentOvertime.map((ot: any) => (
                    <div
                      key={ot.rowid}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{formatDate(ot.date)}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {ot.overtime_type?.replace("_", " ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                          {(ot.actual_working_hours || ot.total_hours).toFixed(1)}h
                        </p>
                      </div>
                    </div>
                  ))}
                  <Link href="/protected/employee/overtime">
                    <Button variant="outline" className="w-full mt-3">
                      View All Overtime
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No overtime records yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

