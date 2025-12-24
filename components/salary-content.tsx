"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { Download, Eye, Pencil, Trash2, Plus } from "lucide-react";
import { SalaryForm } from "@/components/salary-form";
import { SalaryPreview } from "@/components/salary-preview";

interface Employee {
  rowid: number;
  name: string;
  employee_id: string;
  designation: string;
  department: string;
}

interface Salary {
  rowid: number;
  employee_id: string;
  month: number;
  year: number;
  date: string;
  basic_salary: number;
  allowances: number;
  bonus: number;
  gross_salary: number;
  advance: number;
  leave_lop: number;
  penalty: number;
  total_deductions: number;
  net_salary: number;
  pdf_url: string | null;
  created_at?: string;
  updated_at?: string;
  employees?: Employee;
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

interface SalaryContentProps {
  isCreateMode?: boolean;
  onCreateModeChange?: (isCreateMode: boolean) => void;
  onBackRef?: (handler: () => void) => void;
}

export function SalaryContent({ isCreateMode: externalCreateMode, onCreateModeChange, onBackRef }: SalaryContentProps) {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteMultipleDialogOpen, setIsDeleteMultipleDialogOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const itemsPerPage = 20;

  // Simple toast implementation
  const showToast = (message: string, type: "success" | "error" = "success") => {
    console.log(type === "success" ? `✓ ${message}` : `✗ ${message}`);
    if (type === "error") {
      alert(`Error: ${message}`);
    }
  };

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/salary");
      if (!response.ok) throw new Error("Failed to fetch salaries");
      const result = await response.json();
      setSalaries(result.data || []);
    } catch (error) {
      showToast("Failed to load salaries", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employee");
      if (!response.ok) throw new Error("Failed to fetch employees");
      const result = await response.json();
      setEmployees(result.data || []);
    } catch (error) {
      showToast("Failed to load employees", "error");
    }
  };

  useEffect(() => {
    fetchSalaries();
    fetchEmployees();
  }, []);

  // Sync with external create mode state
  useEffect(() => {
    if (externalCreateMode !== undefined) {
      setIsCreateMode(externalCreateMode);
      if (!externalCreateMode && formData) {
        setFormData(null);
        setSelectedEmployee(null);
      }
    }
  }, [externalCreateMode]);

  useEffect(() => {
    if (onCreateModeChange) {
      onCreateModeChange(isCreateMode);
    }
  }, [isCreateMode, onCreateModeChange]);

  const handleCreateMode = () => {
    setIsCreateMode(true);
    setFormData({
      employee_id: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      date: new Date().toISOString().split("T")[0],
      basic_salary: 0,
      allowances: 0,
      bonus: 0,
      advance: 0,
      leave_lop: 0,
      penalty: 0,
    });
    setSelectedEmployee(null);
  };

  const handleBackToTable = () => {
    setIsCreateMode(false);
    setFormData(null);
    setSelectedEmployee(null);
  };

  // Expose handleBackToTable to parent
  useEffect(() => {
    if (onBackRef) {
      onBackRef(handleBackToTable);
    }
  }, [onBackRef]);

  const handleFormChange = useCallback((data: any) => {
    setFormData(data);
    // Find selected employee
    if (data.employee_id) {
      const emp = employees.find((e) => e.employee_id === data.employee_id);
      setSelectedEmployee(emp || null);
    } else {
      setSelectedEmployee(null);
    }
  }, [employees]);

