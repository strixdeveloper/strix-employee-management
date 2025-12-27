"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Clock, Play, Pause, Square, Coffee, CheckCircle2, AlertCircle, UtensilsCrossed, Building2 } from "lucide-react";
import { useSidebar } from "@/components/sidebar-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface EmployeeHeaderWithTimerProps {
  title: string;
}

export function EmployeeHeaderWithTimer({ title }: EmployeeHeaderWithTimerProps) {
  const { isCollapsed, toggleSidebar, toggleMobile } = useSidebar();
  const [session, setSession] = useState<TrackingSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [officeHours, setOfficeHours] = useState<{
    start_time: string;
    end_time: string;
    lunch_start_time: string;
    lunch_end_time: string;
    is_working_day: boolean;
  } | null>(null);
  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [overtimeType, setOvertimeType] = useState<string>("tracking");
  const [projectName, setProjectName] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const breakIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch today's office hours
  useEffect(() => {
    fetchTodayOfficeHours();
  }, []);

  const fetchTodayOfficeHours = async () => {
    try {
      const response = await fetch("/api/office-hours");
      if (response.ok) {
        const result = await response.json();
        const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
        const todayHours = result.data?.find((oh: any) => oh.day_of_week === today);
        
        if (todayHours) {
          setOfficeHours({
            start_time: todayHours.start_time?.slice(0, 5) || "09:00",
            end_time: todayHours.end_time?.slice(0, 5) || "18:00",
            lunch_start_time: todayHours.lunch_start_time?.slice(0, 5) || "13:00",
            lunch_end_time: todayHours.lunch_end_time?.slice(0, 5) || "13:45",
            is_working_day: todayHours.is_working_day,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching office hours:", error);
    }
  };

  // Fetch session on mount and poll for updates
  useEffect(() => {
    fetchSession();
    
    // Poll for session updates every 1.5 seconds to sync with page content
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
      if (response.ok) {
        const result = await response.json();
        setSession(result.data);
        
        if (result.data) {
          const startTime = new Date(result.data.start_time).getTime();
          const now = Date.now();
          const totalElapsed = Math.floor((now - startTime) / 1000);
          setElapsedTime(totalElapsed);
          setBreakTime(result.data.total_break_seconds || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching session:", error);
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
      setIsStartDialogOpen(false);
      setSuccess("Overtime tracking started!");
      setTimeout(() => setSuccess(null), 3000);
      // Immediately refresh to sync with page content
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
      setSuccess("Tracking paused");
      setTimeout(() => setSuccess(null), 2000);
      // Immediately refresh to sync with page
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
      setTimeout(() => setSuccess(null), 2000);
      // Immediately refresh to sync with page
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
        await fetch("/api/employee/overtime-tracking", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resume" }),
        });
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
      setSuccess(`Overtime entry created! ${result.data.session.actual_working_hours.toFixed(2)}h`);
      setTimeout(() => setSuccess(null), 5000);
      // Immediately refresh to sync with page
      await fetchSession();
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

  const formatTimeDisplay = (timeString: string) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const workingTime = elapsedTime - (session?.total_break_seconds || 0) - breakTime;

  return (
    <>
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 lg:px-8 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={toggleMobile}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Desktop Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex shrink-0"
            onClick={toggleSidebar}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-pink-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent truncate">
            {title}
          </h1>
        </div>

        {/* Right Side - Clock and Overtime Tracker */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
          {/* Overtime Tracker */}
          {session ? (
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
              {/* Timer Display - Mobile Compact */}
              <div className="flex sm:hidden items-center gap-1.5 bg-gradient-to-r from-pink-50 to-fuchsia-50 dark:from-pink-900/20 dark:to-fuchsia-900/20 px-2 py-1.5 rounded-lg border border-pink-200 dark:border-pink-800">
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground leading-tight">Work</div>
                  <div className="text-xs font-bold text-green-600 dark:text-green-400 leading-tight">
                    {formatTime(Math.max(0, workingTime))}
                  </div>
                </div>
                <Badge
                  variant={session.is_paused ? "secondary" : "default"}
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 h-auto",
                    session.is_paused
                      ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                      : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  )}
                >
                  {session.is_paused ? (
                    <Coffee className="h-2.5 w-2.5" />
                  ) : (
                    <Play className="h-2.5 w-2.5" />
                  )}
                </Badge>
              </div>

              {/* Timer Display - Desktop */}
              <div className="hidden sm:flex items-center gap-4 px-3 py-1.5">
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Working</div>
                  <div className="text-base font-semibold text-green-600 dark:text-green-400">
                    {formatTime(Math.max(0, workingTime))}
                  </div>
                </div>
                {session.is_paused && (
                  <div className="text-right border-l border-gray-200 dark:border-gray-700 pl-4">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Break</div>
                    <div className="text-base font-semibold text-orange-600 dark:text-orange-400">
                      {formatTime((session.total_break_seconds || 0) + breakTime)}
                    </div>
                  </div>
                )}
                <div className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider",
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

              {/* Action Buttons */}
              <div className="flex items-center gap-1 sm:gap-2">
                {session.is_paused ? (
                  <Button
                    onClick={handleResume}
                    disabled={isResuming}
                    size="sm"
                    className="h-8 sm:h-9 px-2 sm:px-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="hidden lg:inline">Resume</span>
                  </Button>
                ) : (
                  <Button
                    onClick={handlePause}
                    disabled={isPausing}
                    size="sm"
                    variant="outline"
                    className="h-8 sm:h-9 px-2 sm:px-3"
                  >
                    <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="hidden lg:inline">Pause</span>
                  </Button>
                )}
                <Button
                  onClick={handleEnd}
                  disabled={isEnding}
                  size="sm"
                  variant="destructive"
                  className="h-8 sm:h-9 px-2 sm:px-3"
                >
                  <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden lg:inline">End</span>
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsStartDialogOpen(true)}
              size="sm"
              className="h-8 sm:h-9 px-2 sm:px-3 bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white"
            >
              <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
              <span className="hidden sm:inline">Start Overtime</span>
              <span className="sm:hidden">Start</span>
            </Button>
          )}

          {/* Office Hours Announcement - Mobile */}
          {officeHours && officeHours.is_working_day && (
            <div className="flex md:hidden items-center gap-2 px-3 py-1.5 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/50 rounded-lg">
              <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="text-[10px] leading-tight">
                <div className="text-blue-700 dark:text-blue-300 font-medium">
                  {formatTimeDisplay(officeHours.start_time)} - {formatTimeDisplay(officeHours.end_time)}
                </div>
                {officeHours.lunch_start_time && (
                  <div className="text-blue-600 dark:text-blue-400 text-[9px] flex items-center gap-0.5">
                    <UtensilsCrossed className="h-2.5 w-2.5" />
                    {formatTimeDisplay(officeHours.lunch_start_time)} - {formatTimeDisplay(officeHours.lunch_end_time)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Office Hours Announcement - Desktop */}
          {officeHours && officeHours.is_working_day && (
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/50 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="text-xs">
                <div className="text-blue-700 dark:text-blue-300 font-medium">
                  Office: {formatTimeDisplay(officeHours.start_time)} - {formatTimeDisplay(officeHours.end_time)}
                </div>
                {officeHours.lunch_start_time && (
                  <div className="text-blue-600 dark:text-blue-400 text-[10px] flex items-center gap-1">
                    <UtensilsCrossed className="h-3 w-3" />
                    Lunch: {formatTimeDisplay(officeHours.lunch_start_time)} - {formatTimeDisplay(officeHours.lunch_end_time)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Off Day Announcement */}
          {officeHours && !officeHours.is_working_day && (
            <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/50 dark:border-orange-900/50 rounded-lg">
              <Clock className="h-3.5 md:h-4 w-3.5 md:w-4 text-orange-600 dark:text-orange-400 shrink-0" />
              <div className="text-[10px] md:text-xs text-orange-700 dark:text-orange-300 font-medium">
                Off Day
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="px-4 lg:px-8 pt-2">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 lg:px-8 pt-2">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Start Tracking Dialog */}
      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent">
              Start Overtime Tracking
            </DialogTitle>
            <DialogDescription>
              Select overtime type and provide details to start tracking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Overtime Type Selection - Tabs */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Overtime Type *</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={overtimeType === "tracking" ? "default" : "outline"}
                  onClick={() => setOvertimeType("tracking")}
                  className={cn(
                    "h-12 text-sm font-semibold",
                    overtimeType === "tracking"
                      ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                      : ""
                  )}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Tracking
                </Button>
                <Button
                  type="button"
                  variant={overtimeType === "new_tasks" ? "default" : "outline"}
                  onClick={() => setOvertimeType("new_tasks")}
                  className={cn(
                    "h-12 text-sm font-semibold",
                    overtimeType === "new_tasks"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                      : ""
                  )}
                >
                  <Play className="h-4 w-4 mr-1" />
                  New Tasks
                </Button>
                <Button
                  type="button"
                  variant={overtimeType === "pending_tasks" ? "default" : "outline"}
                  onClick={() => setOvertimeType("pending_tasks")}
                  className={cn(
                    "h-12 text-sm font-semibold",
                    overtimeType === "pending_tasks"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                      : ""
                  )}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pending
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="project_name" className="text-sm font-semibold">Project Name (Optional)</Label>
              <Input
                id="project_name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="memo" className="text-sm font-semibold">Memo / Description</Label>
              <Textarea
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="What are you working on? (optional)"
                className="mt-1 min-h-[80px] resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsStartDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStart}
              disabled={isStarting}
              className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white"
            >
              {isStarting ? "Starting..." : "Start Tracking"}
            </Button>
          </div>
          </DialogContent>
        </Dialog>

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
    </>
  );
}

