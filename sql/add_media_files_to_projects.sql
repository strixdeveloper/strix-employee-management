-- Add media_files column to existing projects table
-- Run this SQL if you already created the projects table

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS media_files TEXT[];

-- This will add the media_files column as an array of text (file URLs)
-- Existing projects will have NULL or empty array for media_files