  const handleCreateSalary = async (data: any) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create salary record");
      }

      showToast("Salary record created successfully");
      setIsCreateMode(false);
      setFormData(null);
      setSelectedEmployee(null);
      fetchSalaries();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSalary) return;

    try {
      const response = await fetch(`/api/salary?rowid=${selectedSalary.rowid}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete salary record");
      }

      showToast("Salary record deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedSalary(null);
      fetchSalaries();
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  const handleDownload = async (salary: Salary) => {
    if (!salary.pdf_url) {
      showToast("PDF not available for this salary record", "error");
      return;
    }

    try {
      // Download PDF from Supabase Storage
      const response = await fetch(salary.pdf_url);
      if (!response.ok) throw new Error("Failed to download PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${salary.employees?.employee_id || salary.employee_id}_${salary.year}_${salary.month}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("PDF downloaded successfully");
    } catch (error: any) {
      showToast(error.message || "Failed to download PDF", "error");
    }
  };

  const handleView = (salary: Salary) => {
    if (!salary.pdf_url) {
      showToast("PDF not available for this salary record", "error");
      return;
    }
    // Open PDF in new tab
    window.open(salary.pdf_url, "_blank");
  };

  const openDeleteDialog = (salary: Salary) => {
    setSelectedSalary(salary);
    setIsDeleteDialogOpen(true);
  };

  // Pagination calculations
  const totalPages = Math.ceil(salaries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSalaries = salaries.slice(startIndex, endIndex);

  const selectedSalaries = salaries.filter((sal) => selectedRowIds.has(sal.rowid));
  const isAllSelected = currentSalaries.length > 0 && currentSalaries.every((sal) => selectedRowIds.has(sal.rowid));
  const isIndeterminate = currentSalaries.some((sal) => selectedRowIds.has(sal.rowid)) && !isAllSelected;
  const selectAllCheckboxRef = useRef<React.ElementRef<typeof Checkbox>>(null);

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const checkbox = selectAllCheckboxRef.current as unknown as HTMLButtonElement;
      if (checkbox) {
        checkbox.indeterminate = isIndeterminate;
      }
    }
  }, [isIndeterminate]);

  // Clear selection when page changes
  useEffect(() => {
    setSelectedRowIds(new Set());
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [salaries.length]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowIds(new Set(currentSalaries.map((sal) => sal.rowid)));
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
        fetch(`/api/salary?rowid=${rowid}`, { method: "DELETE" })
      );

      const results = await Promise.all(deletePromises);
      const failed = results.some((r) => !r.ok);

      if (failed) {
        throw new Error("Some salary records could not be deleted");
      }

      showToast(`${selectedRowIds.size} salary record(s) deleted successfully`);
      setIsDeleteMultipleDialogOpen(false);
      setSelectedRowIds(new Set());
      fetchSalaries();
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format month
  const formatMonth = (month: number, year: number) => {
    return `${monthNames[month - 1]} ${year}`;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading salaries...</div>
          </div>
        </div>
      </div>
    );
  }

  // Create Mode View
  if (isCreateMode) {
    return (
      <div className="h-full flex">
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Left Side - Form */}
              <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-8rem)]">
                <SalaryForm
                  employees={employees}
                  onSubmit={handleCreateSalary}
                  onCancel={handleBackToTable}
                  isLoading={isSubmitting}
                  formData={formData}
                  onFormChange={handleFormChange}
                />
              </div>
              {/* Right Side - Preview */}
              <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-8rem)]">
                <SalaryPreview
                  formData={formData || {}}
                  employee={selectedEmployee}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Table View
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">Salary History</h2>
            <p className="text-muted-foreground text-sm">
              Total: {salaries.length} salary record{salaries.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Single Selection Actions */}
            {selectedRowIds.size === 1 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    const salary = selectedSalaries[0];
                    if (salary) handleView(salary);
                  }}
                  className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:from-pink-600 hover:to-fuchsia-600 border-0"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const salary = selectedSalaries[0];
                    if (salary) handleDownload(salary);
                  }}
                  className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:from-pink-600 hover:to-fuchsia-600 border-0"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const salary = selectedSalaries[0];
                    if (salary) openDeleteDialog(salary);
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
            {/* Create Salary Slip Button */}
            <Button
              className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:from-pink-600 hover:to-fuchsia-600"
              onClick={handleCreateMode}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Salary Slip
            </Button>
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
                <TableHead>Employee Name</TableHead>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Gross Amount</TableHead>
                <TableHead className="text-right">Deduction</TableHead>
                <TableHead className="text-right">Net Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSalaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No salary records found. Add your first salary record to get started.
                  </TableCell>
                </TableRow>
              ) : (
                currentSalaries.map((salary) => (
                  <TableRow key={salary.rowid}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRowIds.has(salary.rowid)}
                        onCheckedChange={(checked) =>
                          handleSelectRow(salary.rowid, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {salary.employees?.name || "N/A"}
                    </TableCell>
                    <TableCell>{formatMonth(salary.month, salary.year)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(salary.gross_salary)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(salary.total_deductions)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(salary.net_salary)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(salary)}
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(salary)}
                          title="View PDF"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            // TODO: Open edit dialog
                            showToast("Edit functionality coming soon");
                          }}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(salary)}
                          title="Delete"
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
          {currentSalaries.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-8">
                  No salary records found. Add your first salary record to get started.
                </div>
              </CardContent>
            </Card>
          ) : (
            currentSalaries.map((salary) => (
              <Card key={salary.rowid}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Employee Name</p>
                        <p className="font-medium">{salary.employees?.name || "N/A"}</p>
                      </div>
                      <Checkbox
                        checked={selectedRowIds.has(salary.rowid)}
                        onCheckedChange={(checked) =>
                          handleSelectRow(salary.rowid, checked as boolean)
                        }
                      />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Month</p>
                      <p>{formatMonth(salary.month, salary.year)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gross Amount</p>
                      <p>{formatCurrency(salary.gross_salary)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deduction</p>
                      <p>{formatCurrency(salary.total_deductions)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Net Amount</p>
                      <p className="font-semibold">{formatCurrency(salary.net_salary)}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownload(salary)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleView(salary)}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          showToast("Edit functionality coming soon");
                        }}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive"
                        onClick={() => openDeleteDialog(salary)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
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
              Showing {startIndex + 1} to {Math.min(endIndex, salaries.length)} of{" "}
              {salaries.length} records
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the salary record for{" "}
                <strong>
                  {selectedSalary?.employees?.name || "N/A"} - {selectedSalary && formatMonth(selectedSalary.month, selectedSalary.year)}
                </strong>{" "}
                from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedSalary(null)}>
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
                <strong>{selectedRowIds.size} salary record(s)</strong> from the system.
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
                Delete {selectedRowIds.size} Record(s)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
