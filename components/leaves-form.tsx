"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

const leaveSchema = z.object({
  employee_id: z.string().min(1, "Employee is required"),
  leave_type: z.enum(["full_day", "half_day", "multiple_days"]),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  reason: z.string().optional(),
}).refine((data) => {
  if (data.leave_type === "multiple_days" && !data.end_date) {
    return false;
  }
  if (data.leave_type === "multiple_days" && data.end_date && data.end_date < data.start_date) {
    return false;
  }
  return true;
}, {
  message: "End date is required for multiple days and must be after start date",
  path: ["end_date"],
});

type LeaveFormValues = z.infer<typeof leaveSchema>;

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
}

interface LeavesFormProps {
  leave?: Leave | null;
  onSubmit: (data: LeaveFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  employees: Employee[];
}

export function LeavesForm({
  leave,
  onSubmit,
  onCancel,
  isLoading = false,
  employees,
}: LeavesFormProps) {
  const [leaveType, setLeaveType] = useState<"full_day" | "half_day" | "multiple_days">(
    leave?.leave_type || "full_day"
  );

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      employee_id: leave?.employee_id || "",
      leave_type: leave?.leave_type || "full_day",
      start_date: leave?.start_date || "",
      end_date: leave?.end_date || "",
      reason: leave?.reason || "",
    },
  });

  useEffect(() => {
    if (leave) {
      form.reset({
        employee_id: leave.employee_id,
        leave_type: leave.leave_type,
        start_date: leave.start_date,
        end_date: leave.end_date || "",
        reason: leave.reason || "",
      });
      setLeaveType(leave.leave_type);
    }
  }, [leave, form]);

  const handleSubmit = async (data: LeaveFormValues) => {
    await onSubmit(data);
  };

  return (
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{leave ? "Edit Leave" : "Add Leave"}</DialogTitle>
        <DialogDescription>
          {leave ? "Update leave details" : "Create a new leave request"}
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
                  disabled={isLoading}
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
            name="leave_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leave Type *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setLeaveType(value as "full_day" | "half_day" | "multiple_days");
                    if (value !== "multiple_days") {
                      form.setValue("end_date", "");
                    }
                  }}
                  value={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="full_day">Full Day</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                    <SelectItem value="multiple_days">Multiple Days</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        {...field}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {leaveType === "multiple_days" && (
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          {...field}
                          className="pl-10"
                          disabled={isLoading}
                          min={form.watch("start_date")}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      End date must be after or equal to start date
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter reason for leave (optional)"
                    rows={3}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white"
            >
              {isLoading ? "Saving..." : leave ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

