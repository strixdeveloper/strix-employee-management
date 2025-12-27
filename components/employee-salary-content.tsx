"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Calendar, DollarSign, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function EmployeeSalaryContent() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchSalaries();
  }, []);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/employee/salary");
      if (!response.ok) {
        throw new Error("Failed to fetch salary records");
      }
      
      const result = await response.json();
      setSalaries(result.data || []);
    } catch (error: any) {
      console.error("Error fetching salaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (salary: Salary) => {
    setSelectedSalary(salary);
    setSelectedEmployee(salary.employees || null);
    setIsViewDialogOpen(true);
  };

  const handleDownload = async (salary: Salary) => {
    try {
      // If PDF URL exists, download it
      if (salary.pdf_url) {
        const response = await fetch(salary.pdf_url);
        if (!response.ok) throw new Error("Failed to download PDF");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `salary-slip-${salary.employees?.employee_id || salary.employee_id}-${monthNames[salary.month - 1]}-${salary.year}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }

      // If PDF doesn't exist, show message
      alert("PDF is not available for this salary slip yet. Please contact HR.");
    } catch (error: any) {
      console.error("Error downloading salary slip:", error);
      alert("Failed to download salary slip. Please try again later.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
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

  // Sort by year and month (newest first)
  const sortedSalaries = [...salaries].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  if (loading) {
    return (
      <div className="p-6 lg:p-12 min-h-full">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-12 min-h-full">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">My Salary Slips</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">View and download your monthly salary slips</p>
        </div>

        {/* Salary Slips Table */}
        <Card className="border border-gray-200/50 dark:border-gray-800/50">
          {sortedSalaries.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No salary slips found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs lg:text-sm">Month/Year</TableHead>
                    <TableHead className="text-xs lg:text-sm">Date</TableHead>
                    <TableHead className="text-xs lg:text-sm">Basic Salary</TableHead>
                    <TableHead className="text-xs lg:text-sm">Gross Salary</TableHead>
                    <TableHead className="text-xs lg:text-sm">Deductions</TableHead>
                    <TableHead className="text-xs lg:text-sm">Net Salary</TableHead>
                    <TableHead className="text-xs lg:text-sm text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSalaries.map((salary) => (
                    <TableRow key={salary.rowid}>
                      <TableCell className="text-xs lg:text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {monthNames[salary.month - 1]} {salary.year}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm text-muted-foreground">
                        {formatDate(salary.date)}
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm">
                        {formatCurrency(salary.basic_salary)}
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(salary.gross_salary)}
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm text-orange-600 dark:text-orange-400">
                        {formatCurrency(salary.total_deductions)}
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm font-bold text-pink-600 dark:text-pink-400">
                        {formatCurrency(salary.net_salary)}
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(salary)}
                            className="h-8 px-2"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(salary)}
                            className="h-8 px-2"
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            <span className="hidden sm:inline">Download</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* View Salary Slip Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="!max-w-[98vw] !w-[98vw] max-h-[95vh] overflow-y-auto p-6 lg:p-8 sm:!max-w-[98vw]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Salary Slip - {selectedSalary && `${monthNames[selectedSalary.month - 1]} ${selectedSalary.year}`}
              </DialogTitle>
            </DialogHeader>
            {selectedSalary && selectedEmployee && (
              <SalaryPreview
                formData={{
                  employee_id: selectedSalary.employee_id,
                  month: selectedSalary.month,
                  year: selectedSalary.year,
                  date: selectedSalary.date,
                  basic_salary: selectedSalary.basic_salary,
                  allowances: selectedSalary.allowances,
                  bonus: selectedSalary.bonus,
                  advance: selectedSalary.advance,
                  leave_lop: selectedSalary.leave_lop,
                  penalty: selectedSalary.penalty,
                }}
                employee={selectedEmployee}
              />
            )}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </Button>
              {selectedSalary && (
                <Button
                  onClick={() => handleDownload(selectedSalary)}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

