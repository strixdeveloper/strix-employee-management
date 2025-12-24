-- Create salaries table
CREATE TABLE IF NOT EXISTS salaries (
  rowid BIGSERIAL PRIMARY KEY,
  employee_id VARCHAR(100) NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  date DATE NOT NULL,
  basic_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
  allowances DECIMAL(12, 2) NOT NULL DEFAULT 0,
  bonus DECIMAL(12, 2) NOT NULL DEFAULT 0,
  gross_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
  advance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  leave_lop DECIMAL(12, 2) NOT NULL DEFAULT 0,
  penalty DECIMAL(12, 2) DEFAULT 0,
  total_deductions DECIMAL(12, 2) NOT NULL DEFAULT 0,
  net_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT fk_employee 
    FOREIGN KEY (employee_id) 
    REFERENCES employees(employee_id) 
    ON DELETE CASCADE,
  
  -- Unique constraint: one salary slip per employee per month/year
  CONSTRAINT unique_employee_month_year 
    UNIQUE (employee_id, month, year)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_salaries_employee_id ON salaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_salaries_month_year ON salaries(year, month);
CREATE INDEX IF NOT EXISTS idx_salaries_date ON salaries(date);
CREATE INDEX IF NOT EXISTS idx_salaries_gross_salary ON salaries(gross_salary);
CREATE INDEX IF NOT EXISTS idx_salaries_net_salary ON salaries(net_salary);

-- Enable Row Level Security (RLS)
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users full access to salaries"
ON salaries
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create a function to calculate and update gross_salary, total_deductions, and net_salary
CREATE OR REPLACE FUNCTION calculate_salary_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate gross_salary = basic_salary + allowances + bonus
  NEW.gross_salary := COALESCE(NEW.basic_salary, 0) + 
                      COALESCE(NEW.allowances, 0) + 
                      COALESCE(NEW.bonus, 0);
  
  -- Calculate total_deductions = advance + leave_lop + penalty
  NEW.total_deductions := COALESCE(NEW.advance, 0) + 
                          COALESCE(NEW.leave_lop, 0) + 
                          COALESCE(NEW.penalty, 0);
  
  -- Calculate net_salary = gross_salary - total_deductions
  NEW.net_salary := NEW.gross_salary - NEW.total_deductions;
  
  -- Update updated_at timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate amounts before insert or update
CREATE TRIGGER calculate_salary_amounts_trigger
BEFORE INSERT OR UPDATE ON salaries
FOR EACH ROW
EXECUTE FUNCTION calculate_salary_amounts();

-- Create trigger to update updated_at timestamp (backup)
CREATE TRIGGER update_salaries_updated_at
BEFORE UPDATE ON salaries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

