-- This file contains SQL commands to set up Supabase Storage for salary slips
-- Run these commands in the Supabase SQL Editor

-- Note: Storage buckets are created via the Supabase Dashboard UI, not SQL
-- But we can create policies via SQL

-- Step 1: Create the storage bucket (do this in Dashboard first)
-- Go to: Storage > Create Bucket
-- Name: salary-slips
-- Public: Yes (or No with proper policies)
-- File size limit: 10MB (adjust as needed)
-- Allowed MIME types: application/pdf

-- Step 2: Create policies for authenticated users

-- Policy: Allow authenticated users to upload PDFs
CREATE POLICY "Allow authenticated users to upload salary slips"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'salary-slips' AND
  (storage.foldername(name))[1] = 'salary-slips'
);

-- Policy: Allow authenticated users to read/download PDFs
CREATE POLICY "Allow authenticated users to read salary slips"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'salary-slips'
);

-- Policy: Allow authenticated users to update their own PDFs (optional)
CREATE POLICY "Allow authenticated users to update salary slips"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'salary-slips'
)
WITH CHECK (
  bucket_id = 'salary-slips'
);

-- Policy: Allow authenticated users to delete PDFs (optional)
CREATE POLICY "Allow authenticated users to delete salary slips"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'salary-slips'
);

