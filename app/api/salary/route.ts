import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import type { SupabaseClient } from "@supabase/supabase-js";

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

  // Simple HTML template that mimics the on-screen preview
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <title>Salary Slip</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 12px;
        color: #111827;
        padding: 32px;
      }
      .card {
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 24px;
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
    </style>
  </head>
  <body>
    <div class="card">
      <div class="text-center border-b pb-4">
        <h1 class="text-lg font-bold mb-2 text-primary">STRIX DEVELOPMENT PVT LTD</h1>
        <p class="text-sm mb-1">CIN: U72900HP2021PTC008329</p>
        <p class="text-sm mb-2">GST: 02ABFCS3765D1Z</p>
        <h2 class="font-semibold text-primary mt-4">Salary Slip</h2>
      </div>

      <div style="margin-top:16px;">
        <table>
          <tbody>
            <tr class="border-b">
              <td class="font-semibold text-sm" style="width:33%;">Employee Name:</td>
              <td class="text-sm">${employee?.name ?? "________________"}</td>
            </tr>
            <tr class="border-b">
              <td class="font-semibold text-sm">Employee ID:</td>
              <td class="text-sm">${employee?.employee_id ?? "________________"}</td>
            </tr>
            <tr class="border-b">
              <td class="font-semibold text-sm">Designation:</td>
              <td class="text-sm">${employee?.designation ?? "________________"}</td>
            </tr>
            <tr class="border-b">
              <td class="font-semibold text-sm">Department:</td>
              <td class="text-sm">${employee?.department ?? "________________"}</td>
            </tr>
            <tr class="border-b">
              <td class="font-semibold text-sm">Month:</td>
              <td class="text-sm">${monthName || "________"}</td>
            </tr>
            <tr class="border-b">
              <td class="font-semibold text-sm">Year:</td>
              <td class="text-sm">${salary.year}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-top:16px;">
        <h3 class="font-semibold text-primary">Earnings</h3>
        <table class="border" style="margin-top:4px;">
          <thead>
            <tr class="bg-muted">
              <th class="border font-semibold">Earnings</th>
              <th class="border font-semibold text-right">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border">Basic Salary</td>
              <td class="border text-right">${formatCurrency(basicSalary)}</td>
            </tr>
            <tr>
              <td class="border">Allowances</td>
              <td class="border text-right">${formatCurrency(allowances)}</td>
            </tr>
            <tr>
              <td class="border">Bonus</td>
              <td class="border text-right">${formatCurrency(bonus)}</td>
            </tr>
            <tr class="bg-muted">
              <td class="border font-semibold">Gross Salary</td>
              <td class="border font-semibold text-right">${formatCurrency(grossSalary)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-top:16px;">
        <h3 class="font-semibold text-primary">Deductions</h3>
        <table class="border" style="margin-top:4px;">
          <thead>
            <tr class="bg-muted">
              <th class="border font-semibold">Deductions</th>
              <th class="border font-semibold text-right">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border">Advance</td>
              <td class="border text-right">${formatCurrency(advance)}</td>
            </tr>
            <tr>
              <td class="border">Leave / LOP</td>
              <td class="border text-right">${formatCurrency(leaveLop)}</td>
            </tr>
            <tr>
              <td class="border">Penalty (if any)</td>
              <td class="border text-right">${formatCurrency(penalty)}</td>
            </tr>
            <tr class="bg-muted">
              <td class="border font-semibold">Total Deductions</td>
              <td class="border font-semibold text-right">${formatCurrency(totalDeductions)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-top:16px;">
        <h3 class="font-semibold text-primary">Net Pay</h3>
        <table class="border" style="margin-top:4px;">
          <thead>
            <tr class="bg-muted">
              <th class="border font-semibold">Net Salary (Payable)</th>
              <th class="border font-semibold text-right">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border font-semibold">Net Salary (Payable)</td>
              <td class="border font-semibold text-right text-primary">${formatCurrency(
                netSalary
              )}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pt-4 border-t" style="margin-top:16px;">
        <div class="text-sm">
          <span class="font-semibold">Date:</span> ${formatDate(salary.date) || "________"}
        </div>
        <div class="flex justify-between items-end mt-8">
          <div>
            <p class="font-semibold mb-2">Authorized Signatory</p>
            <div class="border-t" style="width:128px; margin-top:24px;"></div>
          </div>
          <div style="text-align:right;">
            <p class="font-semibold mb-2">Acceptance</p>
            <p class="text-sm mb-2">${
              employee?.name ? `Mr. ${employee.name}` : "________________"
            }</p>
            <p class="text-sm">(Signature and Date)</p>
          </div>
        </div>
        <div class="text-xs text-center mt-6 pt-4 border-t">
          <p class="font-semibold text-primary">STRIX Development Pvt. Ltd</p>
          <p>NH-21, Near Union Bank, 1st & 2nd Floor Main bazar Ner - chowk, Teh-Balh, Distt. Mandi, HP 175008-India</p>
          <div class="footer-row">
            <span>Email: info@strixdevelopment.net</span>
            <span>Website: www.strixdevelopment.net</span>
            <span>Phone: +91 85570-17061, +91 9805997318</span>
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
  salary: any
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
    headless: "new",
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });

    const fileName = `${salary.employee_id}-${salary.year}-${salary.month}-${salary.rowid}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from(SALARY_BUCKET)
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading salary PDF:", uploadError.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
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

    // Optionally delete PDF from storage if exists
    if (salaryData?.pdf_url) {
      const fileName = salaryData.pdf_url.split("/").pop();
      if (fileName) {
        await supabase.storage
          .from("salary-slips")
          .remove([fileName]);
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

