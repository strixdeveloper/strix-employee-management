"use client";

import { useForm, useFieldArray } from "react-hook-form";
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
import { X, Upload, File, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const projectSchema = z.object({
  project_name: z.string().min(1, "Project name is required"),
  project_description: z.string().optional(),
  client_name: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  deadline: z.string().optional(),
  tracking_type: z.enum(["tracking", "fixed"]),
  tracking_hours: z.number().optional(),
  fixed_days: z.number().optional(),
  status: z.enum(["planning", "in_progress", "on_hold", "completed", "cancelled"]),
  assigned_employees: z.array(
    z.object({
      employee_id: z.string(),
      role: z.string().optional(),
    })
  ).optional(),
  media_files: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.tracking_type === "tracking" && !data.tracking_hours) {
    return false;
  }
  if (data.tracking_type === "fixed" && !data.fixed_days) {
    return false;
  }
  return true;
}, {
  message: "Tracking hours or fixed days is required based on tracking type",
  path: ["tracking_hours"],
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: {
    rowid: number;
    project_name: string;
    project_description?: string;
    client_name?: string;
    priority: "low" | "medium" | "high" | "urgent";
    deadline?: string;
    tracking_type: "tracking" | "fixed";
    tracking_hours?: number;
    fixed_days?: number;
    status: "planning" | "in_progress" | "on_hold" | "completed" | "cancelled";
    assigned_employees?: Array<{
      employee_id: string;
      role?: string;
    }>;
    media_files?: string[];
  } | null;
  onSubmit: (data: ProjectFormValues) => Promise<void>;
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

export function ProjectForm({
  project,
  onSubmit,
  onCancel,
  isLoading = false,
}: ProjectFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(project?.media_files || []);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

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
    fetchEmployees();
  }, []);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: project
      ? {
          project_name: project.project_name,
          project_description: project.project_description || "",
          client_name: project.client_name || "",
          priority: project.priority,
          deadline: project.deadline ? new Date(project.deadline).toISOString().split("T")[0] : "",
          tracking_type: project.tracking_type,
          tracking_hours: project.tracking_hours || undefined,
          fixed_days: project.fixed_days || undefined,
          status: project.status,
          assigned_employees: project.assigned_employees || [],
          media_files: project.media_files || [],
        }
      : {
          project_name: "",
          project_description: "",
          client_name: "",
          priority: "medium",
          deadline: "",
          tracking_type: "fixed",
          tracking_hours: undefined,
          fixed_days: undefined,
          status: "planning",
          assigned_employees: [],
          media_files: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "assigned_employees",
  });

  const trackingType = form.watch("tracking_type");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newFiles: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${project?.rowid || "new"}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("project-media")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          alert(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("project-media")
          .getPublicUrl(filePath);

        newFiles.push(urlData.publicUrl);
      }

      setUploadedFiles([...uploadedFiles, ...newFiles]);
      form.setValue("media_files", [...uploadedFiles, ...newFiles]);
    } catch (error) {
      console.error("File upload error:", error);
      alert("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (url: string) => {
    const newFiles = uploadedFiles.filter((f) => f !== url);
    setUploadedFiles(newFiles);
    form.setValue("media_files", newFiles);
  };

  const handleSubmit = async (data: ProjectFormValues) => {
    await onSubmit({ ...data, media_files: uploadedFiles });
  };

  const addEmployee = () => {
    append({ employee_id: "", role: "" });
  };

  return (
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{project ? "Edit Project" : "Add Project"}</DialogTitle>
        <DialogDescription>
          {project
            ? "Update project information below."
            : "Fill in the details to add a new project."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="project_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Project Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="project_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Project description..."
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
            name="client_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Name</FormLabel>
                <FormControl>
                  <Input placeholder="Client Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deadline</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tracking_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tracking Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tracking type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="tracking">Hour Tracking</SelectItem>
                    <SelectItem value="fixed">Fixed Days</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose how to track project progress
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {trackingType === "tracking" ? (
            <FormField
              control={form.control}
              name="tracking_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking Hours *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      step="0.5"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="fixed_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fixed Days *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel>Assigned Employees</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEmployee}
                disabled={loadingEmployees}
              >
                Add Employee
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-end">
                <FormField
                  control={form.control}
                  name={`assigned_employees.${index}.employee_id`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((emp) => (
                              <SelectItem key={emp.employee_id} value={emp.employee_id}>
                                {emp.name} ({emp.employee_id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`assigned_employees.${index}.role`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Role (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No employees assigned. Click "Add Employee" to assign.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <FormLabel>Project Media Files</FormLabel>
            <div className="border-2 border-dashed rounded-lg p-4">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {uploading ? "Uploading..." : "Click to upload files"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Images, PDFs, Documents, etc.
                </p>
              </label>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-xs">
                        {url.split("/").pop()}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFile(url)}
                      className="h-6 w-6"
                    >
                      <XCircle className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:from-pink-600 hover:to-fuchsia-600"
            >
              {isLoading ? "Saving..." : project ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

