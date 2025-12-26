"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Clock,
  CalendarCheck,
  CalendarX,
  FolderKanban,
  TrendingUp,
  Users,
  Download,
  DollarSign,
  FileText,
} from "lucide-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COLORS = ["#ec4899", "#d946ef", "#a855f7", "#8b5cf6", "#6366f1"];

interface ReportData {
  overtime?: any;
  attendance?: any;
  leaves?: any;
  projects?: any;
  summary?: any;
}

export function ReportsContent() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData>({});
  const [selectedReport, setSelectedReport] = useState<string>("summary");
  const [filters, setFilters] = useState({
    employee_id: "all",
    start_date: "",
    end_date: "",
    month: "",
    year: new Date().getFullYear().toString(),
  });
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedReport, filters]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employee");
      const data = await res.json();
      setEmployees(data.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedReport === "summary") {
        params.append("type", "summary");
        params.append("start_date", filters.start_date || getDefaultStartDate());
        params.append("end_date", filters.end_date || getDefaultEndDate());
      } else {
        params.append("type", selectedReport);
        if (filters.employee_id && filters.employee_id !== "all") {
          params.append("employee_id", filters.employee_id);
        }
        if (filters.start_date) params.append("start_date", filters.start_date);
        if (filters.end_date) params.append("end_date", filters.end_date);
        if (filters.month) params.append("month", filters.month);
        if (filters.year) params.append("year", filters.year);
      }

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      setReportData({ [selectedReport]: data });
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  };

  const getDefaultEndDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && !reportData[selectedReport as keyof ReportData]) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent">
                Reports & Analytics
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Comprehensive insights into your workforce
              </p>
            </div>
          </div>
        </div>

        {/* Report Type Selector */}
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <Button
                variant={selectedReport === "summary" ? "default" : "outline"}
                onClick={() => setSelectedReport("summary")}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs sm:text-sm">Summary</span>
              </Button>
              <Button
                variant={selectedReport === "overtime" ? "default" : "outline"}
                onClick={() => setSelectedReport("overtime")}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Clock className="h-5 w-5" />
                <span className="text-xs sm:text-sm">Overtime</span>
              </Button>
              <Button
                variant={selectedReport === "attendance" ? "default" : "outline"}
                onClick={() => setSelectedReport("attendance")}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <CalendarCheck className="h-5 w-5" />
                <span className="text-xs sm:text-sm">Attendance</span>
              </Button>
              <Button
                variant={selectedReport === "leaves" ? "default" : "outline"}
                onClick={() => setSelectedReport("leaves")}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <CalendarX className="h-5 w-5" />
                <span className="text-xs sm:text-sm">Leaves</span>
              </Button>
              <Button
                variant={selectedReport === "projects" ? "default" : "outline"}
                onClick={() => setSelectedReport("projects")}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <FolderKanban className="h-5 w-5" />
                <span className="text-xs sm:text-sm">Projects</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedReport !== "summary" && (
                <div>
                  <Label className="text-xs">Employee</Label>
                  <Select
                    value={filters.employee_id || "all"}
                    onValueChange={(value) =>
                      setFilters({ ...filters, employee_id: value })
                    }
                  >
                    <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.employee_id} value={emp.employee_id}>
                          {emp.name} ({emp.employee_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={filters.start_date || getDefaultStartDate()}
                  onChange={(e) =>
                    setFilters({ ...filters, start_date: e.target.value })
                  }
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input
                  type="date"
                  value={filters.end_date || getDefaultEndDate()}
                  onChange={(e) =>
                    setFilters({ ...filters, end_date: e.target.value })
                  }
                  className="h-9"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      employee_id: "all",
                      start_date: "",
                      end_date: "",
                      month: "",
                      year: new Date().getFullYear().toString(),
                    });
                  }}
                  className="h-9 w-full"
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        <div className="space-y-6">
          {selectedReport === "summary" && (
            <SummaryReport data={reportData.summary} />
          )}
          {selectedReport === "overtime" && (
            <OvertimeReport data={reportData.overtime} />
          )}
          {selectedReport === "attendance" && (
            <AttendanceReport data={reportData.attendance} />
          )}
          {selectedReport === "leaves" && (
            <LeavesReport data={reportData.leaves} />
          )}
          {selectedReport === "projects" && (
            <ProjectsReport data={reportData.projects} />
          )}
        </div>
      </div>
    </div>
  );
}

