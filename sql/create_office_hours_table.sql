-- Create office_hours table
CREATE TABLE IF NOT EXISTS office_hours (
  rowid BIGSERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  -- 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  is_working_day BOOLEAN NOT NULL DEFAULT true,
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '18:00:00',
  has_lunch_break BOOLEAN NOT NULL DEFAULT true,
  lunch_start_time TIME DEFAULT '13:00:00',
  lunch_end_time TIME DEFAULT '13:45:00',
  lunch_duration_minutes INTEGER DEFAULT 45,
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one record per day
  CONSTRAINT unique_day_of_week UNIQUE (day_of_week)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_office_hours_day ON office_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_office_hours_working_day ON office_hours(is_working_day);

-- Enable Row Level Security (RLS)
ALTER TABLE office_hours ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users full access to office hours"
ON office_hours
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_office_hours_updated_at
BEFORE UPDATE ON office_hours
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default office hours for all days (Monday to Sunday)
-- Monday (1)
INSERT INTO office_hours (day_of_week, is_working_day, start_time, end_time, has_lunch_break, lunch_start_time, lunch_end_time, lunch_duration_minutes)
VALUES (1, true, '09:00:00', '18:00:00', true, '13:00:00', '13:45:00', 45)
ON CONFLICT (day_of_week) DO NOTHING;

-- Tuesday (2)
INSERT INTO office_hours (day_of_week, is_working_day, start_time, end_time, has_lunch_break, lunch_start_time, lunch_end_time, lunch_duration_minutes)
VALUES (2, true, '09:00:00', '18:00:00', true, '13:00:00', '13:45:00', 45)
ON CONFLICT (day_of_week) DO NOTHING;

-- Wednesday (3)
INSERT INTO office_hours (day_of_week, is_working_day, start_time, end_time, has_lunch_break, lunch_start_time, lunch_end_time, lunch_duration_minutes)
VALUES (3, true, '09:00:00', '18:00:00', true, '13:00:00', '13:45:00', 45)
ON CONFLICT (day_of_week) DO NOTHING;

-- Thursday (4)
INSERT INTO office_hours (day_of_week, is_working_day, start_time, end_time, has_lunch_break, lunch_start_time, lunch_end_time, lunch_duration_minutes)
VALUES (4, true, '09:00:00', '18:00:00', true, '13:00:00', '13:45:00', 45)
ON CONFLICT (day_of_week) DO NOTHING;

-- Friday (5)
INSERT INTO office_hours (day_of_week, is_working_day, start_time, end_time, has_lunch_break, lunch_start_time, lunch_end_time, lunch_duration_minutes)
VALUES (5, true, '09:00:00', '18:00:00', true, '13:00:00', '13:45:00', 45)
ON CONFLICT (day_of_week) DO NOTHING;

-- Saturday (6)
INSERT INTO office_hours (day_of_week, is_working_day, start_time, end_time, has_lunch_break, lunch_start_time, lunch_end_time, lunch_duration_minutes)
VALUES (6, false, '09:00:00', '18:00:00', true, '13:00:00', '13:45:00', 45)
ON CONFLICT (day_of_week) DO NOTHING;

-- Sunday (0)
INSERT INTO office_hours (day_of_week, is_working_day, start_time, end_time, has_lunch_break, lunch_start_time, lunch_end_time, lunch_duration_minutes)
VALUES (0, false, '09:00:00', '18:00:00', true, '13:00:00', '13:45:00', 45)
ON CONFLICT (day_of_week) DO NOTHING;

