"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Play,
  Pause,
  Square,
  Clock,
  Briefcase,
  FileText,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Filter,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackingSession {
  rowid: number;
  employee_id: string;
  project_id?: number;
  project_name?: string;
  overtime_type: "pending_tasks" | "new_tasks" | "tracking";
  memo?: string;
  start_time: string;
  last_pause_time?: string;
  is_paused: boolean;
  total_break_seconds: number;
}

interface OvertimeEntry {
  rowid: number;
  employee_id: string;
  project_id?: number;
  date: string;
  overtime_type: "pending_tasks" | "new_tasks" | "tracking";
  start_time: string;
  end_time: string;
  total_hours: number;
  actual_working_hours?: number;
  description?: string;
  status: "pending" | "approved" | "rejected" | "paid";
  projects?: {
    rowid: number;
    project_name: string;
    client_name?: string;
  };
}

export function EmployeeOvertimeContent() {
  const [session, setSession] = useState<TrackingSession | null>(null);
  const [overtimeEntries, setOvertimeEntries] = useState<OvertimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [overtimeType, setOvertimeType] = useState<string>("tracking");
  const [projectName, setProjectName] = useState("");
  const [memo, setMemo] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const breakIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch current session and overtime entries
  useEffect(() => {
    fetchSession();
    fetchOvertimeEntries();
    
    // Poll for session updates every 1.5 seconds to sync with header
    const sessionInterval = setInterval(() => {
      fetchSession();
    }, 1500);
    
    return () => clearInterval(sessionInterval);
  }, []);

  // Update timer every second
  useEffect(() => {
    if (session && !session.is_paused) {
      intervalRef.current = setInterval(() => {
        const startTime = new Date(session.start_time).getTime();
        const now = Date.now();
        const totalElapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(totalElapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Track break time if paused
    if (session?.is_paused && session.last_pause_time) {
      breakIntervalRef.current = setInterval(() => {
        const pauseTime = new Date(session.last_pause_time!).getTime();
        const now = Date.now();
        const currentBreakTime = Math.floor((now - pauseTime) / 1000);
        setBreakTime(currentBreakTime);
      }, 1000);
    } else {
      if (breakIntervalRef.current) {
        clearInterval(breakIntervalRef.current);
        breakIntervalRef.current = null;
      }
      setBreakTime(0);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
    };
  }, [session]);

  const fetchSession = async () => {
    try {
      const response = await fetch("/api/employee/overtime-tracking");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch session");
      }
      const result = await response.json();
      setSession(result.data);
      
      if (result.data) {
        const startTime = new Date(result.data.start_time).getTime();
        const now = Date.now();
        const totalElapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(totalElapsed);
        setBreakTime(result.data.total_break_seconds || 0);
      }
    } catch (error: any) {
      console.error("Error fetching session:", error);
    }
  };

  const fetchOvertimeEntries = async () => {
    try {
      setLoading(true);
      // Fetch only current employee's overtime records
      const response = await fetch("/api/employee/overtime");
      if (response.ok) {
        const result = await response.json();
        setOvertimeEntries(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching overtime entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      setIsStarting(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/employee/overtime-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overtime_type: overtimeType,
          project_name: projectName || null,
          memo: memo || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start tracking");
      }

      const result = await response.json();
      setSession(result.data);
      setElapsedTime(0);
      setBreakTime(0);
      setProjectName("");
      setMemo("");
      setOvertimeType("tracking");
      setSuccess("Overtime tracking started successfully!");
      setTimeout(() => setSuccess(null), 3000);
      // Immediately refresh to sync with header
      await fetchSession();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsStarting(false);
    }
  };

  const handlePause = async () => {
    try {
      setIsPausing(true);
      setError(null);

      const response = await fetch("/api/employee/overtime-tracking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to pause tracking");
      }

      const result = await response.json();
      setSession(result.data);
      setSuccess("Tracking paused. Taking a break?");
      setTimeout(() => setSuccess(null), 3000);
      // Immediately refresh to sync with header
      await fetchSession();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsPausing(false);
    }
  };

  const handleResume = async () => {
    try {
      setIsResuming(true);
      setError(null);

      const response = await fetch("/api/employee/overtime-tracking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to resume tracking");
      }

      const result = await response.json();
      setSession(result.data);
      setBreakTime(result.data.total_break_seconds || 0);
      setSuccess("Tracking resumed!");
      setTimeout(() => setSuccess(null), 3000);
      // Immediately refresh to sync with header
      await fetchSession();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsResuming(false);
    }
  };

  const handleEnd = async () => {
    setIsEndDialogOpen(true);
  };

  const confirmEnd = async () => {
    setIsEndDialogOpen(false);

    try {
      setIsEnding(true);
      setError(null);

      // If paused, resume first
      if (session?.is_paused) {
        const resumeResponse = await fetch("/api/employee/overtime-tracking", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resume" }),
        });

        if (!resumeResponse.ok) {
          const error = await resumeResponse.json();
          throw new Error(error.error || "Failed to resume before ending");
        }

        // Fetch updated session
        await fetchSession();
      }

      // Now end the session
      const response = await fetch("/api/employee/overtime-tracking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to end tracking");
      }

      const result = await response.json();
      setSession(null);
      setElapsedTime(0);
      setBreakTime(0);
      setProjectName("");
      setMemo("");
      setOvertimeType("tracking");
      setSuccess(`Overtime entry created! Total: ${result.data.session.actual_working_hours.toFixed(2)} hours`);
      
      // Refresh overtime entries list
      await fetchOvertimeEntries();
      // Immediately refresh to sync with header
      await fetchSession();
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsEnding(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatHours = (seconds: number) => {
    return (seconds / 3600).toFixed(2);
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

  const formatTimeString = (timeString?: string) => {
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

  const workingTime = elapsedTime - (session?.total_break_seconds || 0) - breakTime;

  const filteredEntries = filterType === "all" 
    ? overtimeEntries 
    : overtimeEntries.filter(entry => entry.overtime_type === filterType);

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-12 min-h-full">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
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

        {/* Main Timer Card - Moved to Top */}
        {session ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200/50 dark:border-gray-800/50">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-pink-500 dark:bg-pink-600 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Active Tracking</h2>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Overtime session in progress</p>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Active Tracking Display */}
              <div className="space-y-4 lg:space-y-6">
                {/* Timer Display */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center">
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Total Time</p>
                    <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-gray-900 dark:text-gray-100">
                      {formatTime(elapsedTime)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-4">
                    <div className="text-center p-3 sm:p-4 rounded-lg bg-green-50/50 dark:bg-green-950/20">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Working</p>
                      <p className="text-xl sm:text-2xl font-semibold text-green-600 dark:text-green-400 mb-1">
                        {formatTime(Math.max(0, workingTime))}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {formatHours(Math.max(0, workingTime))}h
                      </p>
                    </div>

                    <div className="text-center p-3 sm:p-4 rounded-lg bg-orange-50/50 dark:bg-orange-950/20">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Break</p>
                      <p className="text-xl sm:text-2xl font-semibold text-orange-600 dark:text-orange-400 mb-1">
                        {formatTime((session.total_break_seconds || 0) + breakTime)}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {formatHours((session.total_break_seconds || 0) + breakTime)}h
                      </p>
                    </div>
                  </div>
                </div>

                {/* Session Info */}
                <div className="space-y-3 pt-6 border-t border-gray-200/50 dark:border-gray-800/50">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {session.overtime_type?.replace("_", " ") || "tracking"}
                    </div>
                    <div className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wider",
                      session.is_paused
                        ? "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
                        : "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                    )}>
                      {session.is_paused ? (
                        <>
                          <Coffee className="h-2.5 w-2.5 inline mr-1" />
                          Paused
                        </>
                      ) : (
                        <>
                          <Play className="h-2.5 w-2.5 inline mr-1" />
                          Active
                        </>
                      )}
                    </div>
                  </div>
                  {session.project_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Briefcase className="h-4 w-4" />
                      <span>{session.project_name}</span>
                    </div>
                  )}
                  {session.memo && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{session.memo}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Started {new Date(session.start_time).toLocaleString()}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
                  {session.is_paused ? (
                    <Button
                      onClick={handleResume}
                      disabled={isResuming}
                      className="flex-1 h-10 sm:h-11 text-sm sm:text-base font-medium bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isResuming ? "Resuming..." : "Resume"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePause}
                      disabled={isPausing}
                      variant="outline"
                      className="flex-1 h-10 sm:h-11 text-sm sm:text-base font-medium"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      {isPausing ? "Pausing..." : "Pause"}
                    </Button>
                  )}
                  <Button
                    onClick={handleEnd}
                    disabled={isEnding}
                    variant="destructive"
                    className="flex-1 h-10 sm:h-11 text-sm sm:text-base font-medium"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    {isEnding ? "Ending..." : "End & Save"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-500 dark:bg-pink-600 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Start Overtime</h2>
                  <p className="text-xs text-muted-foreground">Begin tracking your overtime hours</p>
                </div>
              </div>
            </div>
            <div className="p-6 lg:p-8">
              {/* Start Tracking Form */}
              <div className="space-y-4 lg:space-y-6">
                {/* Overtime Type Selection - Tabs */}
                <div>
                  <Label className="text-xs sm:text-sm lg:text-base font-semibold mb-2 lg:mb-3 block">Overtime Type *</Label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 lg:gap-3">
                    <Button
                      type="button"
                      variant={overtimeType === "tracking" ? "default" : "outline"}
                      onClick={() => setOvertimeType("tracking")}
                      className={cn(
                        "h-12 sm:h-14 text-xs sm:text-sm font-medium",
                        overtimeType === "tracking"
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : ""
                      )}
                    >
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Tracking</span>
                      <span className="sm:hidden">Track</span>
                    </Button>
                    <Button
                      type="button"
                      variant={overtimeType === "new_tasks" ? "default" : "outline"}
                      onClick={() => setOvertimeType("new_tasks")}
                      className={cn(
                        "h-12 sm:h-14 text-xs sm:text-sm font-medium",
                        overtimeType === "new_tasks"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : ""
                      )}
                    >
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">New Tasks</span>
                      <span className="sm:hidden">New</span>
                    </Button>
                    <Button
                      type="button"
                      variant={overtimeType === "pending_tasks" ? "default" : "outline"}
                      onClick={() => setOvertimeType("pending_tasks")}
                      className={cn(
                        "h-12 sm:h-14 text-xs sm:text-sm font-medium",
                        overtimeType === "pending_tasks"
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : ""
                      )}
                    >
                      <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Pending Tasks</span>
                      <span className="sm:hidden">Pending</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="project_name" className="text-sm lg:text-base font-semibold mb-2 flex items-center gap-2">
                    <Briefcase className="h-3 w-3 lg:h-4 lg:w-4" />
                    Project Name (Optional)
                  </Label>
                  <Input
                    id="project_name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name (optional)"
                    className="h-11 lg:h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="memo" className="text-sm lg:text-base font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-3 w-3 lg:h-4 lg:w-4" />
                    Memo / Description
                  </Label>
                  <Textarea
                    id="memo"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="What are you working on? (optional)"
                    className="min-h-[80px] lg:min-h-[100px] resize-none"
                  />
                </div>

                <Button
                  onClick={handleStart}
                  disabled={isStarting}
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isStarting ? "Starting..." : "Start Tracking"}
                </Button>

                <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900/50">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    <strong>Note:</strong> Overtime tracking can only be started outside office hours or on off-days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overtime Entries List - Moved to Bottom */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-500 dark:bg-pink-600 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Overtime Records</h2>
                  <p className="text-xs text-muted-foreground">View your past overtime entries</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="tracking">Tracking</SelectItem>
                    <SelectItem value="new_tasks">New Tasks</SelectItem>
                    <SelectItem value="pending_tasks">Pending Tasks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="p-0">
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No overtime records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs lg:text-sm">Date</TableHead>
                      <TableHead className="text-xs lg:text-sm">Type</TableHead>
                      <TableHead className="text-xs lg:text-sm">Project</TableHead>
                      <TableHead className="text-xs lg:text-sm">Start Time</TableHead>
                      <TableHead className="text-xs lg:text-sm">End Time</TableHead>
                      <TableHead className="text-xs lg:text-sm">Total Hours</TableHead>
                      <TableHead className="text-xs lg:text-sm">Working Hours</TableHead>
                      <TableHead className="text-xs lg:text-sm">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.rowid}>
                        <TableCell className="text-xs lg:text-sm">
                          <div className="flex items-center gap-1.5 lg:gap-2">
                            <Calendar className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground shrink-0" />
                            <span className="truncate">{formatDate(entry.date)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          <Badge className={`${getOvertimeTypeColor(entry.overtime_type)} text-white text-xs`}>
                            <span className="hidden sm:inline">{getOvertimeTypeLabel(entry.overtime_type)}</span>
                            <span className="sm:hidden">{getOvertimeTypeLabel(entry.overtime_type).split(" ")[0]}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          <span className="truncate block max-w-[120px] lg:max-w-none">
                            {entry.projects?.project_name || entry.description?.split(" - ")[0] || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">{formatTimeString(entry.start_time)}</TableCell>
                        <TableCell className="text-xs lg:text-sm">{formatTimeString(entry.end_time)}</TableCell>
                        <TableCell className="text-xs lg:text-sm font-semibold">{entry.total_hours.toFixed(2)}h</TableCell>
                        <TableCell className="text-xs lg:text-sm font-semibold text-green-600 dark:text-green-400">
                          {entry.actual_working_hours?.toFixed(2) || entry.total_hours.toFixed(2)}h
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          <Badge className={`${getStatusColor(entry.status)} text-white text-xs`}>
                            {entry.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* End Confirmation Dialog */}
        <AlertDialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End Overtime Tracking?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to end this tracking session? This will create an overtime entry with your current working hours.
                {session?.is_paused && " The session will be resumed automatically before ending."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmEnd}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                End & Save
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
