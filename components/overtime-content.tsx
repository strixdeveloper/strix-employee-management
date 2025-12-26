"use client";

import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye, Clock, Calendar, Users, FolderKanban, Filter, CheckCircle2, XCircle, Hourglass } from "lucide-react";
import { OvertimeForm } from "@/components/overtime-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Employee {
  rowid: number;
  name: string;
  employee_id: string;
  email: string;
  designation: string;
  department: string;
}

interface Project {
  rowid: number;
  project_name: string;
  client_name?: string;
}

interface Overtime {
  rowid: number;
  employee_id: string;
  project_id?: number;
  date: string;
  overtime_type: "pending_tasks" | "new_tasks" | "tracking";
  start_time: string;
  end_time: string;
  total_hours: number;
  description?: string;
  status: "pending" | "approved" | "rejected" | "paid";
  approved_by?: string;
  approved_at?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
  projects?: Project;
}

export function OvertimeContent() {
  const [overtimeRecords, setOvertimeRecords] = useState<Overtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOvertime, setSelectedOvertime] = useState<Overtime | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    employee_id: "",
    project_id: "",
    status: "all",
    overtime_type: "all",
    start_date: "",
    end_date: "",
  });
  const itemsPerPage = 20;

  const showToast = (message: string, type: "success" | "error" = "success") => {
    console.log(type === "success" ? `✓ ${message}` : `✗ ${message}`);
    if (type === "error") {
      alert(`Error: ${message}`);
    }
  };

  const fetchOvertime = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.employee_id) params.append("employee_id", filters.employee_id);
      if (filters.project_id) params.append("project_id", filters.project_id);
      if (filters.status && filters.status !== "all") params.append("status", filters.status);
      if (filters.overtime_type && filters.overtime_type !== "all") params.append("overtime_type", filters.overtime_type);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);

      const response = await fetch(`/api/overtime?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch overtime records");
      const result = await response.json();
      setOvertimeRecords(result.data || []);
    } catch (error) {
      showToast("Failed to load overtime records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOvertime();
  }, [filters]);

  const handleAdd = async (data: any) => {
    try {
      setIsSubmitting(true);
      // Convert project_id from string to number if it's not "none"
      const payload = {
        ...data,
        project_id: data.project_id && data.project_id !== "none" ? parseInt(data.project_id) : null,
      };
      const response = await fetch("/api/overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add overtime record");
      }

      showToast("Overtime record added successfully");
      setIsAddDialogOpen(false);
      fetchOvertime();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: any) => {
    if (!selectedOvertime) return;

    try {
      setIsSubmitting(true);
      // Convert project_id from string to number if it's not "none"
      const payload = {
        rowid: selectedOvertime.rowid,
        ...data,
        project_id: data.project_id && data.project_id !== "none" ? parseInt(data.project_id) : null,
      };
      const response = await fetch("/api/overtime", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update overtime record");
      }

      showToast("Overtime record updated successfully");
      setIsEditDialogOpen(false);
      setSelectedOvertime(null);
      fetchOvertime();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOvertime) return;

    try {
      const response = await fetch(`/api/overtime?rowid=${selectedOvertime.rowid}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete overtime record");
      }

      showToast("Overtime record deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedOvertime(null);
      fetchOvertime();
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  const openEditDialog = (overtime: Overtime) => {
    setSelectedOvertime(overtime);
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (overtime: Overtime) => {
    setSelectedOvertime(overtime);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (overtime: Overtime) => {
    setSelectedOvertime(overtime);
    setIsDeleteDialogOpen(true);
  };

  const getOvertimeTypeColor = (type: string) => {
    switch (type) {
      case "pending_tasks":
        return "bg-orange-500";
      case "new_tasks":
        return "bg-blue-500";
      case "tracking":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getOvertimeTypeLabel = (type: string) => {
    switch (type) {
      case "pending_tasks":
        return "Pending Tasks";
      case "new_tasks":
        return "New Tasks";
      case "tracking":
        return "Tracking";
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "rejected":
        return "bg-red-500";
      case "paid":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month} ${day.toString().padStart(2, "0")}, ${year}`;
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "N/A";
    try {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = overtimeRecords.slice(startIndex, endIndex);
  const totalPages = Math.ceil(overtimeRecords.length / itemsPerPage);

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent">
                Overtime Management
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Track and manage employee overtime records
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white shadow-lg shadow-pink-500/50 hover:shadow-xl hover:shadow-pink-500/50 transition-all duration-300">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Overtime
                </Button>
              </DialogTrigger>
              <OvertimeForm
                onSubmit={handleAdd}
                onCancel={() => setIsAddDialogOpen(false)}
                isLoading={isSubmitting}
              />
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Filters</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <Label className="text-xs">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={filters.overtime_type}
                  onValueChange={(value) => setFilters({ ...filters, overtime_type: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pending_tasks">Pending Tasks</SelectItem>
                    <SelectItem value="new_tasks">New Tasks</SelectItem>
                    <SelectItem value="tracking">Tracking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2 flex items-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setFilters({
                    employee_id: "",
                    project_id: "",
                    status: "all",
                    overtime_type: "all",
                    start_date: "",
                    end_date: "",
                  })}
                  className="h-9 flex-1"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableHead className="font-semibold">Employee</TableHead>
                <TableHead className="font-semibold">Project</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Time</TableHead>
                <TableHead className="font-semibold">Hours</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Clock className="h-12 w-12 text-muted-foreground/50" />
                      <p>No overtime records found.</p>
                      <p className="text-sm">Add your first overtime record to get started.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentRecords.map((record) => (
                  <TableRow key={record.rowid} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{record.employees?.name || record.employee_id}</div>
                          <div className="text-xs text-muted-foreground">{record.employees?.employee_id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.projects ? (
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{record.projects.project_name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No project</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(record.date)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getOvertimeTypeColor(record.overtime_type)} text-white text-xs`}
                      >
                        {getOvertimeTypeLabel(record.overtime_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{formatTime(record.start_time)} - {formatTime(record.end_time)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Hourglass className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{record.total_hours.toFixed(2)}h</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getStatusColor(record.status)} text-white text-xs`}
                      >
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openViewDialog(record)}
                          title="View"
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(record)}
                          title="Edit"
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(record)}
                          title="Delete"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Grid View */}
        <div className="md:hidden grid gap-4">
          {currentRecords.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-8">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p>No overtime records found.</p>
                  <p className="text-sm mt-1">Add your first overtime record to get started.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            currentRecords.map((record) => (
              <Card key={record.rowid} className="shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <p className="font-semibold">{record.employees?.name || record.employee_id}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{record.employees?.employee_id}</p>
                      </div>
                      <Badge
                        className={`${getStatusColor(record.status)} text-white text-xs shrink-0`}
                      >
                        {record.status}
                      </Badge>
                    </div>
                    {record.projects && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Project</p>
                        <div className="flex items-center gap-1">
                          <FolderKanban className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm font-medium">{record.projects.project_name}</p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Date</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm">{formatDate(record.date)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Hours</p>
                        <div className="flex items-center gap-1">
                          <Hourglass className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm font-semibold">{record.total_hours.toFixed(2)}h</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Type</p>
                      <Badge
                        className={`${getOvertimeTypeColor(record.overtime_type)} text-white text-xs`}
                      >
                        {getOvertimeTypeLabel(record.overtime_type)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Time</p>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{formatTime(record.start_time)} - {formatTime(record.end_time)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openViewDialog(record)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(record)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive"
                        onClick={() => openDeleteDialog(record)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, overtimeRecords.length)} of{" "}
              {overtimeRecords.length} records
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          {selectedOvertime && (
            <OvertimeForm
              overtime={selectedOvertime}
              onSubmit={handleEdit}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedOvertime(null);
              }}
              isLoading={isSubmitting}
            />
          )}
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          {selectedOvertime && (
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Overtime Details
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Employee</p>
                      <p className="font-medium">{selectedOvertime.employees?.name || selectedOvertime.employee_id}</p>
                      <p className="text-xs text-muted-foreground">{selectedOvertime.employees?.employee_id}</p>
                    </div>
                    {selectedOvertime.projects && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Project</p>
                        <p className="font-medium">{selectedOvertime.projects.project_name}</p>
                        {selectedOvertime.projects.client_name && (
                          <p className="text-xs text-muted-foreground">{selectedOvertime.projects.client_name}</p>
                        )}
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Date</p>
                      <p className="font-medium">{formatDate(selectedOvertime.date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Type</p>
                      <Badge
                        className={`${getOvertimeTypeColor(selectedOvertime.overtime_type)} text-white`}
                      >
                        {getOvertimeTypeLabel(selectedOvertime.overtime_type)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Start Time</p>
                      <p className="font-medium">{formatTime(selectedOvertime.start_time)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">End Time</p>
                      <p className="font-medium">{formatTime(selectedOvertime.end_time)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Hours</p>
                      <p className="font-semibold text-lg">{selectedOvertime.total_hours.toFixed(2)} hours</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <Badge
                        className={`${getStatusColor(selectedOvertime.status)} text-white`}
                      >
                        {selectedOvertime.status}
                      </Badge>
                    </div>
                    {selectedOvertime.description && (
                      <div className="sm:col-span-2">
                        <p className="text-sm text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">{selectedOvertime.description}</p>
                      </div>
                    )}
                    {selectedOvertime.remarks && (
                      <div className="sm:col-span-2">
                        <p className="text-sm text-muted-foreground mb-1">Remarks</p>
                        <p className="text-sm">{selectedOvertime.remarks}</p>
                      </div>
                    )}
                    {selectedOvertime.approved_by && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Approved By</p>
                        <p className="text-sm">{selectedOvertime.approved_by}</p>
                      </div>
                    )}
                    {selectedOvertime.approved_at && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Approved At</p>
                        <p className="text-sm">{formatDate(selectedOvertime.approved_at)}</p>
                      </div>
                    )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the overtime record for{" "}
                <strong>{selectedOvertime?.employees?.name || selectedOvertime?.employee_id}</strong> on{" "}
                {selectedOvertime && formatDate(selectedOvertime.date)}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedOvertime(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:from-pink-600 hover:to-fuchsia-600"
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

