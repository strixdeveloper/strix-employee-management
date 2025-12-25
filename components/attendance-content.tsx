"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Employee {
  rowid: number;
  name: string;
  employee_id: string;
  designation: string;
  department: string;
}

interface Attendance {
  rowid: number;
  employee_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  working_hours: number | null;
  overtime_hours: number | null;
  late_minutes: number | null;
  early_departure_minutes: number | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
}

interface AttendanceRow {
  employee_id: string;
  employee_name: string;
  date: string;
  check_in_time: string;
  check_out_time: string;
  status: string;
  notes: string;
  isSelected: boolean;
}

export function AttendanceContent() {
  const [attendance, setAttendance] = React.useState<Attendance[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedAttendance, setSelectedAttendance] = React.useState<Attendance | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  // Bulk entry state
  const [bulkEntryDate, setBulkEntryDate] = React.useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [bulkEntryRows, setBulkEntryRows] = React.useState<AttendanceRow[]>([]);
  const [isBulkMode, setIsBulkMode] = React.useState(false);

  // Filters
  const [selectedEmployee, setSelectedEmployee] = React.useState<string>("all");
  const [startDate, setStartDate] = React.useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = React.useState<string>(
    new Date().toISOString().split("T")[0]
  );

  React.useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, [selectedEmployee, startDate, endDate]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employee");
      const { data, error } = await response.json();
      if (error) throw new Error(error);
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      let url = "/api/attendance?";
      if (selectedEmployee !== "all") {
        url += `employee_id=${selectedEmployee}&`;
      }
      url += `start_date=${startDate}&end_date=${endDate}`;

      const response = await fetch(url);
      const { data, error } = await response.json();
      if (error) throw new Error(error);
      setAttendance(data || []);
    } catch (error: any) {
      showMessage(error.message || "Failed to load attendance", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleStartBulkEntry = async () => {
    setIsBulkMode(true);
    
    // Fetch existing attendance for the selected date
    try {
      const response = await fetch(`/api/attendance?date=${bulkEntryDate}`);
      const { data: existingAttendance, error } = await response.json();
      
      if (error) {
        console.error("Error fetching existing attendance:", error);
      }

      // Create a map of existing attendance by employee_id
      const existingMap = new Map();
      if (existingAttendance && Array.isArray(existingAttendance)) {
        existingAttendance.forEach((att: Attendance) => {
          existingMap.set(att.employee_id, {
            check_in_time: att.check_in_time?.substring(0, 5) || "",
            check_out_time: att.check_out_time?.substring(0, 5) || "",
            status: att.status,
            notes: att.notes || "",
          });
        });
      }

      // Initialize rows with all employees, pre-filling existing data
      const rows: AttendanceRow[] = employees.map((emp) => {
        const existing = existingMap.get(emp.employee_id);
        return {
          employee_id: emp.employee_id,
          employee_name: emp.name,
          date: bulkEntryDate,
          check_in_time: existing?.check_in_time || "",
          check_out_time: existing?.check_out_time || "",
          status: existing?.status || "present",
          notes: existing?.notes || "",
          isSelected: true, // Select all by default
        };
      });
      setBulkEntryRows(rows);
    } catch (error) {
      console.error("Error initializing bulk entry:", error);
      // Fallback: just create empty rows
      const rows: AttendanceRow[] = employees.map((emp) => ({
        employee_id: emp.employee_id,
        employee_name: emp.name,
        date: bulkEntryDate,
        check_in_time: "",
        check_out_time: "",
        status: "present",
        notes: "",
        isSelected: true,
      }));
      setBulkEntryRows(rows);
    }
  };

  const handleBulkRowChange = (index: number, field: keyof AttendanceRow, value: any) => {
    const updated = [...bulkEntryRows];
    updated[index] = { ...updated[index], [field]: value };
    setBulkEntryRows(updated);
  };

  const handleBulkSave = async () => {
    setIsSubmitting(true);
    try {
      // Only save rows that are selected AND have at least check-in or check-out time
      const rowsToSave = bulkEntryRows.filter((row) => 
        row.isSelected && (row.check_in_time || row.check_out_time)
      );
      
      if (rowsToSave.length === 0) {
        showMessage("Please select rows with check-in or check-out time to save", "error");
        setIsSubmitting(false);
        return;
      }

      // First, fetch existing records for the date to check which ones need update vs insert
      const response = await fetch(`/api/attendance?date=${bulkEntryDate}`);
      const { data: existingAttendance } = await response.json();
      const existingMap = new Map();
      if (existingAttendance && Array.isArray(existingAttendance)) {
        existingAttendance.forEach((att: Attendance) => {
          existingMap.set(att.employee_id, att.rowid);
        });
      }

      const promises = rowsToSave.map((row) => {
        const payload = {
          ...(existingMap.has(row.employee_id) ? { rowid: existingMap.get(row.employee_id) } : {}),
          employee_id: row.employee_id,
          date: row.date,
          check_in_time: row.check_in_time ? row.check_in_time + ":00" : null,
          check_out_time: row.check_out_time ? row.check_out_time + ":00" : null,
          status: row.status,
          notes: row.notes || null,
        };

        const method = existingMap.has(row.employee_id) ? "PUT" : "POST";
        return fetch("/api/attendance", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then((res) => res.json());
      });

      const results = await Promise.allSettled(promises);
      const errors = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && r.value.error));

      if (errors.length > 0) {
        showMessage(`Failed to save ${errors.length} record(s)`, "error");
      } else {
        let updatedCount = 0;
        let createdCount = 0;
        rowsToSave.forEach((row) => {
          if (existingMap.has(row.employee_id)) {
            updatedCount++;
          } else {
            createdCount++;
          }
        });
        
        showMessage(
          `Successfully saved ${rowsToSave.length} attendance record(s)! ${createdCount} created, ${updatedCount} updated.`,
          "success"
        );
        setIsBulkMode(false);
        setBulkEntryRows([]);
        fetchAttendance();
      }
    } catch (error: any) {
      showMessage(error.message || "Failed to save attendance", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAttendance) return;

    try {
      const response = await fetch(`/api/attendance?rowid=${selectedAttendance.rowid}`, {
        method: "DELETE",
      });

      const { data, error } = await response.json();
      if (error) throw new Error(error);

      showMessage("Attendance deleted successfully!", "success");
      setIsDeleteDialogOpen(false);
      setSelectedAttendance(null);
      fetchAttendance();
    } catch (error: any) {
      showMessage(error.message || "Failed to delete attendance", "error");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "-";
    return timeString.substring(0, 5);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { label: "Present", className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" },
      absent: { label: "Absent", className: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" },
      half_day: { label: "Half Day", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" },
      leave: { label: "Leave", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" },
      holiday: { label: "Holiday", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.present;
    return (
      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", config.className)}>
        {config.label}
      </span>
    );
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter((a) => a.status === "present").length;
    const absent = attendance.filter((a) => a.status === "absent").length;
    const onLeave = attendance.filter((a) => a.status === "leave").length;
    return { total, present, absent, onLeave };
  }, [attendance]);

  if (loading && attendance.length === 0) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Attendance Management</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Track and manage employee attendance records
            </p>
          </div>
          {!isBulkMode ? (
            <Button
              onClick={handleStartBulkEntry}
              className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white shadow-lg shadow-pink-500/50 hover:shadow-xl hover:shadow-pink-500/50 transition-all duration-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              Record Attendance
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBulkMode(false);
                  setBulkEntryRows([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkSave}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white shadow-lg shadow-pink-500/50 hover:shadow-xl hover:shadow-pink-500/50 transition-all duration-300"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : `Save All (${bulkEntryRows.length})`}
              </Button>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div
            className={cn(
              "p-4 rounded-lg border flex items-center gap-3",
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
            )}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-pink-50 to-fuchsia-50 dark:from-pink-950/20 dark:to-fuchsia-950/20 border-pink-200 dark:border-pink-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-pink-600 dark:text-pink-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Present</p>
                  <p className="text-2xl font-bold mt-1">{stats.present}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Absent</p>
                  <p className="text-2xl font-bold mt-1">{stats.absent}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">On Leave</p>
                  <p className="text-2xl font-bold mt-1">{stats.onLeave}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Entry Mode */}
        {isBulkMode && (
          <Card className="border-2 border-pink-200 dark:border-pink-800">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Bulk Attendance Entry</h3>
                    <p className="text-sm text-muted-foreground">Enter attendance for all employees</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Date</Label>
                      <Input
                        type="date"
                        value={bulkEntryDate}
                        onChange={async (e) => {
                          const newDate = e.target.value;
                          setBulkEntryDate(newDate);
                          
                          // Fetch existing attendance for the new date
                          try {
                            const response = await fetch(`/api/attendance?date=${newDate}`);
                            const { data: existingAttendance } = await response.json();
                            
                            const existingMap = new Map();
                            if (existingAttendance && Array.isArray(existingAttendance)) {
                              existingAttendance.forEach((att: Attendance) => {
                                existingMap.set(att.employee_id, {
                                  check_in_time: att.check_in_time?.substring(0, 5) || "",
                                  check_out_time: att.check_out_time?.substring(0, 5) || "",
                                  status: att.status,
                                  notes: att.notes || "",
                                });
                              });
                            }

                            // Update rows with new date and existing data
                            setBulkEntryRows((rows) =>
                              rows.map((row) => {
                                const existing = existingMap.get(row.employee_id);
                                return {
                                  ...row,
                                  date: newDate,
                                  check_in_time: existing?.check_in_time || row.check_in_time,
                                  check_out_time: existing?.check_out_time || row.check_out_time,
                                  status: existing?.status || row.status,
                                  notes: existing?.notes || row.notes,
                                };
                              })
                            );
                          } catch (error) {
                            // Just update the date if fetch fails
                            setBulkEntryRows((rows) =>
                              rows.map((r) => ({ ...r, date: newDate }))
                            );
                          }
                        }}
                        className="w-40"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={bulkEntryRows.length > 0 && bulkEntryRows.every((r) => r.isSelected)}
                            onCheckedChange={(checked) => {
                              setBulkEntryRows((rows) =>
                                rows.map((r) => ({ ...r, isSelected: checked as boolean }))
                              );
                            }}
                          />
                        </TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkEntryRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Loading employees...
                          </TableCell>
                        </TableRow>
                      ) : (
                        bulkEntryRows.map((row, index) => (
                          <TableRow key={row.employee_id}>
                            <TableCell>
                              <Checkbox
                                checked={row.isSelected}
                                onCheckedChange={(checked) =>
                                  handleBulkRowChange(index, "isSelected", checked)
                                }
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {row.employee_name}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {row.employee_id}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="time"
                                value={row.check_in_time}
                                onChange={(e) =>
                                  handleBulkRowChange(index, "check_in_time", e.target.value)
                                }
                                className="w-32"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="time"
                                value={row.check_out_time}
                                onChange={(e) =>
                                  handleBulkRowChange(index, "check_out_time", e.target.value)
                                }
                                className="w-32"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={row.status}
                                onValueChange={(value) =>
                                  handleBulkRowChange(index, "status", value)
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">Present</SelectItem>
                                  <SelectItem value="absent">Absent</SelectItem>
                                  <SelectItem value="half_day">Half Day</SelectItem>
                                  <SelectItem value="leave">Leave</SelectItem>
                                  <SelectItem value="holiday">Holiday</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.notes}
                                onChange={(e) =>
                                  handleBulkRowChange(index, "notes", e.target.value)
                                }
                                placeholder="Notes..."
                                className="w-48"
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        {!isBulkMode && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs flex items-center gap-2">
                    <Filter className="h-3 w-3" />
                    Employee
                  </Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
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

                <div className="flex-1 space-y-2">
                  <Label className="text-xs flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Start Date
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <Label className="text-xs flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    End Date
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Table */}
        {!isBulkMode && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Working Hours</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No attendance records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendance.map((record) => (
                        <TableRow key={record.rowid}>
                          <TableCell className="font-medium">
                            {formatDate(record.date)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {record.employees?.name || record.employee_id}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {record.employees?.employee_id}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {formatTime(record.check_in_time)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {formatTime(record.check_out_time)}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell>
                            {record.working_hours !== null
                              ? `${record.working_hours.toFixed(1)}h`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {record.late_minutes && record.late_minutes > 0
                              ? `${record.late_minutes}m`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedAttendance(record);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Attendance Record?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the attendance
                record for {selectedAttendance?.employees?.name || selectedAttendance?.employee_id} on{" "}
                {selectedAttendance && formatDate(selectedAttendance.date)}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
