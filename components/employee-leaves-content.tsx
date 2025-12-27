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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, CalendarX, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
}

export function EmployeeLeavesContent() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Form state
  const [leaveType, setLeaveType] = useState<string>("full_day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchLeaves();
  }, [filterStatus]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== "all") {
        params.append("status", filterStatus);
      }
      
      const response = await fetch(`/api/employee/leaves?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch leaves");
      }
      
      const result = await response.json();
      setLeaves(result.data || []);
    } catch (error: any) {
      console.error("Error fetching leaves:", error);
      setError(error.message || "Failed to fetch leaves");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate) {
      setError("Start date is required");
      return;
    }

    if (leaveType === "multiple_days" && !endDate) {
      setError("End date is required for multiple days leave");
      return;
    }

    if (leaveType === "multiple_days" && endDate < startDate) {
      setError("End date must be after or equal to start date");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/employee/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leave_type: leaveType,
          start_date: startDate,
          end_date: leaveType === "multiple_days" ? endDate : null,
          reason: reason || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create leave request");
      }

      const result = await response.json();
      setSuccess("Leave request submitted successfully!");
      setIsAddDialogOpen(false);
      setLeaveType("full_day");
      setStartDate("");
      setEndDate("");
      setReason("");
      await fetchLeaves();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "pending":
        return <Clock className="h-3.5 w-3.5" />;
      case "cancelled":
        return <XCircle className="h-3.5 w-3.5" />;
      default:
        return <AlertCircle className="h-3.5 w-3.5" />;
    }
  };

  const filteredLeaves = filterStatus === "all" 
    ? leaves 
    : leaves.filter(leave => leave.status === filterStatus);

  if (loading) {
    return (
      <div className="p-6 lg:p-12 min-h-full">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-12 min-h-full">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-900/50 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/50 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Header with Add Button and Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">My Leaves</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">View and request your leave applications</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-pink-600 hover:bg-pink-700 text-white w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Request Leave</span>
              <span className="xs:hidden">Request</span>
            </Button>
          </div>
        </div>

        {/* Leaves Table */}
        <Card className="border border-gray-200/50 dark:border-gray-800/50">
          {filteredLeaves.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarX className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No leave records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs lg:text-sm">Type</TableHead>
                    <TableHead className="text-xs lg:text-sm">Start Date</TableHead>
                    <TableHead className="text-xs lg:text-sm">End Date</TableHead>
                    <TableHead className="text-xs lg:text-sm">Reason</TableHead>
                    <TableHead className="text-xs lg:text-sm">Status</TableHead>
                    <TableHead className="text-xs lg:text-sm">Requested</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaves.map((leave) => (
                    <TableRow key={leave.rowid}>
                      <TableCell className="text-xs lg:text-sm">
                        <Badge variant="outline" className="text-xs">
                          {getLeaveTypeLabel(leave.leave_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatDate(leave.start_date)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm">
                        {leave.end_date ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(leave.end_date)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm">
                        <span className="truncate block max-w-[200px] lg:max-w-none">
                          {leave.reason || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm">
                        <Badge
                          className={cn(
                            `${getStatusColor(leave.status)} text-white text-xs flex items-center gap-1.5 w-fit`
                          )}
                        >
                          {getStatusIcon(leave.status)}
                          <span className="capitalize">{leave.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm text-muted-foreground">
                        {leave.created_at ? formatDate(leave.created_at) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Request Leave Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Request Leave</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="leave_type" className="text-sm font-semibold">
                    Leave Type *
                  </Label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger id="leave_type" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_day">Full Day</SelectItem>
                      <SelectItem value="half_day">Half Day</SelectItem>
                      <SelectItem value="multiple_days">Multiple Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="start_date" className="text-sm font-semibold">
                    Start Date *
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1.5"
                    required
                  />
                </div>

                {leaveType === "multiple_days" && (
                  <div>
                    <Label htmlFor="end_date" className="text-sm font-semibold">
                      End Date *
                    </Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1.5"
                      min={startDate}
                      required
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="reason" className="text-sm font-semibold">
                    Reason
                  </Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for leave (optional)"
                    className="mt-1.5 min-h-[100px] resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setError(null);
                    setLeaveType("full_day");
                    setStartDate("");
                    setEndDate("");
                    setReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

