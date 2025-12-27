-- Create overtime_tracking_sessions table for active tracking sessions
CREATE TABLE IF NOT EXISTS overtime_tracking_sessions (
  rowid BIGSERIAL PRIMARY KEY,
  employee_id VARCHAR(100) NOT NULL,
  project_id BIGINT,
  -- Reference to projects table (optional, can be NULL for non-project overtime)
  project_name VARCHAR(255),
  -- Manual project name (if project_id is not set)
  overtime_type VARCHAR(50) NOT NULL DEFAULT 'tracking',
  -- overtime_type can be: 'pending_tasks', 'new_tasks', 'tracking'
  memo TEXT,
  -- Memo/description for the overtime session
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  -- When the tracking started
  last_pause_time TIMESTAMP WITH TIME ZONE,
  -- When the last pause started (if currently paused)
  is_paused BOOLEAN NOT NULL DEFAULT false,
  -- Whether the session is currently paused
  total_break_seconds INTEGER DEFAULT 0,
  -- Total break time in seconds (accumulated)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_tracking_session_employee 
    FOREIGN KEY (employee_id) 
    REFERENCES employees(employee_id) 
    ON DELETE CASCADE,
  
  CONSTRAINT fk_tracking_session_project 
    FOREIGN KEY (project_id) 
    REFERENCES projects(rowid) 
    ON DELETE SET NULL,
  
  -- Check constraint: overtime_type must be valid
  CONSTRAINT check_tracking_overtime_type 
    CHECK (overtime_type IN ('pending_tasks', 'new_tasks', 'tracking')),
  
  -- Unique constraint: one active session per employee
  CONSTRAINT unique_active_session_per_employee 
    UNIQUE (employee_id)

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tracking_session_employee_id ON overtime_tracking_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_tracking_session_project_id ON overtime_tracking_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_tracking_session_start_time ON overtime_tracking_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_session_is_paused ON overtime_tracking_sessions(is_paused);

-- Enable Row Level Security (RLS)
ALTER TABLE overtime_tracking_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users full access to tracking sessions"
ON overtime_tracking_sessions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_tracking_session_updated_at
BEFORE UPDATE ON overtime_tracking_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create overtime_breaks table to track individual breaks
CREATE TABLE IF NOT EXISTS overtime_breaks (
  rowid BIGSERIAL PRIMARY KEY,
  tracking_session_id BIGINT NOT NULL,
  -- Reference to overtime_tracking_sessions
  break_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  break_end_time TIMESTAMP WITH TIME ZONE,
  -- NULL if break is still ongoing
  break_duration_seconds INTEGER,
  -- Calculated when break ends
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT fk_break_tracking_session 
    FOREIGN KEY (tracking_session_id) 
    REFERENCES overtime_tracking_sessions(rowid) 
    ON DELETE CASCADE,
  
  -- Check constraint: break_end_time must be after break_start_time (if set)
  CONSTRAINT check_break_time_order 
    CHECK (break_end_time IS NULL OR break_end_time > break_start_time)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_break_tracking_session_id ON overtime_breaks(tracking_session_id);
CREATE INDEX IF NOT EXISTS idx_break_start_time ON overtime_breaks(break_start_time DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE overtime_breaks ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users full access to breaks"
ON overtime_breaks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_break_updated_at
BEFORE UPDATE ON overtime_breaks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate break duration
CREATE OR REPLACE FUNCTION calculate_break_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate break duration in seconds when break ends
  IF NEW.break_end_time IS NOT NULL AND OLD.break_end_time IS NULL THEN
    NEW.break_duration_seconds = EXTRACT(EPOCH FROM (NEW.break_end_time - NEW.break_start_time))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate break duration
CREATE TRIGGER calculate_break_duration_trigger
BEFORE UPDATE ON overtime_breaks
FOR EACH ROW
EXECUTE FUNCTION calculate_break_duration();

-- Update overtime table to include actual_working_hours (excluding breaks)
ALTER TABLE overtime ADD COLUMN IF NOT EXISTS actual_working_hours DECIMAL(5, 2);
-- actual_working_hours = total_hours - break_hours

-- Add comment to explain the difference
COMMENT ON COLUMN overtime.total_hours IS 'Total time from start to end (including breaks)';
COMMENT ON COLUMN overtime.actual_working_hours IS 'Actual working hours excluding breaks';

