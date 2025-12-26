-- Create overtime table
CREATE TABLE IF NOT EXISTS overtime (
  rowid BIGSERIAL PRIMARY KEY,
  employee_id VARCHAR(100) NOT NULL,
  project_id BIGINT,
  -- Reference to projects table (optional, can be NULL for non-project overtime)
  date DATE NOT NULL,
  overtime_type VARCHAR(50) NOT NULL,
  -- overtime_type can be: 'pending_tasks', 'new_tasks', 'tracking'
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_hours DECIMAL(5, 2) NOT NULL,
  -- Total overtime hours calculated from start_time and end_time
  description TEXT,
  -- Description of the overtime work
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- status can be: 'pending', 'approved', 'rejected', 'paid'
  approved_by VARCHAR(100),
  -- Employee ID of the person who approved
  approved_at TIMESTAMP WITH TIME ZONE,
  -- When the overtime was approved
  remarks TEXT,
  -- Any remarks or notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_overtime_employee 
    FOREIGN KEY (employee_id) 
    REFERENCES employees(employee_id) 
    ON DELETE CASCADE,
  
  CONSTRAINT fk_overtime_project 
    FOREIGN KEY (project_id) 
    REFERENCES projects(rowid) 
    ON DELETE SET NULL,
  
  -- Check constraint: end_time must be after start_time
  CONSTRAINT check_time_order 
    CHECK (end_time > start_time),
  
  -- Check constraint: overtime_type must be valid
  CONSTRAINT check_overtime_type 
    CHECK (overtime_type IN ('pending_tasks', 'new_tasks', 'tracking'))
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_overtime_employee_id ON overtime(employee_id);
CREATE INDEX IF NOT EXISTS idx_overtime_project_id ON overtime(project_id);
CREATE INDEX IF NOT EXISTS idx_overtime_date ON overtime(date);
CREATE INDEX IF NOT EXISTS idx_overtime_type ON overtime(overtime_type);
CREATE INDEX IF NOT EXISTS idx_overtime_status ON overtime(status);
CREATE INDEX IF NOT EXISTS idx_overtime_employee_date ON overtime(employee_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_overtime_created_at ON overtime(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE overtime ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users full access to overtime"
ON overtime
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_overtime_updated_at
BEFORE UPDATE ON overtime
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a function to calculate total hours from start_time and end_time
CREATE OR REPLACE FUNCTION calculate_overtime_hours()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate hours difference between end_time and start_time
  NEW.total_hours = EXTRACT(EPOCH FROM (NEW.end_time::time - NEW.start_time::time)) / 3600.0;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate total_hours
CREATE TRIGGER calculate_overtime_hours_trigger
BEFORE INSERT OR UPDATE ON overtime
FOR EACH ROW
EXECUTE FUNCTION calculate_overtime_hours();

