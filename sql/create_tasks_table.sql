-- Create tasks table for project board
CREATE TABLE IF NOT EXISTS tasks (
  rowid BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'todo',
  -- 'todo', 'in_progress', 'review', 'done'
  priority VARCHAR(20) DEFAULT 'medium',
  -- 'low', 'medium', 'high', 'urgent'
  assignee_id VARCHAR(100),
  -- Employee ID who is assigned to this task
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100),
  -- Employee ID who created the task
  order_index INTEGER DEFAULT 0,
  -- For maintaining order within status column

  CONSTRAINT fk_task_project
    FOREIGN KEY (project_id)
    REFERENCES projects(rowid)
    ON DELETE CASCADE,

  CONSTRAINT fk_task_assignee
    FOREIGN KEY (assignee_id)
    REFERENCES employees(employee_id)
    ON DELETE SET NULL,

  CONSTRAINT fk_task_creator
    FOREIGN KEY (created_by)
    REFERENCES employees(employee_id)
    ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_order_index ON tasks(project_id, status, order_index);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users full access
CREATE POLICY "Allow authenticated users full access to tasks"
ON tasks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_tasks_updated_at_trigger
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_tasks_updated_at();

