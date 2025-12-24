"use client";

import { Card, CardContent } from "@/components/ui/card";

interface SalaryPreviewData {
  employee_id?: string;
  month?: number;
  year?: number;
  date?: string;
  basic_salary?: number;
  allowances?: number;
  bonus?: number;
  advance?: number;
  leave_lop?: number;
  penalty?: number;
}

interface Employee {
  name?: string;
  employee_id?: string;
  designation?: string;
  department?: string;
}

interface SalaryPreviewProps {
  formData: SalaryPreviewData;
  employee?: Employee | null;
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

export function SalaryPreview({ formData, employee }: SalaryPreviewProps) {
  // Calculate values
  const basicSalary = formData.basic_salary || 0;
  const allowances = formData.allowances || 0;
  const bonus = formData.bonus || 0;
  const grossSalary = basicSalary + allowances + bonus;

  const advance = formData.advance || 0;
  const leaveLop = formData.leave_lop || 0;
  const penalty = formData.penalty || 0;
  const totalDeductions = advance + leaveLop + penalty;

  const netSalary = grossSalary - totalDeductions;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const monthName = formData.month ? monthNames[formData.month - 1] : "";
  const year = formData.year || new Date().getFullYear();

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6 space-y-6 min-h-[800px]">
          {/* Company Header */}
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-bold mb-2">STRIX DEVELOPMENT PVT LTD</h1>
            <p className="text-sm text-muted-foreground">
              CIN: U72900HP2021PTC008329 | GST: 02ABFCS3765D1Z
            </p>
            <h2 className="text-xl font-semibold mt-4">Salary Slip</h2>
          </div>

          {/* Employee Details */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Employee Name:</span>{" "}
                {employee?.name || "________________"}
              </div>
              <div>
                <span className="font-semibold">Employee ID:</span>{" "}
                {employee?.employee_id || "________________"}
              </div>
              <div>
                <span className="font-semibold">Designation:</span>{" "}
                {employee?.designation || "________________"}
              </div>
              <div>
                <span className="font-semibold">Department:</span>{" "}
                {employee?.department || "________________"}
              </div>
            </div>
            <div className="text-sm">
              <span className="font-semibold">Month:</span> {monthName || "________"} |{" "}
              <span className="font-semibold">Year:</span> {year}
            </div>
          </div>

          {/* Earnings Table */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Earnings</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Earnings</th>
                  <th className="text-right py-2 font-semibold">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Basic Salary</td>
                  <td className="text-right">{formatCurrency(basicSalary)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Allowances</td>
                  <td className="text-right">{formatCurrency(allowances)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Bonus</td>
                  <td className="text-right">{formatCurrency(bonus)}</td>
                </tr>
                <tr className="border-b font-semibold">
                  <td className="py-2">Gross Salary</td>
                  <td className="text-right">{formatCurrency(grossSalary)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Deductions Table */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Deductions</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Deductions</th>
                  <th className="text-right py-2 font-semibold">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Advance</td>
                  <td className="text-right">{formatCurrency(advance)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Leave / LOP</td>
                  <td className="text-right">{formatCurrency(leaveLop)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Penalty (if any)</td>
                  <td className="text-right">{formatCurrency(penalty)}</td>
                </tr>
                <tr className="border-b font-semibold">
                  <td className="py-2">Total Deductions</td>
                  <td className="text-right">{formatCurrency(totalDeductions)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Pay */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Net Pay</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Net Salary (Payable)</th>
                  <th className="text-right py-2 font-semibold">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-semibold">Net Salary (Payable)</td>
                  <td className="text-right font-semibold text-lg">
                    {formatCurrency(netSalary)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="space-y-4 pt-4 border-t">
            <div className="text-sm">
              <span className="font-semibold">Date:</span> {formatDate(formData.date) || "________"}
            </div>
            <div className="flex justify-between items-end mt-8">
              <div>
                <p className="font-semibold mb-2">Authorized Signatory</p>
                <div className="border-t w-32"></div>
              </div>
              <div>
                <p className="font-semibold mb-2">Acceptance</p>
                <p className="text-sm mb-2">
                  {employee?.name ? `Mr./Ms. ${employee.name}` : "________________"}
                </p>
                <p className="text-sm">(Signature and Date)</p>
              </div>
            </div>
            <div className="text-xs text-center text-muted-foreground mt-6 pt-4 border-t">
              <p className="font-semibold">STRIX Development Pvt. Ltd</p>
              <p>
                NH-21, Near Union Bank, 1st & 2nd Floor Main bazar Ner - chowk, Teh-Balh, Distt.
                Mandi, HP 175008-India
              </p>
              <p>
                Email: info@strixdevelopment.net | Website: www.strixdevelopment.net
              </p>
              <p>Phone: +91 85570-17061, +91 9805997318</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

