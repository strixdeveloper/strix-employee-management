"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Calculator } from "lucide-react";

const overtimeSchema = z.object({
  employee_id: z.string().min(1, "Employee is required"),
  project_id: z.string(),
  date: z.string().min(1, "Date is required"),
  overtime_type: z.enum(["pending_tasks", "new_tasks", "tracking"]),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  description: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected", "paid"]),
  remarks: z.string().optional(),
}).refine((data) => {
  if (data.end_time <= data.start_time) {
    return false;
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["end_time"],
});

type OvertimeFormValues = z.infer<typeof overtimeSchema>;

interface OvertimeFormProps {
  overtime?: {
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
    remarks?: string;
  } | null;
  onSubmit: (data: OvertimeFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface Employee {
  rowid: number;
  name: string;
  employee_id: string;
  email: string;
  designation: string;
}

interface Project {
  rowid: number;
  project_name: string;
  client_name?: string;
}

export function OvertimeForm({
  overtime,
  onSubmit,
  onCancel,
  isLoading = false,
}: OvertimeFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [calculatedHours, setCalculatedHours] = useState<number>(0);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch("/api/employee");
        if (response.ok) {
          const result = await response.json();
          setEmployees(result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      } finally {
        setLoadingEmployees(false);
      }
    };

    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/project");
        if (response.ok) {
          const result = await response.json();
          setProjects(result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };

    fetchEmployees();
    fetchProjects();
  }, []);

  const form = useForm<OvertimeFormValues>({
    resolver: zodResolver(overtimeSchema),
    defaultValues: overtime
      ? {
          employee_id: overtime.employee_id,
          project_id: overtime.project_id?.toString() || "none",
          date: overtime.date ? new Date(overtime.date).toISOString().split("T")[0] : "",
          overtime_type: overtime.overtime_type,
          start_time: overtime.start_time || "",
          end_time: overtime.end_time || "",
          description: overtime.description || "",
          status: overtime.status,
          remarks: overtime.remarks || "",
        }
        : {
          employee_id: "",
          project_id: "none",
          date: new Date().toISOString().split("T")[0],
          overtime_type: "pending_tasks",
          start_time: "",
          end_time: "",
          description: "",
          status: "pending",
          remarks: "",
        },
  });

  const startTime = form.watch("start_time");
  const endTime = form.watch("end_time");

  useEffect(() => {
    if (startTime && endTime && endTime > startTime) {
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      
      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;
      const diffMinutes = endTotalMinutes - startTotalMinutes;
      const hours = diffMinutes / 60;
      
      setCalculatedHours(Math.round(hours * 100) / 100);
    } else {
      setCalculatedHours(0);
    }
  }, [startTime, endTime]);

  const handleSubmit = async (data: OvertimeFormValues) => {
    await onSubmit({
      ...data,
      project_id: data.project_id && data.project_id !== "none" ? data.project_id : "none",
    });
  };

  return (
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{overtime ? "Edit Overtime" : "Add Overtime"}</DialogTitle>
        <DialogDescription>
          {overtime
            ? "Update overtime record information below."
            : "Fill in the details to add a new overtime record."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="employee_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={loadingEmployees}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.employee_id} value={emp.employee_id}>
                        {emp.name} ({emp.employee_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="project_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {projects.map((proj) => (
                      <SelectItem key={proj.rowid} value={proj.rowid.toString()}>
                        {proj.project_name} {proj.client_name ? `- ${proj.client_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select a project if this overtime is project-related
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="overtime_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overtime Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending_tasks">Pending Tasks</SelectItem>
                      <SelectItem value="new_tasks">New Tasks</SelectItem>
                      <SelectItem value="tracking">Tracking</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time *</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time *</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {calculatedHours > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Total Hours: <span className="font-bold">{calculatedHours.toFixed(2)} hours</span>
              </span>
            </div>
          )}

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the overtime work..."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional remarks..."
                    className="resize-none"
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:from-pink-600 hover:to-fuchsia-600"
            >
              {isLoading ? "Saving..." : overtime ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