// Summary Report Component
function SummaryReport({ data }: { data: any }) {
  if (!data) return null;

  const summaryCards = [
    {
      title: "Total Overtime Hours",
      value: data.overtime?.totalHours?.toFixed(2) || "0",
      icon: Clock,
      color: "from-pink-500 to-fuchsia-500",
    },
    {
      title: "Total Attendance",
      value: data.attendance?.totalRecords || "0",
      icon: CalendarCheck,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Total Leaves",
      value: data.leaves || "0",
      icon: CalendarX,
      color: "from-orange-500 to-red-500",
    },
    {
      title: "Total Projects",
      value: data.projects?.totalProjects || "0",
      icon: FolderKanban,
      color: "from-purple-500 to-indigo-500",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="shadow-lg border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold">{card.value}</p>
                  </div>
                  <div
                    className={`h-12 w-12 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}

// Overtime Report Component
function OvertimeReport({ data }: { data: any }) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  
  if (!data) return null;

  const chartData = data.data || [];
  const rawData = data.raw || [];
  const summary = data.summary || {};

  // Process employee-wise data
  const employeeStats: Record<string, {
    name: string;
    employeeId: string;
    totalHours: number;
    totalRecords: number;
    monthlyData: Record<string, number>;
    records: any[];
  }> = {};

  rawData.forEach((record: any) => {
    const empId = record.employee_id;
    const empName = record.employees?.name || empId;
    
    if (!employeeStats[empId]) {
      employeeStats[empId] = {
        name: empName,
        employeeId: empId,
        totalHours: 0,
        totalRecords: 0,
        monthlyData: {},
        records: [],
      };
    }
    
    const hours = parseFloat(record.total_hours) || 0;
    employeeStats[empId].totalHours += hours;
    employeeStats[empId].totalRecords += 1;
    employeeStats[empId].records.push(record);
    
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    employeeStats[empId].monthlyData[monthKey] = (employeeStats[empId].monthlyData[monthKey] || 0) + hours;
  });

  // Payment summary table data
  const paymentSummary = Object.keys(employeeStats).map(empId => ({
    employeeId: empId,
    name: employeeStats[empId].name,
    totalHours: employeeStats[empId].totalHours,
    totalRecords: employeeStats[empId].totalRecords,
  })).sort((a, b) => b.totalHours - a.totalHours);

  // Group by employee for bar chart
  const employeeHours: Record<string, number> = {};
  chartData.forEach((item: any) => {
    employeeHours[item.employee] =
      (employeeHours[item.employee] || 0) + item.hours;
  });

  const barChartData = Object.keys(employeeHours).map((emp) => ({
    employee: emp.length > 15 ? emp.substring(0, 15) + "..." : emp,
    hours: employeeHours[emp],
  }));

  // Monthly trend
  const monthlyData: Record<string, number> = {};
  chartData.forEach((item: any) => {
    monthlyData[item.month] =
      (monthlyData[item.month] || 0) + item.hours;
  });

  const lineChartData = Object.keys(monthlyData)
    .sort()
    .map((month) => ({
      month: month.substring(5), // Show only MM
      hours: monthlyData[month],
    }));

  // Selected employee data
  const selectedEmpData = selectedEmployee !== "all" ? employeeStats[selectedEmployee] : null;
  const selectedEmpMonthlyChart = selectedEmpData 
    ? Object.keys(selectedEmpData.monthlyData)
        .sort()
        .map(month => ({
          month: month.substring(5),
          hours: selectedEmpData.monthlyData[month],
        }))
    : [];

  // CSV Export function
  const exportToCSV = () => {
    if (paymentSummary.length === 0) {
      alert("No data to export");
      return;
    }

    // Create CSV headers
    const headers = ["Employee ID", "Employee Name", "Total Hours", "Total Records", "Status"];
    
    // Create CSV rows
    const rows = paymentSummary.map(emp => [
      emp.employeeId,
      emp.name,
      emp.totalHours.toFixed(2),
      emp.totalRecords.toString(),
      "Pending Payment"
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create BOM for UTF-8 (Excel compatibility)
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    
    // Create download link
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    
    // Generate filename with current date
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    link.setAttribute("download", `overtime-payment-summary-${dateStr}.csv`);
    
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">
              Total Hours
            </p>
            <p className="text-2xl font-bold">{summary.totalHours?.toFixed(2) || "0"}</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">
              Total Records
            </p>
            <p className="text-2xl font-bold">{summary.totalRecords || "0"}</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">
              Employees
            </p>
            <p className="text-2xl font-bold">{summary.uniqueEmployees || "0"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Summary Table */}
      <Card className="shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Payment Summary - Total Overtime Hours
            </CardTitle>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead className="text-right">Records</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentSummary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No overtime records found
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentSummary.map((emp) => (
                    <TableRow key={emp.employeeId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell className="font-medium">{emp.employeeId}</TableCell>
                      <TableCell>{emp.name}</TableCell>
                      <TableCell className="text-right font-semibold text-lg">
                        {emp.totalHours.toFixed(2)}h
                      </TableCell>
                      <TableCell className="text-right">{emp.totalRecords}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Pending Payment
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Employee Tabs */}
      <Tabs value={selectedEmployee} onValueChange={setSelectedEmployee} className="w-full">
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee-wise Overtime Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 mb-6 h-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                All Employees
              </TabsTrigger>
              {Object.keys(employeeStats).map((empId) => {
                const emp = employeeStats[empId];
                const displayName = emp.name.length > 12 
                  ? emp.name.substring(0, 12) + "..." 
                  : emp.name;
                return (
                  <TabsTrigger 
                    key={empId} 
                    value={empId}
                    className="text-xs sm:text-sm"
                  >
                    {displayName}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Overtime by Employee</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="employee" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="hours" fill="#ec4899" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={lineChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="hours"
                          stroke="#ec4899"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {Object.keys(employeeStats).map((empId) => {
              const emp = employeeStats[empId];
              return (
                <TabsContent key={empId} value={empId} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Total Hours</p>
                        <p className="text-2xl font-bold">{emp.totalHours.toFixed(2)}h</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Total Records</p>
                        <p className="text-2xl font-bold">{emp.totalRecords}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Average per Record</p>
                        <p className="text-2xl font-bold">
                          {emp.totalRecords > 0 
                            ? (emp.totalHours / emp.totalRecords).toFixed(2) 
                            : "0"}h
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Overtime Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={selectedEmpMonthlyChart}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="hours" fill="#ec4899" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Overtime Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead className="text-right">Hours</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {emp.records.slice(0, 10).map((record: any) => (
                              <TableRow key={record.rowid}>
                                <TableCell>
                                  {new Date(record.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {record.overtime_type?.replace('_', ' ')}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {record.start_time?.substring(0, 5)} - {record.end_time?.substring(0, 5)}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {parseFloat(record.total_hours).toFixed(2)}h
                                </TableCell>
                                <TableCell>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    record.status === 'approved' 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : record.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                  }`}>
                                    {record.status}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {emp.records.length > 10 && (
                          <p className="text-sm text-muted-foreground mt-4 text-center">
                            Showing 10 of {emp.records.length} records
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </CardContent>
        </Card>
      </Tabs>
    </>
  );
}

// Attendance Report Component
function AttendanceReport({ data }: { data: any }) {
  if (!data) return null;

  const employeeData = data.employeeData || [];
  const dailyTrend = data.dailyTrend || [];
  const summary = data.summary || {};

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Present</p>
            <p className="text-2xl font-bold">{summary.totalPresent || "0"}</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Absent</p>
            <p className="text-2xl font-bold">{summary.totalAbsent || "0"}</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Leaves</p>
            <p className="text-2xl font-bold">{summary.totalLeaves || "0"}</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Employees</p>
            <p className="text-2xl font-bold">{summary.uniqueEmployees || "0"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Attendance Rate by Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="employee"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#10b981" />
                <Bar dataKey="absent" fill="#ef4444" />
                <Bar dataKey="leave" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Daily Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrend.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="present"
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="absent"
                  stroke="#ef4444"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="leave"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Leaves Report Component
function LeavesReport({ data }: { data: any }) {
  if (!data) return null;

  const employeeData = data.employeeData || [];
  const monthlyTrend = data.monthlyTrend || [];
  const summary = data.summary || {};

  const pieData = employeeData.slice(0, 5).map((item: any) => ({
    name: item.employee.length > 15
      ? item.employee.substring(0, 15) + "..."
      : item.employee,
    value: item.leaveCount,
  }));

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Leaves</p>
            <p className="text-2xl font-bold">{summary.totalLeaves || "0"}</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Employees</p>
            <p className="text-2xl font-bold">{summary.uniqueEmployees || "0"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Leaves by Employee (Top 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Monthly Leave Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Projects Report Component
function ProjectsReport({ data }: { data: any }) {
  if (!data) return null;

  const employeeData = data.employeeData || [];
  const statusData = data.statusData || [];
  const summary = data.summary || {};

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Projects</p>
            <p className="text-2xl font-bold">{summary.totalProjects || "0"}</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Employees</p>
            <p className="text-2xl font-bold">{summary.uniqueEmployees || "0"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Projects by Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="employee"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="projectCount" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Projects by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

