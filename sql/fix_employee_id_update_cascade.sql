-- Fix foreign key constraint issue when updating employee_id
-- This script creates a trigger that automatically updates employee_id in all related tables
-- when employee_id is updated in the employees table

-- Create function to cascade employee_id updates to related tables
CREATE OR REPLACE FUNCTION cascade_employee_id_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if employee_id actually changed
  IF OLD.employee_id IS DISTINCT FROM NEW.employee_id THEN
    -- Update salaries table
    UPDATE salaries 
    SET employee_id = NEW.employee_id 
    WHERE employee_id = OLD.employee_id;
    
    -- Update overtime table
    UPDATE overtime 
    SET employee_id = NEW.employee_id 
    WHERE employee_id = OLD.employee_id;
    
    -- Update attendance table
    UPDATE attendance 
    SET employee_id = NEW.employee_id 
    WHERE employee_id = OLD.employee_id;
    
    -- Update leaves table
    UPDATE leaves 
    SET employee_id = NEW.employee_id 
    WHERE employee_id = OLD.employee_id;
    
    -- Update leaves approved_by field if it references the same employee
    UPDATE leaves 
    SET approved_by = NEW.employee_id 
    WHERE approved_by = OLD.employee_id;
    
    -- Update overtime_tracking_sessions table
    UPDATE overtime_tracking_sessions 
    SET employee_id = NEW.employee_id 
    WHERE employee_id = OLD.employee_id;
    
    -- Update tasks assignee_id field
    UPDATE tasks 
    SET assignee_id = NEW.employee_id 
    WHERE assignee_id = OLD.employee_id;
    
    -- Update tasks created_by field
    UPDATE tasks 
    SET created_by = NEW.employee_id 
    WHERE created_by = OLD.employee_id;
    
    -- Update overtime approved_by field if it references the same employee
    UPDATE overtime 
    SET approved_by = NEW.employee_id 
    WHERE approved_by = OLD.employee_id;
    
    -- Update project_employees table
    UPDATE project_employees 
    SET employee_id = NEW.employee_id 
    WHERE employee_id = OLD.employee_id;
    
    -- Update project_comments table
    UPDATE project_comments 
    SET employee_id = NEW.employee_id 
    WHERE employee_id = OLD.employee_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS cascade_employee_id_update_trigger ON employees;

-- Create trigger to automatically cascade employee_id updates
CREATE TRIGGER cascade_employee_id_update_trigger
AFTER UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION cascade_employee_id_update();

-- Add comment to document the trigger
COMMENT ON FUNCTION cascade_employee_id_update() IS 
'Automatically updates employee_id in all related tables (salaries, overtime, attendance, leaves, overtime_tracking_sessions, tasks, project_employees, project_comments) when employee_id is updated in employees table';

