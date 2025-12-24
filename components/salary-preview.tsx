"use client";

import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import strixLogo from "@/app/Strix-logo-1.png";
import { Mail, Globe, Phone } from "lucide-react";

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
    <Card className="h-full flex flex-col">
      <CardContent className="p-6 flex-1 overflow-y-auto custom-scrollbar">
        <div className="bg-white dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-8 space-y-6 min-h-[800px]">
          {/* Company Header with Logo */}
          <div className="text-center border-b border-[#D50260] pb-4">
            <div className="flex items-center justify-center mb-4">
              <Image
                src={strixLogo}
                alt="STRIX Logo"
                width={120}
                height={40}
                className="h-auto"
              />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#D50260" }}>
              STRIX DEVELOPMENT PVT LTD
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              CIN: U72900HP2021PTC008329
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              GST: 02ABFCS3765D1Z
            </p>
            <h2 className="text-xl font-semibold mt-4" style={{ color: "#D50260" }}>
              Salary Slip
            </h2>
          </div>

          {/* Employee Details Table */}
          <div className="space-y-3">
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-3 font-semibold text-sm w-1/3">Employee Name:</td>
                  <td className="py-2 px-3 text-sm">{employee?.name || "________________"}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-3 font-semibold text-sm">Employee ID:</td>
                  <td className="py-2 px-3 text-sm">{employee?.employee_id || "________________"}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-3 font-semibold text-sm">Designation:</td>
                  <td className="py-2 px-3 text-sm">{employee?.designation || "________________"}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-3 font-semibold text-sm">Department:</td>
                  <td className="py-2 px-3 text-sm">{employee?.department || "________________"}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-3 font-semibold text-sm">Month:</td>
                  <td className="py-2 px-3 text-sm">{monthName || "________"}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-3 font-semibold text-sm">Year:</td>
                  <td className="py-2 px-3 text-sm">{year}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Earnings Table */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg" style={{ color: "#D50260" }}>Earnings</h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="text-left py-2 px-3 font-semibold border border-gray-300">Earnings</th>
                  <th className="text-right py-2 px-3 font-semibold border border-gray-300">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-3 border border-gray-300">Basic Salary</td>
                  <td className="text-right py-2 px-3 border border-gray-300">{formatCurrency(basicSalary)}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-3 border border-gray-300">Allowances</td>
                  <td className="text-right py-2 px-3 border border-gray-300">{formatCurrency(allowances)}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-3 border border-gray-300">Bonus</td>
                  <td className="text-right py-2 px-3 border border-gray-300">{formatCurrency(bonus)}</td>
                </tr>
                <tr className="border-b border-gray-300 bg-gray-50 dark:bg-gray-800">
                  <td className="py-2 px-3 font-semibold border border-gray-300">Gross Salary</td>
                  <td className="text-right py-2 px-3 font-semibold border border-gray-300">{formatCurrency(grossSalary)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Deductions Table */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg" style={{ color: "#D50260" }}>Deductions</h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="text-left py-2 px-3 font-semibold border border-gray-300">Deductions</th>
                  <th className="text-right py-2 px-3 font-semibold border border-gray-300">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-3 border border-gray-300">Advance</td>
                  <td className="text-right py-2 px-3 border border-gray-300">{formatCurrency(advance)}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-3 border border-gray-300">Leave / LOP</td>
                  <td className="text-right py-2 px-3 border border-gray-300">{formatCurrency(leaveLop)}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-3 border border-gray-300">Penalty (if any)</td>
                  <td className="text-right py-2 px-3 border border-gray-300">{formatCurrency(penalty)}</td>
                </tr>
                <tr className="border-b border-gray-300 bg-gray-50 dark:bg-gray-800">
                  <td className="py-2 px-3 font-semibold border border-gray-300">Total Deductions</td>
                  <td className="text-right py-2 px-3 font-semibold border border-gray-300">{formatCurrency(totalDeductions)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Pay */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg" style={{ color: "#D50260" }}>Net Pay</h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="text-left py-2 px-3 font-semibold border border-gray-300">Net Salary (Payable)</th>
                  <th className="text-right py-2 px-3 font-semibold border border-gray-300">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-3 font-semibold border border-gray-300">Net Salary (Payable)</td>
                  <td className="text-right py-2 px-3 font-semibold text-lg border border-gray-300" style={{ color: "#D50260" }}>
                    {formatCurrency(netSalary)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="space-y-4 pt-4 border-t border-gray-300">
            <div className="text-sm">
              <span className="font-semibold">Date:</span> {formatDate(formData.date) || "________"}
            </div>
            <div className="flex justify-between items-end mt-8">
              <div>
                <p className="font-semibold mb-2">Authorized Signatory</p>
                <div className="border-t border-gray-400 w-32 mt-8"></div>
              </div>
              <div className="text-right">
                <p className="font-semibold mb-2">Acceptance</p>
                <p className="text-sm mb-2">
                  {employee?.name ? `Mr. ${employee.name}` : "________________"}
                </p>
                <p className="text-sm">(Signature and Date)</p>
              </div>
            </div>
            <div className="text-xs text-center text-gray-600 dark:text-gray-400 mt-6 pt-4 border-t border-gray-300 space-y-1">
              <p className="font-semibold" style={{ color: "#D50260" }}>
                STRIX Development Pvt. Ltd
              </p>
              <p>
                NH-21, Near Union Bank, 1st & 2nd Floor Main bazar Ner - chowk, Teh-Balh, Distt.
                Mandi, HP 175008-India
              </p>
              <div className="flex items-center justify-center gap-4 mt-1">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" style={{ color: "#D50260" }} />
                  <span>info@strixdevelopment.net</span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" style={{ color: "#D50260" }} />
                  <span>www.strixdevelopment.net</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" style={{ color: "#D50260" }} />
                  <span>+91 85570-17061, +91 9805997318</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

