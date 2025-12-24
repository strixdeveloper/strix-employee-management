import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import type { SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SALARY_BUCKET = "salary-slips";

async function generateSalaryPdfHtml(
  salary: any,
  employee: any
): Promise<string> {
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

  const monthName =
    salary.month && salary.month >= 1 && salary.month <= 12
      ? monthNames[salary.month - 1]
      : "";

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const basicSalary = salary.basic_salary || 0;
  const allowances = salary.allowances || 0;
  const bonus = salary.bonus || 0;
  const grossSalary = basicSalary + allowances + bonus;

  const advance = salary.advance || 0;
  const leaveLop = salary.leave_lop || 0;
  const penalty = salary.penalty || 0;
  const totalDeductions = advance + leaveLop + penalty;
  const netSalary = grossSalary - totalDeductions;

  const primaryColor = "#D50260";

  // Read logo and convert to base64 for watermark
  let logoBase64 = "";
  try {
    const logoPath = path.join(process.cwd(), "app", "Strix-logo-1.png");
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Error reading logo file:", error);
  }

  // Simple HTML template that mimics the on-screen preview
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <title>Salary Slip</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 12px;
        color: #111827;
        padding: 0;
        margin: 0;
        height: 100%;
        min-height: 100vh;
      }
      .card {
        border: none;
        border-radius: 0;
        padding: 0;
        position: relative;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
      .watermark {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        opacity: 0.1;
        z-index: 5;
        pointer-events: none;
        width: 600px;
        height: auto;
      }
      .content {
        position: relative;
        z-index: 10;
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .footer-section {
        margin-top: auto;
      }
      table thead tr,
      table tbody tr.bg-muted {
        background-color: rgba(243, 244, 246, 0.7) !important;
      }
      .text-center { text-align: center; }
      .mb-2 { margin-bottom: 8px; }
      .mb-4 { margin-bottom: 16px; }
      .mt-4 { margin-top: 16px; }
      .mt-6 { margin-top: 24px; }
      .mt-8 { margin-top: 32px; }
      .pb-4 { padding-bottom: 16px; }
      .pt-4 { padding-top: 16px; }
      .border-b { border-bottom: 1px solid #e5e7eb; }
      .border-t { border-top: 1px solid #e5e7eb; }
      .font-bold { font-weight: 700; }
      .font-semibold { font-weight: 600; }
      .text-sm { font-size: 12px; }
      .text-xs { font-size: 10px; }
      .text-lg { font-size: 16px; }
      .text-primary { color: ${primaryColor}; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 6px 8px; }
      th { text-align: left; }
      .border { border: 1px solid #e5e7eb; }
      .bg-muted { background-color: #f3f4f6; }
      .flex { display: flex; }
      .justify-between { justify-content: space-between; }
      .items-end { align-items: flex-end; }
      .text-right { text-align: right; }
      .footer-row { display: flex; justify-content: center; gap: 16px; margin-top: 4px; }
      .flex-row { display: flex; }
      .items-center { align-items: center; }
      .justify-between { justify-content: space-between; }
      .gap-2 { gap: 8px; }
      .gap-6 { gap: 24px; }
      .w-1-2 { width: 50%; }
      .space-y-1 > * + * { margin-top: 4px; }
      .space-y-2 > * + * { margin-top: 8px; }
      .space-y-4 > * + * { margin-top: 16px; }
      .space-y-6 > * + * { margin-top: 24px; }
      .mb-1 { margin-bottom: 4px; }
      .mb-2 { margin-bottom: 8px; }
      .mb-4 { margin-bottom: 16px; }
      .block { display: block; }
      .mt-4 { margin-top: 16px; }
      .mt-6 { margin-top: 24px; }
      .mt-8 { margin-top: 32px; }
      .pt-4 { padding-top: 16px; }
      .pb-4 { padding-bottom: 16px; }
      .px-3 { padding-left: 12px; padding-right: 12px; }
      .py-2 { padding-top: 8px; padding-bottom: 8px; }
      .text-xs { font-size: 10px; }
      .text-sm { font-size: 12px; }
      .text-lg { font-size: 18px; }
      .text-xl { font-size: 20px; }
      .border-t-4 { border-top-width: 4px; }
      .border-gray-300 { border-color: #d1d5db; }
      .border-gray-400 { border-color: #9ca3af; }
      .text-gray-700 { color: #374151; }
      .w-32 { width: 128px; }
      .h-4 { height: 16px; width: 16px; }
      .h-1 { height: 4px; }
      .w-full { width: 100%; }
      .logo-img { height: auto; max-width: 180px; }
      .icon { display: inline-block; vertical-align: middle; }
    </style>
  </head>
  <body>
    <div class="card">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Watermark" class="watermark" />` : ""}
      <div class="content">
      <!-- Company Header with Logo -->
      <div class="pb-4">
        <div class="flex justify-between items-center mb-4">
          <!-- Logo on Left -->
          <div class="flex items-center">
            ${logoBase64 ? `<img src="${logoBase64}" alt="STRIX Logo" class="logo-img" />` : ""}
          </div>
          <!-- CIN and GST on Right -->
          <div class="text-right space-y-1">
            <p class="text-sm text-gray-700 font-semibold">CIN : U72900HP2021PTC008329</p>
            <p class="text-sm text-gray-700 font-semibold">GST : 02ABFCS3765D1Z</p>
          </div>
        </div>
        <div class="text-center mt-4">
          <div class="mb-2 h-1 w-full" style="background-color: ${primaryColor};"></div>
          <h2 class="text-xl font-semibold" style="color: #000000;">Salary Slip</h2>
        </div>
      </div>

      <!-- Employee Details Table -->
      <div class="space-y-3">
        <table class="w-full border-collapse">
          <tbody>
            <tr class="border-b border-gray-300">
              <td class="py-2 px-3 font-semibold text-sm" style="width:33%;">Employee Name:</td>
              <td class="py-2 px-3 text-sm">${employee?.name ?? "________________"}</td>
            </tr>
            <tr class="border-b border-gray-300">
              <td class="py-2 px-3 font-semibold text-sm">Employee ID:</td>
              <td class="py-2 px-3 text-sm">${employee?.employee_id ?? "________________"}</td>
            </tr>
            <tr class="border-b border-gray-300">
              <td class="py-2 px-3 font-semibold text-sm">Designation:</td>
              <td class="py-2 px-3 text-sm">${employee?.designation ?? "________________"}</td>
            </tr>
            <tr class="border-b border-gray-300">
              <td class="py-2 px-3 font-semibold text-sm">Department:</td>
              <td class="py-2 px-3 text-sm">${employee?.department ?? "________________"}</td>
            </tr>
            <tr class="border-b border-gray-300">
              <td class="py-2 px-3 font-semibold text-sm">Month:</td>
              <td class="py-2 px-3 text-sm">${monthName || "________"}</td>
            </tr>
            <tr class="border-b border-gray-300">
              <td class="py-2 px-3 font-semibold text-sm">Year:</td>
              <td class="py-2 px-3 text-sm">${salary.year}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Salary Details Section -->
      <div class="mt-8 space-y-4">
        <h3 class="font-semibold text-lg" style="color: ${primaryColor};">
          Salary Details
        </h3>

        <!-- Combined Salary Table -->
        <div class="space-y-2">
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-muted">
              <th class="text-left py-2 px-3 font-semibold border border-gray-300">Description</th>
              <th class="text-right py-2 px-3 font-semibold border border-gray-300">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <!-- Earnings -->
            <tr class="border-b border-gray-300">
              <td class="py-2 px-3 border border-gray-300">Current Salary</td>
              <td class="text-right py-2 px-3 border border-gray-300">${formatCurrency(basicSalary)}</td>
            </tr>
            <tr class="border-b border-gray-300">
              <td class="py-2 px-3 border border-gray-300">Allowances</td>
              <td class="text-right py-2 px-3 border border-gray-300">${formatCurrency(allowances)}</td>
            </tr>
            <tr class="border-b border-gray-300">
              <td class="py-2 px-3 border border-gray-300">Bonus</td>
              <td class="text-right py-2 px-3 border border-gray-300">${formatCurrency(bonus)}</td>
            </tr>
            <tr class="border-b border-gray-300 bg-muted">
              <td class="py-2 px-3 font-semibold border border-gray-300">Gross Salary</td>
              <td class="text-right py-2 px-3 font-semibold border border-gray-300">${formatCurrency(grossSalary)}</td>
            </tr>
            <!-- Deductions -->
            <tr class="border-b border-gray-300">
              <td class="py-2 px-3 border border-gray-300">Advance</td>
              <td class="text-right py-2 px-3 border border-gray-300">${formatCurrency(advance)}</td>
            </tr>
            <tr class="border-b border-gray-300">
              <td class="py-2 px-3 border border-gray-300">Leave / LOP</td>
              <td class="text-right py-2 px-3 border border-gray-300">${formatCurrency(leaveLop)}</td>
            </tr>
            <tr class="border-b border-gray-300">
              <td class="py-2 px-3 border border-gray-300">Penalty (if any)</td>
              <td class="text-right py-2 px-3 border border-gray-300">${formatCurrency(penalty)}</td>
            </tr>
            <tr class="border-b border-gray-300 bg-muted">
              <td class="py-2 px-3 font-semibold border border-gray-300">Total Deductions</td>
              <td class="text-right py-2 px-3 font-semibold border border-gray-300">${formatCurrency(totalDeductions)}</td>
            </tr>
            <!-- Net Pay -->
            <tr class="border-b border-gray-300">
              <td class="py-2 px-3 font-semibold border border-gray-300">Net Salary (Payable)</td>
              <td class="text-right py-2 px-3 font-semibold text-lg border border-gray-300" style="color: ${primaryColor};">
                ${formatCurrency(netSalary)}
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      <!-- Footer -->
      <div class="space-y-4 pt-4 border-t border-gray-300">
        <div class="text-sm">
          <span class="font-semibold">Date:</span> ${formatDate(salary.date) || "________"}
        </div>
        <div class="flex justify-between items-end mt-8">
          <div>
            <p class="font-semibold mb-2">Authorized Signatory</p>
            <div class="border-t border-gray-400 w-32 mt-8"></div>
          </div>
          <div class="text-right">
            <p class="font-semibold mb-2">Acceptance</p>
            <p class="text-sm mb-2">${
              employee?.name ? `Mr. ${employee.name}` : "________________"
            }</p>
            <p class="text-sm">(Signature and Date)</p>
          </div>
        </div>

        <!-- Pink line above footer -->
        <div class="mt-6 mb-4 h-1 w-full" style="background-color: ${primaryColor};"></div>

        <!-- Bottom company/contact bar -->
        <div class="pt-4 border-t-4 footer-section" style="border-color: ${primaryColor};">
          <div class="flex flex-row justify-between gap-6 text-xs text-gray-700">
            <!-- Left: Company name + address -->
            <div class="w-1-2 space-y-1">
              <p class="font-semibold" style="color: ${primaryColor};">
                STRIX Development Pvt. Ltd
              </p>
              <p>
                NH-21, Near Union Bank, 1st &amp; 2nd Floor Main bazar Ner - chowk, Teh-Balh,
                Distt. Mandi, HP 175008-India
              </p>
            </div>

            <!-- Right: Contact info with icons (block format, right aligned) -->
            <div class="w-1-2 space-y-2 text-right">
              <div>
                <svg class="icon h-4" style="color: ${primaryColor}; display: inline-block; vertical-align: middle; margin-right: 8px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <span class="font-semibold">Email:</span>
                <span> info@strixdevelopment.net</span>
              </div>
              <div>
                <svg class="icon h-4" style="color: ${primaryColor}; display: inline-block; vertical-align: middle; margin-right: 8px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                </svg>
                <span class="font-semibold">Website:</span>
                <span> www.strixdevelopment.net</span>
              </div>
              <div>
                <svg class="icon h-4" style="color: ${primaryColor}; display: inline-block; vertical-align: middle; margin-right: 8px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                <span class="font-semibold">Phone:</span>
                <span> +91 85570-17061, +91 9805997318</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </body>
</html>
`;
}

async function generateAndStoreSalaryPdf(
  supabase: SupabaseClient,
  salary: any,
  isUpdate: boolean = false
): Promise<string | null> {
  // Fetch employee details for this salary
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("name, employee_id, designation, department")
    .eq("employee_id", salary.employee_id)
    .single();

  if (employeeError) {
    // We don't fail the whole request if employee fetch fails
    console.error("Error fetching employee for PDF:", employeeError.message);
  }

  const html = await generateSalaryPdfHtml(salary, employee);

  const browser = await puppeteer.launch({
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "5mm", bottom: "10mm", left: "5mm" },
    });

    // Generate filename with -updated suffix if this is an update
    const baseFileName = `${salary.employee_id}-${salary.year}-${salary.month}-${salary.rowid}`;
    const fileName = isUpdate 
      ? `${baseFileName}-updated.pdf`
      : `${baseFileName}.pdf`;

    // Use service role client for storage upload to bypass RLS
    const serviceRoleClient = createServiceRoleClient();

    const { error: uploadError } = await serviceRoleClient.storage
      .from(SALARY_BUCKET)
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading salary PDF:", uploadError.message);
      return null;
    }

    const { data: publicUrlData } = serviceRoleClient.storage
      .from(SALARY_BUCKET)
      .getPublicUrl(fileName);

    return publicUrlData?.publicUrl ?? null;
  } finally {
    await browser.close();
  }
}

// GET - Fetch all salaries or a single salary by ID
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const rowid = searchParams.get("rowid");

    if (rowid) {
      // Fetch single salary by rowid with employee details
      const { data, error } = await supabase
        .from("salaries")
        .select(`
          *,
          employees:employee_id (
            name,
            employee_id,
            designation,
            department
          )
        `)
        .eq("rowid", rowid)
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      return NextResponse.json({ data }, { status: 200 });
    } else {
      // Fetch all salaries with employee details
      const { data, error } = await supabase
        .from("salaries")
        .select(`
          *,
          employees:employee_id (
            name,
            employee_id,
            designation,
            department
          )
        `)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ data }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new salary record
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      employee_id,
      month,
      year,
      date,
      basic_salary,
      allowances,
      bonus,
      advance,
      leave_lop,
      penalty,
    } = body;

    // Validate required fields
    if (
      !employee_id ||
      !month ||
      !year ||
      !date ||
      basic_salary === undefined ||
      allowances === undefined ||
      bonus === undefined ||
      advance === undefined ||
      leave_lop === undefined
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Validate month range
    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Month must be between 1 and 12" },
        { status: 400 }
      );
    }

    // Insert new salary record (triggers will calculate gross_salary, total_deductions, net_salary)
    const { data, error } = await supabase
      .from("salaries")
      .insert([
        {
          employee_id,
          month,
          year,
          date,
          basic_salary: parseFloat(basic_salary) || 0,
          allowances: parseFloat(allowances) || 0,
          bonus: parseFloat(bonus) || 0,
          advance: parseFloat(advance) || 0,
          leave_lop: parseFloat(leave_lop) || 0,
          penalty: parseFloat(penalty) || 0,
        },
      ])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violations
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Salary record already exists for this employee, month, and year" },
          { status: 409 }
        );
      }
      // Handle foreign key violations
      if (error.code === "23503") {
        return NextResponse.json(
          { error: "Employee not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Generate and upload PDF, then update the salary record with pdf_url
    try {
      const pdfUrl = await generateAndStoreSalaryPdf(supabase as SupabaseClient, data);
      if (pdfUrl) {
        const { data: updated } = await supabase
          .from("salaries")
          .update({ pdf_url: pdfUrl })
          .eq("rowid", data.rowid)
          .select()
          .single();

        return NextResponse.json({ data: updated ?? data }, { status: 201 });
      }
    } catch (pdfError: any) {
      console.error("Error generating salary PDF:", pdfError.message || pdfError);
      // Fall through and return salary data without pdf_url
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing salary record
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      rowid,
      employee_id,
      month,
      year,
      date,
      basic_salary,
      allowances,
      bonus,
      advance,
      leave_lop,
      penalty,
    } = body;

    // Validate rowid is provided
    if (!rowid) {
      return NextResponse.json(
        { error: "rowid is required for update" },
        { status: 400 }
      );
    }

    // Validate month range if provided
    if (month !== undefined && (month < 1 || month > 12)) {
      return NextResponse.json(
        { error: "Month must be between 1 and 12" },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (employee_id !== undefined) updateData.employee_id = employee_id;
    if (month !== undefined) updateData.month = month;
    if (year !== undefined) updateData.year = year;
    if (date !== undefined) updateData.date = date;
    if (basic_salary !== undefined) updateData.basic_salary = parseFloat(basic_salary) || 0;
    if (allowances !== undefined) updateData.allowances = parseFloat(allowances) || 0;
    if (bonus !== undefined) updateData.bonus = parseFloat(bonus) || 0;
    if (advance !== undefined) updateData.advance = parseFloat(advance) || 0;
    if (leave_lop !== undefined) updateData.leave_lop = parseFloat(leave_lop) || 0;
    if (penalty !== undefined) updateData.penalty = parseFloat(penalty) || 0;

    // Update salary record (triggers will recalculate amounts)
    const { data, error } = await supabase
      .from("salaries")
      .update(updateData)
      .eq("rowid", rowid)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violations
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Salary record already exists for this employee, month, and year" },
          { status: 409 }
        );
      }
      // Handle foreign key violations
      if (error.code === "23503") {
        return NextResponse.json(
          { error: "Employee not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Salary record not found" },
        { status: 404 }
      );
    }

    // Generate and upload new PDF with -updated suffix, then update the salary record with new pdf_url
    try {
      const pdfUrl = await generateAndStoreSalaryPdf(supabase as SupabaseClient, data, true);
      if (pdfUrl) {
        const { data: updated } = await supabase
          .from("salaries")
          .update({ pdf_url: pdfUrl })
          .eq("rowid", data.rowid)
          .select()
          .single();

        return NextResponse.json({ data: updated ?? data }, { status: 200 });
      }
    } catch (pdfError: any) {
      console.error("Error generating salary PDF:", pdfError.message || pdfError);
      // Fall through and return salary data without updated pdf_url
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a salary record
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const rowid = searchParams.get("rowid");

    if (!rowid) {
      return NextResponse.json(
        { error: "rowid is required" },
        { status: 400 }
      );
    }

    // Get the salary record to delete PDF if exists
    const { data: salaryData } = await supabase
      .from("salaries")
      .select("pdf_url, employee_id, year, month")
      .eq("rowid", rowid)
      .single();

    // Delete salary record
    const { error } = await supabase
      .from("salaries")
      .delete()
      .eq("rowid", rowid);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Optionally delete PDF from storage if exists (both original and updated versions)
    if (salaryData?.pdf_url) {
      const fileName = salaryData.pdf_url.split("/").pop();
      if (fileName) {
        // Use service role client for storage deletion to bypass RLS
        const serviceRoleClient = createServiceRoleClient();
        const filesToDelete = [fileName];
        
        // Also try to delete the original file if this was an updated version
        if (fileName.includes("-updated.pdf")) {
          const originalFileName = fileName.replace("-updated.pdf", ".pdf");
          filesToDelete.push(originalFileName);
        } else {
          // If deleting original, also try to delete updated version
          const updatedFileName = fileName.replace(".pdf", "-updated.pdf");
          filesToDelete.push(updatedFileName);
        }
        
        await serviceRoleClient.storage
          .from("salary-slips")
          .remove(filesToDelete);
      }
    }

    return NextResponse.json(
      { message: "Salary record deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

