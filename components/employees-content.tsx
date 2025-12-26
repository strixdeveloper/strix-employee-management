"use client";

import { useState, useEffect, useRef } from "react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmployeeForm } from "@/components/employee-form";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface Employee {
  rowid: number;
  name: string;
  employee_id: string;
  email: string;
  designation: string;
  department: string;
  created_at?: string;
  updated_at?: string;
  user_role?: string | null; // Role from auth user if exists
}

export function EmployeesContent() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteMultipleDialogOpen, setIsDeleteMultipleDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const itemsPerPage = 20;

  // Simple toast implementation
  const showToast = (message: string, type: "success" | "error" = "success") => {
    // Using console for now - can be replaced with proper toast component
    console.log(type === "success" ? `✓ ${message}` : `✗ ${message}`);
    // For user feedback, you might want to add a toast notification component
    if (type === "error") {
      alert(`Error: ${message}`);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/employee");
      if (!response.ok) throw new Error("Failed to fetch employees");
      const result = await response.json();
      const employeesData = result.data || [];
      
      // Check user roles for each employee
      const employeesWithRoles = await Promise.all(
        employeesData.map(async (emp: Employee) => {
          try {
            const userCheckResponse = await fetch(`/api/auth/check-user?email=${encodeURIComponent(emp.email)}`);
            if (userCheckResponse.ok) {
              const userData = await userCheckResponse.json();
              if (userData.exists) {
                return { ...emp, user_role: userData.user.role };
              }
            }
          } catch (error) {
            console.error(`Failed to check user for ${emp.email}:`, error);
          }
          return { ...emp, user_role: null };
        })
      );
      
      setEmployees(employeesWithRoles);
    } catch (error) {
      showToast("Failed to load employees", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAdd = async (data: any) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add employee");
      }

      showToast("Employee added successfully");
      setIsAddDialogOpen(false);
      fetchEmployees();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: any) => {
    if (!selectedEmployee) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/employee", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowid: selectedEmployee.rowid,
          ...data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update employee");
      }

      showToast("Employee updated successfully");
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;

    try {
      const response = await fetch(`/api/employee?rowid=${selectedEmployee.rowid}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete employee");
      }

      showToast("Employee deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const openCreateUserDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsCreateUserDialogOpen(true);
  };

  const openDeleteDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowIds(new Set(currentEmployees.map((emp) => emp.rowid)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleSelectRow = (rowid: number, checked: boolean) => {
    const newSelected = new Set(selectedRowIds);
    if (checked) {
      newSelected.add(rowid);
    } else {
      newSelected.delete(rowid);
    }
    setSelectedRowIds(newSelected);
  };

  const handleDeleteMultiple = async () => {
    try {
      const deletePromises = Array.from(selectedRowIds).map((rowid) =>
        fetch(`/api/employee?rowid=${rowid}`, { method: "DELETE" })
      );

      const results = await Promise.all(deletePromises);
      const failed = results.some((r) => !r.ok);

      if (failed) {
        throw new Error("Some employees could not be deleted");
      }

      showToast(`${selectedRowIds.size} employee(s) deleted successfully`);
      setIsDeleteMultipleDialogOpen(false);
      setSelectedRowIds(new Set());
      fetchEmployees();
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(employees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = employees.slice(startIndex, endIndex);

  const selectedEmployees = employees.filter((emp) => selectedRowIds.has(emp.rowid));
  const isAllSelected = currentEmployees.length > 0 && currentEmployees.every((emp) => selectedRowIds.has(emp.rowid));
  const isIndeterminate = currentEmployees.some((emp) => selectedRowIds.has(emp.rowid)) && !isAllSelected;
  const selectAllCheckboxRef = useRef<React.ElementRef<typeof Checkbox>>(null);

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const checkbox = selectAllCheckboxRef.current as unknown as HTMLInputElement;
      if (checkbox) {
        checkbox.indeterminate = isIndeterminate;
      }
    }
  }, [isIndeterminate]);

  // Clear selection when page changes
  useEffect(() => {
    setSelectedRowIds(new Set());
  }, [currentPage]);

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading employees...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">Employees</h2>
            <p className="text-muted-foreground text-sm">
              Total: {employees.length} employee{employees.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Single Selection Actions */}
            {selectedRowIds.size === 1 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    const employee = selectedEmployees[0];
                    if (employee) openEditDialog(employee);
                  }}
                  className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:from-pink-600 hover:to-fuchsia-600 border-0"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const employee = selectedEmployees[0];
                    if (employee) openDeleteDialog(employee);
                  }}
                  className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:from-pink-600 hover:to-fuchsia-600 border-0"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
            {/* Multiple Selection Actions */}
            {selectedRowIds.size > 1 && (
              <Button
                variant="outline"
                onClick={() => setIsDeleteMultipleDialogOpen(true)}
                className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:from-pink-600 hover:to-fuchsia-600 border-0"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete {selectedRowIds.size} Selected
              </Button>
            )}
            {/* Add Employee Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:from-pink-600 hover:to-fuchsia-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <EmployeeForm
                employee={null}
                onSubmit={handleAdd}
                onCancel={() => setIsAddDialogOpen(false)}
                isLoading={isSubmitting}
              />
            </Dialog>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    ref={selectAllCheckboxRef}
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No employees found. Add your first employee to get started.
                  </TableCell>
                </TableRow>
              ) : (
                currentEmployees.map((employee) => (
                  <TableRow key={employee.rowid}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRowIds.has(employee.rowid)}
                        onCheckedChange={(checked) =>
                          handleSelectRow(employee.rowid, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.employee_id}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.designation}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 items-center">
                        {employee.user_role ? (
                          <Badge 
                            variant="secondary" 
                            className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white border-0 font-semibold"
                          >
                            {employee.user_role}
                          </Badge>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openCreateUserDialog(employee)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Create User Account</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(employee)}
                          title="Edit Employee"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(employee)}
                          title="Delete Employee"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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
          {currentEmployees.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-8">
                  No employees found. Add your first employee to get started.
                </div>
              </CardContent>
            </Card>
          ) : (
            currentEmployees.map((employee) => (
              <Card key={employee.rowid}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{employee.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Employee ID</p>
                      <p>{employee.employee_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p>{employee.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Designation</p>
                      <p>{employee.designation}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p>{employee.department}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      {employee.user_role ? (
                        <div className="flex-1 flex items-center justify-center">
                          <Badge 
                            variant="secondary" 
                            className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white border-0 font-semibold"
                          >
                            {employee.user_role}
                          </Badge>
                        </div>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                onClick={() => openCreateUserDialog(employee)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Create User
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Create User Account</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(employee)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive"
                        onClick={() => openDeleteDialog(employee)}
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
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, employees.length)} of{" "}
              {employees.length} employees
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
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  );
                })}
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

        {/* Create User Dialog */}
        <CreateUserDialog
          open={isCreateUserDialogOpen}
          onOpenChange={setIsCreateUserDialogOpen}
          employee={selectedEmployee}
          onSuccess={() => {
            showToast("User account created successfully");
            fetchEmployees();
          }}
        />

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          {selectedEmployee && (
            <EmployeeForm
              employee={selectedEmployee}
              onSubmit={handleEdit}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedEmployee(null);
              }}
              isLoading={isSubmitting}
            />
          )}
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the employee{" "}
                <strong>{selectedEmployee?.name}</strong> from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedEmployee(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:from-pink-600 hover:to-fuchsia-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Multiple Confirmation Dialog */}
        <AlertDialog open={isDeleteMultipleDialogOpen} onOpenChange={setIsDeleteMultipleDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete{" "}
                <strong>{selectedRowIds.size} employee(s)</strong> from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteMultipleDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteMultiple}
                className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:from-pink-600 hover:to-fuchsia-600"
              >
                Delete {selectedRowIds.size} Employee(s)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
