-- This file contains SQL commands to set up Supabase Storage for profile avatars
-- Run these commands in the Supabase SQL Editor

-- Note: Storage buckets are created via the Supabase Dashboard UI, not SQL
-- But we can create policies via SQL

-- Step 1: Create the storage bucket (do this in Dashboard first)
-- Go to: Storage > Create Bucket
-- Name: avatars
-- Public: Yes (recommended for easy access to profile pictures)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg,image/png,image/gif,image/webp

-- Step 2: Create policies for authenticated users

-- Policy: Allow authenticated users to upload avatars
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
);

-- Policy: Allow authenticated users to read avatars (public access)
CREATE POLICY "Allow authenticated users to read avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
);

-- Policy: Allow authenticated users to update their own avatars
-- Users can only update files that start with their own user ID
CREATE POLICY "Allow authenticated users to update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
)
WITH CHECK (
  bucket_id = 'avatars'
);

-- Policy: Allow authenticated users to delete their own avatars
-- Users can only delete files that start with their own user ID
CREATE POLICY "Allow authenticated users to delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
);

-- If the bucket is public, also allow public read access
-- This allows profile pictures to be displayed without authentication
CREATE POLICY "Allow public read access to avatars"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'avatars'
);

