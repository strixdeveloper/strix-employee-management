"use client";

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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

const DEPARTMENTS = [
  "Frontend",
  "Backend",
  "Business Development",
  "UI/UX",
  "HR Department",
  "Front Office Department",
] as const;

const DESIGNATIONS = [
  "Sr. Backend Developer",
  "Sr. Frontend Developer",
  "Frontend Developer",
  "Webflow Developer",
  "Shopify Developer",
  "WordPress developer",
  "backend Developer",
  "Business Development Executive",
  "Front Office Executive",
  "Sr. Graphic Designer",
  "Graphic Designer",
] as const;

const employeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  employee_id: z.string().min(1, "Employee ID is required"),
  email: z.string().email("Invalid email address"),
  designation: z.string().min(1, "Designation is required"),
  department: z.string().min(1, "Department is required"),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee?: {
    rowid: number;
    name: string;
    employee_id: string;
    email: string;
    designation: string;
    department: string;
  } | null;
  onSubmit: (data: EmployeeFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EmployeeForm({
  employee,
  onSubmit,
  onCancel,
  isLoading = false,
}: EmployeeFormProps) {
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee
      ? {
          name: employee.name,
          employee_id: employee.employee_id,
          email: employee.email,
          designation: employee.designation,
          department: employee.department,
        }
      : {
          name: "",
          employee_id: "",
          email: "",
          designation: "",
          department: "",
        },
  });

  const handleSubmit = async (data: EmployeeFormValues) => {
    await onSubmit(data);
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{employee ? "Edit Employee" : "Add Employee"}</DialogTitle>
        <DialogDescription>
          {employee
            ? "Update employee information below."
            : "Fill in the details to add a new employee."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="employee_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee ID</FormLabel>
                <FormControl>
                  <Input placeholder="EMP001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="designation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Designation</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DESIGNATIONS.map((designation) => (
                      <SelectItem key={designation} value={designation}>
                        {designation}
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
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DEPARTMENTS.map((department) => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              {isLoading ? "Saving..." : employee ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

