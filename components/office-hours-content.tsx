"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save, Clock, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfficeHours {
  rowid: number;
  day_of_week: number;
  is_working_day: boolean;
  start_time: string;
  end_time: string;
  has_lunch_break: boolean;
  lunch_start_time: string;
  lunch_end_time: string;
  lunch_duration_minutes: number;
  timezone: string;
}

const DAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 0, label: "Sunday", short: "Sun" },
];

export function OfficeHoursContent() {
  const [officeHours, setOfficeHours] = React.useState<OfficeHours[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  React.useEffect(() => {
    fetchOfficeHours();
  }, []);

  const fetchOfficeHours = async () => {
    try {
      const supabase = createClient();
      const response = await fetch("/api/office-hours");
      const { data, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Sort by day_of_week and ensure all days are present
      const sorted = (data || []).sort((a: OfficeHours, b: OfficeHours) => a.day_of_week - b.day_of_week);
      
      // Helper function to convert "HH:MM:SS" to "HH:MM" for time inputs
      const formatTimeForInput = (time: string): string => {
        if (!time) return "09:00";
        // If time is in "HH:MM:SS" format, extract "HH:MM"
        if (time.includes(":") && time.split(":").length === 3) {
          return time.substring(0, 5);
        }
        // If already in "HH:MM" format, return as is
        return time;
      };
      
      // Fill in missing days with defaults
      const allDays = DAYS.map((day) => {
        const existing = sorted.find((oh: OfficeHours) => oh.day_of_week === day.value);
        if (existing) {
          // Convert times from "HH:MM:SS" to "HH:MM" for time inputs
          return {
            ...existing,
            start_time: formatTimeForInput(existing.start_time),
            end_time: formatTimeForInput(existing.end_time),
            lunch_start_time: formatTimeForInput(existing.lunch_start_time),
            lunch_end_time: formatTimeForInput(existing.lunch_end_time),
          };
        }
        return {
          rowid: 0,
          day_of_week: day.value,
          is_working_day: day.value >= 1 && day.value <= 5, // Mon-Fri default working
          start_time: "09:00",
          end_time: "18:00",
          has_lunch_break: true,
          lunch_start_time: "13:00",
          lunch_end_time: "13:45",
          lunch_duration_minutes: 45,
          timezone: "Asia/Kolkata",
        } as OfficeHours;
      });

      setOfficeHours(allDays);
    } catch (error: any) {
      console.error("Error fetching office hours:", error);
      setMessage({ text: error.message || "Failed to load office hours", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const updateDay = (dayOfWeek: number, field: keyof OfficeHours, value: any) => {
    setOfficeHours((prev) =>
      prev.map((oh) =>
        oh.day_of_week === dayOfWeek ? { ...oh, [field]: value } : oh
      )
    );
  };

  const calculateLunchDuration = (start: string, end: string): number => {
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    const startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;
    return endTotal - startTotal;
  };

  const handleLunchTimeChange = (dayOfWeek: number, field: "lunch_start_time" | "lunch_end_time", value: string) => {
    const day = officeHours.find((oh) => oh.day_of_week === dayOfWeek);
    if (!day) return;

    const otherField = field === "lunch_start_time" ? "lunch_end_time" : "lunch_start_time";
    const otherTime = day[otherField];
    
    // Calculate duration using the new value and current other time
    const duration = field === "lunch_start_time"
      ? calculateLunchDuration(value, otherTime)
      : calculateLunchDuration(otherTime, value);
    
    // Update both the field and duration
    setOfficeHours((prev) =>
      prev.map((oh) =>
        oh.day_of_week === dayOfWeek
          ? {
              ...oh,
              [field]: value,
              lunch_duration_minutes: duration > 0 ? duration : oh.lunch_duration_minutes,
            }
          : oh
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Helper function to ensure time is in "HH:MM:SS" format
      const formatTimeForDatabase = (time: string): string => {
        if (!time) return "09:00:00";
        // If already in "HH:MM:SS" format, return as is
        if (time.includes(":") && time.split(":").length === 3) {
          return time;
        }
        // If in "HH:MM" format, add ":00"
        if (time.includes(":") && time.split(":").length === 2) {
          return time + ":00";
        }
        return "09:00:00";
      };

      const updates = officeHours.map((oh) => ({
        day_of_week: oh.day_of_week,
        is_working_day: oh.is_working_day,
        start_time: formatTimeForDatabase(oh.start_time),
        end_time: formatTimeForDatabase(oh.end_time),
        has_lunch_break: oh.has_lunch_break,
        lunch_start_time: formatTimeForDatabase(oh.lunch_start_time),
        lunch_end_time: formatTimeForDatabase(oh.lunch_end_time),
        lunch_duration_minutes: oh.lunch_duration_minutes,
      }));

      const response = await fetch("/api/office-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      const { data, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      setMessage({ text: "Office hours updated successfully!", type: "success" });
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error("Error saving office hours:", error);
      setMessage({ text: error.message || "Failed to save office hours", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 w-full">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Office Hours</h1>
            <p className="text-muted-foreground mt-1">
              Manage working hours and lunch breaks for each day of the week (IST)
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white shadow-lg shadow-pink-500/50 hover:shadow-xl hover:shadow-pink-500/50 transition-all duration-300"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
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
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Days Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS.map((day) => {
            const dayData = officeHours.find((oh) => oh.day_of_week === day.value);
            if (!dayData) return null;

            const isWeekend = day.value === 0 || day.value === 6;

            return (
              <Card
                key={day.value}
                className={cn(
                  "transition-all duration-200",
                  !dayData.is_working_day && "opacity-60"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{day.label}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`working-${day.value}`}
                        checked={dayData.is_working_day}
                        onCheckedChange={(checked) =>
                          updateDay(day.value, "is_working_day", checked)
                        }
                      />
                      <Label
                        htmlFor={`working-${day.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        Working Day
                      </Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Office Hours */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Office Hours</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor={`start-${day.value}`} className="text-xs">
                          Start Time
                        </Label>
                        <Input
                          id={`start-${day.value}`}
                          type="time"
                          value={dayData.start_time}
                          onChange={(e) => updateDay(day.value, "start_time", e.target.value)}
                          disabled={!dayData.is_working_day}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`end-${day.value}`} className="text-xs">
                          End Time
                        </Label>
                        <Input
                          id={`end-${day.value}`}
                          type="time"
                          value={dayData.end_time}
                          onChange={(e) => updateDay(day.value, "end_time", e.target.value)}
                          disabled={!dayData.is_working_day}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lunch Break */}
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <UtensilsCrossed className="h-4 w-4" />
                        <span>Lunch Break</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`lunch-${day.value}`}
                          checked={dayData.has_lunch_break}
                          onCheckedChange={(checked) =>
                            updateDay(day.value, "has_lunch_break", checked)
                          }
                          disabled={!dayData.is_working_day}
                        />
                      </div>
                    </div>
                    {dayData.has_lunch_break && dayData.is_working_day && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor={`lunch-start-${day.value}`} className="text-xs">
                              Start
                            </Label>
                            <Input
                              id={`lunch-start-${day.value}`}
                              type="time"
                              value={dayData.lunch_start_time}
                              onChange={(e) =>
                                handleLunchTimeChange(day.value, "lunch_start_time", e.target.value)
                              }
                              disabled={!dayData.is_working_day}
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`lunch-end-${day.value}`} className="text-xs">
                              End
                            </Label>
                            <Input
                              id={`lunch-end-${day.value}`}
                              type="time"
                              value={dayData.lunch_end_time}
                              onChange={(e) =>
                                handleLunchTimeChange(day.value, "lunch_end_time", e.target.value)
                              }
                              disabled={!dayData.is_working_day}
                              className="h-9"
                            />
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
                          Duration: <span className="font-semibold">{dayData.lunch_duration_minutes} minutes</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Card */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Timezone Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All times are displayed and managed in <strong>IST (Indian Standard Time)</strong> - Asia/Kolkata timezone.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
