-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  rowid BIGSERIAL PRIMARY KEY,
  project_name VARCHAR(255) NOT NULL,
  project_description TEXT,
  client_name VARCHAR(255),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  -- priority can be: 'low', 'medium', 'high', 'urgent'
  deadline DATE,
  tracking_type VARCHAR(20) NOT NULL DEFAULT 'fixed',
  -- tracking_type can be: 'tracking' (hour-based) or 'fixed' (day-based)
  tracking_hours DECIMAL(10, 2),
  -- Number of hours for tracking (if tracking_type = 'tracking')
  fixed_days INTEGER,
  -- Number of days to finish (if tracking_type = 'fixed')
  status VARCHAR(20) NOT NULL DEFAULT 'planning',
  -- status can be: 'planning', 'in_progress', 'on_hold', 'completed', 'cancelled'
  media_files TEXT[],
  -- Array of file URLs/paths in project-media storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_employees junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS project_employees (
  rowid BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL,
  employee_id VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  -- Role in the project (e.g., 'Lead', 'Developer', 'Designer', 'Manager')
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_project_employees_project 
    FOREIGN KEY (project_id) 
    REFERENCES projects(rowid) 
    ON DELETE CASCADE,
  
  CONSTRAINT fk_project_employees_employee 
    FOREIGN KEY (employee_id) 
    REFERENCES employees(employee_id) 
    ON DELETE CASCADE,
  
  -- Unique constraint: one assignment per employee per project
  CONSTRAINT unique_project_employee 
    UNIQUE (project_id, employee_id)
);

-- Create project_comments table
CREATE TABLE IF NOT EXISTS project_comments (
  rowid BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL,
  employee_id VARCHAR(100) NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_project_comments_project 
    FOREIGN KEY (project_id) 
    REFERENCES projects(rowid) 
    ON DELETE CASCADE,
  
  CONSTRAINT fk_project_comments_employee 
    FOREIGN KEY (employee_id) 
    REFERENCES employees(employee_id) 
    ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline);
CREATE INDEX IF NOT EXISTS idx_projects_tracking_type ON projects(tracking_type);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_employees_project_id ON project_employees(project_id);
CREATE INDEX IF NOT EXISTS idx_project_employees_employee_id ON project_employees(employee_id);

CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_employee_id ON project_comments(employee_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_created_at ON project_comments(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users full access to projects"
ON projects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to project_employees"
ON project_employees
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to project_comments"
ON project_comments
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create trigger to update updated_at timestamp for projects
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update updated_at timestamp for project_comments
CREATE TRIGGER update_project_comments_updated_at
BEFORE UPDATE ON project_comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

