"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const salarySchema = z.object({
  employee_id: z.string().min(1, "Employee is required"),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  date: z.string().min(1, "Date is required"),
  basic_salary: z.number().min(0, "Current salary must be 0 or greater"),
  allowances: z.number().min(0, "Allowances must be 0 or greater"),
  bonus: z.number().min(0, "Bonus must be 0 or greater"),
  advance: z.number().min(0, "Advance must be 0 or greater"),
  leave_lop: z.number().min(0, "Leave/LOP must be 0 or greater"),
  penalty: z.number().min(0, "Penalty must be 0 or greater").optional(),
});

type SalaryFormValues = z.infer<typeof salarySchema>;

interface Employee {
  rowid: number;
  name: string;
  employee_id: string;
  designation: string;
  department: string;
}

interface SalaryFormProps {
  employees: Employee[];
  onSubmit: (data: SalaryFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  formData?: SalaryFormValues & { rowid?: number };
  onFormChange?: (data: SalaryFormValues) => void;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function SalaryForm({
  employees,
  onSubmit,
  onCancel,
  isLoading = false,
  formData,
  onFormChange,
}: SalaryFormProps) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const form = useForm<SalaryFormValues>({
    resolver: zodResolver(salarySchema),
    defaultValues: formData || {
      employee_id: "",
      month: currentMonth,
      year: currentYear,
      date: currentDate.toISOString().split("T")[0],
      basic_salary: 0,
      allowances: 0,
      bonus: 0,
      advance: 0,
      leave_lop: 0,
      penalty: 0,
    },
  });

  // Reset form when formData changes (for edit mode)
  useEffect(() => {
    if (formData) {
      form.reset(formData);
    }
  }, [formData, form]);

  // Watch form changes for real-time preview
  const watchedValues = form.watch();
  const previousValuesRef = useRef<string>("");

  useEffect(() => {
    if (onFormChange) {
      const currentValuesString = JSON.stringify(watchedValues);
      // Only call onFormChange if values actually changed
      if (currentValuesString !== previousValuesRef.current) {
        previousValuesRef.current = currentValuesString;
        onFormChange(watchedValues);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues]);

  const handleSubmit = async (data: SalaryFormValues) => {
    await onSubmit(data);
  };

  // Generate years array (current year ± 5 years)
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Salary Slip Details</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto custom-scrollbar">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Employee Selection */}
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.rowid} value={employee.employee_id}>
                          {employee.name} ({employee.employee_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Month and Year */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {monthNames.map((month, index) => (
                          <SelectItem key={index + 1} value={(index + 1).toString()}>
                            {month}
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
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Earnings Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">Earnings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="basic_salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Salary</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allowances"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allowances</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bonus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bonus</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Deductions Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">Deductions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="advance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Advance</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="leave_lop"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave / LOP</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="penalty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Penalty</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value || 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:from-pink-600 hover:to-fuchsia-600"
              >
                {isLoading ? (formData?.rowid ? "Updating..." : "Creating...") : (formData?.rowid ? "Update Salary Slip" : "Create Salary Slip")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

