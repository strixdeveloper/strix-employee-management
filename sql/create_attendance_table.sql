-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  rowid BIGSERIAL PRIMARY KEY,
  employee_id VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  status VARCHAR(20) NOT NULL DEFAULT 'present',
  -- status can be: 'present', 'absent', 'half_day', 'leave', 'holiday'
  working_hours DECIMAL(5, 2),
  -- Working hours in decimal format (e.g., 8.5 for 8 hours 30 minutes)
  overtime_hours DECIMAL(5, 2) DEFAULT 0,
  -- Overtime hours in decimal format
  late_minutes INTEGER DEFAULT 0,
  -- Minutes late (if check-in is after office start time)
  early_departure_minutes INTEGER DEFAULT 0,
  -- Minutes early departure (if check-out is before office end time)
  notes TEXT,
  -- Additional notes or remarks
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT fk_attendance_employee 
    FOREIGN KEY (employee_id) 
    REFERENCES employees(employee_id) 
    ON DELETE CASCADE,
  
  -- Unique constraint: one attendance record per employee per day
  CONSTRAINT unique_employee_date 
    UNIQUE (employee_id, date)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date_range ON attendance(date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users full access to attendance"
ON attendance
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a function to calculate working hours
CREATE OR REPLACE FUNCTION calculate_working_hours()
RETURNS TRIGGER AS $$
DECLARE
  start_time TIME;
  end_time TIME;
  working_minutes INTEGER;
  office_start TIME := '09:00:00';
  office_end TIME := '18:00:00';
  lunch_duration INTEGER := 45; -- 45 minutes lunch break
BEGIN
  -- Only calculate if both check_in and check_out are present
  IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
    -- Calculate working minutes
    working_minutes := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 60;
    
    -- Subtract lunch break if applicable
    IF NEW.status = 'present' THEN
      working_minutes := working_minutes - lunch_duration;
    END IF;
    
    -- Convert to hours (decimal)
    NEW.working_hours := ROUND((working_minutes / 60.0)::numeric, 2);
    
    -- Calculate late minutes (if check-in is after office start time)
    IF NEW.check_in_time > office_start THEN
      NEW.late_minutes := EXTRACT(EPOCH FROM (NEW.check_in_time - office_start)) / 60;
    ELSE
      NEW.late_minutes := 0;
    END IF;
    
    -- Calculate early departure minutes (if check-out is before office end time)
    IF NEW.check_out_time < office_end THEN
      NEW.early_departure_minutes := EXTRACT(EPOCH FROM (office_end - NEW.check_out_time)) / 60;
    ELSE
      NEW.early_departure_minutes := 0;
    END IF;
    
    -- Calculate overtime (if check-out is after office end time)
    IF NEW.check_out_time > office_end THEN
      NEW.overtime_hours := ROUND((EXTRACT(EPOCH FROM (NEW.check_out_time - office_end)) / 3600.0)::numeric, 2);
    ELSE
      NEW.overtime_hours := 0;
    END IF;
  END IF;
  
  -- Update updated_at timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate working hours before insert or update
CREATE TRIGGER calculate_attendance_hours_trigger
BEFORE INSERT OR UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION calculate_working_hours();

