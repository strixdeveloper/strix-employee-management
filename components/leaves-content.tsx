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
import { LeavesForm } from "@/components/leaves-form";
import { Plus, Pencil, Trash2, Eye, Calendar, Users, Filter, CalendarX, Clock, CheckCircle2, XCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Employee {
  rowid: number;
  name: string;
  employee_id: string;
  email: string;
  designation: string;
  department: string;
}

interface Leave {
  rowid: number;
  employee_id: string;
  leave_type: "full_day" | "half_day" | "multiple_days";
  start_date: string;
  end_date?: string;
  status: "pending" | "approved" | "cancelled";
  reason?: string;
  approved_by?: string;
  approved_at?: string;
  cancelled_at?: string;
  cancelled_reason?: string;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
  approver?: {
    name: string;
    employee_id: string;
  };
}

export function LeavesContent() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    employee_id: "all",
    leave_type: "all",
    start_date: "",
    end_date: "",
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [viewMode, setViewMode] = useState<"all" | "pending" | "approved" | "cancelled">("all");
  const itemsPerPage = 20;

  const showToast = (message: string, type: "success" | "error" = "success") => {
    console.log(type === "success" ? `✓ ${message}` : `✗ ${message}`);
    if (type === "error") {
      alert(`Error: ${message}`);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [filters]);

  useEffect(() => {
    // View mode changes will be handled in fetchLeaves
    fetchLeaves();
  }, [viewMode]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employee");
      const data = await res.json();
      setEmployees(data.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.employee_id && filters.employee_id !== "all") {
        params.append("employee_id", filters.employee_id);
      }
      // Override status filter based on view mode
      if (viewMode === "pending") {
        params.append("status", "pending");
      } else if (viewMode === "approved") {
        params.append("status", "approved");
      } else if (viewMode === "cancelled") {
        params.append("status", "cancelled");
      } else if (viewMode === "all") {
        // Don't filter by status - show all
      }
      if (filters.leave_type && filters.leave_type !== "all") {
        params.append("leave_type", filters.leave_type);
      }
      if (filters.start_date) {
        params.append("start_date", filters.start_date);
      }
      if (filters.end_date) {
        params.append("end_date", filters.end_date);
      }

      const response = await fetch(`/api/leaves?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch leaves");
      const result = await response.json();
      setLeaves(result.data || []);
    } catch (error) {
      showToast("Failed to load leaves", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (data: any) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add leave");
      }

      showToast("Leave added successfully");
      setIsAddDialogOpen(false);
      fetchLeaves();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: any) => {
    if (!selectedLeave) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/leaves", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowid: selectedLeave.rowid,
          ...data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update leave");
      }

      showToast("Leave updated successfully");
      setIsEditDialogOpen(false);
      setSelectedLeave(null);
      fetchLeaves();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLeave) return;

    try {
      const response = await fetch(`/api/leaves?rowid=${selectedLeave.rowid}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete leave");
      }

      showToast("Leave deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedLeave(null);
      fetchLeaves();
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  const handleApprove = async (leave: Leave) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/leaves", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowid: leave.rowid,
          status: "approved",
          approved_by: null, // Set to null since we don't have employee_id mapping yet
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve leave");
      }

      showToast("Leave approved successfully");
      fetchLeaves();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCancelDialog = (leave: Leave) => {
    setSelectedLeave(leave);
    setCancelReason("");
    setIsCancelDialogOpen(true);
  };

  const handleCancel = async () => {
    if (!selectedLeave) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/leaves", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowid: selectedLeave.rowid,
          status: "cancelled",
          cancelled_reason: cancelReason.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel leave");
      }

      showToast("Leave cancelled successfully");
      setIsCancelDialogOpen(false);
      setSelectedLeave(null);
      setCancelReason("");
      fetchLeaves();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (leave: Leave) => {
    setSelectedLeave(leave);
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (leave: Leave) => {
    setSelectedLeave(leave);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (leave: Leave) => {
    setSelectedLeave(leave);
    setIsDeleteDialogOpen(true);
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case "full_day":
        return "Full Day";
      case "half_day":
        return "Half Day";
      case "multiple_days":
        return "Multiple Days";
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
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getDateRange = (leave: Leave) => {
    if (leave.leave_type === "multiple_days" && leave.end_date) {
      return `${formatDate(leave.start_date)} - ${formatDate(leave.end_date)}`;
    }
    return formatDate(leave.start_date);
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
  const currentLeaves = leaves.slice(startIndex, endIndex);
  const totalPages = Math.ceil(leaves.length / itemsPerPage);

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent">
                Leaves Management
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Track and manage employee leave requests
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 border rounded-lg p-1 bg-gray-50 dark:bg-gray-800">
                <Button
                  variant={viewMode === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("all")}
                  className="h-8 px-3 text-xs sm:text-sm"
                >
                  All
                </Button>
                <Button
                  variant={viewMode === "pending" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("pending")}
                  className="h-8 px-3 text-xs sm:text-sm"
                >
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  <span className="hidden sm:inline">Pending</span>
                  <span className="sm:hidden">Pending</span>
                  {leaves.filter(l => l.status === "pending").length > 0 && (
                    <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center bg-yellow-600 text-white text-xs">
                      {leaves.filter(l => l.status === "pending").length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={viewMode === "approved" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("approved")}
                  className="h-8 px-3 text-xs sm:text-sm"
                >
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  <span className="hidden sm:inline">Approved</span>
                  <span className="sm:hidden">Approved</span>
                </Button>
                <Button
                  variant={viewMode === "cancelled" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cancelled")}
                  className="h-8 px-3 text-xs sm:text-sm"
                >
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  <span className="hidden sm:inline">Cancelled</span>
                  <span className="sm:hidden">Cancelled</span>
                </Button>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white shadow-lg shadow-pink-500/50 hover:shadow-xl hover:shadow-pink-500/50 transition-all duration-300">
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Add Leave</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </DialogTrigger>
                <LeavesForm
                  onSubmit={handleAdd}
                  onCancel={() => setIsAddDialogOpen(false)}
                  isLoading={isSubmitting}
                  employees={employees}
                />
              </Dialog>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Filters</h3>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[140px] sm:min-w-[160px]">
                <Label className="text-xs mb-1.5 block">Employee</Label>
                <Select
                  value={filters.employee_id || "all"}
                  onValueChange={(value) =>
                    setFilters({ ...filters, employee_id: value })
                  }
                >
                  <SelectTrigger className="h-9 w-full">
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
              <div className="flex-1 min-w-[140px] sm:min-w-[160px]">
                <Label className="text-xs mb-1.5 block">Leave Type</Label>
                <Select
                  value={filters.leave_type}
                  onValueChange={(value) =>
                    setFilters({ ...filters, leave_type: value })
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full_day">Full Day</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                    <SelectItem value="multiple_days">Multiple Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[140px] sm:min-w-[160px]">
                <Label className="text-xs mb-1.5 block">Start Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) =>
                      setFilters({ ...filters, start_date: e.target.value })
                    }
                    className="h-9 pl-10"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-[140px] sm:min-w-[160px]">
                <Label className="text-xs mb-1.5 block">End Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) =>
                      setFilters({ ...filters, end_date: e.target.value })
                    }
                    className="h-9 pl-10"
                    min={filters.start_date}
                  />
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      employee_id: "all",
                      leave_type: "all",
                      start_date: "",
                      end_date: "",
                    })
                  }
                  className="h-9 px-4 whitespace-nowrap"
                >
                  Clear Filters
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
                <TableHead className="font-semibold">Leave Type</TableHead>
                <TableHead className="font-semibold">Date Range</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Reason</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentLeaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <CalendarX className="h-12 w-12 text-muted-foreground/50" />
                      <p>No leave records found.</p>
                      <p className="text-sm">Add your first leave record to get started.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentLeaves.map((leave) => (
                  <TableRow
                    key={leave.rowid}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {leave.employees?.name || leave.employee_id}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {leave.employees?.employee_id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getLeaveTypeLabel(leave.leave_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{getDateRange(leave)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getStatusColor(leave.status)} text-white text-xs`}
                      >
                        {leave.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {leave.reason || "No reason provided"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {leave.status === "pending" && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(leave)}
                              title="Approve"
                              className="h-8 bg-green-600 hover:bg-green-700 text-white border-0"
                              disabled={isSubmitting}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openCancelDialog(leave)}
                              title="Cancel"
                              className="h-8 bg-red-600 hover:bg-red-700 text-white border-0"
                              disabled={isSubmitting}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openViewDialog(leave)}
                          title="View"
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(leave)}
                          title="Edit"
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(leave)}
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
          {currentLeaves.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-8">
                  <CalendarX className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p>No leave records found.</p>
                  <p className="text-sm mt-1">Add your first leave record to get started.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            currentLeaves.map((leave) => (
              <Card
                key={leave.rowid}
                className="shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <p className="font-semibold">
                            {leave.employees?.name || leave.employee_id}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {leave.employees?.employee_id}
                        </p>
                      </div>
                      <Badge
                        className={`${getStatusColor(leave.status)} text-white text-xs shrink-0`}
                      >
                        {leave.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Type</p>
                        <Badge variant="outline" className="text-xs">
                          {getLeaveTypeLabel(leave.leave_type)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Date</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm">{getDateRange(leave)}</p>
                        </div>
                      </div>
                    </div>
                    {leave.reason && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Reason</p>
                        <p className="text-sm">{leave.reason}</p>
                      </div>
                    )}
                    {leave.status === "pending" && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0"
                          onClick={() => handleApprove(leave)}
                          disabled={isSubmitting}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
                          onClick={() => openCancelDialog(leave)}
                          disabled={isSubmitting}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openViewDialog(leave)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(leave)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive"
                        onClick={() => openDeleteDialog(leave)}
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
              Showing {startIndex + 1} to {Math.min(endIndex, leaves.length)} of{" "}
              {leaves.length} records
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
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
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
          {selectedLeave && (
            <LeavesForm
              leave={selectedLeave}
              onSubmit={handleEdit}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedLeave(null);
              }}
              isLoading={isSubmitting}
              employees={employees}
            />
          )}
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          {selectedLeave && (
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Leave Details
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Employee</p>
                    <p className="font-medium">
                      {selectedLeave.employees?.name || selectedLeave.employee_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedLeave.employees?.employee_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Leave Type</p>
                    <Badge variant="outline">
                      {getLeaveTypeLabel(selectedLeave.leave_type)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                    <p className="font-medium">{formatDate(selectedLeave.start_date)}</p>
                  </div>
                  {selectedLeave.end_date && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">End Date</p>
                      <p className="font-medium">{formatDate(selectedLeave.end_date)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge
                      className={`${getStatusColor(selectedLeave.status)} text-white`}
                    >
                      {selectedLeave.status}
                    </Badge>
                  </div>
                  {selectedLeave.approver && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Approved By</p>
                      <p className="text-sm">{selectedLeave.approver.name}</p>
                    </div>
                  )}
                  {selectedLeave.reason && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">Reason</p>
                      <p className="text-sm">{selectedLeave.reason}</p>
                    </div>
                  )}
                  {selectedLeave.cancelled_reason && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">Cancellation Reason</p>
                      <p className="text-sm">{selectedLeave.cancelled_reason}</p>
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
                This action cannot be undone. This will permanently delete the leave record for{" "}
                <strong>
                  {selectedLeave?.employees?.name || selectedLeave?.employee_id}
                </strong>{" "}
                on {selectedLeave && formatDate(selectedLeave.start_date)}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Leave Confirmation Dialog */}
        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <AlertDialogContent className="sm:max-w-[500px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Leave Request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this leave request? You can provide a reason below (optional).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="cancel-reason" className="text-sm font-medium mb-2 block">
                Cancellation Reason (Optional)
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder="Enter reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={isSubmitting}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting} onClick={() => {
                setCancelReason("");
                setSelectedLeave(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

