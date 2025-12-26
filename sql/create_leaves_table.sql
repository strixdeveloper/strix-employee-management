-- Create leaves table
CREATE TABLE IF NOT EXISTS leaves (
  rowid BIGSERIAL PRIMARY KEY,
  employee_id VARCHAR(100) NOT NULL,
  leave_type VARCHAR(20) NOT NULL,
  -- 'full_day', 'half_day', 'multiple_days'
  start_date DATE NOT NULL,
  end_date DATE,
  -- NULL for full_day and half_day, required for multiple_days
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- 'pending', 'approved', 'cancelled'
  reason TEXT,
  approved_by VARCHAR(100),
  approved_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_leaves_employee
    FOREIGN KEY (employee_id)
    REFERENCES employees(employee_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_leaves_approver
    FOREIGN KEY (approved_by)
    REFERENCES employees(employee_id)
    ON DELETE SET NULL,

  CONSTRAINT chk_leave_type CHECK (leave_type IN ('full_day', 'half_day', 'multiple_days')),
  CONSTRAINT chk_leave_status CHECK (status IN ('pending', 'approved', 'cancelled')),
  CONSTRAINT chk_end_date CHECK (
    (leave_type = 'multiple_days' AND end_date IS NOT NULL AND end_date >= start_date) OR
    (leave_type IN ('full_day', 'half_day') AND end_date IS NULL)
  )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leaves_employee_id ON leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_start_date ON leaves(start_date);
CREATE INDEX IF NOT EXISTS idx_leaves_end_date ON leaves(end_date);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);
CREATE INDEX IF NOT EXISTS idx_leaves_leave_type ON leaves(leave_type);
CREATE INDEX IF NOT EXISTS idx_leaves_date_range ON leaves(start_date, end_date);

-- Enable RLS
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users full access
CREATE POLICY "Allow authenticated users full access to leaves"
ON leaves
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leaves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_leaves_updated_at_trigger
BEFORE UPDATE ON leaves
FOR EACH ROW
EXECUTE FUNCTION update_leaves_updated_at();

