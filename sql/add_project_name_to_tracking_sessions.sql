-- Add project_name column to overtime_tracking_sessions table
ALTER TABLE overtime_tracking_sessions 
ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);

-- Add comment to explain the column
COMMENT ON COLUMN overtime_tracking_sessions.project_name IS 'Manual project name (if project_id is not set)';

